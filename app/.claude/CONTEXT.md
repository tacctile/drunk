# Hoppz /app — CONTEXT (single source of truth)

## What this app is

Hoppz (formerly Bar Hoppers) is a mobile-first Next.js webapp a small group of
friends (~6-10 people from Ralston, NE) uses to plan and execute overnight
bar-hop trips. Two wings: **Plan** (pick the city, vote on hotels, mark
availability, manage the crew) and **Social** (group chat with photo sharing,
camera capture, photo gallery, live location sharing). The app ranks 27
candidate cities by a hardcoded walkability index, runs a city +
hotel-preference vote, finds the weekend the most people are free, and provides
a live group map during the trip. The perfect trip: drive to a city, check into
a hotel steps from the bar district, walk to dinner, hop bars on foot all
night, walk back to the hotel — never touch the car. 90%+ of usage is on a
phone.

## Repo & deploy

- Repo: https://github.com/tacctile/drunk
- This app lives entirely in `/app`. The repo root `index.html` is the v1
  single-file app — NEVER touch it or anything outside `/app`.
- Deploy target: Vercel, project root directory set to `app/`.
- Supabase project: `tszssadgsxjoymcttlwd` (shared with unrelated apps — only
  ever touch `v2_*` tables; `bh_*` tables belong to v1).

## Architecture non-negotiables

- Next.js 14 App Router + TypeScript, strict mode
- Tailwind CSS v3 — tokens are CSS variables in `globals.css`, mapped in
  `tailwind.config.ts`
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
  silently skipped; lists always render regardless.
- Identity: first name + last initial ("Nick B") + a 2-digit PIN chosen on
  first visit, stored in `v2_voters` (`display_name`, `pin_hash` — bcryptjs,
  10 salt rounds). Returning users pick their name from a roster dropdown and
  verify the PIN. ONE sanctioned plain-text exception: a PIN changed from the
  profile overlay or reset from the admin edit modal also writes
  `v2_voters.pin_plain` so a forgotten PIN can be recovered — the admin user
  list displays it in plain text; it is NEVER read for verification.
- Pin colors are AUTO-ASSIGNED at registration — never user-selectable,
  never changeable. The Nth registered voter gets the Nth entry of the
  25-color `PIN_COLORS` pool in `lib/colors.ts` (`assignColor(count)`,
  cycling back to index 0 past 24), stored permanently in
  `v2_voters.pin_color`.
- RBAC: `v2_voters.role` column (`super_admin` | `moderator` | null).
  `lib/roles.ts` provides `getRoleForVoter`/`isSuperAdmin`. Middleware gates
  `/plan/admin` (super_admin or hardcoded voter_id) and `/plan/moderator`
  (moderator or super_admin). Two hardcoded superadmins in `lib/superadmin.ts`.
- Icons: Material Symbols Outlined (Google Fonts CDN) — the only icon system
- Font: Manrope 400/500/600/700/800 (Google Fonts CDN)
- All user-rendered strings go through React JSX escaping (no
  `dangerouslySetInnerHTML` anywhere)
- Supabase failures fall back to localStorage silently. Never show Supabase
  errors to users.
- No spinners for vote/availability writes — optimistic updates only.
- Walkability scores, letter grades, and district names are HARDCODED research
  in `cities.ts` — never calculated.
- Never hardcode city counts — always derive from `cities.length`.
- ZERO external links. Venue addresses render as plain text — a tap never
  leaves the app.
- PWA: manifest.json + service worker (offline shell, push notification
  foundation). Installable on mobile.

## Routes & navigation

Dual-wing architecture with a shared home screen:

### Root routes

| Route | Purpose |
|---|---|
| `/` | Cold-open gate: redirect to `/home` (authenticated) or `/login` |
| `/login` | Sign-in / create account + install prompts |
| `/home` | Dashboard: trip anchor, who's going, my status, action pills |

### Plan wing (`/plan/*`)

Five bottom-nav tabs (mobile fixed bar, 64px + safe inset; >=840px an 80px
icon-only left rail with tooltips) plus a cross-wing "Hopp" tab:

| Tab | Route | Icon |
|---|---|---|
| Cities (first) | `/plan/cities` | `location_city` |
| Availability | `/plan/calendar` | `event_available` |
| Results | `/plan/board` | `leaderboard` |
| Hopperz | `/plan/hopperz` | `groups` |
| Hopp (cross-wing) | `/social` | `sports_bar` |

Additional plan routes (not in nav):
- `/plan/city/[id]` — city detail (SSG via generateStaticParams, 404 on
  unknown id). Highlights the Cities tab; own sticky header.
- `/plan/admin` — super admin screen. Accessed via 3-second long-press on any
  nav icon, or "Open Admin" button on profile Me tab. Own sticky header.
- `/plan/moderator` — moderator screen. Accessed via 500ms long-press on
  ProfileAvatar. Own sticky header.
- `/plan` — plan wing root redirect.

### Social wing (`/social/*`)

Five bottom-nav tabs:

| Tab | Route | Icon |
|---|---|---|
| Chat (first) | `/social` | `chat` |
| Camera | `/social/camera` | `photo_camera` |
| Gallery | `/social/gallery` | `photo_library` |
| Locate | `/social/locate` | `person_pin` |
| Plan (cross-wing) | `/plan/cities` | `map` |

### Shared UI

- TopBar: "Hoppz" wordmark left, trip status pill center (when upcoming/active),
  ProfileAvatar right. Hidden on city detail, admin, moderator (those pages
  have own headers).
- ProfileOverlay: full-screen sheet from avatar tap. Three tabs: Me (avatar +
  role + identity edit + switch identity), Trip (vote + availability + location
  + notifications), About (voter notes). NOT a route.
- Middleware (`src/middleware.ts`): auth guard on `/home`, `/plan/*`, `/social/*`.
  Role guard on `/plan/admin` (super_admin or hardcoded voter_id) and
  `/plan/moderator` (moderator or super_admin).

## File map

```
app/
+ package.json               deps + scripts (dev/build/start/lint/typecheck)
+ next.config.mjs            reactStrictMode + / -> /cities redirect
+ .eslintrc.json             next/core-web-vitals
+ tailwind.config.ts         dark-only tokens -> CSS vars, type scale, radii
+ tsconfig.json              strict TS, @/* -> src/*
+ .env.example               documented env vars
+ .claude/                   agent operating system (this folder)
+ public/
| + manifest.json            PWA manifest
| + sw.js                    service worker (offline + push)
| + offline.html             offline fallback page
| + icons/README.txt         placeholder icons
+- src/
   + middleware.ts            auth + role guard middleware
   + app/
   | + layout.tsx             fonts, GroupDataProvider, TripDataProvider,
   | |                        AppShell, IdentityWatcher, ErrorBoundary,
   | |                        ServiceWorkerRegistrar
   | + globals.css            dark-only tokens on :root, .ms icons, anims,
   | |                        .card/.btn/.input/.label, tabular-nums on body
   | + page.tsx               cold-open gate -> /home or /login
   | + not-found.tsx          404
   | + login/page.tsx         sign-in / create account + install prompts
   | + home/page.tsx          dashboard: trip anchor, who's going, my status
   | + plan/
   | | + layout.tsx           plan wing layout (sets last wing)
   | | + page.tsx             plan wing root redirect
   | | + cities/page.tsx      walkability index list + sort
   | | + calendar/page.tsx    personal tri-state availability calendar
   | | + board/page.tsx       results: top cities, hot dates, hotel prefs
   | | + hopperz/page.tsx     crew members list/grid + voter profile sheets
   | | + admin/page.tsx       super admin: users, trip setup, resets, danger zone
   | | + moderator/page.tsx   moderator: crew mgmt, trip setup, resets
   | | + city/[id]/
   | |   + page.tsx           server wrapper: generateStaticParams + notFound
   | |   + CityDetail.tsx     city detail: map, venue tabs, vote CTA
   | + social/
   |   + layout.tsx           social wing layout (HopShell)
   |   + page.tsx             chat: messages, reactions, replies, images
   |   + locate/page.tsx      live map + people strip + location options
   |   + gallery/page.tsx     photo grid + pagination + jump-to-date
   |   + camera/
   |     + layout.tsx         bare layout (no HopShell, full-bleed camera)
   |     + page.tsx           full-screen camera capture + send
   + components/
   | + AppShell.tsx           TopBar + PlanNav composition for /plan/* routes
   | + TopBar.tsx             sticky wordmark bar + trip pip + ProfileAvatar
   | + PlanNav.tsx            plan wing nav (5 tabs + cross-wing Hopp)
   | + HopNav.tsx             social wing nav (5 tabs + cross-wing Plan)
   | + HopShell.tsx           TopBar + HopNav composition for /social/* routes
   | + ProfileAvatar.tsx      36px avatar circle (initials or photo)
   | + ProfileOverlay.tsx     full-screen profile sheet (3-tab: Me/Trip/About)
   | + Avatar.tsx             photo-or-initials avatar component
   | + AvatarCropper.tsx      canvas crop overlay for avatar upload
   | + ActionBar.tsx          floating slot above bottom nav
   | + CityList.tsx           city index rows + sort + sticky column header
   | + CityMap.tsx            live dark Google Map + venue pins + own dot
   | + Calendar.tsx           MonthNav, PersonalCalendar, HeatCalendar
   | + VenueSheet.tsx         pin-tap venue detail sheet
   | + VoterProfileSheet.tsx  read-only voter profile bottom sheet
   | + NamePrompt.tsx         identity modal (create or sign-in)
   | + Dialog.tsx             centered modal over scrim
   | + BottomSheet.tsx        slide-up sheet
   | + Icon.tsx               Material Symbol primitive
   | + ImageViewer.tsx        full-screen image overlay + download
   | + ErrorBoundary.tsx      class-based error boundary with fallback
   | + FieldError.tsx         inline form validation error
   | + RoleBadge.tsx          role indicator chip (crown/shield)
   | + Stars.tsx              star rating display
   | + Switch.tsx             toggle switch
   | + Toast.tsx              ephemeral notification
   | + ServiceWorkerRegistrar.tsx  SW registration on mount
   | + TripSetupPanel.tsx     trip config (shared: admin + moderator)
   | + TripResetsPanel.tsx    reset votes/availability (shared)
   | + ActiveLocationsPanel.tsx  active location oversight (shared)
   | + chat/
   | | + index.ts             chat component exports
   | | + MessageBubble.tsx    chat message bubble + reactions + replies
   | + profile/
   | | + index.ts             profile tab component exports
   | | + ProfileBody.tsx      profile overlay body (tab router)
   | | + IdentityGate.tsx     unregistered state gate
   | | + IdentityCard.tsx     confirm-then-change identity form
   | | + RoleCard.tsx         role display + permissions
   | | + VoteCard.tsx         my vote summary
   | | + AvailabilityCard.tsx my availability summary
   | | + LocationCard.tsx     location sharing toggle + status
   | | + NotificationsCard.tsx push notification toggle
   | | + NotesSection.tsx     voter notes (About tab)
   | | + TripStatusCard.tsx   trip status toggle (going/remote/out)
   | | + SwitchIdentityRow.tsx sign-out action
   | + ui/
   |   + INDEX.md             UI component documentation
   |   + DateBadge.tsx        date display badge
   |   + FloatingActionButton.tsx  FAB component
   |   + GlassCard.tsx        translucent card
   |   + GlassIconButton.tsx  translucent icon button
   |   + ProgressBar.tsx      progress indicator
   |   + SettingToggle.tsx    setting row with toggle
   |   + StatusChip.tsx       status indicator chip
   + hooks/
   | + useGroupData.tsx       THE data layer: fetch + realtime + optimistic
   | |                        mutations + localStorage fallback
   | + useVotes.ts            derived: city ranking, hotel tallies, myCityId
   | + useAvailability.ts     derived: my calendar, per-date breakdowns, heat
   | + useTrip.ts             trip entity: v2_trip + hotels + assignments + members
   | + useTripData.tsx        TripDataProvider context wrapper
   | + useLocations.ts        v2_locations realtime + sharing + mutes
   | + useChat.ts             v2_messages + reactions + reads + pagination
   | + useVenues.ts           v2_hotels/bars/food per city (session-cached)
   | + useHopperz.ts          crew members: voters + locations + roles + notes
   | + useVoterNotes.ts       v2_voter_notes CRUD
   | + useCamera.ts           getUserMedia, flip, capture, retake
   | + usePushNotifications.ts  push subscription management
   | + useAdminHold.ts        long-press navigation hook
   + lib/
   | + supabase.ts            lazy client, env fallbacks, safeSelect, row types
   | + identity.ts            bh2-voter-id/name/pin-color/avatar-url helpers
   | + auth.ts                cookie mirrors, wing state, isAuthenticated
   | + roles.ts               RBAC: getRoleForVoter, isSuperAdmin, permissions
   | + superadmin.ts          hardcoded superadmin seeds + ensureSuperadmin
   | + colors.ts              25-color pool + assignColor + contrastColor
   | + venues.ts              Venue UI model, CityVenues, EMPTY_VENUES
   | + maps.ts                Maps loader, dark style, BASE_MAP_OPTIONS
   | + format.ts              date keys, month grid, labels
   | + chat.ts                MessageRow types, helpers, GALLERY_PAGE_SIZE
   | + storage.ts             uploadChatImage, uploadAvatar (hoppz-media bucket)
   | + push.ts                client push helpers (isPushSupported, etc.)
   | + scrollLock.ts          counter-based body scroll lock
   + data/
     + types.ts               City, Coords, VenueKind
     + cities.ts              27 cities + hardcoded walkability research
```

## Supabase schema (verified live 2026-06-30)

### User data tables (in `supabase_realtime` publication)

```sql
-- Core identity
CREATE TABLE v2_voters (
  voter_id     uuid NOT NULL PRIMARY KEY,
  name         text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 20),
  display_name text,
  pin_hash     text,
  pin_plain    text,
  pin_color    text NOT NULL DEFAULT '#FF8C42',
  is_active    boolean NOT NULL DEFAULT true,
  avatar_url   text,
  role         text CHECK (role IN ('moderator', 'super_admin')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- City vote (one per person)
CREATE TABLE v2_city_votes (
  voter_id   uuid NOT NULL REFERENCES v2_voters(voter_id),
  city_id    text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (voter_id)
);

-- Hotel preference (one per person per city)
CREATE TABLE v2_hotel_votes (
  voter_id       uuid NOT NULL REFERENCES v2_voters(voter_id),
  city_id        text NOT NULL,
  hotel_place_id text NOT NULL,
  hotel_name     text NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (voter_id, city_id)
);

-- Date availability
CREATE TABLE v2_availability (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id   uuid NOT NULL REFERENCES v2_voters(voter_id),
  date       date NOT NULL,
  status     text NOT NULL DEFAULT 'available'
             CHECK (status IN ('available', 'unavailable')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(voter_id, date)
);

-- Live location sharing
CREATE TABLE v2_locations (
  voter_id      uuid PRIMARY KEY REFERENCES v2_voters(voter_id) ON DELETE CASCADE,
  display_name  text NOT NULL,
  lat           float8 NOT NULL,
  lng           float8 NOT NULL,
  pin_color     text NOT NULL DEFAULT '#FF8C42',
  sharing_since timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  muted_ids     uuid[] NOT NULL DEFAULT '{}',
  session_id    uuid
);
```

### Chat tables

```sql
CREATE TABLE v2_messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id    uuid NOT NULL,
  content     text,
  image_url   text,
  reply_to_id uuid,
  is_deleted  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE v2_message_reads (
  message_id uuid NOT NULL,
  voter_id   uuid NOT NULL,
  read_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, voter_id)
);

CREATE TABLE v2_message_reactions (
  message_id uuid NOT NULL,
  voter_id   uuid NOT NULL,
  emoji      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, voter_id)
);
```

### Push notifications

```sql
CREATE TABLE v2_push_subscriptions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id   uuid NOT NULL,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Voter notes (profile About tab)

```sql
CREATE TABLE v2_voter_notes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id   uuid NOT NULL,
  content    text NOT NULL CHECK (char_length(content) <= 280),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Trip entity

```sql
CREATE TABLE v2_trip (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  status     text NOT NULL DEFAULT 'planning'
             CHECK (status IN ('planning', 'upcoming', 'active')),
  city_id    text,
  start_date date,
  end_date   date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE v2_trip_hotels (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id    uuid NOT NULL,
  hotel_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE v2_trip_hotel_assignments (
  voter_id      uuid NOT NULL,
  trip_hotel_id uuid NOT NULL,
  PRIMARY KEY (voter_id, trip_hotel_id)
);

CREATE TABLE v2_trip_members (
  voter_id    uuid NOT NULL PRIMARY KEY,
  trip_status text NOT NULL DEFAULT 'on_trip'
              CHECK (trip_status IN ('on_trip', 'remote', 'out')),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### Curated venue tables (read-only to the app, anon SELECT only, NOT in realtime)

```sql
-- v2_hotels (56 rows)
-- id uuid PK, city_id, name, address, descriptor, stars int,
-- price_range text, distance_note text?, lat float8?, lng float8?

-- v2_bars (75 rows)
-- id uuid PK, city_id, name, address, descriptor, has_food bool?,
-- lat float8?, lng float8?

-- v2_food (75 rows)
-- id uuid PK, city_id, name, address, descriptor, has_bar bool?,
-- lat float8?, lng float8?
```

All v2_* tables have RLS enabled. User tables use anon SELECT/INSERT/UPDATE/DELETE.
Venue tables use anon SELECT only.

### Storage

`hoppz-media` bucket (public) — chat image uploads and avatar uploads via
`lib/storage.ts`.

## localStorage contract

| Key | Type | Purpose |
|---|---|---|
| `bh2-voter-id` | uuid | Current voter identity |
| `bh2-voter-name` | string | Display name cache |
| `bh2-pin-color` | hex string | Auto-assigned pin color cache |
| `bh2-avatar-url` | string \| null | Avatar URL cache |
| `bh2-auth` | "true" | Auth cookie mirror |
| `bh2-last-wing` | "plan" \| "social" | Last visited wing |
| `bh2-city-vote-cache` | CityVoteRow | City vote offline cache |
| `bh2-hotel-vote-cache` | Record<cityId, HotelVoteRow> | Hotel vote offline cache |
| `bh2-avail-cache` | {date: status} | Availability offline cache |
| `bh2-city-sort` | "distance" \| "walk" \| "name" \| "state" | City list sort preference |
| `bh2-muted-ids` | JSON uuid[] | Location mute list |
| `bh2-sharing-preference` | "true" \| "false" | Location sharing choice |
| `bh2-session-id` | uuid | Single-device broadcast lock |
| `bh2-hopperz-view` | "list" \| "grid" | Hopperz view toggle |
| `bh2-live` | timestamp | Realtime connection state |
| `bh2-distance-unit` | string | Distance unit on locate |

Cookies (middleware-readable mirrors, not security boundaries):
- `bh2-auth` — authentication flag
- `bh2-role` — RBAC role
- `bh2-voter-id` — voter UUID (superadmin bypass)

## Design system

Dark ONLY. Forever. No light mode, no theme toggle, no `prefers-color-scheme`
handling, no theme persistence. All tokens live on `:root` in `globals.css`
(`color-scheme: dark`).

Colors:

```
--bg #0A0D14 . --surface #12161F . --surface-raised #1A1F2B
--border #252B3A . --border-strong #323A4F
--ink #E8ECF4 . --ink-muted #8892A4 . --ink-dim #4A5468
--accent #FF8C42 . --accent-dim rgba(255,140,66,.15)
--green #34D399 / --green-dim . --red #F87171 / --red-dim
--grade-a #34D399 . --grade-b #86EFAC . --grade-c #FCD34D
--grade-d #FB923C . --grade-f #F87171
```

- Typography (Manrope): Display 28/800 (`text-display`); Title 17/700
  (`text-title`); Body 15/500 (`text-base`); Label 12/600/uppercase (`.label`);
  Meta 13/400 (`text-meta`). Min rendered text 13px (exceptions: 12px Label,
  11px heat-map fractions). `font-variant-numeric: tabular-nums` on `body`.
- Radius: 12px cards (`rounded-card`), 8px buttons/inputs (`rounded-btn`),
  6px chips/badges (`rounded-chip`), `rounded-full` only for grade badges,
  voter tags, and legend dots.
- Spacing: 4px grid. Cards 16px padding. List rows >=56px; city index rows
  >=72px. Sections 24px gap (`gap-6`). Page padding 16px (`px-4`).
- Every interactive element >=44px tall (`h-11`/`min-h-11`).
- Bottom nav 64px + safe-area inset.
- Transitions 160ms ease; `prefers-reduced-motion` collapses all animation.
- Governing principle: design for 0.08 BAC — one thumb, dim bar, ten seconds.

## Google Maps setup

- Loaded with `@googlemaps/js-api-loader` (`weekly`, no extra libraries) in
  `lib/maps.ts`; key from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with baked public
  fallback. The key needs the Maps JavaScript API only.
- City detail map: 280px mobile, 380px >=600px. `gestureHandling: 'cooperative'`,
  `disableDefaultUI`, `clickableIcons: false`.
- Single dark style: land #0A0D14, roads #1A1F2B, labels --ink-dim, no POI/transit.
- Pin coords from curated `lat`/`lng` columns. Null = no pin, silently skipped.
  Markers diffed by venue id. Zoom-gated OverlayView name labels (zoom >= 15).
- Locate map: full-bleed, Ralston center, zoom 8, greedy gestures.
- Pin sizes: venue 18px (scale 9), your dot 22px (scale 11), locate person
  14px circle. Own dot uses bh2-pin-color fill + contrast initials.

## Data model

```ts
interface City {
  id: string; name: string; state: string;
  miles: number; drive: string;            // from Ralston, NE
  walkScore: number;                       // 0-100, hardcoded research
  walkGrade: string;                       // "A+"..."F", hardcoded research
  district: string;                        // social gathering district name
  mapCenter: Coords; mapZoom: number;
}
type VenueKind = "hotel" | "bar" | "food";
interface Venue {
  id; kind; city_id; name; address; descriptor;
  stars?; price_range?; distance_note?;   // hotels
  has_food?;                              // bars
  has_bar?;                               // food
  lat: number | null; lng: number | null;
}
```
