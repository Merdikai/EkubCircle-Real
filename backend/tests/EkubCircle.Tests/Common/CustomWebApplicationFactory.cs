using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using EkubCircle.Infrastructure.Persistence.Context;

namespace EkubCircle.Tests.Common;

/// <summary>
/// Custom WebApplicationFactory for ASP.NET Core API Integration Testing.
/// Follows Module 12 patterns: boots the real ASP.NET Core pipeline in memory,
/// configures test JWT configuration, and provides an isolated fast in-memory store.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private SqliteConnection? _connection;

    static CustomWebApplicationFactory()
    {
        // Set environment variables before WebApplication.CreateBuilder runs in Program.cs
        // This ensures Program.cs selects SQLite rather than registering PostgreSQL provider.
        Environment.SetEnvironmentVariable("ConnectionStrings__PostgresConnection", "your_password_here");
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", "DataSource=:memory:");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // 1. Open persistent in-memory SQLite connection for test lifecycle
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        // 2. Supply required test configuration (override connection string to SQLite, JWT secrets)
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:PostgresConnection"] = "your_password_here",
                ["ConnectionStrings:DefaultConnection"] = "DataSource=:memory:",
                ["Jwt:Key"] = "EkubCircle_Super_Secret_Key_For_Hackathon_2026_Minimum_32_Bytes!",
                ["Jwt:Issuer"] = "EkubCircleAPI",
                ["Jwt:Audience"] = "EkubCircleClient"
            });
        });

        // 3. Register persistent in-memory SQLite connection
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<EkubDbContext>>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<EkubDbContext>();

            services.AddDbContext<EkubDbContext>(options =>
            {
                options.UseSqlite(_connection);
            });
        });
    }

    /// <summary>
    /// Helper to create an HttpClient authenticated with a seeded test user.
    /// </summary>
    public async Task<HttpClient> CreateAuthenticatedClientAsync(
        string email = "organizer@ekub.local", 
        string password = "Ekub123!")
    {
        var client = CreateClient();

        var loginPayload = new { email, password };
        var response = await client.PostAsJsonAsync("/api/auth/login", loginPayload);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var token = body.GetProperty("token").GetString();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection?.Dispose();
        }
    }
}
