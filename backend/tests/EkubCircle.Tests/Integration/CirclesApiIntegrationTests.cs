using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using EkubCircle.Tests.Common;
using FluentAssertions;

namespace EkubCircle.Tests.Integration;

public class CirclesApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public CirclesApiIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetCircles_WhenAuthenticated_ReturnsOkAndListContract()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");

        // Act - pin URL
        var response = await authedClient.GetAsync("/api/circles");

        // Assert - HTTP 200 OK
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var list = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
        list.Should().NotBeNull();
        list!.Count.Should().BeGreaterThanOrEqualTo(1);

        var firstCircle = list[0];
        firstCircle.TryGetProperty("id", out var idProp).Should().BeTrue();
        idProp.GetInt32().Should().BeGreaterThan(0);
        firstCircle.TryGetProperty("name", out var nameProp).Should().BeTrue();
        nameProp.GetString().Should().NotBeNullOrWhiteSpace();
        firstCircle.TryGetProperty("status", out _).Should().BeTrue();
        firstCircle.TryGetProperty("contributionAmount", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetCircleById_ExistingCircle_ReturnsOkAndMembersRosterContract()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");

        // Act - fetch seeded circle 1
        var response = await authedClient.GetAsync("/api/circles/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var circle = await response.Content.ReadFromJsonAsync<JsonElement>();
        circle.GetProperty("id").GetInt32().Should().Be(1);
        circle.TryGetProperty("members", out var membersProp).Should().BeTrue();
        membersProp.GetArrayLength().Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task CreateCircle_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var newCirclePayload = new
        {
            name = "Unauthorized Attempt Circle",
            contributionAmount = 5000,
            meetingLabel = "Monthly"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/circles", newCirclePayload);

        // Assert - 401 Unauthorized
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateCircle_EmptyName_ReturnsBadRequest()
    {
        // Arrange - invalid empty name payload
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");
        var invalidPayload = new
        {
            name = "",
            contributionAmount = 2500,
            meetingLabel = "Weekly"
        };

        // Act
        var response = await authedClient.PostAsJsonAsync("/api/circles", invalidPayload);

        // Assert - 400 Bad Request
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateCircle_ValidPayload_ReturnsCreatedCircleWithFormingStatus()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");
        var validPayload = new
        {
            name = $"Integration Test Circle {Guid.NewGuid().ToString()[..6]}",
            contributionAmount = 3000,
            meetingLabel = "Bi-Weekly"
        };

        // Act
        var response = await authedClient.PostAsJsonAsync("/api/circles", validPayload);

        // Assert - 200 OK or 201 Created
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        created.GetProperty("name").GetString().Should().Be(validPayload.name);
        created.GetProperty("contributionAmount").GetDecimal().Should().Be(3000m);
        created.GetProperty("status").GetString().Should().Be("Forming");
    }

    [Fact]
    public async Task GetCircleSummary_SeededCircle_ReturnsAuditReportContract()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");

        // Act
        var response = await authedClient.GetAsync("/api/circles/1/summary");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<JsonElement>();
        summary.GetProperty("circleId").GetInt32().Should().Be(1);
        summary.TryGetProperty("rounds", out _).Should().BeTrue();
        summary.TryGetProperty("members", out _).Should().BeTrue();
    }
}
