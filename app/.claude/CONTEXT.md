# BAR HOPPERS /app — CONTEXT (single source of truth)

Last updated: 2026-06-11 · Phase: initial build complete, pending first deploy

## What this app is

Bar Hoppers is a mobile-first Next.js webapp a small group of friends (~6–10 people from Ralston, NE) uses to decide where their next overnight bar-hop trip goes. The perfect trip: drive to a city, check into a hotel steps from the bar district, walk to dinner, hop bars on foot all night, walk back to the hotel — never touch the car. The app ranks 27 candidate cities against that standard, runs a city + hotel vote, and finds the weekend the most people are free. 90%+ of usage is on a phone.

## Repo & deploy

- Repo: https://github.com/tacctile/drunk
- This app lives entirely in `/app`. The repo root `index.html` is the v1 single-file app — NEVER touch it or anything outside `/app`.
- Deploy target: Vercel, project root directory set to `app/`. Not yet deployed.
- Supabase project: `tszssadgsxjoymcttlwd` (shared with unrelated apps — only ever touch `v2_*` tables; `bh_*` tables belong to v1).

## Architecture non-negotiables

- Next.js 14 App Router + TypeScript, strict mode
- Tailwind CSS v3 — tokens are CSS variables in `globals.css`, mapped in `tailwind.config.ts`
- NO UI component libraries (no shadcn/radix/chakra/MUI). Everything hand-built.
- Supabase JS v2 (`@supabase/supabase-js`) — client components + hooks only; no React Server Components for anything touching Supabase realtime
- Google Maps JS API via `@googlemaps/js-api-loader` — in-app map only, NO external navigation links anywhere (hotel websites are the single exception to external links)
- Icons: Material Symbols Outlined (Google Fonts CDN) — the only icon system
- Font: Manrope 400/500/600/700/800 (Google Fonts CDN)
- All user-rendered strings go through React JSX escaping (no `dangerouslySetInnerHTML` for user data; the only `dangerouslySetInnerHTML` is the static theme boot script)
- Supabase failures fall back to localStorage silently. Never show Supabase errors to users.
- Never hardcode city counts — always derive from `cities.length`.

## File map

```
app/
├ package.json               deps + scripts (dev/build/start/lint/typecheck)
├ next.config.mjs            default config
├ tailwind.config.ts         semantic color tokens → CSS vars, type scale, radii
├ tsconfig.json              strict TS, @/* → src/*
├ .env.example               documented env vars (app has working fallbacks)
├ .claude/                   agent operating system (this folder)
└ src/
  ├ app/
  │ ├ layout.tsx             fonts, theme boot script, providers, AppShell
  │ ├ globals.css            design tokens (light/dark), .ms icons, anims, .card/.btn/.chip
  │ ├ page.tsx               DASHBOARD: leaders, best weekend, roster, quick actions, top 3
  │ ├ cities/page.tsx        CITIES: sort (Distance/Score/A–Z/Votes) + vibe/tier filters
  │ ├ city/[id]/page.tsx     server wrapper: generateStaticParams + notFound
  │ ├ city/[id]/CityDetail.tsx  CITY DETAIL: hero, map, vote, hotels, bars, food
  │ ├ vote/page.tsx          VOTE: my vote CTA, ranked results, hotel race, rename
  │ ├ dates/page.tsx         DATES: My Dates / Group View tabs, shared month nav, responses
  │ └ not-found.tsx          404
  ├ components/
  │ ├ AppShell.tsx           bottom nav (mobile) / left rail (≥840px), theme toggle
  │ ├ ThemeProvider.tsx      theme context + THEME_BOOT_SCRIPT (dark default)
  │ ├ Icon.tsx               Material Symbol primitive
  │ ├ Pills.tsx              TierPill, VibePill, ScoreBadge, UnverifiedFlag, Stars
  │ ├ CityCard.tsx           cities-grid card
  │ ├ VoteMeter.tsx          horizontal vote bar
  │ ├ Dialog.tsx             centered modal (esc/backdrop close, scroll lock)
  │ ├ BottomSheet.tsx        slide-up sheet
  │ ├ NamePrompt.tsx         first-name identity dialog (max 20 chars)
  │ ├ VoteFlow.tsx           city+hotel atomic vote dialog (name-gated)
  │ ├ CityMap.tsx            Google map: theme styles, circle pins, filter chips,
  │ │                        zoom≥15 labels via OverlayView, focus/pan, legend
  │ ├ HotelCard.tsx          expandable hotel card w/ per-venue walk distances
  │ ├ VenueRow.tsx           bar/food list row
  │ ├ VenueSheet.tsx         venue bottom sheet (pin tap / list tap)
  │ └ Calendar.tsx           MonthNav, MyCalendar (tri-state), GroupCalendar (heat map)
  ├ hooks/
  │ ├ useGroupData.tsx       THE data layer: fetch + realtime + optimistic mutations
  │ │                        + localStorage fallback. Provider wraps the whole app.
  │ ├ useVotes.ts            derived: city ranking, hotel ranking, my vote, leader
  │ └ useAvailability.ts     derived: my calendar, heat map, best date, breakdowns
  ├ lib/
  │ ├ supabase.ts            lazy client, env w/ baked fallbacks, safeSelect
  │ ├ identity.ts            bh2-voter-id / bh2-voter-name helpers
  │ ├ geo.ts                 haversineMiles, centroid, formatWalkDistance (ft<1000, else mi)
  │ ├ score.ts               cityMeta: cluster, tier, composite score (computed at load)
  │ ├ maps.ts                Maps loader, dark/light styles, PIN_COLORS, base options
  │ └ format.ts              local-time date keys, month grid, labels
  └ data/
    ├ types.ts               City/Hotel/Venue/VibeTag/WalkabilityTier interfaces
    └ cities.ts              27 cities, cleaned + verified data (see Data notes)
```

## Supabase schema (deployed 2026-06-11 as migration `bar_hoppers_v2_schema`)

```sql
CREATE TABLE v2_voters (
  voter_id   uuid not null primary key,
  name       text not null check (char_length(name) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
ALTER TABLE v2_voters ENABLE ROW LEVEL SECURITY;
CREATE POLICY v2_voters_read   ON v2_voters FOR SELECT TO anon USING (true);
CREATE POLICY v2_voters_write  ON v2_voters FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY v2_voters_update ON v2_voters FOR UPDATE TO anon USING (true);

CREATE TABLE v2_city_votes (
  voter_id   uuid not null references v2_voters(voter_id),
  city_id    text not null,
  updated_at timestamptz not null default now(),
  primary key (voter_id)
);
ALTER TABLE v2_city_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY v2_cvotes_read   ON v2_city_votes FOR SELECT TO anon USING (true);
CREATE POLICY v2_cvotes_write  ON v2_city_votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY v2_cvotes_update ON v2_city_votes FOR UPDATE TO anon USING (true);
CREATE POLICY v2_cvotes_delete ON v2_city_votes FOR DELETE TO anon USING (true);

CREATE TABLE v2_hotel_votes (
  voter_id   uuid not null references v2_voters(voter_id),
  city_id    text not null,
  hotel_id   text not null,
  updated_at timestamptz not null default now(),
  primary key (voter_id)
);
ALTER TABLE v2_hotel_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY v2_hvotes_read   ON v2_hotel_votes FOR SELECT TO anon USING (true);
CREATE POLICY v2_hvotes_write  ON v2_hotel_votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY v2_hvotes_update ON v2_hotel_votes FOR UPDATE TO anon USING (true);
CREATE POLICY v2_hvotes_delete ON v2_hotel_votes FOR DELETE TO anon USING (true);

CREATE TABLE v2_availability (
  id         uuid default gen_random_uuid() primary key,
  voter_id   uuid not null references v2_voters(voter_id),
  date       date not null,
  status     text not null default 'available' check (status in ('available','unavailable')),
  updated_at timestamptz not null default now(),
  unique(voter_id, date)
);
ALTER TABLE v2_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY v2_avail_read   ON v2_availability FOR SELECT TO anon USING (true);
CREATE POLICY v2_avail_write  ON v2_availability FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY v2_avail_update ON v2_availability FOR UPDATE TO anon USING (true);
CREATE POLICY v2_avail_delete ON v2_availability FOR DELETE TO anon USING (true);

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE v2_voters, v2_city_votes, v2_hotel_votes, v2_availability;
```

## localStorage contract

`bh2-voter-id` (uuid) · `bh2-voter-name` · `bh2-city-vote-cache` (CityVoteRow) ·
`bh2-hotel-vote-cache` (HotelVoteRow) · `bh2-avail-cache` ({date: status}) · `bh2-theme` ("dark"|"light")

These six keys are the entire localStorage surface. Do not add keys without updating this list.

## Design system

- Font: Manrope. Type scale: 11/12/13/15/17/20/24/30 px (`2xs…3xl` in tailwind config).
- Spacing: Tailwind default 4px grid. Every interactive element is exactly 44px tall (`h-11`; calendar cells, buttons, chips, nav items all comply).
- Radii: 10px default, 14px cards (`rounded-lg`), 18px sheets (`rounded-xl`), pills full.
- Transitions: 180ms ease default; `prefers-reduced-motion` collapses all animation.
- Dark (default): bg #0E0C08, surface #16130D, surface-2 #1E1A12, surface-3 #282217,
  line #2B2517, ink #F3EEE3, muted #A79D89, faint #7C7464, accent #E8A030 (ink-on-accent #201403).
- Light: bg #F8F5EF, surface #FFF, surface-2 #F1ECE1, surface-3 #E8E1D1, line #E5DDCB,
  ink #211B10, muted #6E6555, faint #99907D, accent #B26E0B (ink-on-accent #FFF).
- Status: good #4CAF50/#3E8E47, bad #E5484D/#C73E44, food-blue #2196F3/#1F7FD1 (dark/light).
- Map pins (theme-independent): hotels #E8A030, bars #4CAF50, food #2196F3, white 2px borders.

## Google Maps setup

- Loaded with `@googlemaps/js-api-loader` (`weekly` channel) in `lib/maps.ts`; key from
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with baked public fallback.
- `disableDefaultUI: true`, `gestureHandling: "cooperative"`, custom dark/light style arrays
  synced to theme via `map.setOptions({styles})` on theme change.
- Pins: classic `google.maps.Marker` with `SymbolPath.CIRCLE` (scale 8, focused 11), white stroke.
- Labels: custom `OverlayView` per venue, attached at zoom ≥ 15, detached below.
- `fitBounds` with 48px padding on load; filter chips toggle marker visibility.
- Pin tap → in-app `VenueSheet`. There is intentionally no "Open in Maps" anywhere.

## Data model

```ts
interface City {
  id: string; name: string; state: string;
  miles: number; drive: string;            // from Ralston, NE
  mapCenter: Coords; mapZoom: number;
  vibes: VibeTag[];                        // exactly 2–3 from the fixed tag list
  hotels: Hotel[]; bars: Venue[]; food: Venue[];
}
interface Hotel {
  id: string;                              // kebab-case slug → v2_hotel_votes.hotel_id
  name: string; address: string; stars: number; priceRange: string;
  distanceNote: string; onSite?: string;
  website: string;                         // the ONLY external link in the app
  coords?: Coords; verified: boolean; unverifiedNote?: string;
}
interface Venue {
  id: string; name: string; address: string; description: string;
  hours?: string; coords?: Coords; verified: boolean; unverifiedNote?: string;
}
```

### Data notes

- Cleaned against `bar_crawl_addresses_completed.md` research: CLOSED venues removed,
  wrong-city venues removed (TommyJack's + Thirsty Duck from Yankton, Dario's from Lincoln,
  Malarky's + Norse Horse from Carroll, Olde Main from Fort Dodge), Candlewood Suites removed
  from Grand Island. Verified addresses applied; venues the research couldn't verify stay in
  the data with `verified: false` (rendered with an "unverified" flag).
- Blair's bar list legitimately includes Churchill's Cigar Bar (Fremont) and Fremont hotels —
  the walkability math handles that via outlier-robust clustering (see below).
- Scoring (lib/score.ts, computed at module load into `cityMeta`):
  - Main bar cluster = bars within 2.5 mi of the densest-neighborhood seed bar (robust to
    one far-flung venue). `barSpreadMi` = cluster radius (max bar→centroid distance).
  - Tier: Walk Everything = nearest hotel ≤ 0.2 mi AND radius ≤ 0.3 mi;
    Walk Most = ≤ 0.5 mi AND ≤ 0.5 mi; else Need a Ride.
  - Score = 40% walkability (0.55·tightness + 0.45·hotel reach, continuous) +
    30% bar count (walkable bars / 8, capped) + 30% hotel proximity (1 − mi/1.0, capped).
- Walking distances render in feet under 1000 ft, miles (1 decimal) above.

## Feature checklist

See PROGRESS.md. Everything in the build spec is implemented; deploy + schema were done
2026-06-11 (schema), Vercel deploy still pending.

## Current state

- Last change: initial full build of /app (dashboard, cities, city detail w/ map, vote, dates,
  realtime, theming, .claude ecosystem). `npm run build` green, 34 static pages.
- Supabase v2 schema: DEPLOYED (migration `bar_hoppers_v2_schema` incl. realtime publication).
- What's next: deploy to Vercel (root dir `app/`), set the three NEXT_PUBLIC_ env vars
  (optional — fallbacks baked), restrict the Google Maps key to the deploy domain.
