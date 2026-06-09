# NunaCare — Feature Bundle: Locked Decisions

> Companion to `design/feature-bundle-plan.md`. These are the approved answers to the
> 23 open questions. Build strictly to these. If a decision conflicts with the plan,
> this file wins. If anything here is ambiguous in the actual code, STOP and ask —
> do not guess.

## Release shape
- **Phased, not one bundle.** Ship in order: Release A → B → C → D (as defined in the plan).
- Each release must be independently green (frontend builds, backend builds, migrations apply, tests pass) and committed before the next begins.

## Migrations
- Only **two** migrations in this whole bundle, both low-risk:
  1. Caregiver tag: nullable `CreatedByFamilyMemberId` on `BabyLog` (Feature 8).
  2. Mom check-in one-per-day: unique index `(FamilyId, Date)` + upsert (Feature 11).
- No `ActiveTimer` table. Timers are client-only.

## Per-feature decisions

### 1 — "Right now" home
- Primary CTAs: **Feeding + Diaper** only. Do NOT add Sleep as a third primary.
- Primary CTAs **open the existing bottom sheets** (current behavior). No instant-log-with-default.

### 2 — Repeat-last-action
- After a one-tap repeat: show a **confirmation toast with Undo**. Not silent.

### 3 — Live timers (sleep + breastfeeding)
- **Client-only persistence** (localStorage, survives app close on same device). No backend table, no endpoints.
- **One timer at a time.** Generalize `activeSleepTimer` → `activeTimer { kind: 'sleep' | 'breastfeeding', startTimestamp, meta }`.
- Characterization-test the existing sleep-timer save path BEFORE refactoring.

### 4 — Pattern whispers
- Threshold: **≥7 days of data AND ≥20 logs of that type**, prediction window ±45 min. (Accept as proposed.)
- **Suppressed in Calm Mode.**
- New setting `patternWhispers`, **opt-in, default off**, localStorage only.

### 5 — Night Mode
- Trigger: **both** — manual toggle + optional auto schedule. Manual override always wins.
- Auto **default off**. Window **19:00–06:00, hardcoded in v1** (not user-configurable yet).
- Implement LAST, in isolation, behind the toggle. Full RTL × Calm × Night QA pass.

### 6 — Storylike Timeline
- Just shares the existing `store.logs` (no data-coupling change). Group by day with soft date headers; show caregiver attribution once Feature 8 lands.

### 7 — Doctor Report preview
- **Caregiver-agnostic** for the doctor (do NOT show who logged what in the report).
- Custom range allowed; **cap at 90 days.**
- Add "since last appointment" range + custom range + a "what will be included" preview section.
- Must not crash on empty ranges. Keep "generated locally" privacy note.

### 8 — Caregiver tag
- Scope: **`BabyLog` only** for now. Do not add to weights/appointments/etc.
- Acting caregiver: **remembered default** + a picker inside the log sheet.
- Backend: nullable FK, `OnDelete(SetNull)`, validate member belongs to family on write, resolve name at read time (join) — never store stale name.

### 9 — Doctor Questions on appointments
- **Full appointment detail route/screen** (not an inline card). Reached from Calendar row tap.
- Wire `appointmentId` through `addQuestion` + create DTO. Add optional `?appointmentId=` filter to GET (additive, no migration). Keep standalone questions screen working.

### 10 — Food reactions
- Add **custom (free-text) food** entry reusing the existing `LogFoodSheet`.
- Add a **"foods tried + reactions" history** view.
- Preserve all safety wording (no honey <12mo, choking, allergy) and the <6mo lock.

### 11 — Mom check-in
- **Simple one-tap mood capture is the default.** Keep the existing detailed form as **optional/advanced** (do not delete it).
- **Enforce one-per-day** (unique index + upsert migration).
- Fix the duplicate bug: add `updateMomCheckIn` to the store; screen updates today's existing check-in instead of re-adding.
- Preserve supportive, non-fitness wording.

### 12 — Weekly summary
- **In-app only, no notifications of any kind.**
- **Always-available card** (not gated to Sunday evening). Dismissible per week.
- Metrics: feeds, sleeps, diapers, total sleep. **Exclude anything rankable/comparative.** No scores.

### 13 — Empty states
- Rewrite copy to match brand voice, **centralized into `translations.ts`**, English + Arabic. Copy/i18n only, no structural change.

## Must-preserve regression checklist (every release)
Arabic/RTL · Calm Mode · Doctor Report PDF (incl. empty range) · First Foods <6mo gate + safety wording · Mom Recovery non-fitness wording · admin-created manual-sales auth flow · customer family data isolation · no payment integration.