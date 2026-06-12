# BAR HOPPERS /app — CONTEXT (single source of truth)

Last updated: 2026-06-12 · Phase: ground-up UI/UX rebuild complete (walkability index), pending first deploy

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
- Google Maps JS API via `@googlemaps/js-api-loader` (`weekly`, `places` library loaded)
- Venue lists (hotels/bars/food) come LIVE from Google Places Nearby Search.
  If Places returns nothing for a category (no key, quota, offline), the app
  silently falls back to the curated `v2_hotels`/`v2_bars`/`v2_food` Supabase
  tables, and to an empty state after that. Venue lists are never hardcoded
  in the bundle (the legacy arrays still sitting in `cities.ts` are reference
  data only — the UI never reads them).
- Icons: Material Symbols Outlined (Google Fonts CDN) — the only icon system
- Font: Manrope 400/500/600/700/800 (Google Fonts CDN)
- All user-rendered strings go through React JSX escaping (no `dangerouslySetInnerHTML` anywhere)
- Supabase failures fall back to localStorage silently. Never show Supabase errors to users.
- No spinners for vote/availability writes — optimistic updates only.
- Walkability scores, letter grades, and district names are HARDCODED research
  in `cities.ts` — never calculated. The old scoring/cluster math is deleted.
- Never hardcode city counts — always derive from `cities.length`.
- Addresses are tappable → `https://maps.google.com/?q=[name+address]` in a new
  tab (the app's only external links).

## Routes & navigation

Three bottom-nav tabs (mobile fixed bar, 64px + safe inset; ≥840px an 80px
icon-only left rail with tooltips):

| Tab | Route | Icon |
|---|---|---|
| Cities (first screen) | `/cities` | `location_city` |
| Calendar | `/calendar` | `calendar_month` |
| The Board | `/board` | `bar_chart` |

- `/` 307-redirects to `/cities` (next.config.mjs redirect + page fallback).
- `/city/[id]` — city detail (SSG via generateStaticParams, 404 on unknown id).
  Highlights the Cities tab; the global wordmark bar hides there (the page has
  its own sticky header: back / city + state / vote icon).
- Sticky top bar everywhere else: "Bar Hoppers" wordmark left, nothing right.
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
  │ ├ layout.tsx             fonts, GroupDataProvider, AppShell
  │ ├ globals.css            dark-only tokens on :root, .ms icons, anims,
  │ │                        .card/.btn/.input/.label, tabular-nums on body
  │ ├ page.tsx               redirect fallback → /cities
  │ ├ cities/page.tsx        CITIES: walkability index list + sort pill +
  │ │                        sort bottom sheet (Distance/Walk/A–Z/By State)
  │ ├ city/[id]/page.tsx     server wrapper: generateStaticParams + notFound
  │ ├ city/[id]/CityDetail.tsx  CITY DETAIL: sticky header, live map w/ pins,
  │ │                        Hotels/Bars/Food tabs (Places-fed), hotel
  │ │                        preference radios, vote CTA in ActionBar;
  │ │                        ≥840px push layout keeps CityList visible left
  │ ├ calendar/page.tsx      CALENDAR: personal tri-state calendar only
  │ ├ board/page.tsx         THE BOARD: hot-dates heat map + vote standings
  │ │                        (+ hotel preference sub-rows) + day breakdown sheet
  │ └ not-found.tsx          404
  ├ components/
  │ ├ AppShell.tsx           3 tabs (Cities/Calendar/The Board), wordmark bar,
  │ │                        mobile bottom nav, 80px desktop rail
  │ ├ ActionBar.tsx          the floating slot above the bottom nav (fixed on
  │ │                        mobile, sticky bottom of column ≥840px)
  │ ├ CityList.tsx           index rows (name/state/district · score+grade ·
  │ │                        miles/drive · inline vote), sort logic + persistence,
  │ │                        by-state grouping, grade color lookups
  │ ├ Calendar.tsx           useMonthNav (hydration-safe), MonthHeader,
  │ │                        PersonalCalendar (tap-cycle), HeatCalendar (board)
  │ ├ CityMap.tsx            live dark Google Map, 10px circle pins w/ white
  │ │                        stroke (hotel accent / bar green / food blue)
  │ ├ VenueSheet.tsx         pin-tap sheet: name, tappable address, rating, price
  │ ├ NamePrompt.tsx         "What's your name?" dialog + useNameGate() hook —
  │ │                        every identifying write funnels through it
  │ ├ Dialog.tsx             centered modal over scrim (esc/backdrop, scroll lock)
  │ ├ BottomSheet.tsx        slide-up sheet (sort options, venues, breakdowns)
  │ └ Icon.tsx               Material Symbol primitive
  ├ hooks/
  │ ├ useGroupData.tsx       THE data layer: fetch + realtime + optimistic
  │ │                        mutations + localStorage fallback. setCityVote /
  │ │                        setHotelPref / setAvailability / saveName.
  │ ├ useVotes.ts            derived: city ranking + per-city hotel-preference
  │ │                        tallies (grouped by place_id), myCityId,
  │ │                        myHotelPrefFor(cityId)
  │ ├ useAvailability.ts     derived: my calendar, per-date breakdowns, heat
  │ └ usePlaces.ts           Places Nearby Search per city (lodging 2000m /
  │                          bar 1000m / restaurant 800m, prominence, chain
  │                          filter) → Supabase venue tables fallback → empty;
  │                          session-cached per city
  ├ lib/
  │ ├ supabase.ts            lazy client, env w/ baked fallbacks, safeSelect,
  │ │                        row types (HotelVoteRow = place_id + name)
  │ ├ identity.ts            bh2-voter-id / bh2-voter-name helpers
  │ ├ venues.ts              Venue UI model, chain regex, types→descriptor,
  │ │                        $-symbols, maps.google.com URL builder
  │ ├ maps.ts                Maps loader (places lib), single dark style,
  │ │                        PIN_COLORS, BASE_MAP_OPTIONS
  │ └ format.ts              local-time date keys, month grid, labels
  └ data/
    ├ types.ts               City (id/name/state/miles/drive/walkScore/
    │                        walkGrade/district/mapCenter/mapZoom), Coords,
    │                        VenueKind
    └ cities.ts              27 cities + hardcoded walkability research;
                             legacy venue arrays retained as reference only
```

## Supabase schema (deployed; verified live 2026-06-12)

User data (all four in the `supabase_realtime` publication):

```sql
CREATE TABLE v2_voters (
  voter_id   uuid not null primary key,
  name       text not null check (char_length(name) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- RLS: anon SELECT/INSERT/UPDATE

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
  hotel_place_id text not null,     -- Google Places place_id (or v2_hotels uuid in fallback mode)
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
```

Curated venue fallback tables (read-only to the app, anon SELECT only, NOT in
the realtime publication): `v2_hotels` (id uuid PK, city_id, name, address,
descriptor, stars, price_range), `v2_bars` / `v2_food` (id uuid PK, city_id,
name, address, descriptor, has_food/has_bar). Populated with ~206 curated rows.

## localStorage contract

`bh2-voter-id` (uuid) · `bh2-voter-name` · `bh2-city-vote-cache` (CityVoteRow | absent) ·
`bh2-hotel-vote-cache` (Record<cityId, HotelVoteRow>) · `bh2-avail-cache` ({date: status}) ·
`bh2-city-sort` ("distance" | "walk" | "name" | "state")

These six keys are the entire localStorage surface. Do not add keys without updating this list.

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

## Google Maps & Places setup

- Loaded with `@googlemaps/js-api-loader` (`weekly`, `libraries: ["places"]`)
  in `lib/maps.ts`; key from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with baked
  public fallback.
- The detail map always mounts: 280px tall mobile, 380px ≥600px wide.
  `gestureHandling: 'cooperative'`, `disableDefaultUI`, `clickableIcons: false`.
- Single dark style: land #0A0D14, roads #1A1F2B, labels --ink-dim, no POI/transit.
- Venues via classic `PlacesService.nearbySearch` (service bound to a detached
  div): lodging r=2000m, bar r=1000m, restaurant r=800m, prominence ranking,
  non-OPERATIONAL filtered, name-regex chain filter on bars/food only.
- Pins: filled 10px circles (Symbol CIRCLE scale 5), white 2px stroke —
  hotel #FF8C42 / bar #34D399 / food #60A5FA. Pin tap → `VenueSheet`.
- Bar/food descriptor = Places `types` formatted to readable text (no
  per-venue details calls; `editorial_summary` is not in nearby results).

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
// UI venue shape (lib/venues.ts) — id is place_id (or fallback uuid):
interface Venue { id; kind; name; address; coords|null; rating|null;
  ratingCount|null; priceLevel|null; priceText|null; descriptor }
```

Hardcoded walkability research (do not recalculate, do not "fix"): Lincoln 96
A+ … Blair 28 F — full table lives in `cities.ts`, one entry per city, with
the district names.

## Feature checklist

See PROGRESS.md.

## Current state

- Last change (2026-06-12): complete ground-up UI/UX rebuild. Three-tab IA
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
- What's next: deploy to Vercel (root dir `app/`), set the three NEXT_PUBLIC_
  env vars (optional — fallbacks baked), restrict the Google Maps key to the
  deploy domain, and confirm Places API quota/billing covers Nearby Search.
