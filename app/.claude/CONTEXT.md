# BAR HOPPERS /app — CONTEXT (single source of truth)

Last updated: 2026-06-11 · Phase: dark-only redesign complete, pending first deploy

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
├ .eslintrc.json             next/core-web-vitals (font-link rules off for App Router)
├ tailwind.config.ts         dark-only tokens → CSS vars, 3-voice type scale, 16px radius
├ tsconfig.json              strict TS, @/* → src/*
├ .env.example               documented env vars (app has working fallbacks)
├ .claude/                   agent operating system (this folder)
└ src/
  ├ app/
  │ ├ layout.tsx             fonts, GroupDataProvider, AppShell (no theming)
  │ ├ globals.css            dark-only tokens on :root, .ms icons, anims,
  │ │                        .card/.btn/.chip/.input/.label
  │ ├ page.tsx               TRIP: decision board — leader hero (the vote surface),
  │ │                        standings, closest picks, roster, date nudge
  │ ├ cities/page.tsx        CITIES: sort (Nearest/Best walk/Most votes/A–Z),
  │ │                        state filter pills, sticky footer vote pill
  │ ├ city/[id]/page.tsx     server wrapper: generateStaticParams + notFound
  │ ├ city/[id]/CityDetail.tsx  CITY DETAIL: two-pane ≥840px, hero, constellation
  │ │                        peek ↔ expanded live map, vote, hotels, bars, food
  │ ├ vote/page.tsx          VOTE FLOW: full-screen three beats (city → hotel →
  │ │                        confirm), no app chrome, ?city= enters at beat 2
  │ ├ dates/page.tsx         DATES: I'm Free / I'm Busy mode toggle, My/Group tabs,
  │ │                        heat map, responses
  │ └ not-found.tsx          404
  ├ components/
  │ ├ AppShell.tsx           3 tabs (Trip/Cities/Dates): bottom nav mobile, 224px
  │ │                        rail ≥840px; renders nothing around /vote
  │ ├ Icon.tsx               Material Symbol primitive
  │ ├ WalkStrip.tsx          THE signature element: fixed 0→1 mi SVG strip,
  │ │                        bar dots + accent hotel square, city & per-hotel variants
  │ ├ ConstellationMap.tsx   pure-SVG venue dot-field (city identity, map peek)
  │ ├ VoterAvatars.tsx       overlapping first-name initials (max 5 + "+N", own in accent)
  │ ├ Stars.tsx              hotel star rating (muted)
  │ ├ CityCard.tsx           5 elements: name+state, tagline, walk strip, drive, initials
  │ ├ Dialog.tsx             centered modal (esc/backdrop close, scroll lock)
  │ ├ BottomSheet.tsx        slide-up sheet
  │ ├ NamePrompt.tsx         first-name identity dialog (max 20 chars)
  │ ├ CityMap.tsx            live Google map — mounted ONLY when expanded; dark style
  │ │                        only; shape pins (accent square / white dot / outlined
  │ │                        circle), zoom≥15 labels, filter chips, collapse button
  │ ├ HotelCard.tsx          hotel card: stars/price/on-site, per-hotel walk strip,
  │ │                        vote initials, website link, expandable distance list
  │ ├ VenueRow.tsx           bar/food row (shape glyph) — tap expands map + pans
  │ ├ VenueSheet.tsx         venue bottom sheet (pin tap)
  │ └ Calendar.tsx           MonthNav, MyCalendar (mode-toggle set/clear),
  │                          GroupCalendar (heat map), Fri/Sat emphasis
  ├ hooks/
  │ ├ useGroupData.tsx       THE data layer: fetch + realtime + optimistic mutations
  │ │                        + localStorage fallback. Provider wraps the whole app.
  │ ├ useVotes.ts            derived: city ranking, hotel ranking, my vote, leader,
  │ │                        recentlyChangedCityIds (others-only diff → one-shot pulse)
  │ └ useAvailability.ts     derived: my calendar, heat map, best date, breakdowns
  ├ lib/
  │ ├ supabase.ts            lazy client, env w/ baked fallbacks, safeSelect
  │ ├ identity.ts            bh2-voter-id / bh2-voter-name helpers
  │ ├ geo.ts                 haversineMiles, centroid, formatWalkDistance (ft<1000, else mi)
  │ ├ score.ts               cityMeta: bar district centroid, nearest hotel, composite
  │ │                        score — UI-invisible; score is only the "Best walk" sort key
  │ ├ maps.ts                Maps loader, single dark style, PIN_COLORS (shape inks)
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
`bh2-hotel-vote-cache` (HotelVoteRow) · `bh2-avail-cache` ({date: status})

These five keys are the entire localStorage surface. Do not add keys without updating this list.

## Design system

Dark ONLY. No light mode, no theme toggle, no `prefers-color-scheme` handling, no theme
persistence. All tokens live directly on `:root` in `globals.css` (`color-scheme: dark`).

- Surfaces: bg `#0A0D14`, surface `#12161F`, raised `#1A1F2B` — three clearly separated
  lifts. Depth = surface lift + hairline borders (line `#232A38`, line-strong `#2E3748`),
  near-zero shadows (one `shadow-overlay` value for sheets/dialogs only).
- Text: ink `#E8ECF4` (never pure white), muted `#8E99AC`, dim `#5C6678`. Body text is
  15px minimum; nothing meaningful below 13px. Tabular numerals (`tabular-nums`) on every
  number.
- ONE accent: warm streetlight orange `#FF9433` (accent-ink `#1A0E00`, accent-soft 12%).
  It appears ONLY on: the current vote leader, the user's own vote (initial/CTA states),
  the walk strip's hotel square, primary action buttons, hotel pins/dots on the
  constellation and live map, the active nav tab, and the today ring. Nowhere else.
- Status colors exist only in the calendar: good `#34D399`, bad `#F87171` (+ softs).
  Never elsewhere, never beside the accent.
- Typography — exactly three voices (Manrope 400–800, Google Fonts CDN):
  - Display: 32px / 800 / 36px line / −0.02em (`text-display`) — city names, hero lines.
  - Body: 15px / 500 (`text-base`, body default) — everything readable.
  - Label: 12px / 600 / uppercase / +0.06em (`.label`) — section markers, metadata.
  Weight communicates importance; metadata/labels never render bold/extrabold.
- Radius: 16px (`rounded`) on ALL cards/panels/buttons; `rounded-full` only on
  avatar/initial circles and the sanctioned pills (chips, footer vote pill). No other
  radius values in markup.
- Spacing: 4px grid; 32px between sections (`gap-8`); 20px card padding (`p-5`); list
  rows ≥56px (`min-h-14`); every tap target ≥44px (`h-11`) — sacred, no exceptions.
- Signature element: `WalkStrip` — fixed shared 0→1 mi axis on EVERY strip (auto-scaling
  per city is forbidden), ¼ mi tick, near-white bar dots, accent hotel square; hotel
  past 1 mi snaps to the edge with "[X] mi — you'll need a ride"; no coords →
  "Map data pending". It replaces ALL score/tier/vibe UI; the composite score number
  never appears anywhere (it survives only as the invisible "Best walk" sort key).
- City identity: `ConstellationMap` pure-SVG dot-field (accent squares / near-white
  dots / outlined muted circles) — also the collapsed map peek.
- Vote counts render as overlapping first-name initials (max 5 + "+N", own initial in
  accent; colliding first letters get two). No vote bars, no badges, no tier/vibe pills,
  no "unverified" flags, no `distanceNote`, and the word "cluster" never renders in UI
  chrome (hand-written taglines are exempt).
- Live pulse: when ANOTHER person's vote changes, the affected row/hero plays
  `anim-pulse-once` (driven by `useVotes.recentlyChangedCityIds`); never on your own
  optimistic writes; killed by `prefers-reduced-motion`.
- Transitions: 200ms ease-out default (keyframes 180–220ms); `prefers-reduced-motion`
  collapses all animation.
- Governing principle: design for 0.08 BAC — one thumb, dim bar, ten seconds. Two taps
  to any primary action; nothing that needs explanation.

## Google Maps setup

- Loaded with `@googlemaps/js-api-loader` (`weekly` channel) in `lib/maps.ts`; key from
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with baked public fallback.
- The live map mounts ONLY in the expanded state. Collapsed (~170px) renders the
  pure-SVG `ConstellationMap` peek — the Google map is never mounted collapsed, and the
  map element's size is never animated (the container's height/clip animates instead).
- Single dark style array tuned to the blue-black surfaces. The light style is gone.
- Pins differentiate by SHAPE, not color: hotel = filled accent `#FF9433` square
  (custom Symbol path), bar = filled near-white `#E8ECF4` circle, food = outlined muted
  `#8E99AC` circle.
- Labels: custom `OverlayView` per venue, attached at zoom ≥ 15, detached below.
- `fitBounds` with 48px padding on load; filter chips (expanded only) toggle marker
  visibility; venue-list taps expand the map and pan to the pin.
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

- Last change: full dark-only UI/UX overhaul — blue-black token system, three-tab nav
  (Trip / Cities / Dates), decision-board Trip screen, WalkStrip + ConstellationMap
  signature elements, full-screen three-beat /vote flow, mode-toggle calendar,
  expand-only live map with shape pins. ThemeProvider/Pills/VoteMeter/VoteFlow deleted;
  Maryville's placeholder `downtown-loft-rentals` hotel removed from data. Data layer,
  routing, and a11y patterns untouched. `npm run build` green, 34 static pages.
- Supabase v2 schema: DEPLOYED (migration `bar_hoppers_v2_schema` incl. realtime publication).
- What's next: deploy to Vercel (root dir `app/`), set the three NEXT_PUBLIC_ env vars
  (optional — fallbacks baked), restrict the Google Maps key to the deploy domain.
