# NunaCare — Warm & Tactile Redesign Spec

> A whole-app visual restyle. **Logic, data, routes, state, API calls, and auth are
> untouched.** This is a token/type/icon/copy pass only. If applying any of this would
> require changing behavior, STOP and ask — do not change logic to fit the design.
>
> Companion to `CLAUDE.md`. The must-preserve checklist there and in
> `design/feature-bundle-decisions.md` still applies in full.

## Direction in one line
Cream, tactile, editorial-calm. Warm off-white surfaces, soft peach/sand/blush tints,
serif headlines, sans UI, and crafted line-icons in tinted circles instead of emojis.
The feeling: a gentle paper journal for a tired parent, not a data dashboard.

---

## 1. Color tokens

Define these as the source of truth (CSS variables / `tailwind.config.js` theme tokens).
**Swap the existing semantic tokens to these values — do not hardcode hex in components.**
Every component should keep using `bg-background`, `text-text-primary`, `bg-soft-surface`,
etc.; only the token *values* change.

### Light (default)
| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#FBF6EC` | app base (warm cream, not gray) |
| `soft-surface` / card | `#FFFCF6` | card / sheet surface |
| `surface-sunk` | `#F2E8DC` | banners, secondary cards |
| `text-primary` | `#2D2118` | headlines, primary text (warm near-black) |
| `text-secondary` | `#5C4A3A` | body / labels |
| `text-muted` | `#8A7868` | timestamps, sublabels |
| `text-faint` | `#B09984` | microlabels, placeholders |
| `accent` | `#8B4A2B` | primary actions, active nav, save buttons (warm brown) |
| `accent-soft` | `#D4845C` | accent dots, highlights |
| `border-hairline` | `rgba(217,175,130,0.18)` | card borders, dividers |

### Category tints (icon-circle backgrounds + summary cards)
| Category | Tint bg | Icon color |
|----------|---------|-----------|
| Feeding | `#FBEAE0` | `#8B4A2B` |
| Sleep | `#F0E6DC` | `#6B533A` |
| Diaper | `#F6E4DC` | `#8B4A2B` |
| Medicine | `#FBE9D8` | `#8B4A2B` |
| Neutral/util | `#F4E8D8` / `#F2E8DC` | `#6B533A` |

### Night variant (composes with Release D Night Mode)
Night Mode already exists as `darkMode: 'class'` token overrides. Add a **warm, dim,
low-blue** night palette — NOT cold black. The redesign must look intentional in night too.
| Token | Night hex |
|-------|-----------|
| `background` | `#1C1714` |
| `soft-surface` | `#241D18` |
| `surface-sunk` | `#2B221C` |
| `text-primary` | `#F0E6DC` |
| `text-secondary` | `#C9B89F` |
| `text-muted` | `#9A8670` | timestamps, sublabels |
| `accent` | `#D99A6C` (lifted so it reads on dark) |
| `border-hairline` | `rgba(217,175,130,0.14)` |
Category tints in night: darken to ~12–16% opacity of the hue over the surface, icon color lifts to the light tint.

> Verify all four combinations after: Light, Night, Calm+Light, Calm+Night, each in RTL + LTR.

---

## 2. Typography

Two families. Load via the project's existing font pipeline.
- **Display / serif** — a warm humanist serif (e.g. *Fraunces*, *Newsreader*, or similar).
  Used for: greetings, baby name, screen titles, large numbers (amounts, timer), and
  short editorial lines (italic). Weight 400–500. Never for dense UI.
- **Body / UI / sans** — the existing sans (keep current body font if it's clean).
  Used for: labels, buttons, list items, body text, nav.

Scale (mobile):
- Screen title (serif): 24px / 500
- Greeting name (serif): 26px / 500
- Section header (serif): 16px / 500
- Card value (sans): 15px / 500
- Body (sans): 13–14px
- Microlabel (sans, lowercase, letter-spacing 0.05em): 11px, `text-faint`
- Timestamp (sans): 12px, `text-muted`

Microlabels above inputs are **lowercase** ("type", "amount", "when", "a small note") — this
is a signature of the direction. Keep it consistent.

---

## 3. Components

- **Icon-circle:** 40px (32px in cards, 36px in quick tiles, 48–64px hero) circle, category
  tint bg, line-icon in category color centered. This replaces ALL emoji (see §4).
- **Card:** `soft-surface` bg, radius 18px, 14px padding, `border-hairline` 0.5px border.
  Soft shadow only — no hard drop shadows. Summary cards use category tint bg instead.
- **Primary button:** `accent` bg, cream text, radius 18px, 14px padding, centered.
- **Bottom nav:** hairline top border, line-icons, active item in `accent`, label 10px.
- **Selectable chip (e.g. feeding type):** selected = `accent` bg + cream text; unselected =
  `soft-surface` + hairline border + `text-secondary`. Radius 14px.
- **Stepper (amount):** big serif number centered, +/- in `surface-sunk` icon-circles.
- Radii: cards 18px, tiles/chips 14–16px, buttons 18px, phone frame stays as-is.

---

## 4. Iconography — full emoji replacement

Replace every emoji with a line-icon (e.g. **Tabler Icons** / Lucide — pick one set, install
it, use it everywhere). Map:
| Was | Icon |
|-----|------|
| 🍼 feeding | `bottle` |
| 😴 sleep | `moon` |
| 💧/diaper | `droplet` |
| 💊 medicine | `pill` |
| ⚖️ weight | `scale` |
| 📝 note | `notebook` |
| 📅 appointment | `calendar-heart` / `vaccine` |
| 👋 greeting | none — drop it, let the serif greeting carry it |
| 👶 baby | `mood-happy` (avatar circle) |
| 📈 growth | `chart-line` |
| 🩺 doctor report | `stethoscope` |
| ❓ questions | `help-circle` |
| 🥑 first foods | `apple` |
| 🌸 mom recovery | `flower` |
| ⚙️ settings | `settings` |

All icons sit in a tinted icon-circle (§3). No bare icons, no remaining emoji anywhere
(check empty states, toasts, nav, sheets). Icons are decorative → `aria-hidden`; keep text labels for a11y.

---

## 5. Voice / copy (EN + AR, into `translations.ts`)

Apply the brand voice already in CLAUDE.md. Specific lines to use:
- Greeting: serif "Good afternoon" + name. Age as "one month old", not "Age: 1month".
- Recent activity header → "Today, gently"
- Calendar subtitle → "Care, remembered gently."
- More screen title → "For your family" / subtitle "Small steps, gently kept."
- Mom Recovery row sublabel → "Rest counts too."
- Feeding sheet hero line (italic serif) → "A little nourishment"
- Note placeholder → "Anything you'd like to remember…"
Keep all medical/safety wording EXACTLY as-is (first foods, medicine, growth, mom recovery).
Every new string must have an Arabic translation and render correctly RTL.

---

## 6. Per-screen notes

- **Home:** serif greeting + name + "one month old"; settings icon-circle top-right. 2×2
  summary cards in category tints. Next-appointment banner in `surface-sunk` with
  `calendar-heart` circle. "Quick add" → keep the Release-A primary CTAs (Feeding, Diaper)
  prominent, secondary tiles below, all with icon-circles. "Today, gently" recent list.
  Weekly summary card + pattern whisper (from Release B) inherit the new card style.
- **Calendar:** serif "Appointments" + "Care, remembered gently." Plus button = `accent`
  circle. Calendar card with serif month, lowercase weekday labels, selected day = `accent`
  disc, event day = `accent-soft` dot. "Coming up" list with `vaccine` icon-circles.
- **More:** serif "For your family". Baby switcher card in `surface-sunk` with `mood-happy`
  avatar. Menu rows = cards with category-tinted icon-circles + chevron.
- **Feeding sheet (and all log sheets):** X / serif title / "Save". Hero icon-circle +
  italic serif line. Lowercase microlabels. Type chips, amount stepper (serif number),
  when-row, note field. Full-width `accent` save button. Apply same pattern to sleep,
  diaper, medicine, weight, note sheets.

---

## 7. Hard constraints
- No logic, data, route, state, or API change. Visual layer only.
- Light theme is the default; Night Mode (Release D) must still work and look intentional.
- Calm Mode still hides what it hid; redesign must compose with it.
- RTL: use logical properties (`ms`/`me`, `text-start`, `ps`/`pe`) everywhere; no `left`/`right`.
- Keep all component names and routes. No large rewrites — restyle in place.
- Accessibility: keyboard focus visible, contrast AA, tap targets ≥44px, icons `aria-hidden`
  with text labels, `prefers-reduced-motion` respected for any new transitions.
- Doctor Report PDF must still generate (and the PDF itself can stay visually plain — the
  redesign is the on-screen app, not necessarily the exported PDF; don't break export).