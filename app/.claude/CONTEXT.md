# BAR HOPPERS /app — CONTEXT (single source of truth)

Last updated: 2026-06-12 · Phase: admin hardening + back-nav fixes, pending first deploy

## What this app is

Bar Hoppers is a mobile-first Next.js webapp a small group of friends (~6–10 people from Ralston, NE) uses to decide where their next overnight bar-hop trip goes. The perfect trip: drive to a city, check into a hotel steps from the bar district, walk to dinner, hop bars on foot all night, walk back to the hotel — never touch the car. The app ranks 27 candidate cities by a hardcoded walkability index, runs a city + hotel-preference vote, and finds the weekend the most people are free. 90%+ of usage is on a phone.

## Repo & deploy

- Repo: https://github.com/tacctile/drunk
- This app lives entirely in `/app`. The repo root `index.html` is the v1 single-file app — NEVER touch it or anything outside `/app`.
- Deploy target: Vercel, project root directory set to `app/`. Not yet deployed.
- Supabase project: `tszssadgsxjoymcttlwd` (shared with unrelated apps — only ever touch `v2_*` tables; `bh_*` tables belong to v1).

## Architecture non-negotiables

- Next.js 14 App Router + TypeScript, strict mode
- Tailwind CSS v3 — tokens are CSS variables in `globals.css`, mapped in `tailwind.config.ts`
- NO UI component libraries (no shadcn/radix/chakra/MUI). Everything hand-built.
- Supabase JS v2 (`@supabase/supabase-js`) — client components + hooks only
- Google Maps JS API via `@googlemaps/js-api-loader` (`weekly`, no extra
  libraries) — map display ONLY. The Geocoding and Places APIs are NOT used.
- Venue lists (hotels/bars/food) come ONLY from the curated
  `v2_hotels`/`v2_bars`/`v2_food` Supabase tables (empty state if the query
  fails — never an error UI). Hotels filter to `stars >= 3`; all queries
  return every row for the city — no LIMIT, no ORDER BY (insertion order is
  already proximity/rating order). Map pin coordinates come straight from
  the curated `lat`/`lng` columns — null lat/lng = no pin for that venue,
  silently skipped; lists always render regardless. Venue lists are never
  hardcoded in the bundle (the legacy arrays still sitting in `cities.ts`
  are reference data only — the UI never reads them).
- Identity: first name + last initial ("Nick B") + a 2-digit PIN chosen on
  first visit, stored in `v2_voters` (`display_name`, `pin_hash` — bcryptjs,
  10 salt rounds). Returning users pick their name from a roster dropdown and
  verify the PIN to load their voter_id onto the device. No lockout, no
  complexity — wrong PIN just says "PIN doesn't match. Try again." ONE
  sanctioned plain-text exception (Prompt 3 spec): a PIN changed from the
  profile overlay or reset from the admin edit modal also writes
  `v2_voters.pin_plain` so a forgotten PIN can be recovered — the admin user
  list displays it in plain text; it is NEVER read for verification (sign-in
  and the profile confirmation always compare against `pin_hash`).
  Registration and sign-in do not write it.
- Pin colors are AUTO-ASSIGNED at registration — never user-selectable,
  never changeable. The Nth registered voter gets the Nth entry of the
  25-color `PIN_COLORS` pool in `lib/colors.ts` (`assignColor(count)`,
  cycling back to index 0 past 24), stored permanently in
  `v2_voters.pin_color`. `bh2-pin-color` is only a local cache of the
  server-assigned color, written by the identity layer (createIdentity /
  signIn / roster refetch) and read for avatar rendering and the
  v2_locations upsert. There is NO color picker anywhere.
- Icons: Material Symbols Outlined (Google Fonts CDN) — the only icon system
- Font: Manrope 400/500/600/700/800 (Google Fonts CDN)
- All user-rendered strings go through React JSX escaping (no `dangerouslySetInnerHTML` anywhere)
- Supabase failures fall back to localStorage silently. Never show Supabase errors to users.
- No spinners for vote/availability writes — optimistic updates only.
- Walkability scores, letter grades, and district names are HARDCODED research
  in `cities.ts` — never calculated. The old scoring/cluster math is deleted.
- Never hardcode city counts — always derive from `cities.length`.
- ZERO external links. Venue addresses render as plain text (rows + pin
  sheet) — a tap never leaves the app.

## Routes & navigation

Four bottom-nav tabs (mobile fixed bar, 64px + safe inset; ≥840px an 80px
icon-only left rail with tooltips):

| Tab | Route | Icon |
|---|---|---|
| Cities (first screen) | `/cities` | `location_city` |
| Availability | `/calendar` | `event_available` |
| Results | `/board` | `leaderboard` |
| Locate (rightmost) | `/locate` | `person_pin` |

- `/` 307-redirects to `/cities` (next.config.mjs redirect + page fallback).
- `/city/[id]` — city detail (SSG via generateStaticParams, 404 on unknown id).
  Highlights the Cities tab; the global wordmark bar hides there (the page has
  its own sticky header: back / city + state / vote icon).
- `/locate` — live location sharing. Registered users only (valid
  bh2-voter-id found in the roster); everyone else gets a centered
  "Identity required" gate into the NamePrompt.
- `/admin` — hidden management screen. The ONLY way in is a 3-second
  long-press on the Locate nav icon (the item pulses opacity 1→0.5→1 across
  the hold; a normal tap still goes to /locate; once the hold fires the
  release click is swallowed). No link, no menu entry anywhere. Brings its
  own sticky header (back arrow → /locate), so the wordmark bar hides there
  like on city detail.
- Sticky top bar everywhere else: "Bar Hoppers" wordmark left, profile
  avatar right — a 36px circle showing your initials on your auto-assigned
  pin color (bh2-pin-color cache), or a `person` icon on --surface-raised
  before registration. Tapping it opens the ProfileOverlay — a full-screen
  slide-up sheet (overlay component only, NO /profile route): vote +
  availability summaries, location-sharing toggle, confirm-then-change
  identity editing, and "Switch identity" sign-out.
- EVERY sticky header in the app is fully opaque — plain `bg-bg`/`bg-surface`,
  never an opacity modifier (`/90`), never `backdrop-blur`.
- A single floating control sits just above the bottom nav (`ActionBar`):
  the sort pill on `/cities`, the full-width vote button on `/city/[id]`.
  Nowhere else.

## File map

```
app/
├ package.json               deps + scripts (dev/build/start/lint/typecheck)
├ next.config.mjs            reactStrictMode + / → /cities redirect
├ .eslintrc.json             next/core-web-vitals (font-link rules off for App Router)
├ tailwind.config.ts         dark-only tokens → CSS vars, 5-voice type scale,
│                            radius: chip 6 / btn 8 / card 12 / full
├ tsconfig.json              strict TS, @/* → src/*
├ .env.example               documented env vars (app has working fallbacks)
├ .claude/                   agent operating system (this folder)
└ src/
  ├ app/
  │ ├ layout.tsx             fonts, GroupDataProvider, AppShell, IdentityWatcher
  │ ├ globals.css            dark-only tokens on :root, .ms icons, anims,
  │ │                        .card/.btn/.input/.label, tabular-nums on body
  │ ├ page.tsx               redirect fallback → /cities
  │ ├ cities/page.tsx        CITIES: walkability index list + sticky column
  │ │                        header + sort pill + sort bottom sheet
  │ ├ city/[id]/page.tsx     server wrapper: generateStaticParams + notFound
  │ ├ city/[id]/CityDetail.tsx  CITY DETAIL: opaque sticky header, live map
  │ │                        w/ pins, Hotels/Bars/Food tabs (Supabase-fed,
  │ │                        plain-text addresses, wrapping descriptors),
  │ │                        hotel preference star toggles ("Prefer" label
  │ │                        when unselected), vote CTA in ActionBar; ≥840px
  │ │                        push layout keeps CityList visible left
  │ ├ calendar/page.tsx      AVAILABILITY tab: personal tri-state calendar only
  │ ├ board/page.tsx         RESULTS tab (The Board): two card columns, side
  │ │                        by side at EVERY width (never stack) — TOP
  │ │                        CITIES (top 5, "See Votes" sheet) and HOT
  │ │                        DATES (top 5, "See Who" sheet) + top-3 hotel
  │ │                        section for the leading city + "Not you?" switch
  │ ├ locate/page.tsx        LOCATE tab: registration gate, full-screen dark
  │ │                        map (Ralston center, zoom 8, greedy gestures),
  │ │                        person pins (14px circle + name pill; own pin
  │ │                        18px + amber ring, "You (name)"), controls card
  │ │                        with SHARING (toggle + disclaimer) and — only
  │ │                        while sharing is on — VISIBILITY ("Manage who
  │ │                        sees you" mute list), draggable people panel
  │ │                        (80px ↔ 50vh; rows = 20px color dot, accent-
  │ │                        ringed for you, name, right-aligned "X min
  │ │                        ago"; row tap → pan/zoom 15 + 400ms pin pulse
  │ │                        + 1s raised row flash); no color picker —
  │ │                        auto-assigned
  │ ├ admin/page.tsx         ADMIN (3s long-press on Locate icon ONLY): user
  │ │                        cards always plain-visible (name, pin_plain or
  │ │                        "PIN not set", last vote — NO eye toggle),
  │ │                        pencil edit modal (rename + PIN reset writing
  │ │                        pin_hash AND pin_plain), red row delete →
  │ │                        confirm → ordered cascade delete, reset votes /
  │ │                        reset availability, active-location list +
  │ │                        force expire, data-health count grid + refresh,
  │ │                        DANGER ZONE wipe-all users (type-DELETE sheet)
  │ └ not-found.tsx          404
  ├ components/
  │ ├ AppShell.tsx           4 tabs (Cities/Availability/Results/Locate),
  │ │                        fully opaque wordmark bar (hidden on /city/*
  │ │                        and /admin) with ProfileAvatar top right
  │ │                        (initials on bh2-pin-color, person icon when
  │ │                        unregistered, tap opens ProfileOverlay),
  │ │                        mobile bottom nav, 80px desktop rail; 3s
  │ │                        long-press on Locate → /admin with
  │ │                        opacity-pulse hold feedback
  │ ├ ActionBar.tsx          the floating slot above the bottom nav (fixed on
  │ │                        mobile, sticky bottom of column ≥840px)
  │ ├ CityList.tsx           index rows (name/state/district · score+grade ·
  │ │                        miles/drive · inline vote), sticky column header
  │ │                        (City/Walkability/Distance/Vote, /cities only),
  │ │                        sort logic + persistence, by-state grouping
  │ ├ Calendar.tsx           useMonthNav (hydration-safe), MonthHeader,
  │ │                        PersonalCalendar (tap-cycle), HeatCalendar (board)
  │ ├ CityMap.tsx            live dark Google Map, 10px circle pins w/ white
  │ │                        stroke (hotel accent / bar green / food blue),
  │ │                        diffed by venue id + zoom-gated OverlayView
  │ │                        name labels (zoom ≥ 15)
  │ ├ VenueSheet.tsx         pin-tap sheet: name, address (plain), descriptor
  │ ├ NamePrompt.tsx         single-screen identity modal ("Who are you?"):
  │ │                        first name + initial + 2-digit PIN + Save, with
  │ │                        an in-modal swap to sign-in (roster dropdown +
  │ │                        PIN) — no steps; useNameGate() — every
  │ │                        identifying write funnels through it;
  │ │                        IdentityWatcher (auto sign-in form on unverified
  │ │                        localStorage id); NotYouLink ("Not you?" switch)
  │ ├ ProfileOverlay.tsx     full-screen profile sheet (avatar tap): 64px
  │ │                        avatar + member-since, MY VOTE / MY
  │ │                        AVAILABILITY summary cards (Go vote / Mark
  │ │                        dates deep links), LOCATION SHARING toggle
  │ │                        (useLocations), MY IDENTITY confirm-then-
  │ │                        change form (bcrypt PIN confirm, double-entry
  │ │                        changed fields, masked PINs w/ eyeball,
  │ │                        updateProfile), "Switch identity" sign-out
  │ │                        behind a BottomSheet confirm; closes on back
  │ │                        arrow / Esc / header swipe-down / device back
  │ │                        button (dummy history entry + popstate;
  │ │                        in-app closes pop it, deep links replace it);
  │ │                        body mounts only while open
  │ ├ Dialog.tsx             centered modal over scrim (esc/backdrop, scroll lock)
  │ ├ BottomSheet.tsx        slide-up sheet (sort options, venues, breakdowns)
  │ └ Icon.tsx               Material Symbol primitive
  ├ hooks/
  │ ├ useGroupData.tsx       THE data layer: fetch + realtime + optimistic
  │ │                        mutations + localStorage fallback. setCityVote /
  │ │                        setHotelPref / setAvailability / createIdentity
  │ │                        (bcrypt PIN hash + pin_color via
  │ │                        assignColor(voter count)) / signIn (PIN verify
  │ │                        + adopt + pin-color cache) / updateProfile
  │ │                        (in-place rename + re-PIN: optimistic name +
  │ │                        roster + bh2-voter-name, upsert w/ pin_hash +
  │ │                        pin_plain on PIN change) / signOut (clear
  │ │                        bh2-voter-id/-name/-pin-color + write caches,
  │ │                        reset context — roster row remains) /
  │ │                        identityInvalid. Roster rows carry pin_color;
  │ │                        refetch re-syncs bh2-pin-color from the server
  │ │                        row.
  │ ├ useLocations.ts        v2_locations realtime (unique channel topic
  │ │                        per mount so locate page + profile overlay
  │ │                        can subscribe at once) + 30s clock:
  │ │                        activeLocations (expired + muted-from-you rows
  │ │                        filtered, self first), isSharing, toggleSharing
  │ │                        (geolocation prompt → upsert w/ 72h expiry +
  │ │                        cached auto pin_color, 60s coord updates while
  │ │                        granted, delete on off), muteUser/unmuteUser;
  │ │                        bh2-muted-ids persistence
  │ ├ useVotes.ts            derived: city ranking + per-city hotel-preference
  │ │                        tallies (grouped by place_id), myCityId,
  │ │                        myHotelPrefFor(cityId)
  │ ├ useAvailability.ts     derived: my calendar, per-date breakdowns, heat
  │ └ useVenues.ts           v2_hotels (stars >= 3) / v2_bars / v2_food per
  │                          city (the ONLY venue-list source, session-
  │                          cached, no LIMIT/ORDER BY) → empty on fail
  ├ lib/
  │ ├ supabase.ts            lazy client, env w/ baked fallbacks, safeSelect,
  │ │                        row types (HotelVoteRow = v2_hotels uuid + name)
  │ ├ identity.ts            bh2-voter-id / bh2-voter-name helpers +
  │ │                        bh2-pin-color cache (getStoredPinColor /
  │ │                        storePinColor) + buildDisplayName ("Nick B") +
  │ │                        isValidPin (00–99)
  │ ├ colors.ts              25-color PIN_COLORS pool + assignColor(count)
  │ │                        (registration-order auto-assignment, cycles at
  │ │                        25) + contrastColor (avatar initials b/w)
  │ ├ venues.ts              Venue UI model (curated v2 row fields incl.
  │ │                        nullable lat/lng), CityVenues, EMPTY_VENUES
  │ ├ maps.ts                Maps loader (no extra libs), single dark style,
  │ │                        PIN_COLORS, BASE_MAP_OPTIONS
  │ ├ scrollLock.ts          counter-based body scroll lock shared by every
  │ │                        overlay (safe when stacked overlays unmount
  │ │                        in the same commit)
  │ └ format.ts              local-time date keys, month grid, labels
  └ data/
    ├ types.ts               City (id/name/state/miles/drive/walkScore/
    │                        walkGrade/district/mapCenter/mapZoom), Coords,
    │                        VenueKind
    └ cities.ts              27 cities + hardcoded walkability research;
                             legacy venue arrays retained as reference only
```

## Supabase schema (deployed; verified live 2026-06-12)

User data (all five in the `supabase_realtime` publication):

```sql
CREATE TABLE v2_voters (
  voter_id     uuid not null primary key,
  name         text not null check (char_length(name) between 1 and 20),
  display_name text,        -- "Nick B"; null on legacy rows (fall back to name)
  pin_hash     text,        -- bcrypt hash of the 2-digit PIN; verification ALWAYS uses this
  pin_plain    text,        -- plain copy written by profile PIN changes + admin PIN resets (recovery/admin display; never verified against)
  pin_color    text not null default '#FF8C42',  -- auto-assigned pool color; never user-set
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- RLS: anon SELECT/INSERT/UPDATE/DELETE (DELETE added 2026-06-12 for admin user management)

CREATE TABLE v2_city_votes (
  voter_id   uuid not null references v2_voters(voter_id),
  city_id    text not null,
  updated_at timestamptz not null default now(),
  primary key (voter_id)            -- one city vote per person
);
-- RLS: anon SELECT/INSERT/UPDATE/DELETE

CREATE TABLE v2_hotel_votes (
  voter_id   uuid not null references v2_voters(voter_id),
  city_id    text not null,
  hotel_place_id text not null,     -- v2_hotels row uuid (legacy rows may hold Google place_ids)
  hotel_name text not null,
  updated_at timestamptz not null default now(),
  primary key (voter_id, city_id)   -- one preferred hotel per person per city
);
-- RLS: anon SELECT/INSERT/UPDATE/DELETE

CREATE TABLE v2_availability (
  id         uuid default gen_random_uuid() primary key,
  voter_id   uuid not null references v2_voters(voter_id),
  date       date not null,
  status     text not null default 'available' check (status in ('available','unavailable')),
  updated_at timestamptz not null default now(),
  unique(voter_id, date)
);
-- RLS: anon SELECT/INSERT/UPDATE/DELETE

CREATE TABLE v2_locations (
  voter_id     uuid primary key references v2_voters(voter_id) on delete cascade,
  display_name text not null,
  lat          float8 not null,
  lng          float8 not null,
  pin_color    text not null default '#FF8C42',
  sharing_since timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '72 hours'),
  updated_at   timestamptz not null default now(),
  muted_ids    uuid[] not null default '{}'   -- voters this sharer hides from
);
-- RLS: anon SELECT only where expires_at > now(); anon INSERT/UPDATE/DELETE
-- Sharing is opt-in, expires 72h after enable; app also filters expiry +
-- mutes client-side. Created 2026-06-12 via MCP migration create_v2_locations.
```

Curated venue tables — the CANONICAL venue source (read-only to the app, anon
SELECT only, NOT in the realtime publication): `v2_hotels` (id uuid PK,
city_id, name, address, descriptor, stars, price_range, distance_note, lat,
lng), `v2_bars` / `v2_food` (id uuid PK, city_id, name, address, descriptor,
has_food/has_bar, lat, lng). `lat`/`lng` are nullable float8 used solely for
map pins — null = no pin, the list row renders regardless. 56 + 75 + 75 =
206 curated rows (verified live 2026-06-12).

2026-06-12 foundation migration (applied live via MCP; idempotent — safe to
re-run in the Supabase SQL editor):

```sql
-- Add PIN authentication to v2_voters
ALTER TABLE v2_voters ADD COLUMN IF NOT EXISTS pin_hash text;
ALTER TABLE v2_voters ADD COLUMN IF NOT EXISTS display_name text;

-- Add coordinates to venue tables
ALTER TABLE v2_hotels ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE v2_hotels ADD COLUMN IF NOT EXISTS lng float8;

ALTER TABLE v2_bars ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE v2_bars ADD COLUMN IF NOT EXISTS lng float8;

ALTER TABLE v2_food ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE v2_food ADD COLUMN IF NOT EXISTS lng float8;
```

2026-06-12 pin-color migration (applied live via MCP, `add_pin_color_to_v2_voters`;
idempotent — safe to re-run in the Supabase SQL editor):

```sql
ALTER TABLE v2_voters
  ADD COLUMN IF NOT EXISTS pin_color text
  NOT NULL DEFAULT '#FF8C42';
```

The rows that existed before the column was added were backfilled (one-time
UPDATE, also already applied) with pool colors in `created_at` order, so
registration-order assignment holds for everyone.

2026-06-12 pin-plain migration (applied live via MCP, `add_pin_plain_to_v2_voters`;
idempotent — safe to re-run in the Supabase SQL editor). Per the Prompt 3
profile spec: a PIN changed from the profile overlay stores its plain value
alongside the re-hash so it can be recovered; nothing ever verifies against
it. Note the column is readable through the public anon key like the rest of
v2_voters — acceptable for a ~10-friend app whose 2-digit PINs have no
lockout anyway:

```sql
ALTER TABLE v2_voters ADD COLUMN IF NOT EXISTS pin_plain text;
```

2026-06-12 voters-delete migration (applied live via MCP,
`allow_anon_delete_v2_voters`; idempotent — safe to re-run in the Supabase
SQL editor). v2_voters was the ONLY v2 user table with no anon DELETE
policy, which made the admin cascade delete a silent no-op (child rows went,
the voter row survived and the user reappeared on refetch). Required by both
the per-user delete and the wipe-all action:

```sql
DROP POLICY IF EXISTS v2_voters_delete ON public.v2_voters;
CREATE POLICY v2_voters_delete ON public.v2_voters FOR DELETE TO anon USING (true);
```

## localStorage contract

`bh2-voter-id` (uuid) · `bh2-voter-name` · `bh2-city-vote-cache` (CityVoteRow | absent) ·
`bh2-hotel-vote-cache` (Record<cityId, HotelVoteRow>) · `bh2-avail-cache` ({date: status}) ·
`bh2-city-sort` ("distance" | "walk" | "name" | "state") · `bh2-pin-color` (cache of the
auto-assigned `v2_voters.pin_color` — written ONLY by the identity layer, never a user pick) ·
`bh2-muted-ids` (JSON uuid[] — applies to the location row when sharing starts)

These eight keys are the entire localStorage surface. Do not add keys without updating this list.

## Design system

Dark ONLY. Forever. No light mode, no theme toggle, no `prefers-color-scheme`
handling, no theme persistence. All tokens live on `:root` in `globals.css`
(`color-scheme: dark`).

Colors:

```
--bg #0A0D14 · --surface #12161F · --surface-raised #1A1F2B
--border #252B3A · --border-strong #323A4F
--ink #E8ECF4 · --ink-muted #8892A4 · --ink-dim #4A5468
--accent #FF8C42 · --accent-dim rgba(255,140,66,.15)
--green #34D399 / --green-dim · --red #F87171 / --red-dim
--grade-a #34D399 · --grade-b #86EFAC · --grade-c #FCD34D · --grade-d #FB923C · --grade-f #F87171
```

- Grade colors also exist as literal hex in `tailwind.config.ts` (`grade.a`…)
  so opacity modifiers work (`bg-grade-a/15` for the grade badges).
- Typography (Manrope): Display 28/800/−0.02em (`text-display`) — scores, rank
  numbers; Title 17/700 (`text-title`) — city/hotel names, section headers;
  Body 15/500 (`text-base`); Label 12/600/uppercase/+0.06em (`.label`);
  Meta 13/400 (`text-meta`) — addresses, secondary info. Minimum rendered
  text 13px (sanctioned exceptions: the 12px Label voice and the 11px
  heat-map fractions, both per spec). `font-variant-numeric: tabular-nums`
  is set on `body` — numbers are tabular everywhere.
- Radius: 12px cards (`rounded-card`), 8px buttons/inputs (`rounded-btn`),
  6px chips/badges (`rounded-chip`), `rounded-full` pills only (sort pill,
  grade badges, voter tags, legend dots).
- Spacing: 4px grid. Cards 16px padding. List rows ≥56px; city index rows
  ≥72px. Sections 24px gap (`gap-6`). Page padding 16px (`px-4`).
- Every interactive element ≥44px tall (`h-11`/`min-h-11`) — sacred.
- Bottom nav 64px + safe-area inset, `--surface` bg, `--border` top hairline.
- Transitions 160ms ease; `prefers-reduced-motion` collapses all animation.
- Calendar status colors: green = available, red = not available — calendar
  surfaces only. Heat buckets: 0 resp → raised; 1–33% → red-dim; 34–66% →
  accent-dim; 67–89% → green-dim; 90–100% → green @ 30%.
- Governing principle: design for 0.08 BAC — one thumb, dim bar, ten seconds.
  Nothing that requires explanation.

## Google Maps setup

- Loaded with `@googlemaps/js-api-loader` (`weekly`, no extra libraries) in
  `lib/maps.ts`; key from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with baked public
  fallback. The key needs the Maps JavaScript API only — the Geocoding and
  Places APIs are no longer used anywhere.
- The detail map always mounts: 280px tall mobile, 380px ≥600px wide.
  `gestureHandling: 'cooperative'`, `disableDefaultUI`, `clickableIcons: false`.
- Single dark style: land #0A0D14, roads #1A1F2B, labels --ink-dim, no POI/transit.
- Pin coords come from the curated `lat`/`lng` columns on the venue rows.
  Null lat/lng = no pin, silently skipped — the map stays sparse until
  coordinates are backfilled, and that is expected and correct. No geocoding,
  ever. Markers are diffed by venue id, never torn down on re-render.
- Pins: filled 10px circles (Symbol CIRCLE scale 5), white 2px stroke —
  hotel #FF8C42 / bar #34D399 / food #60A5FA. Pin tap → `VenueSheet`.
- Pin labels: custom `OverlayView` pill per pin (rgba(10,13,20,.85) bg,
  --ink text, 11px, 4px radius, 2px/6px padding, pointer-events: none),
  sits right of the pin and flips left at the map edge; hidden below zoom 15.
- Venue descriptors are the curated `descriptor` column — never derived.

## Data model

```ts
interface City {
  id: string; name: string; state: string;
  miles: number; drive: string;            // from Ralston, NE
  walkScore: number;                       // 0–100, hardcoded research
  walkGrade: string;                       // "A+"…"F", hardcoded research
  district: string;                        // social gathering district name
  mapCenter: Coords; mapZoom: number;
}
type VenueKind = "hotel" | "bar" | "food";
// UI venue shape (lib/venues.ts) — id is the v2_* row uuid (it is what
// v2_hotel_votes.hotel_place_id stores); lat/lng for map pins only:
interface Venue { id; kind; city_id; name; address; descriptor;
  stars?; price_range?; distance_note?;   // hotels
  has_food?;                              // bars
  has_bar?;                               // food
  lat: number | null; lng: number | null }
```

Hardcoded walkability research (do not recalculate, do not "fix"): Lincoln 96
A+ … Blair 28 F — full table lives in `cities.ts`, one entry per city, with
the district names.

## Feature checklist

See PROGRESS.md.

## Current state

- Last change (2026-06-12, admin-hardening + back-nav session): four
  targeted fixes, nothing else. (1) ProfileOverlay intercepts the
  device/browser back button: opening pushes a dummy `{ profile: true }`
  history entry and listens for popstate, so Android back / browser back
  closes the overlay instead of leaving the app. In-app closes (back arrow,
  Escape, header swipe, sign-out confirm) call history.back() to pop the
  dummy entry — the popstate then closes the overlay — keeping the stack
  clean; the Go vote / Mark dates deep links instead router.replace the
  dummy entry with the destination (popping first would race the push), so
  Back from there returns to the page the overlay was opened from. (2)
  Admin user cards are always plain-visible — the eyeball toggle and all
  reveal state are deleted. Each card: display name (Title/--ink), "PIN:
  [pin_plain]" or "PIN not set" (--ink-dim), "Last voted: [city]" or "No
  vote" (Meta/--ink-dim), 44px pencil edit + NEW 44px red delete button.
  The edit modal's PIN reset now writes pin_plain alongside pin_hash so the
  displayed PIN stays truthful; the modal's embedded "Delete user" flow
  moved out to the row delete button (modal is rename/PIN-reset only now).
  (3) Cascade delete actually works: root cause was v2_voters having NO
  anon DELETE RLS policy (the only v2 user table without one) — added live
  via MCP (`allow_anon_delete_v2_voters`, see migration log). deleteUser
  deletes explicitly in FK order — v2_locations → v2_availability →
  v2_hotel_votes → v2_city_votes → v2_voters — each step awaited, then
  refetches the list without a reload; the confirm dialog ("Delete [name]?
  This removes all their votes, availability, and location data. Cannot be
  undone." / Cancel / red Delete) stays. (4) Admin scroll fixed at the real
  root cause: the old save-and-restore body scroll lock broke when two
  stacked overlays unmounted in the same commit (edit dialog + its nested
  confirm) — the second cleanup restored "hidden" and the page locked
  forever. Dialog, BottomSheet, and ProfileOverlay now share a
  counter-based lock (new lib/scrollLock.ts: lockBodyScroll /
  unlockBodyScroll); the admin content wrapper also gained pb-32 so the
  last section clears the bottom nav. (5) NEW DANGER ZONE section below
  DATA HEALTH: full-width red-bordered "Wipe All Users" button (warning
  icon, bg-raised) opens a BottomSheet — red "Wipe All Users" heading,
  warning copy, "Type DELETE to confirm" input (44px,
  autoCapitalize="characters", no autocorrect/autocomplete), full-width
  text Cancel, and a red filled "Wipe Everything" button disabled until the
  input is exactly "DELETE" (case-sensitive). Confirming deletes every row
  from the five user tables in the same FK order (`.neq(voter_id,
  nil-uuid)` filters), closes the sheet, refetches (list now empty), and
  shows "All users wiped." centered in the users section for 4s. Voting
  logic, availability calendar, city list/detail, Results, locate, and the
  root index.html untouched. Build green — 36 static pages; lint + strict
  typecheck clean.
- Earlier (2026-06-12, profile-overlay session / Prompt 3): the avatar
  tap finally goes somewhere. New `components/ProfileOverlay.tsx` — a
  full-screen sheet (anim-sheet slide-up over everything incl. the tab bar,
  --bg background, z-50, NOT a route) opened from the AppShell avatar
  (`profileOpen` state). Own opaque header: back arrow / "Profile" (Title) /
  spacer; closes on back arrow, Escape, or a 70px downward swipe on the
  header; body scroll locks while open; the content (and its hooks) mounts
  only while open. Sections top to bottom: (1) 64px pin-color avatar with
  contrast initials, display name (Display), "Member since [Month D, YYYY]"
  from v2_voters.created_at (fetched per open with pin_hash; line hidden
  offline). (2) MY VOTE card — voted: city name + "You voted for this city"
  + "Preferred hotel: X" when a pref exists for that city; not voted: "No
  vote cast yet" + accent "Go vote" text button that closes the overlay and
  pushes /cities. (3) MY AVAILABILITY card — "[N] days available" (--green,
  Title) + "[N] days unavailable" (--red, Title) + "Last updated [Month
  Year]" from the latest marked date; empty state "No dates marked yet" +
  "Mark dates" → /calendar. (4) LOCATION SHARING card — "Share my location"
  toggle wired to useLocations.toggleSharing (same denied/error inline
  copy as /locate), status line "Sharing · expires in X hrs" (--green) /
  "Not sharing" (--ink-dim), disclaimer "This only affects Bar Hoppers."
  (5) MY IDENTITY card — confirm-then-change: three always-shown
  confirmation inputs (first name / initial / PIN — PIN masked with an
  eyeball reveal); all comparisons trimmed + case-insensitive; the PIN is
  bcrypt-compared against the fetched pin_hash (a hashless legacy row or
  offline fetch accepts any valid PIN, mirroring sign-in adoption).
  "Update my profile" (disabled: raised/dim/border; enabled: accent)
  unlocks on full match; tapping it reveals the change section: three
  optional pairs (new first name / new initial / new PIN, each confirm
  input appearing once its field has content, PINs masked w/ eyeballs);
  a filled pair must be valid + entered twice (matching), empty pairs are
  left alone. "Save changes" (accent, full width) calls the new
  useGroupData.updateProfile, flashes a green check for 1.2s, then resets
  the form. (6) "Not [name]? Switch identity" (--ink-dim, 44px, mt-6) →
  BottomSheet confirm ("Sign out as [name]? You'll need your PIN to sign
  back in." / Cancel / red Sign out) → new useGroupData.signOut + overlay
  closes. Unregistered avatar taps see a quiet "No identity yet" gate into
  NamePrompt instead of an empty profile. Data layer: useGroupData gained
  `updateProfile` (optimistic name/roster/bh2-voter-name update; v2_voters
  upsert carries pin_hash + pin_plain when the PIN changed — pin_plain is
  new, per spec, recovery-only) and `signOut` (clears
  bh2-voter-id/-name/-pin-color + the three write caches, resets context
  to unregistered; server rows untouched); identity.ts gained
  clearIdentity(); useLocations now subscribes under a unique channel
  topic per mount so the overlay and /locate can run simultaneously
  without killing each other's realtime feed. Schema: `v2_voters.pin_plain
  text` added live via MCP (idempotent, see migration log). Voting,
  availability, city list/detail, Results, admin, locate map logic, and
  the root index.html untouched. Build green — 36 static pages; lint +
  strict typecheck clean.
- Earlier (2026-06-12, avatar-and-locate-polish session / Prompt 2):
  identity made visible. (1) The AppShell wordmark bar carries a profile
  avatar top right on every screen that shows the bar (city detail and
  /admin keep their own headers, as before): a 36px circle — initials
  ("Nick B" → "NB", 13px/700, contrastColor(bh2-pin-color) text) on the
  bh2-pin-color background with a 1.5px border at 30% opacity of that color
  (`${color}4D`); before registration it's a `person` icon (20px, --ink-dim)
  on --surface-raised with a --border hairline. The button is a 44px target
  wrapping the 36px circle, aria-label "Your profile", and tapping it is a
  deliberate no-op until the profile screen lands (Prompt 3). It re-reads
  localStorage whenever useGroupData's name/voters change — registration,
  sign-in, and the roster pin-color re-sync all update it with no reload —
  plus a `storage` listener for other tabs; the initial render is always
  the icon variant so SSR hydration stays clean. (2) /locate options card
  simplified into two labeled sections: SHARING (toggle + unchanged
  disclaimer) and VISIBILITY — the mute list, renamed "Manage who sees you"
  — which renders only while sharing is on. No color swatches anywhere
  (deleted last session; verified). There are no Save/Cancel buttons —
  writes stay immediate/optimistic like everywhere else in the app. (3)
  People panel rows are single-line: 20px pin-color dot (your own wears a
  2px --accent outline with a 2px gap), name (Title, --ink) with "(you)" in
  --ink-dim, right-aligned "X min ago" (Meta, --ink-dim — the "Last
  updated" prefix is gone). Tapping a row pans the map to that person,
  zooms to 15 (was 14), pulses their pin by growing it +6px diameter with a
  400ms timeout reset (a 14px pin hits exactly 20px; timers are tracked per
  pin and cleared on teardown — the old rAF sine pulse is deleted), and
  flashes the row --surface-raised for 1s before the 160ms transition fades
  it back. Pin taps still highlight the row accent-dim without moving the
  map. (4) Verified (no change needed): map pins already fill from
  v2_locations.pin_color, which toggle-on writes from the voter's
  auto-assigned color. Voting, availability, city list/detail, Results,
  admin, and the root index.html untouched. Build green — 36 static pages;
  lint + strict typecheck clean.
- Earlier (2026-06-12, pin-color-foundation session): auto-assigned pin
  colors — the identity-layer foundation everything else builds on. New
  `lib/colors.ts`: 25-color `PIN_COLORS` pool, `assignColor(n)` (n % 25 →
  pool hex), `contrastColor(hex)` (black/white text for avatar initials —
  consumed in Prompt 2). Schema: `v2_voters.pin_color text NOT NULL DEFAULT
  '#FF8C42'` added live via MCP (idempotent SQL in the migration log above);
  the 4 pre-existing voters were backfilled with pool colors in created_at
  order. createIdentity counts v2_voters (COUNT exact, head:true), upserts
  `pin_color: assignColor(count)` alongside the bcrypt hash, and caches the
  color to bh2-pin-color; signIn selects pin_color and caches it after PIN
  verification; refetch re-syncs the cache from my server row every time
  (server truth wins — retires colors picked with the old swatch UI).
  VoterRow gained `pin_color: string`, the roster select includes it, and
  useGroupData's voters now carry it so components can render colored
  circles next to names. The color picker is DELETED everywhere:
  PIN_PALETTE, DEFAULT_PIN_COLOR, updatePinColor, and all bh2-pin-color
  writes are gone from useLocations.ts; the swatch radiogroup block is gone
  from locate/page.tsx (the ONLY change there); toggleSharing writes
  v2_locations.pin_color from the bh2-pin-color cache ?? '#FF8C42'.
  ensureVoter deliberately omits pin_color (insert → column default,
  conflict update → assignment preserved). AppShell, voting, availability,
  city data, admin, and the root index.html untouched. Build green — 36
  static pages; lint + strict typecheck clean.
- Earlier (2026-06-12, locate-and-admin session): the Locate tab and the
  hidden Admin screen. (1) Nav: fourth tab "Locate" (`person_pin`, /locate),
  rightmost on the mobile bar and bottom of the desktop rail; a 3-second
  long-press on the Locate item (mouse or touch) opens /admin — the ONLY way
  in — with an opacity 1→0.5→1 pulse over the full hold (`anim-hold`); a
  normal tap navigates to /locate; once the hold fires the release click is
  swallowed. (2) /locate: registered users only (stored voter id verified
  against the roster; otherwise a centered "Identity required" card →
  NamePrompt). Full-screen dark Google Map (Ralston center 41.172/-96.1358,
  zoom 8, greedy gestures, disableDefaultUI, clickableIcons false) under the
  wordmark bar. Pins read from v2_locations via a realtime subscription
  (`bh2-locations` channel, debounced refetch + focus refetch + 30s clock):
  expired rows and rows whose muted_ids contain you are filtered everywhere;
  others are 14px filled circles (white 2px stroke) with an always-visible
  name pill above; your own pin is 18px with a 22px amber ring and "You
  (name)". Pin tap highlights + reveals that row in the list (map stays
  put); list-row tap pans/zooms the map to them (zoom 14) and pulses the pin
  once (400ms). Controls card: "Share my location" toggle (opt-in, OFF by
  default, 44px) with the disclaimer "This only affects Bar Hoppers. Your
  device location settings are unchanged."; denied permission shows the
  inline error and the toggle stays off; ON upserts the row (display name,
  coords, pin color, muted_ids, expires_at = now()+72h) and updates coords
  every 60s (only auto-resumes when the browser permission is already
  granted — never a surprise prompt); OFF deletes the row — device settings
  are never touched. 10-swatch pin color picker (32px circles, ink ring on
  selected, persists to bh2-pin-color) shows while sharing. "Manage
  visibility" expands to a one-directional mute list (hide MY pin from
  specific people — they never know); muted ids live on my row's muted_ids
  and mirror to bh2-muted-ids so they apply when sharing starts. People
  panel: drag/tap bottom sheet (collapsed 80px = handle + first row,
  expanded 50% viewport), rows 56px (color dot, name — self first with
  "(you)", "Last updated X min ago"), empty state "No one is sharing their
  location right now.". (3) /admin: own sticky header (back arrow →
  /locate). REGISTERED USERS — v2_voters by created_at asc as cards: name,
  PIN status ("PIN: ••" until the eye reveals "PIN set ✓ / No PIN set —
  PINs are hashed and cannot be recovered. Use edit to reset."), "Last
  voted: [city]" via v2_city_votes join, pencil → edit modal (rename,
  optional PIN reset w/ confirm, "Delete user" → confirmation → cascade
  delete from v2_city_votes/v2_hotel_votes/v2_availability/v2_locations
  then v2_voters). TRIP MANAGEMENT — Reset All Votes (clears
  v2_city_votes + v2_hotel_votes) and Reset All Availability, both behind
  red confirmation modals. ACTIVE LOCATIONS — non-expired v2_locations
  rows ("sharing since/expires in hours", Force expire sets expires_at =
  now()). DATA HEALTH — count grid (voters, city votes, availability,
  active locations, hotels, bars, food) with a refresh button. (4) Supabase:
  v2_locations created live via MCP (RLS anon read gated to expires_at >
  now(), anon insert/update/delete, added to supabase_realtime) — SQL is
  idempotent and safe to re-run. New hook useLocations.ts; LocationRow type
  in supabase.ts; two new localStorage keys (bh2-pin-color, bh2-muted-ids).
  No voting/availability/city/board logic touched. Build green — 36 static
  pages; lint + strict typecheck clean.
- Earlier (2026-06-12, surgical-polish session): three targeted fixes,
  nothing else. (1) The Board's two card columns (TOP CITIES / HOT DATES)
  are now side by side at EVERY width — `grid grid-cols-2 gap-3`, the
  `<480px` stacking breakpoint is gone; row cards keep their existing
  `px-3 py-2` padding, names/dates already truncate with ellipsis, counts
  and the 32px See buttons stay visible at 375px. Hotel section untouched.
  (2) The AppShell wordmark bar is fully opaque — `bg-bg/90 backdrop-blur`
  replaced with plain `bg-bg`; this was the ONLY opacity/blur header in the
  app (city-list column header, city-detail header, and venue-tab bar were
  already plain `bg-bg`/`bg-surface`; modal scrims are intentionally
  translucent and unchanged). Every sticky header on every page is now
  fully opaque. (3) Nav renames — Calendar → "Availability"
  (`event_available` icon), The Board → "Results" (`leaderboard` icon);
  Cities unchanged; routes unchanged (/calendar, /board); still three tabs
  (the Locate tab arrives in a later prompt). No logic, query, or route
  changes. Build green — 34 static pages; lint + strict typecheck clean.
- Earlier (2026-06-12, simplification session): NamePrompt is now ONE
  single-screen modal ("Who are you?") — first name (max 15) + last initial
  (1 letter, auto-capitalized) + 2-digit PIN stacked, 44px inputs, helper
  line "Name, initial, and PIN let you vote from another device.", full-width
  accent Save. No steps, no PIN-confirm screen. Validation runs on Save with
  inline 12px red errors per field (first name letters-only 1–15, initial
  exactly 1 letter, PIN exactly 2 digits); save still flows through
  createIdentity (uuid + bcrypt hash + v2_voters upsert + localStorage).
  "Sign in as existing user" swaps the same modal to the sign-in form (A–Z
  roster dropdown + PIN + full-width Sign in; wrong PIN → "PIN doesn't
  match. Try again." — no lockout; "Never mind, create new" swaps back).
  Trigger logic (useNameGate / IdentityWatcher / NotYouLink) untouched.
  The Board fully rebuilt: px-4 pt-4 page; Section 1 is two equal columns
  (12px gap, stacking <480px) of 56px-min card rows (surface / 12px radius /
  border, 8px row gap) — TOP CITIES left (top 5 by votes: name, "N votes"
  accent count, 32px "See Votes" button → bottom sheet listing voter names
  in 44px rows with a close button top right) and HOT DATES right (top 5 by
  available count desc: "Sat Jun 28", "N free", "See Who" → bottom sheet
  headed "Sat, Jun 28" with Available (green) / Not available (red) 44px
  name rows). Section 2 (24px below): "Top Hotels in Top Voted City" —
  v2_hotel_votes rows for the leading city only, grouped by hotel_name,
  sorted count desc → stars desc → low end of price_range asc (stars/price
  joined against the city's v2_hotels via useVenues by exact name match),
  top 3 as card rows (name, "N prefer this", filled 14px accent stars); the
  whole section hides when no city has votes or the leading city has no
  hotel votes. Rank numbers, meters, voter pills, and hotel sub-rows are
  gone from the board; the "Not you?" switcher stays at the page bottom.
  Empty states: "No votes yet." / "No dates marked yet.". The 32px See
  buttons are a spec'd exception to the 44px-target rule. Build green — 34
  static pages; lint + strict typecheck clean.
- Earlier (2026-06-12, foundation-fixes session): identity system is now
  name + last initial + 2-digit PIN. New users enter first name (1–15 chars)
  + last initial (1 letter), then choose/confirm a 2-digit PIN — a fresh
  uuid is generated, the PIN is bcrypt-hashed (bcryptjs, 10 rounds) and the
  row upserted to v2_voters (name = display_name e.g. "Nick B"). Returning
  users ("I have an account", or auto-shown when the stored voter_id can't
  be verified against the live roster) pick their name from an A–Z dropdown
  and enter their PIN — verified with bcrypt.compare; wrong PIN shows "That
  PIN doesn't match. Try again." (no lockout); legacy rows without a
  pin_hash adopt the first PIN entered for them. Identity switching clears
  this device's vote/availability caches; The Board gained a "You're X ·
  Not you?" switcher. Schema migration applied live: v2_voters +pin_hash
  +display_name; v2_hotels/v2_bars/v2_food +lat +lng (nullable float8).
  Venue queries: hotels now `gte(stars, 3)` (was unfiltered), no ORDER BY
  anywhere (insertion order is canonical), still no LIMIT. ALL geocoding
  deleted — map pins read venue lat/lng, null = silently no pin (sparse map
  until coords are backfilled — expected). City detail: descriptor/address
  text wraps (`break-words`, no truncate); hotel preference is now a star
  toggle (FILL 0 outline + "PREFER" label when unselected → FILL 1 accent
  star alone when selected, 44px target). The Board rebuilt as read-only
  two-column grid (stacks <480px): STANDINGS left (rank/name/count/meter/
  voter pills/hotel sub-rows), HOT DATES right (dates sorted by available
  count desc, "X available", available/roster meter, name pills) — heat
  calendar + day breakdown sheet removed from the board (HeatCalendar
  component remains in Calendar.tsx, unused). bcryptjs added. Build green —
  34 static pages; lint + strict typecheck clean.
- Earlier (2026-06-12, later session): venue data layer flipped to
  Supabase-primary. `v2_hotels`/`v2_bars`/`v2_food` are now the ONLY source
  for venue lists (`usePlaces.ts` deleted → `useVenues.ts`; Places Nearby
  Search, the chain filter, and the types→descriptor formatter removed; the
  Maps loader no longer loads the `places` library). Google APIs serve only
  the map display and background Geocoding of pin coords — lists render
  immediately, pins stream in, geocode failures silently mean no pin. ALL
  external links removed (`mapsUrl()` deleted; addresses are plain text in
  rows and the pin sheet — zero `target="_blank"` in the app). Hotel rows:
  name, address, filled accent star icons (`stars`), `price_range`, plus the
  untouched preference radio (now keyed by v2_hotels uuids). Bar/food rows:
  name, address, curated descriptor, "Also serves food"/"Full bar" pills
  (has_food/has_bar). City detail sticky header is fully opaque (`bg-bg`,
  no /90 opacity, no backdrop-blur). /cities gained a 36px sticky column
  header (CITY/WALKABILITY/DISTANCE/VOTE) below the wordmark bar; the row
  walkability block is fixed at 96px so columns align. Map pins are diffed
  by venue id and carry zoom-gated OverlayView name labels (zoom ≥ 15,
  edge-flipping pills). `npm run build` green — 34 static pages; lint +
  strict typecheck clean.
- Earlier (2026-06-12): complete ground-up UI/UX rebuild. Three-tab IA
  (Cities / Calendar / The Board); walkability index list with hardcoded
  scores/grades/districts, sort pill + bottom sheet (distance default);
  city detail with always-mounted dark map, Google Places venue tabs
  (Supabase venue tables as silent fallback), per-city hotel preference
  radios (place_id keyed), full-width vote CTA; personal-only tri-state
  calendar (tap cycles available → not available → clear); The Board with
  respondents heat map + day breakdown sheet + vote standings with hotel
  sub-rows. Deleted: Trip dashboard, /vote flow, /dates page, WalkStrip,
  ConstellationMap, CityCard, HotelCard, VenueRow, VoterAvatars, Stars,
  score.ts, geo.ts. `npm run build` green — 34 static pages; lint + strict
  typecheck clean.
- Supabase: schema verified live 2026-06-12 — v2_hotel_votes already matches
  the new shape (PK voter_id+city_id, hotel_place_id, hotel_name + full anon
  RLS); v2_hotels/v2_bars/v2_food curated fallback tables present (~206 rows,
  anon read). No SQL changes were needed this session. All four user tables
  in the realtime publication.
- What's next: backfill venue lat/lng in the Supabase SQL editor (map pins
  are sparse until then), deploy to Vercel (root dir `app/`), set the three
  NEXT_PUBLIC_ env vars (optional — fallbacks baked), restrict the Google
  Maps key to the deploy domain, and confirm the key has the Maps JavaScript
  API enabled with billing (Geocoding and Places APIs are no longer needed).
  (pin_plain now surfaces in the admin user cards; it still only fills when
  a PIN is changed from the profile or reset from the admin edit modal —
  everyone else shows "PIN not set" even though their hashed PIN works.)
