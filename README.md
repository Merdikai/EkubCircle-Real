# EkubCircle — Rotating Savings & Credit Associations Digital Ledger

**QIYAS Full-Stack Development Hackathon 2026 — Challenge 3: EkubCircle**

EkubCircle is an audit-compliant, robust digital ledger for Ethiopian Rotating Savings and Credit Associations (Ekub / ዕቁብ). The backend is architected in ASP.NET Core with Entity Framework Core, SQLite, and an enterprise **Multi-Project Onion (Clean) Architecture** leveraging **MediatR (CQRS)** and **AutoMapper**.

---

## 👥 Team Information

- **Project**: EkubCircle
- **Challenge**: Challenge 3 — EkubCircle
- **Team**: EkubCircle Dev Team
- **Roles**:
  - Backend Architect & Engineer: ASP.NET Core, EF Core, CQRS with MediatR, Domain Engine, SQLite, REST API
  - Frontend Developer: User Interface & Client Experience (Separately developed)

---

## 🏛️ Onion Architecture & Directory Tree

The backend strictly adheres to concentric architectural layers with dependency inversion where dependencies point strictly inward toward the core domain:

```
backend/
├── EkubCircle.sln
├── src/
│   ├── EkubCircle.Domain/                                 # Innermost Core Domain Layer
│   │   ├── Entities/                                      # Domain Entities (Zero external dependencies)
│   │   │   ├── User.cs                                    # Registered accounts (Admin, Organizer, Member) with Phone
│   │   │   ├── Circle.cs                                  # Savings circle aggregate root (Frequency, MaxMembers, StartDate)
│   │   │   ├── CircleMember.cs                            # Membership with deterministic order & HasWon status
│   │   │   ├── Round.cs                                   # Rounds engine (DueDate, DrawnAt, WinnerMemberId)
│   │   │   ├── Payment.cs                                 # Contribution ledger (Normal/Extra, ChanceCount, Status, IsLate)
│   │   │   ├── JoinRequest.cs                             # Circle join requests & organizer invitations
│   │   │   └── Notification.cs                            # In-app event notifications
│   │   ├── Enums/                                         # Pure Domain Enums
│   │   │   └── EkubEnums.cs                               # UserRole, CircleStatus, CircleFrequency, RoundStatus, PaymentType, JoinRequestStatus
│   │   └── Exceptions/                                    # Domain Exceptions
│   │       └── DomainExceptions.cs                        # DomainException, EkubRuleViolationException
│   │
│   ├── EkubCircle.Application/                             # Application / Use Cases Layer
│   │   ├── Abstractions/                                  # Application Abstractions
│   │   ├── Commands/                                      # CQRS State-Mutating Commands (MediatR IRequest)
│   │   │   ├── Auth/                                      # RegisterUserCommand, LoginUserCommand
│   │   │   ├── Circles/                                   # CreateCircleCommand, AddMemberCommand, RemoveMemberCommand, StartCircleCommand
│   │   │   ├── Payments/                                  # RecordPaymentCommand (anti-duplicate, late tracking)
│   │   │   ├── Rounds/                                    # ExecutePayoutCommand, DrawRoundWinnerCommand (Fair Draw)
│   │   │   ├── JoinRequests/                              # CreateJoinRequestCommand, RespondJoinRequestCommand
│   │   │   └── Notifications/                             # MarkNotificationAsReadCommand
│   │   ├── Queries/                                       # CQRS Read Queries (MediatR IRequest)
│   │   │   ├── Auth/                                      # GetCurrentUserQuery
│   │   │   ├── Circles/                                   # GetUserCirclesQuery, GetCircleByIdQuery, GetCircleSummaryQuery
│   │   │   ├── Payments/                                  # GetPaymentsQuery
│   │   │   ├── Rounds/                                    # GetCurrentRoundQuery, GetCircleRoundsQuery
│   │   │   ├── JoinRequests/                              # GetCircleJoinRequestsQuery, GetUserJoinRequestsQuery
│   │   │   └── Notifications/                             # GetUserNotificationsQuery
│   │   ├── Handlers/                                      # MediatR Command & Query Handlers
│   │   │   ├── Auth/                                      # RegisterUserCommandHandler, LoginUserCommandHandler, etc.
│   │   │   ├── Circles/                                   # CreateCircleCommandHandler, AddMemberCommandHandler, etc.
│   │   │   ├── Payments/                                  # RecordPaymentCommandHandler, GetPaymentsQueryHandler
│   │   │   ├── Rounds/                                    # ExecutePayoutCommandHandler, DrawRoundWinnerCommandHandler, etc.
│   │   │   ├── JoinRequests/                              # CreateJoinRequestCommandHandler, RespondJoinRequestCommandHandler, etc.
│   │   │   └── Notifications/                             # MarkNotificationAsReadCommandHandler, GetUserNotificationsQueryHandler
│   │   ├── Common/                                        # Common Interfaces & Mappings
│   │   │   ├── Interfaces/                                # IEkubDbContext, ITokenService, IPasswordHasher, IJwtTokenGenerator
│   │   │   └── Mappings/                                  # AutoMapper Profile (MappingProfile)
│   │   └── DTOs/                                          # Data Transfer Objects
│   │       ├── Auth/                                      # Register, Login, User, AuthResponse DTOs
│   │       ├── Circles/                                   # CreateCircle, AddMember, CircleDto, CircleSummaryDto
│   │       ├── Payments/                                  # RecordPayment, PaymentDto
│   │       ├── Rounds/                                    # CurrentRoundDto, PayoutResultDto, DrawWinnerDto
│   │       ├── JoinRequests/                              # CreateJoinRequestDto, RespondJoinRequestDto, JoinRequestDto
│   │       └── Notifications/                             # NotificationDto
│   │
│   ├── EkubCircle.Infrastructure/                          # Outermost Infrastructure Layer
│   │   ├── Identity/                                      # Security & Token implementations
│   │   │   ├── TokenService.cs                            # HMAC-SHA256 JWT Token Generation
│   │   │   └── PasswordHasher.cs                          # BCrypt-compatible PBKDF2 Password Hashing
│   │   ├── Persistence/                                   # Data Access & Database Configurations
│   │   │   ├── Context/                                   # EF Core DbContext & Factory
│   │   │   │   ├── EkubDbContext.cs                       # Implements IEkubDbContext (7 DbSets)
│   │   │   │   └── EkubDbContextFactory.cs                # Design-time factory for EF Core migrations
│   │   │   ├── Configurations/                            # Fluent Entity Configurations & Constraints
│   │   │   │   ├── UserConfiguration.cs                   # Email unique constraint, Phone
│   │   │   │   ├── CircleConfiguration.cs                 # Decimal precision, Frequency, MaxMembers, StartDate
│   │   │   │   ├── CircleMemberConfiguration.cs           # UNIQUE(CircleId, UserId)
│   │   │   │   ├── RoundConfiguration.cs                  # UNIQUE(CircleId, RoundNumber), WinnerMemberId
│   │   │   │   ├── PaymentConfiguration.cs                # UNIQUE(RoundId, CircleMemberId, PaymentType), ChanceCount, Status
│   │   │   │   ├── JoinRequestConfiguration.cs            # Circle, RequestedUser, RequestedByUser FKs & Indexes
│   │   │   │   └── NotificationConfiguration.cs           # User FK, (UserId, IsRead) Index
│   │   │   └── SeedData/                                  # Deterministic Seed Data
│   │   │       └── DbInitializer.cs                       # Seeds Users, Circles, Members, Rounds, Payments, JoinRequests, Notifications
│   │
│   └── EkubCircle.API/                                     # Presentation Layer (Thin Web API Controllers)
│       ├── Controllers/                                   # Thin API Controllers (Inject ONLY ISender & IMapper)
│       │   ├── AuthController.cs                          # /api/auth
│       │   ├── CirclesController.cs                       # /api/circles
│       │   ├── RoundsController.cs                        # /api/rounds
│       │   ├── PaymentsController.cs                      # /api/payments
│       │   ├── JoinRequestsController.cs                  # /api/join-requests
│       │   └── NotificationsController.cs                 # /api/notifications
│       ├── Middlewares/                                   # Global Middlewares
│       │   └── ExceptionMiddleware.cs                     # Converts DomainExceptions to standardized HTTP 400/404/500 JSON
│       └── Program.cs                                     # Dependency Injection Composition Root & Swagger
└── test-api.ps1                                           # 12-Suite Automated Verification Suite
```

> **Design Pattern Enforcement**: All controllers adhere to strict Clean Architecture rules: they inject **only `ISender` (MediatR)** and **`IMapper` (AutoMapper)**. No controllers perform business logic or touch entity repositories directly.

---

## 📊 Complete Database Schema & ER Diagram Alignment

The database schema directly implements the official Eraser ER diagram in full across 4 distinct modules:

### 1. Core: Identity (Checkpoint 1)
- **`Users`**: `Id` (PK), `FullName` / `Name`, `Email` (UNIQUE), `Phone`, `PasswordHash`, `Role` (User, Admin, Organizer, Member), `CreatedAt`

### 2. Core: Circles and Rounds (Checkpoint 1)
- **`Circles`**: `Id` (PK), `Name`, `ContributionAmount`, `Frequency` (Weekly, Monthly), `MaxMembers`, `Status` (Draft, Forming, Active, Completed), `StartDate`, `CompletedAt`, `CreatedByUserId` (FK), `CreatedAt`
- **`CircleMembers`**: `Id` (PK), `CircleId` (FK), `UserId` (FK), `MemberOrder`, `RoleInCircle` (Organizer, Member), `HasReceived` / `HasWon` (Boolean), `JoinedAt` (Constraint: `UNIQUE(CircleId, UserId)`)
- **`Rounds`**: `Id` (PK), `CircleId` (FK), `RoundNumber`, `DueDate`, `PotAmount`, `Status` (Open, Drawn, Closed, PaidOut), `DrawnAt`, `WinnerMemberId` (FK nullable -> CircleMembers.Id) (Constraint: `UNIQUE(CircleId, RoundNumber)`)

### 3. Supporting: Payments (Normal / Extra)
- **`Payments`**: `Id` (PK), `RoundId` (FK), `CircleMemberId` (FK), `Amount`, `PaymentType` (Normal, Extra), `ChanceCount`, `Status` (Pending, Paid, Failed), `PaymentMethod`, `Notes`, `IsLate` (Boolean), `PaidAt`, `RecordedByUserId` (FK) (Constraint: `UNIQUE(RoundId, CircleMemberId, PaymentType)`)

### 4. Extensions: Join Requests and Notifications
- **`JoinRequests`**: `Id` (PK), `CircleId` (FK), `RequestedUserId` (FK), `RequestedByUserId` (FK), `Status` (Pending, Accepted, Rejected, Cancelled), `Message`, `CreatedAt`, `RespondedAt`
- **`Notifications`**: `Id` (PK), `UserId` (FK), `Type`, `Title`, `Message`, `RelatedEntityId`, `IsRead` (Boolean), `CreatedAt`, `ReadAt`

---

## 🔒 The 7 Core Server-Side Hard Rules Enforced

The API acts as the single source of truth and strictly enforces all business rules on the server side:

1. **Member List Locks on Start**: Circle members can only be added or removed when the circle is in `Draft` / `Forming` status. Once `POST /api/circles/{id}/start` is called, status switches to `Active` and member roster modifications or new join requests are rejected (`HTTP 400 Bad Request`).
2. **Deterministic Payout Order**: Payout order ($1..N$) is locked deterministically at circle start based on member sequence. The system pre-assigns the receiver for each round.
3. **Exactly One Receiver / Winner per Round**: Each round has an assigned `WinnerMemberId` / `ReceiverMemberId` that cannot be duplicated or bypassed.
4. **100% Member Contribution Gate**: Payout cannot occur until every registered member of the circle has paid their contribution for that round (`HTTP 400 Bad Request` if any member is unpaid).
5. **Single Pot Receipt Rule**: A member can receive the pot at most once (`HasWon` / `HasReceived` flag). The server rejects payouts if a member already received a pot.
6. **Ongoing Payment Obligation**: Members who have already received their payout must continue contributing in all subsequent rounds.
7. **Duplicate Payment Prevention**: Composite database index `UNIQUE(RoundId, CircleMemberId, PaymentType)` and handler validation prevent duplicate contributions for the same round (`HTTP 400 Bad Request`).

---

## 🌟 Innovation & Extra Credit Features (Criterion 5: 10 pts)

1. **Server-Side Cryptographically Fair Draw Simulator (`POST /api/rounds/{roundId}/draw`)**:
   - Uses `RandomNumberGenerator` for cryptographically strong, non-deterministic random selection.
   - **Strict Rule Enforcement**: Only members who have **paid** for the round AND **have not yet won** a pot are eligible. Unpaid members are strictly disqualified from winning.
   - Automatically records `DrawnAt` and assigns the chosen member as `WinnerMemberId`.

2. **Completed-Circle Summary & Audit Report (`GET /api/circles/{id}/summary`)**:
   - Comprehensive audit endpoint for completed or active circles.
   - Calculates total pot collected, payout timelines, on-time vs. late contribution breakdown per member, and payout history.

3. **Late Contributor Flag & Audit Tracking (`IsLate`)**:
   - Payments track an `IsLate` boolean flag.
   - Enables organizers to audit timely payments vs late payments across all rounds.

4. **Self-Service Join Requests & Organizer Workflow**:
   - Prospective members can browse forming circles and submit join requests (`POST /api/join-requests`).
   - Organizers can review pending requests (`GET /api/join-requests/circle/{id}`) and accept/reject them (`PUT /api/join-requests/{id}/respond`).
   - Accepted requests automatically add the user to the `CircleMembers` roster and notify both parties.

5. **Integrated In-App Notification System**:
   - Real-time audit trail of user notifications (`GET /api/notifications`, `PUT /api/notifications/{id}/read`) for join request status, invitations, payments, and payouts.

---

## 👥 Seeded Demo Accounts (for Judges & Testing)

| Role | Email | Password | Full Name | Phone |
|---|---|---|---|---|
| **System Admin** | `admin@hackathon.local` | `Admin123!` | Hackathon Admin | `+251911000000` |
| **Organizer** | `organizer@ekub.local` | `Ekub123!` | Abebe Bikila (Circle Organizer) | `+251911111111` |
| **Member 1** | `member1@ekub.local` | `Ekub123!` | Hana Girma | `+251911222222` |
| **Member 2** | `member2@ekub.local` | `Ekub123!` | Dawit Tadesse | `+251911333333` |
| **Member 3** | `member3@ekub.local` | `Ekub123!` | Meron Bekele | `+251911444444` |
| **Member 4** | `member4@ekub.local` | `Ekub123!` | Selam Fikre | `+251911555555` |

---

## ⚙️ Configuration & Database Setup

The backend automatically supports both **SQLite (zero-setup default)** and **PostgreSQL**:
- By default, `appsettings.json` connects to local SQLite (`ekubcircle.db`), requiring zero external database configuration.
- To use PostgreSQL, copy `backend/src/EkubCircle.API/appsettings.Development.example.json` to `appsettings.Development.json` (or use `.env.example` as a template) and configure your connection string:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=ekubcircle_db;Username=postgres;Password=your_password_here"
  }
  ```
  *(Note: All credentials, passwords, and `.env` / `appsettings.*.json` files are protected and excluded by `.gitignore`)*.

---

## 🚀 Running the Project

### Prerequisites
- [.NET 9 / .NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js v20+ & npm](https://nodejs.org/)

### 1. Build & Run the Backend API
```powershell
dotnet build backend/EkubCircle.sln
dotnet run --project backend/src/EkubCircle.API/EkubCircle.API.csproj --urls "http://localhost:5000"
```

- **Swagger UI**: Accessible at `http://localhost:5000/` or `http://localhost:5000/swagger`
- **CORS**: Configured with `AllowAll` for local frontend development servers.

### 2. Run the Angular Frontend
```powershell
cd frontend
npm install
npm start
```
- **App URL**: `http://localhost:4200/` (proxied to API at `http://localhost:5000`)

---

## 📱 Frontend Screens & Wireframe Coverage (100% Wireframe Alignment)

| Screen | Route | Role / Purpose | Wireframe Mapping |
|---|---|---|---|
| **Login & Register** | `/login` | Authentication with 6 pre-seeded judging accounts (Admin, Organizer, Members 1–4). | Screen 1 |
| **Member Home Ledger** | `/dashboard` | Primary member dashboard showing active round, current receiver, pot so far, **PAID/UNPAID** badge with 1-click contribution, and **YES/NO** pot receipt flag. | Screen 6 |
| **Create Circle** | `/circles/create` | Organizer sets circle name, contribution in Birr, and meeting frequency label. | Screen 2 |
| **Forming Circle & Members** | `/circles/:id/members` | Add members by email, review join requests, remove members during forming stage. | Screen 3 |
| **Start Circle Modal** | `/circles/:id` | Irreversible start confirmation: locks member list, fixes deterministic payout order, generates rounds. | Screen 4 |
| **Join Requests & Invites** | `/join-requests` | Organizers invite users by email; members review and accept/decline incoming invitations. | Screen 5 |
| **Current Round (Member & Organizer)** | `/circles/:id/round` | Live pot collection progress, member payment checklist, **Fair Draw Simulator**, and 100% contribution payout disbursement. | Screens 7, 8, 9, 10 |
| **Round & Winner History** | `/circles/:id/history` | Historical audit of member contributions, late payment indicators, and completed payout rounds. | Screen 11 |
| **Audit Notifications** | `/notifications` | Live event audit trail of invitations, contributions, round starts, and pot disbursements. | Screen 12 |
| **Completed Circle Summary** | `/circles/:id/summary` | Completed circle audit report displaying total pot disbursed, rotation history, and member audit metrics. | Screen 13 |


### 3. Run the Automated Backend Tests (80 Tests, 100% Green)
Adhering to enterprise .NET 10 testing pyramid architecture (unit tests, boundary theories, NSubstitute mocks, and `WebApplicationFactory` API integration tests):

```powershell
dotnet test backend/tests/EkubCircle.Tests/EkubCircle.Tests.csproj --no-build
```

**Testing Pyramid Architecture:**
- **Tier 1 (Pure Domain Logic)**: `EkubCalculationServiceTests` with `[Fact]` and parameterized `[Theory]` boundary tests (testing zero, negative, deadline edges, grace period cutoffs, and draw ticket calculations).
- **Tier 2 (Boundary Mocking)**: Command handler tests using `NSubstitute` asserting exact `Received(1)` and `DidNotReceive()` interactions across validation branches.
- **Tier 3 (HTTP Pipeline Integration)**: `CustomWebApplicationFactory<Program>` in-memory test server running integration suites (`AuthApiIntegrationTests`, `CirclesApiIntegrationTests`, `RoundsApiIntegrationTests`) asserting HTTP status codes and contract shapes.

### 4. Run the 12-Suite Automated Live API Verification Test
We provide an automated PowerShell test suite verifying all 7 server-side rules, innovation features, join requests, and notifications end-to-end:

```powershell
powershell -ExecutionPolicy Bypass -File backend/test-api.ps1
```

**Verified Test Cases:**
1. Authentication & JWT profile retrieval
2. Circle creation & member invitations
3. Circle start & deterministic round generation
4. Server rejection of member additions after circle start (`HTTP 400`)
5. Round state & pot calculation engine
6. 100% member contribution gate (`HTTP 400` on premature payout attempt)
7. Payment recording & duplicate contribution rejection (`HTTP 400`)
8. Payout disbursement, round advancement, and duplicate payout rejection (`HTTP 400`)
9. Server-side fair draw simulator (verifying unpaid members cannot win)
10. Circle completion audit report generation
11. Circle join requests and organizer acceptance workflow
12. In-app notification delivery and read status management

### 5. Run Frontend Unit & Component Tests (Vitest — 19 Tests, 100% Green)
Frontend unit, component, and HTTP mock tests are located in `frontend/src/` and run with Vitest:

```bash
cd frontend
npm test
```

**Tested Areas:**
- **Signal Inputs & Reactive State**: `StatCardComponent` and `ConfirmationModalComponent` testing `setInput()`, `whenStable()`, and output event subscriptions (`confirm`, `cancel`).
- **Reactive Filtering & Router Isolation**: `CirclesListComponent` with `provideRouter([])`, `circles` signal, `activeFilter` signal, and `filteredCircles` computed signal.
- **HTTP Mock Boundary**: `CircleService`, `PaymentService`, and `RoundService` with `provideHttpClientTesting()` and `HttpTestingController` asserting contract shapes, query params, and mutation payloads.

### 6. Run Frontend E2E & Accessibility Tests (Playwright — 6 Tests, 100% Green)
Full browser user journeys, authentication storage state reuse, API resilience, and WCAG 2.1 AA accessibility audits in `frontend/e2e/`:

```bash
cd frontend
npx playwright test
```

**Tested Journeys:**
- **Shared Authentication Setup (`auth.setup.ts`)**: Automated login saving persistent session storage state (`playwright/.auth/user.json`) so subsequent tests run authenticated without repeated form submissions.
- **Dashboard & Circles User Journey (`circles-journey.spec.ts`)**: Authenticated navigation to dashboard and circles list, testing filter switching between Active, Forming, and All circles.
- **API Failure & Resilience (`resilience.spec.ts`)**: Intercepts `/api/circles` with HTTP 500 (`ProblemDetails`) using `page.route` to verify graceful degradation without client crash.
- **WCAG 2.1 AA Accessibility Audits (`accessibility.spec.ts`)**: Automated scanning with `@axe-core/playwright` across critical login and circles views enforcing zero critical/serious accessibility violations.

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Log in and receive a JWT Bearer token
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Circles (`/api/circles`)
- `POST /api/circles` — Create a new circle (creator assigned as Organizer)
- `GET /api/circles` — List user's circles (`?status=draft|forming|active|completed`)
- `GET /api/circles/{id}` — Get circle details, members list, and round status
- `POST /api/circles/{id}/members` — Add member by email (Organizer only, Forming only)
- `DELETE /api/circles/{id}/members/{memberId}` — Remove member (Organizer only, Forming only)
- `POST /api/circles/{id}/start` — Lock member list, assign deterministic payout order, generate rounds
- `GET /api/circles/{id}/summary` — Completed-circle audit report and member metrics

### Rounds (`/api/rounds`)
- `GET /api/rounds/current?circleId={id}` — Current open round details, receiver info, member checklist, pot calculation
- `GET /api/rounds?circleId={id}` — List all rounds and payout statuses
- `POST /api/rounds/{roundId}/payout` — Execute pot payout (enforces 100% payment gate & single receipt rule)
- `POST /api/rounds/{roundId}/draw` — Server-side cryptographically fair draw simulator

### Payments (`/api/payments`)
- `POST /api/payments` — Record member contribution (prevents duplicate payments, supports `IsLate` flag)
- `GET /api/payments?circleId={id}&roundId={id}` — Audit trail of payments

### Join Requests (`/api/join-requests`)
- `POST /api/join-requests` — Submit request to join a circle or invite a user
- `PUT /api/join-requests/{id}/respond` — Accept or reject a join request (Organizer / Invitee)
- `GET /api/join-requests/circle/{circleId}` — Get all join requests for a circle
- `GET /api/join-requests/my` — Get all join requests sent or received by the current user

### Notifications (`/api/notifications`)
- `GET /api/notifications` — Get current user's notifications (`?unreadOnly=true|false`)
- `PUT /api/notifications/{id}/read` — Mark notification as read