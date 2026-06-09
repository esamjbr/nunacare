# CLAUDE.md

## Project Overview

This project is **NunaCare**, a private baby routine tracker designed mainly for the Jordan market.

NunaCare helps parents and families track:

* Baby feeding
* Sleep
* Diapers
* Medicine
* Appointments
* Baby weight/growth
* First foods from 6–12 months
* Doctor questions
* Doctor reports
* Mom postpartum recovery
* Family/caregiver records

The product should feel calm, respectful, private, warm, and simple for tired parents.

The business model is manual sales:

1. Customer sees NunaCare on Instagram.
2. Customer messages us.
3. Customer pays manually outside the app.
4. Admin creates a customer account.
5. Admin sends the customer a link, username, and temporary password.
6. Customer logs in, changes password, and uses the app.

There is **no in-app purchase** and **no payment gateway** for now.

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Recharts, if charts exist
* jsPDF/html2canvas, if doctor report PDF export exists

### Backend

* ASP.NET Core Web API
* .NET 8
* Entity Framework Core
* PostgreSQL
* JWT authentication
* Refresh tokens
* Role-based authorization

### Database

* PostgreSQL

### Deployment Target

Preferred free MVP deployment:

* Frontend: Netlify / Cloudflare Pages
* Backend: Render Free Web Service
* Database: Supabase Free PostgreSQL

---

## Product Rules

### Must Preserve

Do not remove or break:

* Arabic/RTL support
* English support
* Calm Mode
* Doctor report PDF generation
* First Foods safety gate
* Mom Recovery safety wording
* Admin-created customer flow
* Manual sales model
* Existing visual identity
* Existing soft/premium UI style
* Existing core baby tracking features

### Must Not Add

Do not add:

* Stripe
* PayPal
* Apple In-App Purchase
* Google Play Billing
* Tap
* HyperPay
* CliQ integration
* Zain Cash integration
* Any payment gateway
* Social login unless explicitly requested
* Real caregiver invites unless explicitly requested
* SMS/email sending unless explicitly requested
* Medical diagnosis features
* Aggressive fitness or weight-loss language

---

## UX / Brand Guidelines

The app must feel:

* Calm
* Soft
* Premium
* Warm
* Private
* Family-friendly
* Respectful
* Simple for tired parents
* Arabic-market friendly

Avoid language that makes parents feel judged, behind, or pressured.

Use wording like:

* “Care, remembered gently.”
* “Track your baby’s routine calmly.”
* “Discuss changes with your doctor.”
* “Rest counts too.”
* “Small recovery steps.”

Avoid wording like:

* “Your baby is behind.”
* “Bad sleep score.”
* “You failed today.”
* “Lose baby weight fast.”
* “Get your body back.”
* “Flat belly challenge.”

---

## Medical and Safety Rules

This app is a tracking tool, not a medical diagnosis app.

Always preserve safety language for medicine, first foods, growth, and mom recovery.

### Medicine

Medicine logs are reminders only.

Use wording like:

> Medicine logs are reminders only. Always follow your doctor’s instructions.

### Growth

Do not say:

* Too small
* Too big
* Abnormal
* Behind

Use:

> Track your baby’s growth trend and discuss changes with your doctor.

### First Foods

First Foods must only be available for babies around 6–12 months.

If the baby is under 6 months, show a locked/safety state.

Do not provide recipes for 0–5 months.

Keep safety notes such as:

> No honey before 12 months. Avoid choking hazards. Ask your doctor if your baby has allergies, reflux, prematurity, or medical conditions.

### Mom Recovery

Do not call it “Mommy Fitness.”

Use:

* Mom Recovery
* Postpartum Recovery
* Gentle recovery

Keep supportive safety text.

---

## Authentication Rules

The app uses manual admin-created accounts.

### User Roles

There are two main roles:

* Admin
* Customer

### Admin

Admin can:

* Login
* Create customer accounts
* Generate temporary passwords
* Reset customer passwords
* Activate/deactivate customers
* Set access type
* Set expiration date
* View customer account status

Admin must not see private baby logs by default.

### Customer

Customer can:

* Login
* Change temporary password
* Create baby profile
* Use the baby tracker
* Generate doctor report
* Export/delete their own data

### Password Rules

Never store plain text passwords.

Use password hashing only.

Temporary passwords may be shown once when admin creates/resets a customer, but must never be stored as plain text.

Customers with `MustChangePassword = true` must be forced to change password before using the app.

---

## Backend Security Rules

Every customer data request must be scoped to the authenticated customer’s family.

Never trust `familyId` from the frontend for authorization.

Correct approach:

1. Read authenticated user ID from JWT.
2. Load that user’s family.
3. Query data only where `FamilyId == user.FamilyId`.

Customer A must never access Customer B data.

Admin routes require Admin role.

Customer routes require:

* Customer role
* Active account
* Non-expired access

Expired or inactive accounts should show a calm renewal message and should not delete data.

---

## Data Persistence Rules

The backend database is the source of truth for customer baby/family data.

### Allowed localStorage Usage

localStorage may store:

* Access token
* Refresh token
* Selected language
* Calm Mode
* Small UI preferences

### Not Allowed as Source of Truth

Do not use localStorage as the main storage for:

* Baby profile
* Feeding logs
* Sleep logs
* Diaper logs
* Medicine
* Appointments
* Weights
* Doctor questions
* Food reactions
* Mom recovery records
* Family members
* Premium/access status

If any of the above still use localStorage, migrate them to backend API persistence.

---

## Core Data Models

Expected backend entities include:

* User
* Family
* FamilyMember
* BabyProfile
* BabyLog
* Medicine
* MedicineDose
* Appointment
* WeightEntry
* DoctorQuestion
* FoodReaction
* MomCheckIn
* RefreshToken

BabyLog can be used as a flexible table for:

* Feeding
* Sleep
* Diaper
* Notes
* General logs

Use `DataJson` for flexible log-specific details where appropriate.

---

## API Expectations

Expected auth endpoints:

* `POST /api/auth/login`
* `POST /api/auth/refresh`
* `POST /api/auth/logout`
* `GET /api/auth/me`
* `POST /api/auth/change-password`

Expected admin endpoints:

* `GET /api/admin/customers`
* `POST /api/admin/customers`
* `GET /api/admin/customers/{id}`
* `PATCH /api/admin/customers/{id}`
* `POST /api/admin/customers/{id}/reset-password`
* `POST /api/admin/customers/{id}/activate`
* `POST /api/admin/customers/{id}/deactivate`

Expected customer data endpoints:

* `/api/babies`
* `/api/logs`
* `/api/medicines`
* `/api/medicine-doses`
* `/api/appointments`
* `/api/weights`
* `/api/doctor-questions`
* `/api/food-reactions`
* `/api/mom-checkins`
* `/api/family-members`
* `/api/account/export`
* `/api/account/delete-data`

If an endpoint is missing but the frontend expects it, either implement the endpoint or update the frontend API call to match the existing backend design.

---

## Frontend Rules

Preserve the current UI as much as possible.

Do not redesign screens unless the user explicitly asks.

When fixing bugs:

* Keep component names if possible.
* Keep routes if possible.
* Keep existing styling and colors.
* Keep the mobile-first layout.
* Keep bottom navigation behavior.
* Keep Arabic/RTL behavior.
* Keep loading and empty states clean.
* Avoid large rewrites.

### Responsive Rules

The app should behave like a mobile app in the browser.

Expected behavior:

* Mobile-first layout
* Centered mobile frame on desktop
* No horizontal overflow
* Bottom navigation fixed/sticky consistently
* Content should not hide behind bottom navigation
* Bottom sheets should fit inside viewport
* Arabic text should not break layout

---

## Admin Dashboard Rules

Admin dashboard should be functional and simple.

It should support:

* Customer list
* Search customers
* Create customer
* Reset password
* Activate/deactivate
* Set access type
* Set expiry date
* Copy customer credentials message

Credential message format:

```text
Welcome to NunaCare 🤍

App link:
[APP_LINK]

Username:
[USERNAME]

Temporary password:
[PASSWORD]

Please change your password after first login.
```

Do not show private baby logs in admin by default.

---

## Manual Sales Flow

The complete flow must work like this:

1. Admin logs in.
2. Admin creates customer.
3. System generates temporary password.
4. Admin copies credentials.
5. Customer logs in.
6. Customer changes temporary password.
7. Customer creates baby profile.
8. Customer uses the app.
9. All data persists in PostgreSQL.

---

## Error Handling

Backend should return consistent errors:

```json
{
  "message": "Human readable error",
  "errors": {}
}
```

Frontend should show friendly error messages.

Avoid exposing technical stack traces to users.

---

## Build and Run Commands

Use the actual project scripts if different.

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

### Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet run
```

### Database

```bash
docker compose up -d
```

### EF Core Migrations

If needed:

```bash
cd backend
dotnet ef database update
```

---

## Environment Variables

### Frontend

```env
VITE_API_BASE_URL=http://localhost:5000
```

Production example:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

### Backend

```env
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=nunacare;Username=nunacare;Password=nunacare_dev_password
Jwt__Issuer=NunaCare
Jwt__Audience=NunaCare.Client
Jwt__SigningKey=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
Jwt__AccessTokenMinutes=15
Jwt__RefreshTokenDays=30
AdminSeed__Username=admin
AdminSeed__Password=CHANGE_THIS_ADMIN_PASSWORD
Cors__AllowedOrigins__0=http://localhost:5173
```

Never commit real production secrets.

---

## Deployment Notes

Free MVP deployment target:

* Frontend: Netlify / Cloudflare Pages
* Backend: Render Free Web Service
* Database: Supabase Free PostgreSQL

Production environment must use:

* Strong JWT signing key
* Strong admin password
* HTTPS
* Restricted CORS origins
* No public development secrets
* Protected or disabled Swagger

---

## Common Issues to Check

When debugging, inspect:

1. TypeScript build errors
2. Missing imports
3. Wrong API base URL
4. CORS errors
5. JWT claim mismatch
6. Refresh token loop
7. Admin/customer redirect loop
8. `MustChangePassword` redirect issues
9. Expired/inactive account handling
10. Date serialization problems
11. `DateOnly` mapping problems in .NET/PostgreSQL
12. `DataJson` parsing errors
13. Frontend still using localStorage for server-backed data
14. Customer data not scoped by authenticated family
15. Arabic/RTL layout regressions
16. Doctor PDF generation crashing on empty data
17. First Foods showing for babies under 6 months
18. Mom Recovery wording becoming too fitness-focused

---

## Acceptance Criteria

A task is complete only when:

* Frontend builds successfully.
* Backend builds successfully.
* Database migrations apply.
* Admin can login.
* Admin can create customer.
* Temporary password is displayed once.
* Customer can login.
* Customer is forced to change password.
* Customer can create baby profile.
* Customer can add major records.
* Data persists after refresh.
* Data persists after logout/login.
* Customer A cannot access Customer B data.
* Inactive/expired account is blocked.
* Arabic/RTL still works.
* Calm Mode still works.
* Doctor report still works.
* No payment integration exists.
* UI design remains consistent.

---

## Development Style

When making changes:

* Prefer small, targeted fixes.
* Do not rewrite large sections without need.
* Explain major changes.
* Keep existing UX intact.
* Keep code readable and typed.
* Avoid duplicate logic.
* Keep backend authorization strict.
* Keep frontend state predictable.
* Validate on both frontend and backend where appropriate.
* Do not introduce unnecessary dependencies.

---

## Final Reminder

NunaCare is a private family baby-care tracking app.

Trust, privacy, calm UX, and data safety matter more than adding many features.

Always protect the user’s family and baby data.
