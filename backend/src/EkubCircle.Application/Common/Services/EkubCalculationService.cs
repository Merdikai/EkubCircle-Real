namespace EkubCircle.Application.Common.Services;

public enum ContributionTimeliness
{
    OnTime,
    GracePeriod,
    Late,
    Defaulted
}

public class EkubCalculationService
{
    public const int DefaultGracePeriodHours = 24;
    public const decimal MaxAllowedContribution = 10_000_000m;

    /// <summary>
    /// Pure calculation: Computes total pot amount for a given round contribution and roster size.
    /// Returns 0m if contribution is non-positive or member count is non-positive.
    /// </summary>
    public decimal CalculateTotalPot(decimal contributionAmount, int memberCount)
    {
        if (contributionAmount <= 0m || memberCount <= 0)
            return 0m;

        if (contributionAmount > MaxAllowedContribution || memberCount > 10_000)
            throw new ArgumentOutOfRangeException(nameof(contributionAmount), "Parameters exceed maximum Ekub thresholds.");

        return contributionAmount * memberCount;
    }

    /// <summary>
    /// Classifies timeliness of member contribution relative to the round due date and grace period.
    /// </summary>
    public ContributionTimeliness ClassifyContributionTimeliness(
        DateTime dueDate, 
        DateTime paymentDate, 
        int gracePeriodHours = DefaultGracePeriodHours)
    {
        if (gracePeriodHours < 0)
            throw new ArgumentOutOfRangeException(nameof(gracePeriodHours), "Grace period cannot be negative.");

        if (paymentDate <= dueDate)
            return ContributionTimeliness.OnTime;

        if (paymentDate <= dueDate.AddHours(gracePeriodHours))
            return ContributionTimeliness.GracePeriod;

        if (paymentDate <= dueDate.AddDays(7))
            return ContributionTimeliness.Late;

        return ContributionTimeliness.Defaulted;
    }

    /// <summary>
    /// Computes net disbursed pot after deducting optional organizer administrative fee.
    /// </summary>
    public (decimal NetPayout, decimal OrganizerFee) CalculateNetPayout(decimal totalPot, decimal organizerFeePercent = 0m)
    {
        if (organizerFeePercent < 0m || organizerFeePercent > 100m)
            throw new ArgumentOutOfRangeException(nameof(organizerFeePercent), "Fee percentage must be between 0 and 100.");

        if (totalPot <= 0m)
            return (0m, 0m);

        var fee = Math.Round(totalPot * (organizerFeePercent / 100m), 2, MidpointRounding.AwayFromZero);
        var net = totalPot - fee;

        return (net, fee);
    }

    /// <summary>
    /// Pure lottery draw weight calculation for the server-side fair draw simulator.
    /// Unpaid or past winner members are strictly disqualified (0 tickets).
    /// </summary>
    public (bool IsEligible, int ChanceTickets) CalculateDrawEligibility(
        bool hasContributedThisRound, 
        bool hasAlreadyReceivedPot, 
        int priorLateCount = 0)
    {
        if (!hasContributedThisRound || hasAlreadyReceivedPot)
            return (false, 0);

        if (priorLateCount < 0)
            priorLateCount = 0;

        int tickets = priorLateCount switch
        {
            0 => 10,  // Prime score
            1 => 5,   // Moderate penalty
            _ => 1    // Heavy penalty
        };

        return (true, tickets);
    }
}
