using EkubCircle.Application.Common.Services;
using FluentAssertions;

namespace EkubCircle.Tests.Unit.Services;

public class EkubCalculationServiceTests
{
    private readonly EkubCalculationService _service = new();

    // 1. Fact Test for Standard Scenario (Exercise 1 Step 3)
    [Fact]
    public void CalculateTotalPot_StandardCircle_ReturnsCorrectCalculatedProduct()
    {
        // Arrange
        decimal contribution = 2500m;
        int members = 10;

        // Act
        var totalPot = _service.CalculateTotalPot(contribution, members);

        // Assert (FluentAssertions)
        totalPot.Should().Be(25000m);
    }

    // 2. Parameterized Theory Tests for Pot Boundaries (Exercise 1 Step 4)
    [Theory]
    [InlineData(0, 10, 0)]                // Boundary: zero contribution
    [InlineData(1000, 0, 0)]              // Boundary: zero members
    [InlineData(-500, 10, 0)]             // Boundary: negative contribution
    [InlineData(1000, -2, 0)]             // Boundary: negative members
    [InlineData(100, 1, 100)]             // Boundary: minimum single member
    [InlineData(50000, 100, 5000000)]     // Boundary: large regular circle
    public void CalculateTotalPot_VariousBoundaryInputs_ReturnsExpectedAmount(
        decimal contribution, int members, decimal expectedPot)
    {
        // Act
        var result = _service.CalculateTotalPot(contribution, members);

        // Assert
        result.Should().Be(expectedPot);
    }

    [Fact]
    public void CalculateTotalPot_ExcessiveContribution_ThrowsArgumentOutOfRangeException()
    {
        // Act
        var act = () => _service.CalculateTotalPot(100_000_000m, 10);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("contributionAmount");
    }

    // 3. Timeliness Classification Boundary Tests
    [Fact]
    public void ClassifyContributionTimeliness_PaidBeforeDeadline_ReturnsOnTime()
    {
        // Arrange
        var dueDate = new DateTime(2026, 10, 10, 18, 0, 0, DateTimeKind.Utc);
        var paymentDate = dueDate.AddHours(-2);

        // Act
        var status = _service.ClassifyContributionTimeliness(dueDate, paymentDate);

        // Assert
        status.Should().Be(ContributionTimeliness.OnTime);
    }

    [Theory]
    [InlineData(0, ContributionTimeliness.OnTime)]        // Exact deadline second
    [InlineData(1, ContributionTimeliness.GracePeriod)]   // 1 hour after deadline (inside 24h grace period)
    [InlineData(24, ContributionTimeliness.GracePeriod)]  // Exact edge of 24h grace period
    [InlineData(25, ContributionTimeliness.Late)]         // 1 hour past grace period
    [InlineData(168, ContributionTimeliness.Late)]        // 7 days late boundary
    [InlineData(169, ContributionTimeliness.Defaulted)]   // Past 7 days -> Defaulted
    public void ClassifyContributionTimeliness_TimelineOffsets_ReturnsCorrectClassification(
        int hoursOffset, ContributionTimeliness expected)
    {
        // Arrange
        var dueDate = new DateTime(2026, 10, 10, 12, 0, 0, DateTimeKind.Utc);
        var paymentDate = dueDate.AddHours(hoursOffset);

        // Act
        var result = _service.ClassifyContributionTimeliness(dueDate, paymentDate);

        // Assert
        result.Should().Be(expected);
    }

    // 4. Net Payout & Organizer Fee Boundary Tests
    [Theory]
    [InlineData(10000, 0, 10000, 0)]          // 0% fee -> 100% net payout
    [InlineData(10000, 5, 9500, 500)]         // 5% standard organizer fee
    [InlineData(10000, 10, 9000, 1000)]       // 10% fee
    [InlineData(10000, 100, 0, 10000)]        // 100% fee edge
    [InlineData(0, 5, 0, 0)]                  // 0 total pot
    public void CalculateNetPayout_FeePercentages_ComputesAccurateDeductions(
        decimal pot, decimal feePct, decimal expectedNet, decimal expectedFee)
    {
        // Act
        var (net, fee) = _service.CalculateNetPayout(pot, feePct);

        // Assert
        net.Should().Be(expectedNet);
        fee.Should().Be(expectedFee);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void CalculateNetPayout_InvalidFeePercentage_ThrowsArgumentOutOfRangeException(decimal invalidFee)
    {
        // Act
        var act = () => _service.CalculateNetPayout(10000m, invalidFee);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("organizerFeePercent");
    }

    // 5. Fair Draw Weight & Qualification Rule Tests (Rules 4 & 5)
    [Theory]
    [InlineData(false, false, 0, false, 0)]   // Unpaid member -> strictly disqualified
    [InlineData(true, true, 0, false, 0)]     // Member already won in past round -> disqualified
    [InlineData(false, true, 0, false, 0)]    // Unpaid & already won -> disqualified
    [InlineData(true, false, 0, true, 10)]    // Paid, never won, 0 late payments -> Prime (10 tickets)
    [InlineData(true, false, 1, true, 5)]     // Paid, never won, 1 late payment -> Minor penalty (5 tickets)
    [InlineData(true, false, 3, true, 1)]     // Paid, never won, multiple late payments -> Heavy penalty (1 ticket)
    public void CalculateDrawEligibility_MemberStates_EnforcesFairDrawRules(
        bool hasContributed, bool hasWon, int lateCount, bool expectedEligible, int expectedTickets)
    {
        // Act
        var (isEligible, tickets) = _service.CalculateDrawEligibility(hasContributed, hasWon, lateCount);

        // Assert
        isEligible.Should().Be(expectedEligible);
        tickets.Should().Be(expectedTickets);
    }
}
