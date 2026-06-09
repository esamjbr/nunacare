# NunaCare Backend Audit — Consolidated Report

*Read-only audit. No files were modified, no migrations run, no state mutated. All findings are from static inspection of `/home/asauafth/Desktop/local projects/pregnency/backend`. No build or tests were executed (the `.git` directory is empty/non-functional, so commit history could not be inspected; secrets are assessed as they sit in the source tree).*

---

## 1. Executive Summary

- **Tenant isolation is correctly implemented where it exists.** Every customer-data controller resolves `FamilyId` from the JWT (never from the client body) and scopes all reads/writes with `FamilyId == familyId`, plus ownership-checked `BabyId` on creates. No IDOR was found in Babies, Logs, FamilyMembers, FoodReactions, or MomCheckIns.
- **Two genuine auth holes.** `change-password` never verifies the current password (account takeover from any leaked token), and `MustChangePassword` is set/emitted but **never enforced server-side** — a customer holding the admin-issued temp password can call every data endpoint directly.
- **A usable JWT signing key and a DB password are committed in `appsettings.json`.** The startup guard only checks length (≥32), so the known key passes and will be used in prod if no env override is set — enabling forged admin tokens.
- **No service/repository layer.** The tenant-scoping primitive (`GetCurrentFamilyIdAsync`) is copy-pasted verbatim into 5 controllers; business logic, JSON handling, and DTO mapping all live in fat controllers. This is the highest-leverage maintainability/security risk.
- **Schema models a dual FK to Family with no consistency guarantee.** Baby-owned entities carry both a direct `FamilyId` (FK `NoAction`) and an indirect `Baby→Family` (Cascade); nothing enforces `row.FamilyId == Baby.FamilyId`, the very column isolation depends on.
- **Broad API-contract gap.** `Medicine`, `MedicineDose`, `Appointment`, `WeightEntry`, `DoctorQuestion` tables/indexes exist but have **no controllers**; `/api/account/export` and `/api/account/delete-data` are also missing. Core tracking features cannot persist to the backend.
- **Zero automated tests.** No test project, no xUnit/Moq/Mvc.Testing references. 0% coverage on auth, authorization, tenant isolation, and the admin lifecycle. (`public partial class Program;` is already present, so an integration harness can be added without touching prod code.)
- **Missing operational hardening:** no rate limiting/lockout on login, no refresh-token reuse detection, no global exception handler, auto-migrate-on-startup, and `AllowedHosts: *`.
- **`AccessType` is dead policy** — stored/editable but never drives expiry or authorization; access depends solely on a manually-set `ExpiresAt`.
- **Cryptography is solid:** PBKDF2-SHA256 (100k iters, per-password salt, fixed-time compare), refresh tokens stored only as SHA-256 hashes with a unique index, JWT validates issuer/audience/lifetime/key with a tight 1-min clock skew. No raw SQL, no file uploads, no payment code.

---

## 2. Findings by Severity

### CRITICAL

**SEC-001 — `change-password` does not verify the current password**
`Controllers/AuthController.cs:139-167`; DTO `DTOs/AuthDtos.cs:11`.
The endpoint requires only `[Authorize]` + a `NewPassword` (≥8 chars). No `CurrentPassword` field, no verification before overwriting `user.PasswordHash`.
*Why it matters:* Any actor with a valid access token (XSS on the SPA reading `localStorage`, a leaked/proxied token, an unlocked device) can permanently change the password and lock out the owner — durable account takeover of a PII-bearing family account.
*Exploit:* Steal token via XSS → `POST /api/auth/change-password {"newPassword":"x"}` → victim locked out, attacker holds credentials.
*Fix:* Add a required `CurrentPassword`; verify with `VerifyPassword` before hashing the new one. Skip the check **only** when `user.MustChangePassword == true` (first-login flow). Keep the existing refresh-token revocation.

**SEC-002 — `MustChangePassword` is never enforced server-side** *(also TEST-004)*
Flag written at `AuthController.cs:161`, `AdminCustomersController.cs:82,184`; emitted as JWT claim at `Auth/JwtTokenService.cs:33`. Gates (`AuthController.GetBlockedResult` `:216-229`; every `GetCurrentFamilyIdAsync`) check only `IsActive`/`ExpiresAt`.
*Why it matters:* CLAUDE.md requires forcing password change before app use. The backend issues a fully-functional access token at login regardless, and serves all data to a user still holding the temp password. Temp passwords travel over WhatsApp/Instagram DMs.
*Exploit:* Temp password leaks in chat; attacker logs in and calls `/api/babies`, `/api/logs`, `/api/mom-checkins` directly (bypassing the SPA) while `MustChangePassword` is still true.
*Fix:* Server-side gate (shared filter / scope service) returning 403 when `MustChangePassword == true`, allowing only `auth/me`, `auth/change-password`, `auth/logout`, `auth/refresh`.

**SEC-003 — Usable JWT signing key + DB password committed in config** *(also ARCH-006)*
`appsettings.json:14` (`"SigningKey":"dev-only-change-this-signing-key-before-production-32chars"`), `appsettings.json:3` (DB password). Build copy also at `backend/bin/Debug/net8.0/appsettings.json`. Guard `Program.cs:71-74` checks length only. `.gitignore` does **not** exclude `appsettings*.json`.
*Why it matters:* If this file/key reaches prod (Render deploy without `Jwt__SigningKey` override), anyone with the repo forges JWTs with `role=Admin` and arbitrary `sub` → total authn/authz bypass.
*Exploit:* Sign a token with the known key, `role=Admin`, call every admin endpoint (list customers, reset passwords, deactivate).
*Fix:* Remove the secret from `appsettings.json`; require from env/secret store. Reject known placeholder values and refuse to start in Production with a missing/weak key (`AddOptions<JwtOptions>().Validate(...).ValidateOnStart()`). Ensure `bin/` artifacts with secrets aren't deployed; add config to `.gitignore`.

**ARCH-001 — Tenant-scoping logic duplicated across 5 controllers, no shared abstraction**
`BabiesController.cs:141-157`, `LogsController.cs:174-190`, `FoodReactionsController.cs:189-206`, `MomCheckInsController.cs:151-167`, `FamilyMembersController.cs:178-194` (and the parallel `AuthController.GetBlockedResult:216-229`).
*Why it matters:* This is the core multi-tenant isolation guarantee, copy-pasted. Any hardening (e.g., SEC-002 enforcement, audit logging) must be applied in 5+ places; a new controller can silently omit it.
*Fix:* Introduce a scoped `IFamilyScopeResolver`/`ICurrentFamilyContext` (reads user, applies active/expired/must-change gate, returns `Guid? FamilyId`) injected into all data controllers; ideally push the `Where(FamilyId == ...)` predicate behind a family-scoped repository.

**ARCH-002 / DB-001 — Dual FK to Family with `NoAction` and no consistency constraint**
`Data/AppDbContext.cs:120-123,140-143,157-164,181-184,200-203,217-220,240-243`; migration `Migrations/20260608115853_InitialCreate.cs` FKs created without `onDelete` (e.g. `:178-182,207-211,240-244,274-278,304-308,339-343,368-372`).
Baby-owned entities carry a direct `FamilyId` FK (`NoAction`) **and** an indirect `Baby→Family` (Cascade). Nothing guarantees `row.FamilyId == Baby.FamilyId` — the exact column the controllers filter on for isolation.
*Why it matters:* A future bug setting a wrong `FamilyId` would silently cross tenants and the DB would accept it; on `Family` delete the un-cascaded direct FK produces inconsistent/orphaning behavior depending on path.
*Fix:* Pick one authoritative ownership path. Preferred: keep `FamilyId` denormalized but enforce a composite FK `(BabyId, FamilyId)` → unique `(Id, FamilyId)` on `BabyProfile`, or a CHECK/trigger. Alternatively drop the redundant column and scope via `Baby.FamilyId`. At minimum make the Family FK `Restrict` explicitly.

### HIGH

**SEC-004 — No rate limiting / lockout on login & refresh**
`AuthController.cs:30-59` (Login), `:61-93` (Refresh); no `AddRateLimiter`/`UseRateLimiter` in `Program.cs`.
Usernames are predictable (`admin`, `customer<...>`); login is anonymous and unlimited.
*Exploit:* Script thousands of `/api/auth/login` attempts vs `admin` (note CLAUDE.md default `CHANGE_THIS_ADMIN_PASSWORD`) → online brute force → full admin control.
*Fix:* ASP.NET Core rate limiter (window keyed by IP+username) on login/refresh + per-account failed-attempt lockout with backoff.

**SEC-005 — Refresh rotation lacks reuse detection / theft response**
`AuthController.cs:61-93`, `CreateAuthResponseAsync:169-195`.
Rotation revokes only the presented token; replay of an already-revoked token just returns 401 with no containment. No token-family linkage.
*Exploit:* Stolen refresh token rotated independently of victim; 30-day window (`RefreshTokenDays=30`); theft never detected.
*Fix:* Track token family/parent; on presentation of a known-but-revoked hash, revoke all of the user's tokens and force re-login. Consider shortening `RefreshTokenDays`.

**ARCH-003 — Missing controllers promised by the API contract**
Entities/DbSets exist (`AppDbContext.cs:19-24`) but no controllers for `/api/medicines`, `/api/medicine-doses`, `/api/appointments`, `/api/weights`, `/api/doctor-questions`, `/api/account/export`, `/api/account/delete-data` (CLAUDE.md API Expectations).
*Why it matters:* Core features (medicine, appointments, weight/growth, doctor questions, export/delete) cannot persist; frontend 404s or falls back to localStorage, violating Data Persistence Rules. Dead schema + broken contract.
*Fix:* Implement on top of the ARCH-001 scope service. For `account/delete-data`, respect "expired/inactive accounts must not delete data."

**ARCH-004 — No service layer; fat controllers own data access, JSON, and mapping**
All `Controllers/*.cs`; notably `FamilyMembersController.cs:70-76,122-145,196-214` (permission JSON merge in 3 spots), `LogsController.cs:204-221` (type/JSON normalize), `AdminCustomersController.cs:88-107` (user+family creation inline).
*Fix:* Extract per-aggregate services or at least shared helpers for tenant scope, DTO mapping, and JSON handling; model `PermissionsJson` as a typed value object.

**ARCH-005 — `AccessType` stored but never used for authorization/expiry**
`Entities/User.cs:15`, writes at `AdminCustomersController.cs:83,152-155`; gating uses only `ExpiresAt`/`IsActive`.
A "Monthly" customer with null `ExpiresAt` has indefinite access; a "Lifetime" with a stray past `ExpiresAt` is locked out.
*Fix:* Make `AccessType` authoritative (compute/validate `ExpiresAt`: Lifetime⇒null/bypass; Monthly/Yearly⇒required), or demote it to a display label and document that `ExpiresAt`+`IsActive` are the only inputs. Centralize in the scope service.

**DB-002 — No uniqueness guarantee of one Family per owner**
`Data/AppDbContext.cs:76` indexes `Family.OwnerUserId` but **not unique**; `GetCurrentFamilyIdAsync` uses `FirstOrDefault`. `CreateCustomer` creates exactly one family today, but nothing prevents a second; if one ever exists, family resolution becomes nondeterministic and could silently scope a user to the wrong family.
*Fix:* Make the `OwnerUserId` index unique (enforces the 1:1 the code assumes).

**ARCH-012 / DB-003 — Auto-migrate on every startup**
`Program.cs:123-127`, `Services/DatabaseInitializer.cs:30` (`Database.MigrateAsync()`).
On Render free-tier redeploys/multi-instance boots, concurrent startups race on migration locks and uncontrolled DDL can run against prod data without review.
*Fix:* Gate `MigrateAsync` to dev (or a flag); run migrations as an explicit deploy step in prod. Admin seed is already idempotent.

### MEDIUM

**SEC-006 — Permissive CORS + `AllowedHosts: *`**
`Program.cs:50-64,136`; `appsettings.json:5-9,24`. Single policy `FrontendDev` applied in all environments with `AllowAnyHeader().AllowAnyMethod()`; base origins are localhost-only; host filtering disabled.
*Fix:* Restrict to explicit prod origins via env, scope `WithHeaders`/`WithMethods`, set a concrete `AllowedHosts`, and assert at startup that prod origins are non-localhost/non-wildcard.

**SEC-007 — `LogsController` stores arbitrary `DataJson` with no size/shape limit; risky parse-on-read**
`LogsController.cs:72-108,110-149,210-221`. Raw `JsonElement` stored verbatim as jsonb; no size cap, no depth limit, no per-`Type` schema; `ParseJson` calls `JsonDocument.Parse` on every read unguarded.
*Exploit:* Customer POSTs multi-MB / deeply nested `data` repeatedly → DB bloat (Supabase free tier) + slow reads.
*Fix:* Enforce max serialized length, require a JSON object, set `JsonDocumentOptions` max depth, validate keys per known `Type`.

**SEC-008 — Temp passwords returned without `no-store` cache headers**
`AdminCustomersController.cs:105` (create), `:189` (reset). Returning the plaintext once is by design, but no `Cache-Control: no-store` and no logging redaction on these routes.
*Fix:* Add `no-store` headers; ensure request/response body logging excludes/redacts these routes.

**SEC-009 / ARCH-011 — No global exception handler; parse-on-read can 500 with stack traces**
`Program.cs:135-139` (no `UseExceptionHandler`); `LogsController.cs:217-221` (`JsonDocument.Parse`), `FamilyMembersController.cs:127,198` (`Deserialize`), `ClaimsPrincipalExtensions.cs:9-13` (throws). A misset `ASPNETCORE_ENVIRONMENT=Development` in prod would surface the developer exception page; one malformed jsonb row breaks a whole list endpoint.
*Fix:* Add `IExceptionHandler`/middleware mapping unhandled exceptions to the standard `ApiError` envelope (log detail server-side); guard JSON parsing defensively.

**ARCH-007 — `GetBabies` not `AsNoTracking`; method-call projection in IQueryable**
`BabiesController.cs:33-37`. Unlike sibling read endpoints, it tracks entities and projects via `.Select(b => ToDto(b))` inside the expression tree.
*Fix:* Add `.AsNoTracking()`; project to `BabyDto` inline or map in memory like the others.

**ARCH-008 — Outward DTOs leak internal `FamilyId`**
`DTOs/FoodReactionDtos.cs:8` + `FoodReactionsController.cs:208-224`; `DTOs/MomCheckInDtos.cs:7` + `MomCheckInsController.cs:169-183`. `BabyDto`/`BabyLogDto` don't. Inconsistent and invites the frontend to trust `familyId` (forbidden by CLAUDE.md).
*Fix:* Drop `FamilyId` from outward DTOs; keep field conventions uniform.

**ARCH-009 / DB — FoodReaction date parse can shift the calendar day**
`FoodReactionsController.cs:71,89,133-137` parses `TriedDate` as `DateTimeOffset.TryParseExact(...).UtcDateTime` then `DateOnly.FromDateTime`. `MomCheckInsController.cs:54,99-104` does it cleanly with `DateOnly.TryParse`. The `.UtcDateTime` round-trip can roll a date to a neighbor day depending on server offset.
*Fix:* Use `DateOnly.TryParse(..., "yyyy-MM-dd")` to match MomCheckIns; consider a `JsonConverter<DateOnly>`.

**ARCH-010 — Split validation strategy**
DataAnnotations on some DTOs (`FoodReactionDtos`, `MomCheckInDtos`, `FamilyMemberDtos`), manual `ApiError.BadRequest` in others (`BabiesController.cs:45-48`, `LogsController.cs:75-78`, `AuthController` login), inline enum-string checks ("yes/no/neutral", "parent/caregiver/readonly"). `LoginRequest`/`CreateBabyLogRequest` have no annotations.
*Fix:* Standardize on DataAnnotations/FluentValidation so the central `InvalidModelStateResponseFactory` handles them uniformly; model constrained strings as enums.

**API-001 — Blocked (inactive/expired) accounts get 404 on data endpoints, not a calm renewal 403**
Every `GetCurrentFamilyIdAsync` returns `null` for inactive/expired users → controllers return `404 "Family was not found."`. CLAUDE.md wants a calm renewal message (auth endpoints correctly use 403). Inconsistent and misleading.
*Fix:* Distinguish "no family" from "blocked account"; return 403 with a renewal message for blocked accounts.

**ARCH-015 / DB — Nullability drift between entity/DB and DTO**
`Entities/MomCheckIn.cs:10` `string? Mood` + nullable column (migration `:134`) vs `DTOs/MomCheckInDtos.cs:9,21` `[Required] string Mood`. Same for `FoodReaction.Liked` (`Entities/FoodReaction.cs:12` nullable) vs `FoodReactionDto.Liked` non-null (`FoodReactionsController.cs:217` returns it straight) — a null row would surprise the non-null DTO.
*Fix:* Align: if required, make entity/columns `NOT NULL` (migration) ; else relax the DTO.

**API-002 — `CreatedAtAction` references collection actions with an `{id}` route value**
`BabiesController.cs:69` (`nameof(GetBabies)`, `new { id }`), `LogsController.cs:107` (`nameof(GetLogs)`, `new { babyId }`), `FoodReactionsController.cs:102`, `MomCheckInsController.cs:78` (`new {}`). The referenced GET actions are collection routes with no `{id}` template, so the generated `Location` header is a query-string URL or unreliable.
*Fix:* Add a `GET /{id:guid}` action per resource and point `CreatedAtAction` at it, or return `Created(string.Empty, dto)` / `Ok(dto)` consistently.

### LOW

**SEC-010 — Root endpoint advertises Swagger; Swagger gated only by `IsDevelopment()`**
`Program.cs:129-133,141-146`. Unauthenticated `/` always returns `swagger="/swagger"`, aiding recon; if env is misconfigured, full API surface is exposed.
*Fix:* Remove the swagger hint from the public root (or dev-only); confirm deploy sets `ASPNETCORE_ENVIRONMENT=Production`.

**SEC-011 — Admin PII aggregation without audit logging or minimization**
`AdminCustomersController.cs:32-54,257-289`; `Entities/User.cs:10-11`. `GetCustomers` returns every customer's phone/name in one call, no audit trail of admin PII access. Combined with SEC-003/SEC-004 the admin surface is a high-value target.
*Fix:* Audit-log admin reads of customer detail; omit phone numbers from the bulk list (detail only); tighten admin auth controls.

**SEC-012 — Login timing enables username enumeration**
`AuthController.cs:40-58`. PBKDF2 runs only when the user exists; non-existent users return immediately, a measurable timing difference (amplified by SEC-004).
*Fix:* Run a dummy PBKDF2 against a fixed decoy hash on user-not-found for constant timing; pair with rate limiting.

**ARCH-013 — Dead `revokeExisting` parameter; fresh login never revokes prior sessions**
`AuthController.cs:55,89,169-177`. Both call sites pass `false`, so the revoke branch is dead; refresh tokens accumulate until natural expiry.
*Fix:* Remove the unused parameter or decide a session policy and call it intentionally.

**ARCH-014 — CORS policy misleadingly named `FrontendDev` but used in prod**
`Program.cs:57,136`. *Fix:* Rename to `Frontend`.

**ARCH-016 — `MedicineDose` triple-denormalized (Family/Baby/Medicine) with inconsistent cascade**
`Data/AppDbContext.cs:157-168`. Same class as ARCH-002, scoped to doses. *Fix:* When medicine controllers land, reconsider whether doses need their own `FamilyId`/`BabyId`; if kept, enforce consistency.

---

## 3. Endpoint Map

| Method | Path | Auth | Ownership/Tenant check | Validation | Tests |
|---|---|---|---|---|---|
| GET | `/` | Anon | n/a | n/a | none |
| GET | `/api/health` | Anon | n/a | n/a | none |
| POST | `/api/auth/login` | Anon | n/a | manual (null/empty) | none |
| POST | `/api/auth/refresh` | Anon | token-hash lookup | manual | none |
| POST | `/api/auth/logout` | Authorize (any) | scoped `UserId + TokenHash` | manual | none |
| GET | `/api/auth/me` | Authorize | self (JWT userId) | n/a | none |
| POST | `/api/auth/change-password` | Authorize | self | **len≥8 only; no current-pwd (SEC-001)** | none |
| GET | `/api/admin/customers` | AdminOnly | filter `Role==Customer` | n/a | none |
| POST | `/api/admin/customers` | AdminOnly | n/a | manual + 409 conflict | none |
| GET | `/api/admin/customers/{id}` | AdminOnly | `Role==Customer` | route `:guid` | none |
| PATCH | `/api/admin/customers/{id}` | AdminOnly | `Role==Customer` | partial; **can't clear ExpiresAt** | none |
| POST | `/api/admin/customers/{id}/reset-password` | AdminOnly | `Role==Customer` | n/a | none |
| POST | `/api/admin/customers/{id}/activate` | AdminOnly | `Role==Customer` | n/a | none |
| POST | `/api/admin/customers/{id}/deactivate` | AdminOnly | `Role==Customer` + revokes tokens | n/a | none |
| GET | `/api/babies` | CustomerOnly | family-scoped | n/a | none |
| POST | `/api/babies` | CustomerOnly | stamps `FamilyId` from JWT | name required | none |
| PATCH | `/api/babies/{id}` | CustomerOnly | `Id && FamilyId` | partial | none |
| DELETE | `/api/babies/{id}` | CustomerOnly | `Id && FamilyId` | n/a | none |
| GET | `/api/logs` | CustomerOnly | family-scoped + filters | query parse | none |
| POST | `/api/logs` | CustomerOnly | family-scoped + baby ownership | type required | none |
| PATCH | `/api/logs/{id}` | CustomerOnly | `Id && FamilyId` | partial | none |
| DELETE | `/api/logs/{id}` | CustomerOnly | `Id && FamilyId` | n/a | none |
| GET | `/api/family-members` | CustomerOnly | family-scoped | n/a | none |
| POST | `/api/family-members` | CustomerOnly | family-scoped | role+name | none |
| PATCH | `/api/family-members/{id}` | CustomerOnly | `Id && FamilyId` | role merge | none |
| DELETE | `/api/family-members/{id}` | CustomerOnly | `Id && FamilyId` | n/a | none |
| GET | `/api/food-reactions` | CustomerOnly | family-scoped (+babyId) | n/a | none |
| POST | `/api/food-reactions` | CustomerOnly | family-scoped + baby ownership | date/liked (ARCH-009) | none |
| PATCH | `/api/food-reactions/{id}` | CustomerOnly | `Id && FamilyId` | partial | none |
| DELETE | `/api/food-reactions/{id}` | CustomerOnly | `Id && FamilyId` | n/a | none |
| GET | `/api/mom-checkins` | CustomerOnly | family-scoped | n/a | none |
| POST | `/api/mom-checkins` | CustomerOnly | family-scoped | date parse | none |
| PATCH | `/api/mom-checkins/{id}` | CustomerOnly | `Id && FamilyId` | partial | none |
| DELETE | `/api/mom-checkins/{id}` | CustomerOnly | `Id && FamilyId` | n/a | none |
| — | `/api/medicines`, `/api/medicine-doses`, `/api/appointments`, `/api/weights`, `/api/doctor-questions`, `/api/account/export`, `/api/account/delete-data` | **MISSING (ARCH-003)** | — | — | none |

*Note: all blocked (inactive/expired) accounts get `404` here rather than a `403` renewal — API-001.*

---

## 4. Database & Migration Risks

- **DB-001 (Critical, =ARCH-002):** Dual FK to Family with `NoAction` and no `FamilyId`↔`Baby.FamilyId` consistency constraint. Migration FKs created without `onDelete` (`InitialCreate.cs:178-182, 207-211, 240-244, 274-278, 304-308, 339-343, 368-372`).
- **DB-002 (High):** `Family.OwnerUserId` index is **not unique** (`AppDbContext.cs:76`) despite 1:1 assumption in `GetCurrentFamilyIdAsync` (`FirstOrDefault`). Make it unique.
- **DB-003 (High, =ARCH-012):** Auto-migrate on startup (`DatabaseInitializer.cs:30`) — race/uncontrolled-DDL risk on Render.
- **DB-004 (Medium, =SEC-007):** `DataJson` (`AppDbContext.cs:119`) and `PermissionsJson` (`:91`) are unbounded `jsonb` — storage-abuse/DoS vector.
- **DB-005 (Medium, =ARCH-015):** Nullability drift — `MomCheckIn.Mood` / `FoodReaction.Liked` nullable in DB but required/non-null in DTOs.
- **DB-006 (Low):** `Family.OwnerUser` FK is `Restrict` (`AppDbContext.cs:78-81`), so a customer `User` can't be deleted while a family exists; with `account/delete-data` unimplemented (ARCH-003) there's no supported customer-deletion path. Plan deletion order before implementing.
- **Rollback:** `Down()` drops all tables in dependency order — correct for an initial migration, but it is fully destructive; never auto-run in prod (ties DB-003).
- **Indexes:** Composite `(FamilyId, BabyId[, Date/LoggedAt])` indexes exist for the main query paths — read paths are not N+1-prone (mapping methods touch no lazy navigations). No missing index found for current endpoints.

---

## 5. Missing Test Coverage

**State:** 0 backend tests. No test project; `NunaCare.Api.csproj` references no test/mocking/`Mvc.Testing` packages. `public partial class Program;` (`Program.cs:150`) already enables a `WebApplicationFactory<Program>` harness.

**Critical (build first):**
- **TEST-001 Login** (`AuthController.cs:30-59`): happy admin/customer, empty creds→400, wrong/unknown→401 generic, inactive→403, expired→403, username trim, `LastLoginAt` only on success, token validates.
- **TEST-002 Refresh rotation** (`:61-93`): happy; **old token revoked & unusable**; empty→400; unknown→401; revoked→401; expired→401; blocked user→403; hash-only matching.
- **TEST-004 Change-password + enforcement** (`:139-167`): happy flips `MustChangePassword`; weak→400; unauth→401; blocked→403; all refresh tokens revoked; new pwd works/old fails; **assert SEC-001 (current-pwd) and SEC-002 (data access blocked while flag true).**
- **TEST-006 AdminOnly** / **TEST-007 CustomerOnly**: cross-role 403 per verb; no token→401; correct role allowed; pin role-claim casing (`JwtTokenService.cs:32` vs policy `Program.cs:108-112`).
- **TEST-008 Inactive/expired blocking** (all `GetCurrentFamilyIdAsync`): blocked→no access; **blocked DELETE must not remove rows** (data-safety); pin intended status (API-001).
- **TEST-009..013 Tenant isolation** (Babies/Logs/FamilyMembers/FoodReactions/MomCheckIns): A cannot GET/PATCH/DELETE B's rows (→404, B unchanged); create with another family's `BabyId`→404; body-supplied family id ignored.
- **TEST-015 Create customer** (`AdminCustomersController.cs:56-107`): creates Customer+Family, temp pwd once, hash≠plaintext, duplicate→409, auto-username, defaults; end-to-end manual-sales flow.
- **TEST-016 Reset password** / **TEST-017 Activate/Deactivate**: new temp pwd + token revocation; deactivate blocks + revokes + **does not delete data**; non-customer id→404; customer token→403.

**High:** TEST-003 Logout (incl. IDOR: A logs out B's token → no-op), TEST-014 Admin can't target Admin rows, TEST-018 PATCH partial (+document ExpiresAt can't be cleared), TEST-019 Pbkdf2 service, TEST-020 JwtTokenService, TEST-021 DataJson round-trip/normalize, TEST-022 DateOnly no-day-shift (ARCH-009).

**Medium/Low:** TEST-005 `/me`, TEST-023 permissions JSON merge, TEST-024 required-field/`ApiError` shape, TEST-025 admin seed idempotency, TEST-026 CredentialGenerator, TEST-027 (missing endpoints — coverage gap = feature gap, ARCH-003), TEST-028 JWT/CORS startup guards.

---

## 6. Architecture & Maintainability Notes

- **Single biggest issue:** absence of a service/repository layer (ARCH-001, ARCH-004). The tenant primitive is copy-pasted; business logic, JSON handling, and mapping live in controllers. A shared `IFamilyScopeResolver` + per-aggregate services would fix isolation duplication, enable SEC-002 enforcement in one place, and make logic unit-testable.
- **Schema denormalization without enforcement** (ARCH-002, ARCH-016, DB-002) is the structural risk — the isolation column isn't policed by the DB.
- **Implicit policy fields** (ARCH-005 `AccessType`) and **nullability drift** (ARCH-015) mean the domain model implies rules the code doesn't enforce.
- **Config/startup**: options pattern partly bypassed (`Program.cs:68` re-reads the Jwt section instead of using the registered `IOptions`); secrets committed (SEC-003); auto-migrate (ARCH-012); silent admin-seed skip when env unset (`DatabaseInitializer.cs:36-42`) — out of the box there is **no admin user**, conflicting with Acceptance Criteria.
- **Positives:** consistent `{message, errors}` envelope (`Common/ApiError.cs` + `InvalidModelStateResponseFactory`); correct tenant filtering where present; strong password hashing; hashed refresh tokens with unique index; good composite indexes; clean, uniform code style; parameterized LINQ only (no injection); no payment code.

---

## 7. Fix Queue for Sonnet

**Batch 1 — Critical security (do first)**
1. **SEC-001** — Require & verify `CurrentPassword` in change-password (skip only when `MustChangePassword`). Files: `Controllers/AuthController.cs`, `DTOs/AuthDtos.cs`. *AC:* wrong/empty current pwd→400/401 unchanged; correct→200 old pwd fails; `MustChangePassword` user changes without it. Add TEST-004.
2. **SEC-002** — Server-side `MustChangePassword` gate (403) on all data endpoints; allow only me/change-password/logout/refresh. Files: shared filter or each `GetCurrentFamilyIdAsync`. *AC:* fresh customer→403 on `/api/babies`; after change→200. Add TEST-004/TEST-007.
3. **SEC-003** — Remove `SigningKey`/DB password from `appsettings.json`; reject placeholder/weak key & fail-fast in Production; add config to `.gitignore`. Files: `appsettings.json`, `Program.cs`, `.gitignore`. *AC:* prod boot with no env key fails; tokens signed by old key rejected. Add TEST-028.

**Batch 2 — Tenant integrity & schema (new migration; review before apply)**
4. **DB-002** — Unique index on `Family.OwnerUserId`. *AC:* second family for same owner rejected.
5. **ARCH-002/DB-001** — Enforce `FamilyId`↔`Baby.FamilyId` consistency (composite FK or CHECK) or drop redundant column; make Family FKs explicit. Files: `Data/AppDbContext.cs` + migration. *AC:* inconsistent `FamilyId` insert rejected; family-delete behavior deterministic.
6. **ARCH-015/DB-005** — Resolve nullability drift (Mood/Liked). Files: entities + migration or DTOs. *AC:* DTO and column agree; null row doesn't break serialization.

**Batch 3 — Auth hardening**
7. **SEC-004** — Rate limiting + lockout on login/refresh. Files: `Program.cs`, `AuthController.cs`. *AC:* N+1 rapid failures→429; valid login works after window.
8. **SEC-005** — Refresh reuse detection (revoke family on replay). Files: `AuthController.cs`, `Entities/RefreshToken.cs`(+migration). *AC:* replay of revoked token revokes all user tokens.
9. **SEC-012 + ARCH-013** — Constant-time login (decoy PBKDF2) on user-not-found; remove dead `revokeExisting`. File: `AuthController.cs`.

**Batch 4 — Robustness & contract**
10. **SEC-009/ARCH-011** — Global `IExceptionHandler` returning `ApiError`; guard JSON parsing. Files: `Program.cs`, `LogsController.cs`, `FamilyMembersController.cs`. *AC:* unhandled error→standard 500 envelope, no stack trace.
11. **SEC-007/DB-004** — Cap/validate `DataJson` (size, object-only, max depth). File: `LogsController.cs`. *AC:* oversized/over-deep→400.
12. **API-001** — Distinguish blocked-account (403 renewal) from not-found across data controllers. *AC:* blocked customer→403 renewal message.
13. **SEC-006 + ARCH-014** — Lock down CORS/`AllowedHosts` for prod; rename policy. File: `Program.cs`, `appsettings.json`.
14. **SEC-008** — `no-store` headers on create/reset-password responses; redact logs. File: `AdminCustomersController.cs`.
15. **SEC-010 / SEC-011** — Remove swagger hint from `/`; add admin PII audit logging + minimize bulk list. Files: `Program.cs`, `AdminCustomersController.cs`.

**Batch 5 — Maintainability refactor (larger; do after tests exist)**
16. **ARCH-001/ARCH-004** — Extract `IFamilyScopeResolver` + per-aggregate services; remove duplicated scoping/mapping/JSON. *AC:* all controllers use one scope path; behavior unchanged (Batch-tests green).
17. **ARCH-003** — Implement missing controllers (medicines, medicine-doses, appointments, weights, doctor-questions, account/export, account/delete-data) on the scope service; export/delete must respect blocked-account data-safety. Add TEST-027 + isolation tests.
18. **ARCH-005** — Make `AccessType` authoritative or demote to label.
19. **ARCH-007/ARCH-008/ARCH-009/ARCH-010/ARCH-012/ARCH-016/API-002** — `AsNoTracking` on `GetBabies`; drop `FamilyId` from outward DTOs; unify date parsing; standardize validation; gate auto-migrate to dev; reconsider dose denormalization; fix `CreatedAtAction` targets.

**Batch 6 — Test foundation (can run parallel to Batch 1, pin behavior before refactor)**
20. Add test project (`Mvc.Testing` + EF InMemory/Sqlite) using `WebApplicationFactory<Program>`. Implement TEST-001/002/004/006/007/008/009-013/015/016/017 (Critical), then High unit suites TEST-019/020. *AC:* suite builds & passes; isolation and auth invariants enforced.

---

## 8. Questions Before Fixing

1. **Multi-device sessions:** Should a fresh login revoke prior refresh tokens (one active session), or is multi-device intended? This decides ARCH-013/SEC-005 design.
2. **`AccessType` semantics:** Should Trial/Monthly/Yearly auto-compute `ExpiresAt` (and Lifetime bypass expiry), or is `AccessType` purely a display label with `ExpiresAt` manual? (ARCH-005)
3. **`FamilyId` denormalization:** Keep the denormalized column on baby-owned entities (add a consistency constraint) or remove it and scope via `Baby.FamilyId`? (ARCH-002)
4. **Blocked-account contract:** What status/shape should expired/inactive accounts get on data endpoints — 403 with a renewal message? (API-001)
5. **Caregiver scope:** `FamilyMember` is a record only (not a login). Confirm caregivers will never authenticate (no real invites per CLAUDE.md), so isolation stays per-owner-user.
6. **Missing endpoints priority:** Implement all of ARCH-003 now, or only the subset the current frontend calls? (Frontend today calls only auth, admin/customers, babies, logs.)
7. **Should `appsettings.json` continue to ship any non-secret defaults**, or move all of Jwt/ConnectionStrings/AdminSeed entirely to env? (SEC-003)
