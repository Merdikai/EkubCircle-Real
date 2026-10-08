using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using EkubCircle.Tests.Common;
using FluentAssertions;

namespace EkubCircle.Tests.Integration;

public class RoundsApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public RoundsApiIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetCurrentRound_WhenAuthenticated_ReturnsRoundMetricsContract()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");

        // Act - pin URL
        var response = await authedClient.GetAsync("/api/circles/1/rounds/current");

        // Assert - HTTP 200 OK
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var round = await response.Content.ReadFromJsonAsync<JsonElement>();
        round.TryGetProperty("roundId", out var roundIdProp).Should().BeTrue();
        roundIdProp.GetInt32().Should().BeGreaterThan(0);

        round.TryGetProperty("currentPotAmount", out _).Should().BeTrue();
        round.TryGetProperty("roundNumber", out _).Should().BeTrue();
        round.TryGetProperty("status", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetCircleRounds_WhenAuthenticated_ReturnsRoundsList()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");

        // Act
        var response = await authedClient.GetAsync("/api/circles/1/rounds");

        // Assert - 200 OK
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var rounds = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
        rounds.Should().NotBeNull();
        rounds!.Count.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Payout_NonExistentRound_ReturnsNotFoundOrBadRequest()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");

        // Act
        var response = await authedClient.PostAsync("/api/rounds/999999/payout", null);

        // Assert - 400 Bad Request or 404 Not Found
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DrawWinner_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Act - hit draw without token
        var response = await _client.PostAsync("/api/rounds/1/draw", null);

        // Assert - 401 Unauthorized
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
