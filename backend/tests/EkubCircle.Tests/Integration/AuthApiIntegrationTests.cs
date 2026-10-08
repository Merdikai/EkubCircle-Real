using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using EkubCircle.Tests.Common;
using FluentAssertions;

namespace EkubCircle.Tests.Integration;

public class AuthApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthApiIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkAndJwtToken()
    {
        // Arrange
        var loginPayload = new
        {
            email = "organizer@ekub.local",
            password = "Ekub123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginPayload);

        // Assert - HTTP 200 OK
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.TryGetProperty("token", out var tokenProp).Should().BeTrue();
        tokenProp.GetString().Should().NotBeNullOrWhiteSpace();

        body.TryGetProperty("user", out var userProp).Should().BeTrue();
        userProp.GetProperty("email").GetString().Should().Be("organizer@ekub.local");
        userProp.GetProperty("role").GetString().Should().Be("Organizer");
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var invalidPayload = new
        {
            email = "organizer@ekub.local",
            password = "WrongPassword999!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", invalidPayload);

        // Assert - HTTP 401 Unauthorized
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_WithInvalidPayload_ReturnsBadRequest()
    {
        // Arrange - empty email and missing password (contract validation check)
        var invalidPayload = new
        {
            fullName = "Test User",
            email = "",
            password = "",
            role = "Member"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", invalidPayload);

        // Assert - 400 Bad Request
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetProfile_WhenAuthenticated_ReturnsUserProfile()
    {
        // Arrange
        using var authedClient = await _factory.CreateAuthenticatedClientAsync("organizer@ekub.local", "Ekub123!");

        // Act
        var response = await authedClient.GetAsync("/api/auth/me");

        // Assert - 200 OK
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("email").GetString().Should().Be("organizer@ekub.local");
    }

    [Fact]
    public async Task GetProfile_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Act - request without Bearer token
        var response = await _client.GetAsync("/api/auth/me");

        // Assert - 401 Unauthorized
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
