using MediatR;
using Microsoft.EntityFrameworkCore;
using EkubCircle.Application.Commands.Rounds;
using EkubCircle.Application.Common.Interfaces;
using EkubCircle.Application.DTOs.Rounds;
using EkubCircle.Domain.Entities;
using EkubCircle.Domain.Enums;

namespace EkubCircle.Application.Handlers.Rounds;

public class ExecutePayoutCommandHandler : IRequestHandler<ExecutePayoutCommand, PayoutResultDto>
{
    private readonly IEkubDbContext _context;

    public ExecutePayoutCommandHandler(IEkubDbContext context)
    {
        _context = context;
    }

    public async Task<PayoutResultDto> Handle(ExecutePayoutCommand request, CancellationToken cancellationToken)
    {
        var round = await _context.Rounds
            .Include(r => r.Circle)
                .ThenInclude(c => c!.Members)
                    .ThenInclude(m => m.User)
            .Include(r => r.Circle)
                .ThenInclude(c => c!.Rounds)
            .Include(r => r.Payments)
            .Include(r => r.WinnerMember)
                .ThenInclude(rm => rm!.User)
            .FirstOrDefaultAsync(r => r.Id == request.RoundId, cancellationToken);

        if (round == null)
        {
            throw new KeyNotFoundException($"Round with ID {request.RoundId} was not found.");
        }

        var circle = round.Circle!;

        if (circle.CreatedByUserId != request.RequesterUserId)
        {
            var isOrganizer = circle.Members.Any(m => m.UserId == request.RequesterUserId && m.RoleInCircle == CircleRole.Organizer);
            if (!isOrganizer)
            {
                throw new UnauthorizedAccessException("Only the circle organizer can execute payouts.");
            }
        }

        if (round.Status != RoundStatus.Open && round.Status != RoundStatus.Drawn)
        {
            throw new InvalidOperationException($"Cannot execute payout for round with status '{round.Status}'. Only open or drawn rounds can be paid out.");
        }

        // Rule 1: 100% Contribution Gate
        var normalContributions = round.Payments.Where(p => p.PaymentType == PaymentType.Contribution).ToList();
        var totalMembers = circle.Members.Count;

        if (normalContributions.Count < totalMembers)
        {
            throw new InvalidOperationException($"Cannot execute payout: Only {normalContributions.Count} of {totalMembers} members have contributed for Round {round.RoundNumber}.");
        }

        // Rule 2: Single Pot Receipt
        var receiver = round.WinnerMember;
        if (receiver == null)
        {
            throw new InvalidOperationException("No assigned recipient found for this round.");
        }

        if (receiver.HasReceived)
        {
            throw new InvalidOperationException($"Member '{receiver.User?.FullName}' has already received a pot payout in this circle.");
        }

        // Execute Payout
        var totalPot = normalContributions.Sum(c => c.Amount);
        round.PotAmount = totalPot;
        round.PaidOutAt = DateTime.UtcNow;
        round.Status = RoundStatus.PaidOut;
        receiver.HasReceived = true;

        var payoutPayment = new Payment
        {
            RoundId = round.Id,
            MemberId = receiver.Id,
            Amount = totalPot,
            PaymentType = PaymentType.Payout,
            PaymentMethod = "BankTransfer",
            Notes = $"Pot payout for Round {round.RoundNumber} to {receiver.User?.FullName}",
            PaidAt = DateTime.UtcNow,
            RecordedByUserId = request.RequesterUserId
        };

        _context.Payments.Add(payoutPayment);

        // Advance to next round or complete circle
        var nextRound = circle.Rounds.FirstOrDefault(r => r.RoundNumber == round.RoundNumber + 1);
        if (nextRound != null)
        {
            nextRound.Status = RoundStatus.Open;
        }
        else
        {
            circle.Status = CircleStatus.Completed;
            circle.CompletedAt = DateTime.UtcNow;
        }

        var receiverDisplayName = !string.IsNullOrWhiteSpace(receiver.User?.FullName)
            ? receiver.User.FullName
            : $"Member #{receiver.MemberOrder}";

        // Notify recipient
        _context.Notifications.Add(new Notification
        {
            UserId = receiver.UserId,
            Type = "PayoutCompleted",
            Title = "Pot Disbursed To You!",
            Message = $"Congratulations! The pot of {totalPot:N2} ETB for Round #{round.RoundNumber} of '{circle.Name}' has been disbursed to you.",
            RelatedEntityId = circle.Id,
            CreatedAt = DateTime.UtcNow
        });

        // Notify other circle members
        foreach (var m in circle.Members.Where(m => m.UserId != receiver.UserId))
        {
            _context.Notifications.Add(new Notification
            {
                UserId = m.UserId,
                Type = "PayoutCompleted",
                Title = "Round Completed",
                Message = $"Round #{round.RoundNumber} pot of {totalPot:N2} ETB in '{circle.Name}' was successfully disbursed to {receiverDisplayName}.",
                RelatedEntityId = circle.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new PayoutResultDto
        {
            RoundId = round.Id,
            RoundNumber = round.RoundNumber,
            PotAmount = totalPot,
            ReceiverMemberId = receiver.Id,
            ReceiverName = receiver.User?.FullName ?? string.Empty,
            PaidOutAt = round.PaidOutAt.Value,
            RoundStatus = round.Status,
            CircleStatus = circle.Status,
            NextRoundNumber = nextRound?.RoundNumber,
            Message = $"Payout of {totalPot:N2} ETB successfully disbursed to {receiver.User?.FullName}."
        };
    }
}
