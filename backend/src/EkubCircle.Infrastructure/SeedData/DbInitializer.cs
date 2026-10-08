using Microsoft.EntityFrameworkCore;
using EkubCircle.Domain.Entities;
using EkubCircle.Domain.Enums;
using EkubCircle.Infrastructure.Persistence.Context;

namespace EkubCircle.Infrastructure.SeedData;

public static class DbInitializer
{
    public static async Task SeedAsync(EkubDbContext context)
    {
        if (!context.Database.IsRelational() || context.Database.IsNpgsql())
        {
            await context.Database.EnsureCreatedAsync();
        }
        else
        {
            await context.Database.MigrateAsync();
        }

        if (await context.Users.AnyAsync())
        {
            return; // DB has been seeded already
        }

        // 1. Seed Users
        string adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
        string userPasswordHash = BCrypt.Net.BCrypt.HashPassword("Ekub123!");

        var admin = new User
        {
            FullName = "Hackathon Admin",
            Email = "admin@hackathon.local",
            Phone = "+251911000000",
            PasswordHash = adminPasswordHash,
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        var organizer = new User
        {
            FullName = "Abebe Bikila",
            Email = "organizer@ekub.local",
            Phone = "+251911111111",
            PasswordHash = userPasswordHash,
            Role = UserRole.Organizer,
            CreatedAt = DateTime.UtcNow.AddDays(-20)
        };

        var member1 = new User
        {
            FullName = "Hana Girma",
            Email = "member1@ekub.local",
            Phone = "+251911222222",
            PasswordHash = userPasswordHash,
            Role = UserRole.Member,
            CreatedAt = DateTime.UtcNow.AddDays(-19)
        };

        var member2 = new User
        {
            FullName = "Dawit Tadesse",
            Email = "member2@ekub.local",
            Phone = "+251911333333",
            PasswordHash = userPasswordHash,
            Role = UserRole.Member,
            CreatedAt = DateTime.UtcNow.AddDays(-18)
        };

        var member3 = new User
        {
            FullName = "Meron Bekele",
            Email = "member3@ekub.local",
            Phone = "+251911444444",
            PasswordHash = userPasswordHash,
            Role = UserRole.Member,
            CreatedAt = DateTime.UtcNow.AddDays(-17)
        };

        var member4 = new User
        {
            FullName = "Selam Fikre",
            Email = "member4@ekub.local",
            Phone = "+251911555555",
            PasswordHash = userPasswordHash,
            Role = UserRole.Member,
            CreatedAt = DateTime.UtcNow.AddDays(-16)
        };

        context.Users.AddRange(admin, organizer, member1, member2, member3, member4);
        await context.SaveChangesAsync();

        // 2. Seed Active Circle: "Bole Tech Savings Circle"
        var activeCircle = new Circle
        {
            Name = "Bole Tech Savings Circle",
            ContributionAmount = 1000m,
            Frequency = CircleFrequency.Weekly,
            MaxMembers = 5,
            Status = CircleStatus.Active,
            CreatedByUserId = organizer.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-14),
            StartDate = DateTime.UtcNow.AddDays(-14)
        };

        // Seed Forming / Draft Circle: "Arat Kilo Traders Ekub"
        var formingCircle = new Circle
        {
            Name = "Arat Kilo Traders Ekub",
            ContributionAmount = 2500m,
            Frequency = CircleFrequency.Monthly,
            MaxMembers = 10,
            Status = CircleStatus.Forming,
            CreatedByUserId = organizer.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        context.Circles.AddRange(activeCircle, formingCircle);
        await context.SaveChangesAsync();

        // 3. Seed Circle Members for Active Circle
        var cmOrganizer = new CircleMember
        {
            CircleId = activeCircle.Id,
            UserId = organizer.Id,
            MemberOrder = 1,
            RoleInCircle = CircleRole.Organizer,
            HasReceived = true, // Received round 1 pot
            JoinedAt = DateTime.UtcNow.AddDays(-14)
        };

        var cmHana = new CircleMember
        {
            CircleId = activeCircle.Id,
            UserId = member1.Id,
            MemberOrder = 2,
            RoleInCircle = CircleRole.Member,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow.AddDays(-14)
        };

        var cmDawit = new CircleMember
        {
            CircleId = activeCircle.Id,
            UserId = member2.Id,
            MemberOrder = 3,
            RoleInCircle = CircleRole.Member,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow.AddDays(-14)
        };

        var cmMeron = new CircleMember
        {
            CircleId = activeCircle.Id,
            UserId = member3.Id,
            MemberOrder = 4,
            RoleInCircle = CircleRole.Member,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow.AddDays(-14)
        };

        var cmSelam = new CircleMember
        {
            CircleId = activeCircle.Id,
            UserId = member4.Id,
            MemberOrder = 5,
            RoleInCircle = CircleRole.Member,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow.AddDays(-14)
        };

        // Members for Forming Circle
        var cmForming1 = new CircleMember
        {
            CircleId = formingCircle.Id,
            UserId = organizer.Id,
            MemberOrder = 0,
            RoleInCircle = CircleRole.Organizer,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow.AddDays(-2)
        };

        var cmForming2 = new CircleMember
        {
            CircleId = formingCircle.Id,
            UserId = member1.Id,
            MemberOrder = 0,
            RoleInCircle = CircleRole.Member,
            HasReceived = false,
            JoinedAt = DateTime.UtcNow.AddDays(-1)
        };

        context.CircleMembers.AddRange(cmOrganizer, cmHana, cmDawit, cmMeron, cmSelam, cmForming1, cmForming2);
        await context.SaveChangesAsync();

        // 4. Seed Rounds for Active Circle (5 members -> 5 rounds)
        var round1 = new Round
        {
            CircleId = activeCircle.Id,
            RoundNumber = 1,
            WinnerMemberId = cmOrganizer.Id,
            Status = RoundStatus.PaidOut,
            PotAmount = 5000m,
            DueDate = DateTime.UtcNow.AddDays(-7),
            DrawnAt = DateTime.UtcNow.AddDays(-7)
        };

        var round2 = new Round
        {
            CircleId = activeCircle.Id,
            RoundNumber = 2,
            WinnerMemberId = cmHana.Id,
            Status = RoundStatus.Open,
            PotAmount = 3000m,
            DueDate = DateTime.UtcNow.AddDays(7),
            DrawnAt = null
        };

        var round3 = new Round
        {
            CircleId = activeCircle.Id,
            RoundNumber = 3,
            WinnerMemberId = cmDawit.Id,
            Status = RoundStatus.Pending,
            PotAmount = 0m,
            DueDate = DateTime.UtcNow.AddDays(14)
        };

        var round4 = new Round
        {
            CircleId = activeCircle.Id,
            RoundNumber = 4,
            WinnerMemberId = cmMeron.Id,
            Status = RoundStatus.Pending,
            PotAmount = 0m,
            DueDate = DateTime.UtcNow.AddDays(21)
        };

        var round5 = new Round
        {
            CircleId = activeCircle.Id,
            RoundNumber = 5,
            WinnerMemberId = cmSelam.Id,
            Status = RoundStatus.Pending,
            PotAmount = 0m,
            DueDate = DateTime.UtcNow.AddDays(28)
        };

        context.Rounds.AddRange(round1, round2, round3, round4, round5);
        await context.SaveChangesAsync();

        // 5. Seed Payments for Round 1 (All 5 paid -> 5000 Birr pot disbursed)
        var p1_1 = new Payment { RoundId = round1.Id, CircleMemberId = cmOrganizer.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddDays(-8), RecordedByUserId = organizer.Id };
        var p1_2 = new Payment { RoundId = round1.Id, CircleMemberId = cmHana.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddDays(-8), RecordedByUserId = organizer.Id };
        var p1_3 = new Payment { RoundId = round1.Id, CircleMemberId = cmDawit.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddDays(-7), RecordedByUserId = organizer.Id };
        var p1_4 = new Payment { RoundId = round1.Id, CircleMemberId = cmMeron.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddDays(-7), RecordedByUserId = organizer.Id };
        var p1_5 = new Payment { RoundId = round1.Id, CircleMemberId = cmSelam.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddDays(-7), RecordedByUserId = organizer.Id };

        // Seed Payments for Round 2 (3 paid: Abebe, Hana, Dawit. Meron and Selam unpaid -> ready for demo!)
        var p2_1 = new Payment { RoundId = round2.Id, CircleMemberId = cmOrganizer.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddDays(-1), RecordedByUserId = organizer.Id };
        var p2_2 = new Payment { RoundId = round2.Id, CircleMemberId = cmHana.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddDays(-1), RecordedByUserId = organizer.Id };
        var p2_3 = new Payment { RoundId = round2.Id, CircleMemberId = cmDawit.Id, Amount = 1000m, PaymentType = PaymentType.Normal, Status = PaymentStatus.Paid, PaidAt = DateTime.UtcNow.AddHours(-3), RecordedByUserId = organizer.Id };

        context.Payments.AddRange(p1_1, p1_2, p1_3, p1_4, p1_5, p2_1, p2_2, p2_3);

        // 6. Seed Join Requests (e.g. member3 requests to join forming circle)
        var joinRequest = new JoinRequest
        {
            CircleId = formingCircle.Id,
            RequestedUserId = member3.Id,
            RequestedByUserId = member3.Id,
            Status = JoinRequestStatus.Pending,
            Message = "Hello! I'd like to join the Arat Kilo Traders Ekub.",
            CreatedAt = DateTime.UtcNow.AddHours(-5)
        };

        context.JoinRequests.Add(joinRequest);

        // 7. Seed Notifications (e.g. notification to organizer about join request, and to member2 about payment)
        var notif1 = new Notification
        {
            UserId = organizer.Id,
            Type = "JoinRequest",
            Title = "New Join Request",
            Message = $"{member3.FullName} has requested to join '{formingCircle.Name}'.",
            RelatedEntityId = joinRequest.Id,
            IsRead = false,
            CreatedAt = DateTime.UtcNow.AddHours(-5)
        };

        var notif2 = new Notification
        {
            UserId = member2.Id,
            Type = "PaymentReceived",
            Title = "Payment Confirmed",
            Message = $"Your payment of 1,000 ETB for Round 2 in '{activeCircle.Name}' has been confirmed.",
            RelatedEntityId = round2.Id,
            IsRead = true,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            ReadAt = DateTime.UtcNow.AddHours(-2)
        };

        context.Notifications.AddRange(notif1, notif2);

        await context.SaveChangesAsync();
    }
}
