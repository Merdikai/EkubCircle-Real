using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EkubCircle.Application.Commands.Rounds;
using EkubCircle.Application.Common.Interfaces;
using EkubCircle.Application.DTOs.Rounds;
using EkubCircle.Domain.Entities;
using EkubCircle.Domain.Enums;

namespace EkubCircle.Application.Handlers.Rounds;

public class DrawRoundWinnerCommandHandler : IRequestHandler<DrawRoundWinnerCommand, DrawWinnerDto>
{
    private readonly IEkubDbContext _context;

    public DrawRoundWinnerCommandHandler(IEkubDbContext context)
    {
        _context = context;
    }

    public async Task<DrawWinnerDto> Handle(DrawRoundWinnerCommand request, CancellationToken cancellationToken)
    {
        var round = await _context.Rounds
            .Include(r => r.Circle)
                .ThenInclude(c => c!.Members)
                    .ThenInclude(m => m.User)
            .Include(r => r.Payments)
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
                throw new UnauthorizedAccessException("Only the circle organizer can conduct the winner draw.");
            }
        }

        if (round.Status != RoundStatus.Open)
        {
            throw new InvalidOperationException($"Cannot draw winner for round with status '{round.Status}'. Only open rounds can draw a winner.");
        }

        // Candidates: members who have NOT received pot AND who have paid for this round (unpaid members cannot win the draw)
        var paidMemberIds = round.Payments
            .Where(p => p.PaymentType == PaymentType.Contribution)
            .Select(p => p.MemberId)
            .ToHashSet();

        var eligibleMembers = circle.Members
            .Where(m => !m.HasReceived && paidMemberIds.Contains(m.Id))
            .ToList();

        if (eligibleMembers.Count == 0)
        {
            throw new InvalidOperationException("No eligible candidates found for draw. Members must have paid their contribution and not yet received a pot.");
        }

        // Cryptographically secure random selection
        var winnerIndex = RandomNumberGenerator.GetInt32(eligibleMembers.Count);
        var winner = eligibleMembers[winnerIndex];

        round.WinnerMemberId = winner.Id;
        round.DrawnAt = DateTime.UtcNow;

        _context.Notifications.Add(new Notification
        {
            UserId = winner.UserId,
            Type = "FairDrawWon",
            Title = "Fair Draw Winner!",
            Message = $"Congratulations! You have been selected as the fair draw winner for Round #{round.RoundNumber} of '{circle.Name}'!",
            RelatedEntityId = circle.Id,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new DrawWinnerDto
        {
            RoundId = round.Id,
            RoundNumber = round.RoundNumber,
            WinnerMemberId = winner.Id,
            WinnerName = winner.User?.FullName ?? string.Empty,
            WinnerEmail = winner.User?.Email ?? string.Empty,
            EligibleCandidatesCount = eligibleMembers.Count,
            DrawnAt = DateTime.UtcNow,
            Message = $"Fair lottery draw completed. Winner selected: {winner.User?.FullName} out of {eligibleMembers.Count} eligible candidates."
        };
    }
}
