using MediatR;
using Microsoft.EntityFrameworkCore;
using EkubCircle.Application.Commands.Payments;
using EkubCircle.Application.Common.Interfaces;
using EkubCircle.Application.DTOs.Payments;
using EkubCircle.Domain.Entities;
using EkubCircle.Domain.Enums;

namespace EkubCircle.Application.Handlers.Payments;

public class RecordPaymentCommandHandler : IRequestHandler<RecordPaymentCommand, PaymentDto>
{
    private readonly IEkubDbContext _context;

    public RecordPaymentCommandHandler(IEkubDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentDto> Handle(RecordPaymentCommand request, CancellationToken cancellationToken)
    {
        var round = await _context.Rounds
            .Include(r => r.Circle)
                .ThenInclude(c => c!.Members)
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.Id == request.RoundId, cancellationToken);

        if (round == null)
        {
            throw new KeyNotFoundException($"Round with ID {request.RoundId} was not found.");
        }

        if (round.Circle == null)
        {
            throw new InvalidOperationException("Round does not have an associated circle.");
        }

        var circle = round.Circle;
        {
            var isOrganizer = circle.Members.Any(m => m.UserId == request.RecordedByUserId && m.RoleInCircle == CircleRole.Organizer);
            if (!isOrganizer)
            {
                throw new UnauthorizedAccessException("Only the circle organizer can record payments.");
            }
        }

        if (round.Status != RoundStatus.Open)
        {
            throw new InvalidOperationException($"Cannot record payments for round with status '{round.Status}'. Only open rounds accept payments.");
        }

        var member = circle.Members.FirstOrDefault(m => m.Id == request.MemberId);
        if (member == null)
        {
            throw new KeyNotFoundException($"Member with ID {request.MemberId} is not a member of circle '{circle.Name}'.");
        }

        if (request.Amount != circle.ContributionAmount)
        {
            throw new ArgumentException($"Payment amount ({request.Amount:N2}) must equal the fixed contribution amount ({circle.ContributionAmount:N2}).");
        }

        var alreadyPaid = round.Payments.Any(p => p.MemberId == request.MemberId && p.PaymentType == PaymentType.Contribution);
        if (alreadyPaid)
        {
            throw new InvalidOperationException("Member has already made a contribution for this round.");
        }

        var payment = new Payment
        {
            RoundId = request.RoundId,
            MemberId = request.MemberId,
            Amount = request.Amount,
            PaymentType = PaymentType.Contribution,
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "Cash" : request.PaymentMethod.Trim(),
            Notes = request.Notes?.Trim(),
            IsLate = request.IsLate,
            PaidAt = DateTime.UtcNow,
            RecordedByUserId = request.RecordedByUserId
        };

        _context.Payments.Add(payment);

        _context.Notifications.Add(new Notification
        {
            UserId = member.UserId,
            Type = "PaymentReceived",
            Title = "Contribution Confirmed",
            Message = $"Your contribution of {payment.Amount:N2} ETB for Round #{round.RoundNumber} of '{circle.Name}' has been successfully recorded.",
            RelatedEntityId = circle.Id,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        var memberUser = await _context.Users.FindAsync(new object[] { member.UserId }, cancellationToken);

        return new PaymentDto
        {
            Id = payment.Id,
            RoundId = payment.RoundId,
            RoundNumber = round.RoundNumber,
            MemberId = payment.MemberId,
            MemberName = memberUser?.FullName ?? string.Empty,
            Amount = payment.Amount,
            PaymentType = payment.PaymentType,
            PaymentMethod = payment.PaymentMethod,
            Notes = payment.Notes,
            IsLate = payment.IsLate,
            PaidAt = payment.PaidAt
        };
    }
}
