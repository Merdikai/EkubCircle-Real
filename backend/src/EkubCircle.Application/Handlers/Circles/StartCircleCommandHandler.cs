using MediatR;
using Microsoft.EntityFrameworkCore;
using EkubCircle.Application.Commands.Circles;
using EkubCircle.Application.Common.Interfaces;
using EkubCircle.Application.DTOs.Circles;
using EkubCircle.Domain.Entities;
using EkubCircle.Domain.Enums;

namespace EkubCircle.Application.Handlers.Circles;

public class StartCircleCommandHandler : IRequestHandler<StartCircleCommand, CircleDetailDto>
{
    private readonly IEkubDbContext _context;

    public StartCircleCommandHandler(IEkubDbContext context)
    {
        _context = context;
    }

    public async Task<CircleDetailDto> Handle(StartCircleCommand request, CancellationToken cancellationToken)
    {
        var circle = await _context.Circles
            .Include(c => c.CreatedByUser)
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Id == request.CircleId, cancellationToken);

        if (circle == null)
        {
            throw new KeyNotFoundException($"Circle with ID {request.CircleId} was not found.");
        }

        if (circle.CreatedByUserId != request.RequesterUserId)
        {
            var isOrganizer = circle.Members.Any(m => m.UserId == request.RequesterUserId && m.RoleInCircle == CircleRole.Organizer);
            if (!isOrganizer)
            {
                throw new UnauthorizedAccessException("Only the circle organizer can start the circle.");
            }
        }

        if (circle.Status != CircleStatus.Forming)
        {
            throw new InvalidOperationException($"Cannot start circle. Current status is '{circle.Status}'.");
        }

        if (circle.Members.Count < 2)
        {
            throw new InvalidOperationException("A circle must have at least 2 members before it can be started.");
        }

        circle.Status = CircleStatus.Active;
        circle.StartedAt = DateTime.UtcNow;

        var orderedMembers = circle.Members.OrderBy(m => m.MemberOrder).ToList();
        for (int i = 0; i < orderedMembers.Count; i++)
        {
            var roundNumber = i + 1;
            var receiverMember = orderedMembers[i];

            var round = new Round
            {
                CircleId = circle.Id,
                RoundNumber = roundNumber,
                WinnerMemberId = receiverMember.Id,
                Status = roundNumber == 1 ? RoundStatus.Open : RoundStatus.Pending,
                PotAmount = 0m
            };

            _context.Rounds.Add(round);
        }

        foreach (var m in orderedMembers)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = m.UserId,
                Type = "CircleStarted",
                Title = "Ekub Circle Started",
                Message = $"'{circle.Name}' has officially started! Your assigned payout turn is #{m.MemberOrder}.",
                RelatedEntityId = circle.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new CircleDetailDto
        {
            Id = circle.Id,
            Name = circle.Name,
            ContributionAmount = circle.ContributionAmount,
            MeetingLabel = circle.MeetingLabel,
            Status = circle.Status,
            CreatedByUserId = circle.CreatedByUserId,
            CreatedByUserName = circle.CreatedByUser?.FullName ?? string.Empty,
            CreatedAt = circle.CreatedAt,
            StartedAt = circle.StartedAt,
            CompletedAt = circle.CompletedAt,
            MemberCount = circle.Members.Count,
            TotalRounds = orderedMembers.Count,
            CurrentRoundNumber = 1,
            Members = orderedMembers.Select(m => new CircleMemberDto
            {
                Id = m.Id,
                UserId = m.UserId,
                FullName = m.User?.FullName ?? string.Empty,
                Email = m.User?.Email ?? string.Empty,
                MemberOrder = m.MemberOrder,
                RoleInCircle = m.RoleInCircle,
                HasReceived = m.HasReceived,
                JoinedAt = m.JoinedAt
            }).ToList()
        };
    }
}
