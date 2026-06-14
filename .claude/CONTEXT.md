# Bar Hoppers — Project Context
> Single source of truth for all Claude Code sessions. Read this before starting.
>
> NOTE: This documents **v2 — the Next.js app under `app/`** (the live product).
> The root `index.html` is the legacy v1 single-file app, kept for reference only;
> both share the same Supabase project. When this doc and `index.html` disagree,
> `app/` wins.

---

## What This Is
A PWA for planning overnight bar-hop trips from Ralston, NE. A group of friends
browse destinations, vote on cities/hotels/dates, mark availability, and share
live locations. Personal project — built solid, not overcomplicated.

The perfect trip: drive to a city, check into a hotel steps from the bar
district, walk to dinner, bar hop on foot, walk back. Never touch the car.
Every city is measured against that standard.

90%+ of usage is on a mobile phone. Desktop is a power-user upgrade.

---

## Stack & Structure
- **Next.js 14 (App Router)** + React 18 + TypeScript, in `app/`.
- **Tailwind** with semantic tokens on `:root` (see Design System). Dark only.
- **Supabase** (`@supabase/supabase-js`) for shared data; every call falls back
  to localStorage silently on failure — never surface a Supabase error.
- **bcryptjs** for PIN hashing. **@googlemaps/js-api-loader** for maps.
- Material Symbols Outlined + Manrope via Google Fonts CDN. Icons only — no emoji.
- Repo: https://github.com/tacctile/drunk · Supabase:
  https://tszssadgsxjoymcttlwd.supabase.co · deploy: Vercel-style (server runtime;
  middleware + `redirects()` are in use, so this is **not** a static export).

Key dirs:
- `app/src/app/` — routes (App Router). `app/src/components/` — UI.
- `app/src/hooks/` — data hooks (`useGroupData` is the shared provider).
- `app/src/lib/` — `identity`, `auth`, `supabase`, `maps`, `venues`, `colors`, …
- `app/src/data/` — `cities.ts` (the walkability index) + `types.ts`.
- `app/public/` — PWA assets (manifest, service worker, offline page, icons).

---

## Routes & Navigation (dual-wing shell)
Cold open hits `/` → client checks `isAuthenticated()`:
- **not authenticated → `/login`** · **authenticated → `/home`** (always).

- `/login` — full-screen create/sign-in screen. No AppShell chrome. Shares the
  identity form with the NamePrompt modal (`IdentityForm`). Has an "Install App"
  section (Android `beforeinstallprompt` button + iOS instructions, hidden in
  standalone). On success → `setLastWing("plan")` → `/plan`.
- `/home` — wing picker. AppShell header only (no bottom nav). Two cards:
  **Plan a Trip → `/plan`**, **Night Out → `/social`** (placeholder).
- **Plan wing — `/plan/*`** (`plan/layout.tsx` sets last wing = plan):
  - `/plan` → redirects to `/plan/cities`.
  - `/plan/cities`, `/plan/city/[id]`, `/plan/calendar`, `/plan/board`,
    `/plan/locate`, `/plan/admin` (3s-hold the Locate tab to reach admin).
  - AppShell renders the 4 bottom tabs (Cities / Availability / Results /
    Locate) + the 80px desktop rail at ≥840px. A subtle Night Out icon button
    (`local_bar`) sits left of the avatar in the wordmark bar to cross wings.
- **Social wing — `/social/*`** (`social/layout.tsx` sets last wing = social):
  - `/social` (Chat placeholder), `/social/camera` (Camera placeholder).
  - AppShell header still renders, but its plan nav/rail is **suppressed**; the
    social layout supplies its own bottom nav (Chat / Camera / Switch-to-Plan),
    matched to the plan nav's 64px + safe-area dimensions.

AppShell (`components/AppShell.tsx`) is global (root layout) and pathname-aware:
bare on `/login` and `/`; header everywhere else except pages with their own
sticky header (`/plan/city/*`, `/plan/admin`); plan nav + rail only on `/plan/*`.

**Auth guard:** `src/middleware.ts` matches `/home`, `/plan/:path*`,
`/social/:path*` and redirects to `/login` when the `bh2-auth` cookie is absent.
It's a **soft guard** (prevents blank protected screens), not security — the real
identity check stays localStorage-based.

---

## Identity & Auth
- Per-device identity in localStorage, backed by a `v2_voters` row whose 2-digit
  PIN (bcrypt hash) lets the same person sign in from any device.
- `lib/identity.ts` owns `bh2-voter-id` / `bh2-voter-name` / `bh2-pin-color`.
  `clearIdentity()` (sign-out) also clears the `bh2-auth` cookie.
- `lib/auth.ts` is the soft-auth layer: `isAuthenticated()` (true when id + name
  are stored; mirrors the `bh2-auth` presence cookie as a side effect),
  `getLastWing()` / `setLastWing()`, `mirrorAuthCookie()`, `clearAuthCookie()`.

### localStorage / cookie contract
All keys are product contract:
- `bh2-voter-id` — voter uuid.
- `bh2-voter-name` — display name ("Nick B").
- `bh2-pin-color` — cached auto-assigned avatar color.
- `bh2-last-wing` — `"plan"` | `"social"`; written on entering either wing.
- `bh2-city-sort` — cities sort preference.
- `bh2-city-vote-cache` / `bh2-hotel-vote-cache` / `bh2-avail-cache` — silent
  offline fallback caches mirroring this voter's writes.
- `bh2-muted-ids` / `bh2-sharing-preference` / `bh2-session-id` — location sharing.
- **`bh2-auth`** — *cookie*, value `"1"`, session-scoped, `SameSite=Lax`. Set by
  `isAuthenticated()`/`mirrorAuthCookie()`, cleared by `clearIdentity()`. Read by
  the middleware (existence only).

---

## PWA
- `public/manifest.json` — name/short_name "Bar Hoppers", `start_url` "/",
  `display` standalone, portrait, bg/theme `#0A0D14`, icon placeholders
  (192/512/180; drop real PNGs in `public/icons/`, see its README).
- `public/sw.js` — cache `bar-hoppers-v1`. Navigations network-first with
  `/offline.html` fallback; fonts + `/_next/static/` + icons cache-first;
  supabase.co / googleapis.com network-first; `skipWaiting` + `clients.claim`.
- `public/offline.html` — standalone dark page, no app-shell deps.
- Registered by `components/ServiceWorkerRegistrar.tsx` (mounted in the root
  layout). `<head>` carries the manifest link + apple-mobile-web-app meta tags.

---

## Design System — dark only
Tokens live on `:root` in `app/src/app/globals.css` and map 1:1 in
`tailwind.config.ts`. Blue-black surfaces, one warm accent.
- `--bg #0A0D14` · `--surface #12161F` · `--surface-raised #1A1F2B`
- `--border #252B3A` · `--border-strong #323A4F`
- `--ink #E8ECF4` · `--ink-muted #8892A4` · `--ink-dim #4A5468`
- `--accent #FF8C42` (+ `--accent-dim`) · `--green` / `--red` (+ dims) · grade A–F.
- Type voices: Display 28/800, Title 17/700, Body 15/500, Meta 13/400, Label
  12/600/uppercase/+0.06em. Radius: 12px cards, 8px buttons/inputs, 6px chips.
- Every interactive element ≥ 44px tall. 4px spacing grid. 160ms ease transitions;
  `prefers-reduced-motion` respected. Breakpoint 840px (bottom nav → left rail).
- Component classes: `card`, `btn`/`btn-accent`/`btn-ghost`, `input`, `label`.

---

## Supabase Schema (v2 tables)
Shared data only; all reads via `safeSelect`, all writes optimistic with cache
mirroring. Tables (see `lib/supabase.ts` for row shapes):
- `v2_voters` — `voter_id`, `name`, `display_name`, `pin_hash` (bcrypt),
  `pin_plain` (admin recovery, never verified against), `pin_color`,
  `is_active` (admin soft-disable), `updated_at`.
- `v2_city_votes` — one row per voter (`voter_id`, `city_id`, `updated_at`).
- `v2_hotel_votes` — one per voter per city (`hotel_place_id`, `hotel_name`, …).
- `v2_hotels` / `v2_bars` / `v2_food` — curated venue rows (`DbVenueRow`), the
  canonical venue source per `city_id`.
- `v2_availability` — `voter_id`, `date` (YYYY-MM-DD), `status`
  available/unavailable; no row = no answer.
- `v2_locations` — live shares, 72h lifetime, `muted_ids[]`, `session_id`
  broadcast lock.

---

## Non-Negotiable Rules
1. Never break existing features — every session ends with all prior
   functionality working. Mobile-first; think at 375px first.
2. Supabase is shared data only; everything else is localStorage. Supabase
   failures fall back silently — never an error toast.
3. Material Symbols + Manrope only. No emoji, no SVG icons.
4. Dark only. Use the semantic tokens; no inline hex, no new radii.
5. `cities` array is variable in length — never hardcode a count.
6. The plan-wing pages and their hooks/lib are stable; don't refactor them
   without cause.

---

## Current State
Last updated: 2026-06-14
Last change: **PWA foundation + auth flow + home screen + dual-wing navigation.**
- Added the PWA layer (manifest, `sw.js`, `offline.html`, registrar, head tags).
- Added `lib/auth.ts` (soft-auth + last-wing), `/login` (inline `IdentityForm`
  extracted from NamePrompt), `/home` wing picker, and `src/middleware.ts`.
- Moved the plan pages under `/plan/*` and split off a placeholder `/social/*`
  wing with its own bottom nav. AppShell is now pathname-aware.
Next up: real PNG app icons; flesh out the Night Out (social) wing.
