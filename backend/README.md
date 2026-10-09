<div align="center">

# 🏛️ EkubCircle — Backend Architecture & API Service
### Enterprise .NET 10 Clean Architecture (Onion) with MediatR CQRS & EF Core

[![.NET 10](https://img.shields.io/badge/.NET%2010-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![C# 13](https://img.shields.io/badge/C%23%2013-239120?style=for-the-badge&logo=csharp&logoColor=white)](https://learn.microsoft.com/dotnet/csharp/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-Web%20API-512BD4?style=for-the-badge&logo=.net&logoColor=white)](https://dotnet.microsoft.com/apps/aspnet)
[![EF Core](https://img.shields.io/badge/Entity%20Framework%20Core-10.0-512BD4?style=for-the-badge&logo=nuget&logoColor=white)](https://learn.microsoft.com/ef/core/)
[![MediatR](https://img.shields.io/badge/MediatR-CQRS-orange?style=for-the-badge)](https://github.com/jbogard/MediatR)
[![AutoMapper](https://img.shields.io/badge/AutoMapper-13.0-red?style=for-the-badge)](https://automapper.org/)
[![xUnit](https://img.shields.io/badge/xUnit-80%20Tests%20Passing-green?style=for-the-badge&logo=dotnet&logoColor=white)](https://xunit.net/)

<br/>

**The robust, audit-compliant financial server and domain engine powering EkubCircle (ዕቁብ).**

</div>

---

## 📐 Concentric Onion Architecture

The backend strictly implements Concentric Clean Architecture with dependency inversion: dependencies flow strictly inward toward the core domain.

```text
EkubCircle.sln
│
├── src/
│   ├── EkubCircle.Domain/                  # Core Business Domain (Zero External Dependencies)
│   │   ├── Entities/                       # User, Circle, CircleMember, Round, Payment, JoinRequest, Notification
│   │   ├── Enums/                          # UserRole, CircleStatus, CircleFrequency, RoundStatus, PaymentType
│   │   └── Exceptions/                     # DomainException, EkubRuleViolationException
│   │
│   ├── EkubCircle.Application/             # Use Cases & Orchestration Layer
│   │   ├── Abstractions/                   # Interfaces for DbContext, Tokens, Hashing
│   │   ├── Commands/                       # CQRS State-Mutating Commands (IRequest<T>)
│   │   ├── Queries/                        # CQRS Read Queries (IRequest<T>)
│   │   ├── Handlers/                       # MediatR Command & Query Handlers
│   │   ├── Common/Services/                # EkubCalculationService (pure calculations & lottery logic)
│   │   ├── Common/Mappings/                # AutoMapper Profile (MappingProfile.cs)
│   │   └── DTOs/                           # Request & Response Contracts
│   │
│   ├── EkubCircle.Infrastructure/          # External Concerns & Data Access Layer
│   │   ├── Identity/                       # TokenService (HMAC-SHA256 JWT) & PasswordHasher (PBKDF2)
│   │   ├── Persistence/Context/            # EkubDbContext (EF Core) & EkubDbContextFactory
│   │   ├── Persistence/Configurations/     # Fluent Entity Configurations with unique composite indexes
│   │   └── SeedData/                       # DbInitializer (Deterministic hackathon dataset)
│   │
│   └── EkubCircle.API/                     # Presentation Web API (Thin Controllers)
│       ├── Controllers/                    # Injects ONLY ISender & IMapper (Zero direct DB access)
│       ├── Middlewares/                    # Global ExceptionMiddleware (RFC 7807 ProblemDetails)
│       └── Program.cs                      # Dependency Injection Composition Root & Swagger
│
└── tests/
    └── EkubCircle.Tests/                   # Comprehensive Automated Test Suite (80 Tests)
        ├── Unit/Services/                  # Pure domain fact & theory boundary tests
        ├── Unit/Handlers/                  # NSubstitute command handler isolation specs
        ├── Integration/                    # WebApplicationFactory end-to-end API pipeline tests
        └── Common/                         # CustomWebApplicationFactory with in-memory SQLite
```

---

## 🔒 7 Server-Side Business Rules Enforced

The API serves as the single source of truth for all financial and rotational logic:

1. **Member List Locks on Start**: Circle members can only join or leave when status is `Forming`. Calling `POST /api/circles/{id}/start` switches status to `Active` and rejects all roster mutations (`HTTP 400 Bad Request`).
2. **Deterministic Round Generation**: Exactly $N$ rounds are pre-generated for $N$ registered members upon circle start.
3. **One Winner per Round**: Enforced by composite unique constraint `UNIQUE(CircleId, RoundNumber)`.
4. **100% Contribution Gate**: Payout cannot execute until every member in the circle has paid for the current round (`HTTP 400 Bad Request`).
5. **Single Pot Receipt Rule**: A member can receive the pot at most once during a circle's complete lifecycle (`HasWon` / `HasReceived` flag).
6. **Ongoing Payment Obligation**: Members who have already won their payout must continue contributing in all subsequent rounds.
7. **Zero Duplicate Payments**: Composite unique index `UNIQUE(RoundId, CircleMemberId, PaymentType)` and handler validation prevent duplicate contributions.

---

## 🚀 Running the Backend

### Prerequisites
- [.NET 9 or .NET 10 SDK](https://dotnet.microsoft.com/)
- SQLite (included out-of-the-box, zero external configuration needed)

### Build & Run
```powershell
dotnet build backend/EkubCircle.sln
dotnet run --project backend/src/EkubCircle.API/EkubCircle.API.csproj --urls "http://localhost:5000"
```

- **Swagger Interactive API**: `http://localhost:5000/swagger`
- **Health Check**: `GET http://localhost:5000/api/auth/me`

### Database Configuration (SQLite vs. PostgreSQL)
- **Default (Zero-Setup)**: Local SQLite file (`ekubcircle.db`) created automatically on first startup.
- **PostgreSQL (Optional)**: Copy `backend/src/EkubCircle.API/appsettings.Development.example.json` to `appsettings.Development.json` and adjust the connection string:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=ekubcircle_db;Username=postgres;Password=your_password_here"
  }
  ```
  *(Credentials and active `appsettings.*.json` files are strictly excluded from version control by `.gitignore`)*.

---

## 🧪 Testing Pyramid (80 Tests, 100% Green)

The backend test suite covers all architectural layers:

```powershell
dotnet test backend/EkubCircle.sln --no-build
```

### Breakdown of Test Suites
- **Tier 1 — Pure Domain Calculations (`EkubCalculationServiceTests.cs`)**:
  - Tests pot totals, deductions, edge cases, and parameterized `[Theory]` tests for payment timeliness (on-time, boundary, grace period, late).
  - Tests fair draw lottery ticket weight assignment and validation.
- **Tier 2 — Handler Boundary Isolation (NSubstitute)**:
  - Command handlers (`RecordPaymentCommandHandler`, `StartCircleCommandHandler`, `ExecutePayoutCommandHandler`, `DrawRoundWinnerCommandHandler`) verified with mocked dependencies.
  - Asserts exact `Received(1)` state changes and `DidNotReceive()` abort paths.
- **Tier 3 — HTTP Pipeline Integration (`CustomWebApplicationFactory.cs`)**:
  - In-memory ASP.NET Core test server booting with SQLite in-memory database and test JWT tokens.
  - End-to-end HTTP tests across `AuthApiIntegrationTests`, `CirclesApiIntegrationTests`, and `RoundsApiIntegrationTests`.

### Automated 12-Suite Live API Verification Script
```powershell
powershell -ExecutionPolicy Bypass -File backend/test-api.ps1
```

---

## 👥 Seeded Judging Accounts

| Role | Email | Password | Full Name |
|:---|:---|:---|:---|
| **System Admin** | `admin@hackathon.local` | `Admin123!` | Hackathon Admin |
| **Organizer** | `organizer@ekub.local` | `Ekub123!` | Abebe Bikila (Circle Organizer) |
| **Member 1** | `member1@ekub.local` | `Ekub123!` | Hana Girma |
| **Member 2** | `member2@ekub.local` | `Ekub123!` | Dawit Tadesse |
| **Member 3** | `member3@ekub.local` | `Ekub123!` | Meron Bekele |
| **Member 4** | `member4@ekub.local` | `Ekub123!` | Selam Fikre |
