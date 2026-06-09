# NunaCare — Tired-Parent UX Feature Bundle: Implementation Plan

> **Status:** Planning only. No code written. Approve (and answer the questions in
> the "Consolidated Questions" section) before any implementation begins.
>
> **Scope:** 13 features to improve UX for tired parents.
> **Stack reminder:** React + TS + Vite + Tailwind + Zustand + React Router (frontend);
> ASP.NET Core 8 + EF Core + PostgreSQL (backend). State lives in Zustand `useStore`,
> persisted to localStorage as a cache, with the backend as source of truth.

---

## How this codebase is currently shaped (shared context)

A lot of this bundle already exists in partial form. Key facts that shape every feature below:

- **Logs** (`feeding`/`sleep`/`diaper`/`note`) round-trip through `BabyLog.DataJson` — the
  whole frontend log object is stored as JSON and rehydrated (`useStore.logFromDto`).
  Weight/medicine/appointment/question/reaction/checkin are **typed** entities with real columns.
- **`useStore`** (Zustand) holds all domain state and is the single write path; every mutation
  calls the API then `set()` then `persist()` to localStorage. Settings (`calmMode`, `language`,
  `direction`, `notificationsEnabled`) are **client/localStorage only** — no backend preferences table.
- **Home** (`HomeScreen.tsx`) already has: greeting header, an active-sleep-timer banner,
  4 summary cards (hidden in Calm Mode), next-appointment banner, a 3×2 "Quick Add" grid,
  and a "Recent Activity" (last 3) list linking to `/timeline`.
- **Bottom nav** has 4 tabs: Home, Timeline, Calendar, More.
- **Timeline** (`/timeline`) already exists: filter chips + a vertical timeline with delete.
- **Doctor Report** (`/doctor-report`) already exists: 24h/7d/30d segmented range, summary
  cards, questions/appointments sections, PDF (jsPDF) + copy-to-clipboard.
- **Doctor Questions** (`/doctor-questions`) already exists as a standalone screen.
  Backend `DoctorQuestion` supports an optional `AppointmentId` FK, but the frontend
  `addQuestion` never sets it, and there is **no appointment detail screen** to surface them on.
- **First Foods** (`/first-foods`) already has age-gating (<6mo locked) and a working
  **food-reaction logging sheet** (`LogFoodSheet`) writing to `/api/food-reactions`.
- **Mom Recovery** (`/mom-recovery`) already has a daily check-in — but it's a **multi-field**
  form (mood + water + pain 0–10 + walking minutes + bleeding note), i.e. it has scoring.
- **Sleep timer** already exists: `activeSleepTimer { startTimestamp, sleepType }` in store,
  persisted to localStorage, survives app close, finalizes a `SleepLog` on stop.
- **Caregivers**: `FamilyMember` entity + `/api/family-members` CRUD exist and are loaded into
  `store.caregivers`, but **no log records who created it**.

### Backend design answers (from backend-architect review)

| # | Topic | Migration? | Risk | Note |
|---|-------|-----------|------|------|
| Caregiver tag on logs | add nullable `CreatedByFamilyMemberId` FK to `BabyLog` | **Yes** | Low | Validate `member.FamilyId == familyId` on write; `OnDelete(SetNull)`; resolve name at read time, don't store stale name |
| Live timers | new dedicated `ActiveTimer` table **if** server-persisted | **Yes** (only if server-side) | Low | Unique `(FamilyId, BabyId, Type)`; client-only is the cheaper alternative |
| Mom check-in one-per-day | add unique index `(FamilyId, Date)` + upsert | **Yes** (if enforced) | Low | Currently **no uniqueness** and POST does **not** upsert → duplicate rows |
| Doctor questions by appointment | add `?appointmentId=` filter to GET | No (additive) | Low | Index on `AppointmentId` already exists |
| "Since last appointment" range | none | No | — | Frontend-only; logs GET already supports `from`/`to` |
| Weekly summary | none for MVP | No | — | Compute client-side from loaded logs |
| Night Mode | none | No | — | Pure frontend theme (localStorage), like Calm Mode |

> ⚠️ Two latent bugs found that intersect this bundle:
> 1. **Mom check-in "update" actually duplicates.** `MomRecoveryScreen` calls `addMomCheckIn`
>    for both create and "Update Today's Check-in"; the store has **no `updateMomCheckIn`**, the
>    backend has no per-day uniqueness, so a second save inserts a duplicate row. Fix as part of Feature 11.
> 2. `CreateMomCheckInRequest.PainLevel` is non-nullable `int` (defaults 0) while entity/update treat it nullable.

---

## Feature-by-feature plan

### 1. "Right now" home — feeding & diaper as primary CTAs

- **Current state:** `HomeScreen.tsx` already exists with a flat 3×2 Quick Add grid (feeding, sleep,
  diaper, medicine, weight, note) all equal weight, plus 4 summary cards and recent activity. No
  primary/secondary hierarchy; feeding and diaper are not emphasized.
- **Proposed implementation (frontend only):**
  - Restructure the Quick Add region into **two large primary CTA buttons** (Feeding, Diaper) at the
    top — full-width or two-up, large tap targets — followed by a secondary row (Sleep, Medicine,
    Weight, Note) as the existing smaller `QuickAction` tiles.
  - Keep all existing sheets (`FeedingSheet`, `DiaperSheet`, etc.) and the `setSheet` wiring untouched.
  - Primary CTAs become the natural home for Feature 2 (repeat-last) and Feature 3 (start timer).
  - Respect Calm Mode (summary cards already hidden then; primary CTAs should remain visible).
- **Backend/schema:** none.
- **Product decisions needed (see Q1, Q2).**
- **Risk to existing features:** Low. RTL: new layout must use logical props (`ms`/`me`, `text-start`)
  as the codebase already does. Calm Mode: verify CTAs still render. No auth/report/sales impact.
- **Effort:** **M**

### 2. Repeat-last-action ("same as last feeding/diaper")

- **Current state:** None. `lastFeeding`/`lastDiaper` are already computed in `HomeScreen`.
- **Proposed implementation (frontend only):**
  - On each primary CTA, add a secondary "↻ same as last" affordance that clones the most recent log
    of that type (template = last log's fields: feedingType/side/amount, diaperType/color) with a new
    `id`, `time = now`, `createdAt = now`, then calls `addLog` directly — no sheet.
  - Hidden when no prior log of that type exists.
  - Optional: a tiny confirmation toast with undo (depends on Q3).
- **Backend/schema:** none (reuses `addLog` → `POST /api/logs`).
- **Product decisions needed (Q3).**
- **Risk:** Low. Make sure the cloned object omits stale `durationMinutes`/`endTime` for sleep
  (we restrict repeat to feeding & diaper per the brief, so this is naturally avoided).
- **Effort:** **S**

### 3. Live timers for sleep AND breastfeeding

- **Current state:** Sleep timer fully works (`activeSleepTimer` in store + localStorage, finalizes
  on stop in `SleepSheet`). **Breastfeeding has no timer.** Persistence is **client/localStorage only**.
- **Proposed implementation:**
  - **Generalize the timer model** from `activeSleepTimer` to a typed `activeTimer` that supports
    `{ kind: 'sleep' | 'breastfeeding', startTimestamp, meta }` (meta carries `sleepType` or `side`).
    Keep one active timer at a time **unless** Q5 says otherwise.
  - Add a breastfeeding timer UI in `FeedingSheet` (start/stop, elapsed display) mirroring `SleepSheet`;
    on stop, write a `FeedingLog` with computed duration (requires adding an optional `durationMinutes`
    to `FeedingLog` type — additive, stored in `DataJson`, no migration).
  - Home banner already shows a running sleep timer; extend it to show whichever timer is active.
  - **Persistence decision (Q4):** client-only (localStorage, as today) vs. server-persisted.
    Backend-architect recommends server-side (`ActiveTimer` table, unique `(FamilyId,BabyId,Type)`,
    `GET/POST/DELETE /api/timers` + `POST /api/timers/{id}/stop`) to satisfy the "persists after
    reinstall/device change" rule — but flags client-only as acceptable for single-device manual sales.
- **Backend/schema:** none if client-only; **new `ActiveTimer` table + endpoints (migration, low risk)** if server-side.
- **Product decisions needed (Q4, Q5).**
- **Risk:** Medium. This refactors the existing `activeSleepTimer` contract (type + store + SleepSheet
  + HomeScreen banner). Characterization test the current sleep-timer save path first (see Testing).
  RTL/Calm unaffected.
- **Effort:** **M** (client-only) / **L** (server-persisted)

### 4. Pattern whispers (soft, opt-in inline hints)

- **Current state:** None.
- **Proposed implementation (frontend only):**
  - A small `PatternWhisper` component rendered on Home (and only when **opt-in** setting is on).
  - Derived purely from loaded logs, e.g.:
    - "Last diaper was ~4 hours ago" (always factual, time since last).
    - "{baby} usually feeds around now" (only when a periodicity is detectable).
  - **Threshold (proposed, justify):** show pattern-based whispers ("usually feeds around now") only
    after **≥ 7 days of data AND ≥ 20 logs of that type**, and only when the predicted window is within
    ±45 min of now. Rationale: fewer data points produce noisy, wrong predictions that erode trust and
    can feel judgmental; a week captures weekday/weekend variation; 20 feeds is ~2–3 days for a newborn
    but a meaningful sample for older babies. Below threshold, only show the neutral "time since last"
    style (no prediction). All copy is non-judgmental, never "you missed/late".
  - New setting `patternWhispers: boolean` (default **off** per brief "opt-in"), localStorage only.
- **Backend/schema:** none.
- **Product decisions needed (Q6, Q7).**
- **Risk:** Low–Medium. Brand risk if wording drifts judgmental — copy must follow CLAUDE.md voice
  and be in both languages. Calm Mode: decide whether whispers show in Calm Mode (Q7).
- **Effort:** **M**

### 5. Night Mode (separate from Calm Mode)

- **Current state:** None. Calm Mode exists (`settings.calmMode`) and only hides summary cards;
  it is **not** a dark theme. App uses semantic Tailwind tokens (`bg-background`, `text-text-primary`,
  `bg-soft-surface`, `bg-teal-soft`, etc.) defined in `tailwind.config.js`.
- **Proposed implementation (frontend only):**
  - Add `settings.nightMode: boolean` (localStorage only) and a `nightMode` trigger.
  - **Trigger logic (proposed):** **both** — a manual toggle in Settings *and* an optional auto
    schedule (e.g. auto-on between a user-set bedtime window, default ~19:00–06:00). Justification:
    tired parents at 3am will not reliably find a toggle; auto-by-time matches the actual use moment.
    But auto-only is surprising/uncontrollable, so manual override must always win. Default: auto **off**,
    manual available — confirm via Q8.
  - **Theming approach:** introduce a `dark`/`night` class on `<html>` and dark variants for the
    semantic tokens (dim, warm-tinted, low-blue). Prefer driving via CSS variables / Tailwind
    `darkMode: 'class'` so component classNames mostly don't change. This is the cross-cutting part.
- **Backend/schema:** none.
- **Product decisions needed (Q8, Q9).**
- **Risk:** **Medium–High (cross-cutting).** Touches global theming; every screen must be visually
  re-checked in RTL + Calm Mode + Night Mode combinations. Must not regress existing light UI.
  Recommend implementing **last / in isolation** behind the toggle so it can't break the default theme.
- **Effort:** **L**

### 6. Storylike Timeline tab (readable day-stream; source for Doctor Report)

- **Current state:** `/timeline` exists with filter chips + a single flat reverse-chron list. Not
  grouped by day; no caregiver attribution; the brief calls it the "source data for Doctor Report"
  (the report currently reads `store.logs` directly, not the Timeline screen).
- **Proposed implementation (frontend only):**
  - Group logs by **day** with soft date headers ("Today", "Yesterday", localized dates), keep the
    existing per-item cards and filter chips.
  - Show caregiver attribution per item **once Feature 8 lands** ("logged by Mama").
  - Clarify "source for Doctor Report": the report already derives from the same `store.logs`; no data
    coupling change needed — they share the store. (Confirm interpretation in Q10.)
- **Backend/schema:** none.
- **Product decisions needed (Q10).**
- **Risk:** Low. Preserve filter behavior, delete-with-confirm, RTL slide animation direction.
- **Effort:** **S–M**

### 7. Doctor Report preview + range picker

- **Current state:** `/doctor-report` exists with fixed 24h/7d/30d ranges and immediately renders a
  summary + PDF/copy. There is already a basic on-screen preview (summary cards + questions + appts).
- **Proposed implementation (mostly frontend):**
  - Add ranges: keep last-24h/7d/30d, add **"since last appointment"** (compute `from` = most recent
    past `appointment.date`) and **custom range** (two date inputs).
  - Add an explicit **"what will be included"** preview section listing the sections/counts that will
    be in the PDF for the chosen range, before the user exports.
  - Apply the chosen range to **all** report sources (logs already filter by date client-side; also
    filter weights/questions/reactions client-side — they're small).
  - Show caregiver attribution in the report once Feature 8 lands (depends on Q11).
- **Backend/schema:** none (logs GET supports `from`/`to`; other sources filtered client-side).
- **Product decisions needed (Q11, Q12).**
- **Risk:** Medium. **Doctor Report PDF is a "must preserve" feature** and must not crash on empty
  ranges (CLAUDE.md common-issue #16). Add empty-range guards. Keep "generated locally" privacy note.
- **Effort:** **M**

### 8. Caregiver tag on logs (who created each log)

- **Current state:** `FamilyMember` + `/api/family-members` exist; `store.caregivers` is loaded.
  No log carries a creator. There is also no notion of "the current acting caregiver" in the app.
- **Proposed implementation:**
  - **Backend (migration, low risk):** add nullable `CreatedByFamilyMemberId Guid?` to `BabyLog`
    with `OnDelete(SetNull)`; validate the referenced member belongs to the family on create/update
    (same pattern `DoctorQuestionsController` uses for `AppointmentId`). Return it in `BabyLogDto` and
    resolve the **name at read time** (join), do not store a stale name.
  - **Frontend:** add a way to pick/remember the **acting caregiver** (e.g. a lightweight selector on
    Home or in the log sheets, defaulting to a remembered choice). Send `createdByFamilyMemberId` on
    `addLog`. Display attribution in Timeline (Feature 6) and Report (Feature 7).
  - **Schema scope:** add the column to `BabyLog` only for now; the brief says "every log" but the
    backend-architect recommends **not** blanket-adding it to typed entities (weights, checkins, etc.)
    until a screen needs it. Confirm scope in Q13.
- **Backend/schema:** **Yes — `BabyLog` migration (low risk).**
- **Product decisions needed (Q13, Q14).**
- **Risk:** Medium. Touches a "must preserve" data path (logs) and adds a migration; family-scoping
  must be enforced server-side (security checklist: ownership/tenant isolation). Existing logs get
  `null` creator (acceptable). No auth change.
- **Effort:** **M**

### 9. Doctor Questions capture + surfacing on appointment detail

- **Current state:** Standalone `/doctor-questions` screen exists (add/answer/delete). Backend
  supports linking a question to an appointment (`AppointmentId`), but: frontend `addQuestion` never
  sets it; **there is no appointment detail screen** (Calendar lists appointments but tapping does
  nothing); and **GET `/api/doctor-questions` has no `?appointmentId=` filter**.
- **Proposed implementation:**
  - **New appointment detail screen** (or expandable card) reached from Calendar; shows appointment
    info + its linked questions + an inline "add question for this appointment" capture.
  - Wire `appointmentId` through `addQuestion` (store already accepts it in the type) and the create DTO.
  - **Backend (additive, low risk, optional):** add `?appointmentId=` filter to
    `GET /api/doctor-questions` to fetch a single appointment's questions cleanly (else filter the
    already-loaded `store.doctorQuestions` client-side — viable since all are loaded).
  - Keep the existing standalone questions screen working.
- **Backend/schema:** No migration; optional additive query param.
- **Product decisions needed (Q15).**
- **Risk:** Low–Medium. New route + Calendar interaction (Calendar currently has no row tap). RTL.
- **Effort:** **M**

### 10. Food Reactions for First Foods

- **Current state:** **Already implemented.** `LogFoodSheet` in `FirstFoodsScreen` logs liked +
  rash/vomiting/constipation + notes to `/api/food-reactions`, gated to ≥6mo, with safety wording.
- **Proposed implementation (small enhancement only):**
  - The only gap vs. the brief ("logging flow when introducing a **new** food") is that reactions can
    currently only be logged against the **predefined** `foodItems` list. Add an "introduce a custom
    food" entry (free-text food name) that opens the same `LogFoodSheet`. Preserve all safety notes
    (no honey <12mo, choking, allergy) and the <6mo lock.
  - Optionally surface a "foods tried + reactions" history list.
- **Backend/schema:** none (FoodReaction supports arbitrary `foodName`).
- **Product decisions needed (Q16).**
- **Risk:** Low. **Must not** weaken First Foods safety gate/wording (must-preserve).
- **Effort:** **S**

### 11. Mom Recovery daily check-in (single-question, gentle, no scoring)

- **Current state:** A check-in exists but is **multi-field with scoring** (pain 0–10, water, walking).
  The brief wants a **single-question gentle mood/feeling capture + supportive response text, no
  scoring, no streaks.** Also the current "update" path is buggy (duplicates rows — see top note).
- **Proposed implementation:**
  - Add a **simple one-tap mood capture** (the 6 existing `MoodOption`s) as the primary daily check-in,
    with a warm supportive response line per mood (no numbers, no score, no streak). This can be a new
    lightweight entry (e.g. on Home and/or top of Mom Recovery) that writes a `MomCheckIn` with just
    `mood` + `date`.
  - **Fix the duplicate bug:** add `updateMomCheckIn` to the store (backend PATCH exists) and have the
    screen update today's existing check-in instead of re-adding. Decide whether to enforce one-per-day
    server-side (unique index `(FamilyId, Date)` + upsert — migration, low risk) per Q18.
  - Decide whether the existing detailed form stays (advanced/optional) or is replaced (Q17).
- **Backend/schema:** none for the simple capture; **optional** unique-index migration for one-per-day.
- **Product decisions needed (Q17, Q18).**
- **Risk:** Medium. **Must preserve Mom Recovery supportive, non-fitness wording** (must-preserve).
  Touches an existing screen; keep affirmations/breathing/exercise links intact.
- **Effort:** **S–M**

### 12. Weekly summary card (soft Sunday-evening recap, in-app only)

- **Current state:** None.
- **Proposed implementation (frontend only):**
  - A soft Home card computed **client-side** from the last 7 days of `store.logs`: counts of
    feeds/sleeps/diapers (and maybe total sleep). **No scores, no comparisons, no "better/worse".**
  - **Surfacing:** show prominently around Sunday evening (e.g. Sun 17:00 → Mon), otherwise hidden or
    available on tap. **In-app only — no notifications** (CLAUDE.md forbids SMS/email; keep it passive).
  - Dismissible per week.
- **Backend/schema:** none (backend-architect: client-side for MVP; a `/api/logs/summary` endpoint is
  only worth it later).
- **Product decisions needed (Q19, Q20).**
- **Risk:** Low. Keep wording calm and non-judgmental.
- **Effort:** **S**

### 13. Better empty states (warm, inviting copy across the app)

- **Current state:** A shared `EmptyState` component exists and is used in Timeline, Calendar,
  Doctor Questions, Home (no-profile). Copy is functional/plain (e.g. "No logs yet", "Please complete
  onboarding") and partly hardcoded inline rather than via `translations.ts`.
- **Proposed implementation (frontend only):**
  - Rewrite empty-state copy across screens to match CLAUDE.md brand voice (warm, calm, inviting),
    in **both** English and Arabic, ideally moved into `translations.ts` for consistency/RTL.
  - No structural/component change — copy + i18n only.
- **Backend/schema:** none.
- **Product decisions needed (Q21).**
- **Risk:** Very low. Just verify Arabic strings render RTL and don't overflow.
- **Effort:** **S**

---

## Dependency graph

```
                ┌─────────────────────────────────────────────┐
                │ 8. Caregiver tag on logs (BACKEND MIGRATION) │
                └───────────────┬──────────────┬──────────────┘
                                │ attribution   │ attribution
                                ▼               ▼
                        6. Storylike      7. Doctor Report
                           Timeline          preview
                                ▲
   1. "Right now" home ─────────┘ (timeline link / day-stream is independent but pairs well)
        │  hosts CTAs for:
        ├──► 2. Repeat-last-action        (needs home primary CTAs)
        ├──► 3. Live timers (sleep+BF)    (refactors existing activeSleepTimer; surfaces on home)
        ├──► 4. Pattern whispers          (renders on home; opt-in setting)
        └──► 12. Weekly summary card      (renders on home)

   9. Doctor Questions surfacing ──► requires NEW appointment-detail screen (from Calendar)
   10. Food reactions (custom food)  — standalone, builds on existing First Foods
   11. Mom check-in (simple + bugfix)— standalone, builds on existing Mom Recovery
   13. Empty states (copy/i18n)      — standalone, no deps
   5. Night Mode (cross-cutting theme)— independent; do LAST/in isolation to avoid theme regressions
```

**Hard dependencies**
- 6 (attribution display) and 7 (attribution in report) depend on **8**.
- 2, 4, 12 are best built **after 1** (they live on the restructured home).
- 9 depends on a **new appointment-detail screen**.

**No dependency / can start anytime:** 1, 8, 10, 11, 13, 5.

---

## Consolidated questions for you (numbered)

**Feature 1 — Right now home**
1. Confirm the two primary CTAs are **Feeding + Diaper** (per brief). Any chance you'd want Sleep as a third primary given the timer?
2. Should the primary CTAs open the existing bottom sheets (current behavior), or log instantly with a default and let the user edit afterward?

**Feature 2 — Repeat-last-action**
3. After a one-tap repeat, do you want a confirmation toast with **Undo**, or silent instant logging?

**Feature 3 — Live timers**
4. **Persistence:** client-only (localStorage, survives app close on same device — simplest) or **server-persisted** (survives reinstall/device change; new table + endpoints)? Backend-architect leans server-side to honor the data-persistence rule.
5. Can **only one timer run at a time**, or do you need a sleep timer and a breastfeeding timer running simultaneously?

**Feature 4 — Pattern whispers**
6. Is the proposed threshold (**≥7 days + ≥20 logs of that type**, prediction window ±45 min) acceptable, or do you want it stricter/looser?
7. Should whispers appear in **Calm Mode**, or be suppressed there? Default visibility: opt-in **off**?

**Feature 5 — Night Mode**
8. Trigger: **manual toggle only**, **auto-by-time only**, or **both** (manual override wins; auto default off)?
9. If auto-by-time: what default night window (e.g. 19:00–06:00), and should it be user-configurable in v1 or hardcoded?

**Feature 6 — Storylike Timeline**
10. "Source data for Doctor Report" — do you just mean the timeline should *look like* the report's day-stream (shared store, no change needed), or do you want the Report to literally render the Timeline view?

**Feature 7 — Doctor Report preview**
11. Should the report **show caregiver attribution** (who logged what), or keep it caregiver-agnostic for the doctor?
12. For **custom range**, any max span limit (e.g. cap at 90 days) to keep the PDF sane?

**Feature 8 — Caregiver tag**
13. Scope: tag **only `BabyLog`** (feeding/sleep/diaper/note) for now, or also weights/appointments/etc.?
14. How does the app know **who is acting**? A per-session "I am ___" caregiver selector, a remembered default, or a picker inside each log sheet?

**Feature 9 — Doctor Questions on appointments**
15. New **appointment detail screen** (full route) vs. an expandable inline card in Calendar — preference?

**Feature 10 — Food reactions**
16. Do you want **custom (free-text) foods** in addition to the predefined list, plus a "foods tried" history view?

**Feature 11 — Mom check-in**
17. Should the new **single-question mood capture replace** the current detailed form, or sit alongside it as the quick default (detailed = optional/advanced)?
18. Enforce **one check-in per day** (unique index + upsert, small migration), or allow multiple and just edit the latest?

**Feature 12 — Weekly summary**
19. Confirm **in-app only, no notification of any kind**, and that the Sun-evening timing is right (vs. always-visible card).
20. Which metrics in the recap (feeds, sleeps, diapers, total sleep)? Anything to deliberately **exclude** to avoid feeling judged?

**Feature 13 — Empty states**
21. OK to **centralize empty-state copy into `translations.ts`** (small refactor) rather than leaving strings inline?

**Cross-cutting**
22. Is a **DB migration acceptable for this release** at all? (Features 8 always, 3 if server-side, 11 if one-per-day enforced.) If you'd rather avoid migrations now, we keep timers client-only and caregiver tag becomes the only migration.
23. Release shape: ship as **one big bundle** or in the phased releases below?

---

## Recommended phasing (releases)

> Sequenced so the migration lands first, foundations precede dependents, and the risky
> cross-cutting theme work is isolated last.

**Release A — Foundations & quick wins** *(low risk, high daily value)*
- **8** Caregiver tag (backend migration) — unblocks 6 & 7
- **1** "Right now" home restructure
- **13** Empty-state copy/i18n
- **2** Repeat-last-action
- *Acceptance gate: frontend builds, backend builds, migration applies, logs still round-trip, RTL + Calm Mode intact.*

**Release B — Faster logging & gentle insight**
- **3** Live timers (sleep + breastfeeding) — decide client vs. server (Q4)
- **12** Weekly summary card
- **4** Pattern whispers (opt-in)
- **6** Storylike Timeline (now shows attribution from Release A)

**Release C — Medical & report surfaces**
- **7** Doctor Report preview + range picker (+ attribution per Q11)
- **9** Doctor Questions on appointment detail
- **10** Food reactions: custom food + history
- **11** Mom check-in simplification + duplicate-bug fix

**Release D — Night Mode** *(isolated; cross-cutting theming)*
- **5** Night Mode (manual ± auto), full RTL × Calm × Night visual QA pass

---

## Testing & rollback notes (per refactor-planning skill)

- **Characterization first** for the two refactors that touch existing behavior:
  - Feature 3: capture current sleep-timer → `SleepLog` save (start/stop/duration, localStorage
    persistence across reload) before generalizing `activeSleepTimer` → `activeTimer`.
  - Feature 8: backend has a 131-test suite (per project memory); add tests for create-log-with-caregiver,
    family-scope rejection of a foreign `CreatedByFamilyMemberId`, and `SetNull` on member delete.
- **Backend** changes (8, optional 3/11) need EF migration + the existing test project
  (`backend.Tests/`) green, and `dotnet ef database update` verified locally.
- **Rollback:** each feature is independently revertable; the only one-way door is the **8** migration
  (nullable column — safe to leave; drop-column migration available if reverted). Night Mode (5) is
  behind a toggle so it can ship dark and be disabled without code revert.
- **Must-preserve regression checklist before each release:** Arabic/RTL, Calm Mode, Doctor Report PDF
  (incl. empty range), First Foods <6mo gate + safety wording, Mom Recovery non-fitness wording,
  admin-created manual-sales auth flow, customer family data isolation, no payment integration.

---

*Not tested / not verified in this planning pass:* no build or tests were run; the
backend-architect did not directly read `WeightsController`/`AppointmentsController` (their lack of
`from`/`to` filters is inferred from sibling controllers — confirm before finalizing Feature 7's
client-side filtering of those sources). Frontend `translations.ts` contents were not exhaustively
read; the empty-state i18n refactor (13) assumes keys can be added there.
