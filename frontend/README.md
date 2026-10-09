<div align="center">

# 🎨 EkubCircle — Frontend Application
### Next-Gen Angular 21 (Zoneless Signals) Client for Ethiopian Rotating Savings & Credit

[![Angular 21](https://img.shields.io/badge/Angular-21.2%20Zoneless-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-19%20Specs%20Passing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-6%20E2E%20Passing-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Axe A11y](https://img.shields.io/badge/Axe--Core-WCAG%202.1%20AA%20Compliant-blue?style=for-the-badge&logo=w3c&logoColor=white)](https://www.deque.com/axe/)

<br/>

**A premium, culturally grounded, and responsive web application engineered for transparency, accessible community banking, and seamless ROSCA ledger interaction.**

</div>

---

## 🎨 Cultural Design System & Aesthetics

EkubCircle features a bespoke Ethiopian visual identity tailored for modern community banking:

- **Color Palette**: Deep Imperial Burgundy (`#791e2a`), Warm Clay (`#63141f`), Highland Blue (`#3b6b91`), Emerald Green (`#1e7e48`), and Gold Accents (`#d97706`).
- **Cultural Motifs**: Subtle vector artwork featuring the Imperial Lion of Judah watermark, Addis Ababa landmark silhouettes, and the traditional Ekub rosette medallion.
- **Typography**: Clean, accessible type hierarchy with native Amharic script support (ዕቁብ).
- **Responsive Layout**: Desktop sidebar navigation with persistent ledger shortcuts, paired with mobile bottom app navigation for on-the-go contribution recording.

---

## ⚡ Modern Angular Architecture

- **Zoneless Signal Mindset**: Built on Angular 21's latest signal model. Reactive state is modeled using `signal()`, `computed()`, `input()`, and `output()`, avoiding legacy Zone.js change-detection overhead.
- **Standalone Components**: 100% standalone component architecture with explicit dependency imports.
- **Functional Route Guards**: Lightweight, tree-shakeable guards (`authGuard` and `organizerGuard`) enforcing role-based client routing.
- **HTTP Client Testing Architecture**: Robust HTTP layer with `proxy.conf.json` forwarding API requests to the .NET backend during local development.

### Directory Layout

```text
frontend/src/app/
├── core/
│   ├── guards/                         # authGuard, organizerGuard
│   ├── interceptors/                   # JWT Bearer token attachment & global error interception
│   ├── models/                         # TypeScript interfaces (User, Circle, Round, Payment, JoinRequest)
│   └── services/                       # AuthService, CircleService, RoundService, PaymentService, MockDbService
├── features/
│   ├── auth/                           # Login, Registration & 1-click persona quick-switcher
│   ├── dashboard/                      # Member home ledger (Screen 6): active pot, turn order, payout state
│   ├── circles/                        # Circles list, circle creation, circle details & summary audit
│   ├── members/                        # Member roster management, email invitations, member removal
│   ├── rounds/                         # Round status, live pot counter, member checklist, Fair Draw simulator
│   ├── payments/                       # Contribution recording modal, payment history filters
│   ├── join-requests/                  # Self-service requests to join circles & organizer response flow
│   └── notifications/                  # In-app real-time audit notifications list
├── layout/                             # AppShell, Topbar, Sidebar, MobileNavigation
└── shared/                             # StatCard, ConfirmationModal, StatusBadge, Toast, EtbCurrencyPipe
```

---

## 📱 100% Wireframe Alignment Matrix

| Screen | Route | Key Capabilities | Wireframe Alignment |
|:---|:---|:---|:---:|
| **Authentication** | `/login` | Dual-mode sign in / sign up with 1-click persona quick-switcher for judges. | **Screen 1** |
| **Create Circle** | `/circles/create` | Organizer defines circle name, contribution in Birr, and frequency label. | **Screen 2** |
| **Forming Circle & Members** | `/circles/:id/members` | Invite members by email, review requests, remove members prior to start. | **Screen 3** |
| **Start Circle Modal** | `/circles/:id` | Modal locking roster, assigning deterministic turns, and generating rounds. | **Screen 4** |
| **Join Requests & Invites** | `/join-requests` | Public requests to join circles with organizer accept/reject workflow. | **Screen 5** |
| **Member Home Ledger** | `/dashboard` | Active round, current receiver, pot so far, **PAID/UNPAID** badge with 1-click contribution, and **YES/NO** pot receipt flag. | **Screen 6** |
| **Current Round (Member & Organizer)** | `/circles/:id/round` | Pot collection progress, member payment checklist, **Fair Draw Simulator**, and payout execution. | **Screens 7–10** |
| **Round & Winner History** | `/circles/:id/history` | Historical audit of member contributions, late payment indicators, and completed payout rounds. | **Screen 11** |
| **Audit Notifications** | `/notifications` | Live event audit trail of invitations, contributions, round starts, and pot disbursements. | **Screen 12** |
| **Completed Circle Summary** | `/circles/:id/summary` | Completed circle audit report displaying total pot disbursed, rotation history, and member metrics. | **Screen 13** |

---

## 🧪 Testing Suites (100% Passing)

### 1. Vitest Unit & Component Suite (19 Tests)
Executes unit tests against components, signals, and services in a simulated DOM environment:

```powershell
cd frontend
npm test
```

- `stat-card.component.spec.ts`: Tests signal inputs via `fixture.componentRef.setInput()` and DOM stability via `await fixture.whenStable()`.
- `confirmation-modal.component.spec.ts`: Tests modal signal inputs, output event emitters (`confirm`, `cancel`), and user click interactions.
- `circles-list.component.spec.ts`: Tests `provideRouter([])` router isolation, reactive filtering signals (`circles()`, `activeFilter()`), and computed signal `filteredCircles()`.
- `circle.service.spec.ts`, `round.service.spec.ts`, `payment.service.spec.ts`: Tests HTTP request methods, URL matching, and response mapping with `provideHttpClientTesting()` and `HttpTestingController`.

### 2. Playwright Full-Browser E2E Suite (6 Tests)
Runs automated end-to-end tests in headless Chromium against real browser views:

```powershell
cd frontend
npx playwright test
```

- **Shared Auth Setup (`e2e/auth.setup.ts`)**: Authenticates once as the seeded organizer and stores cookies/session to `playwright/.auth/user.json` for fast test execution.
- **Core User Journey (`e2e/circles-journey.spec.ts`)**: Validates authenticated dashboard rendering, circle navigation, and status filter switching (`All`, `Active`, `Forming`).
- **Resilience Spec (`e2e/resilience.spec.ts`)**: Intercepts `/api/circles` with HTTP 500 (`ProblemDetails`) via `page.route` to verify graceful degradation without client crash.
- **Accessibility Audits (`e2e/accessibility.spec.ts`)**: Automated WCAG 2.1 AA accessibility scans with `@axe-core/playwright` ensuring zero critical or serious violations.

### Interactive UI Mode (Optional Visual Runner)
```powershell
cd frontend
npx playwright test --ui
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ and npm

### Installation & Launch
```powershell
cd frontend
npm install
npm start
```
- The application will be accessible at `http://localhost:4200/`.
- Requests to `/api/*` are automatically forwarded to the backend API (`http://localhost:5000`) via `proxy.conf.json`.

---

## 👥 Seeded Persona Quick-Switcher

The `/login` screen includes convenient 1-click persona cards for judging and demonstration:
- **Abebe Bikila** (Circle Organizer) — `organizer@ekub.local`
- **Hana Girma** (Member 1) — `member1@ekub.local`
- **Dawit Tadesse** (Member 2) — `member2@ekub.local`
- **Hackathon Admin** (System Admin) — `admin@hackathon.local`
*(All default demo passwords: `Ekub123!` / `Admin123!`)*
