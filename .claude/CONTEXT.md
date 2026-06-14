# Hoppz — Project Context
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
- `app/src/hooks/` — data hooks (`useGroupData` is the shared provider),
  plus `useAdminHold` (3s hold → admin).
- `app/src/lib/` — `identity`, `auth`, `supabase`, `maps`, `venues`, `colors`, …
- `app/src/data/` — `cities.ts` (the walkability index) + `types.ts`.
- `app/public/` — PWA assets (manifest, service worker, offline page, icons).

### File map — shell & nav components
- `components/AppShell.tsx` — root-level shell (bare on `/login`/`/`/`/social/*`,
  TopBar-only on `/home` (suppressNav), TopBar + PlanNav on plan routes,
  TopBar-only elsewhere). Wraps all pages via root layout. Social routes
  bypass AppShell entirely — HopShell handles chrome.
- `components/TopBar.tsx` — sticky wordmark bar: "Hoppz" left, trip status
  pill center (upcoming: countdown, active: "On Trip"), ProfileAvatar right.
  Hidden on `/plan/city/*` and `/plan/admin` (pages with own headers).
  Rendered by both AppShell and HopShell.
- `components/PlanNav.tsx` — plan-wing nav: Cities, Availability, Results,
  Hopperz, Hopp. Flex row with vertical divider before cross-wing Hopp tab.
  Mobile bottom bar + desktop 80px rail (≥840px). Admin long-press on Results
  AND Hopp tabs. Only renders on `/plan/*`.
- `components/HopNav.tsx` — hopp-wing nav: Chat, Camera, Gallery, Locate, Plan.
  Flex row with vertical divider before cross-wing Plan tab.
  Admin long-press on Plan tab.
- `components/HopShell.tsx` — hopp-wing shell: TopBar + children + HopNav.
  Used by `social/layout.tsx`.
- `components/RoleBadge.tsx` — role badge pill (sm for inline lists, md for
  profile hero). Renders crown/Admin for super_admin, shield/Moderator for
  moderator. Returns null for null role.
- `components/VoterProfileSheet.tsx` — BottomSheet showing read-only voter
  profile: avatar, name, role badge, locate button (if sharing), about notes,
  moderator toggle (super admin only).
- `hooks/useAdminHold.ts` — hold hook shared by PlanNav, HopNav, and
  ProfileAvatar. Accepts optional holdMs param (default 3000ms).
- `hooks/useHopperz.ts` — data hook for Hopperz screen. Merges voters,
  locations, roles, and note counts into HopperzVoter[]. Sorted: you first,
  then A–Z. Trip status per voter (on_trip/remote/out), sorted by status group.
- `hooks/useTrip.ts` — trip data hook: trip state, hotels, assignments,
  members, realtime (channel "hoppz-trip"), mutations, date-based
  status auto-transition. Single source of truth for all trip data.
- `hooks/useTripData.tsx` — TripDataProvider + useTripData context hook.
  Mounted in layout.tsx inside GroupDataProvider.
- `hooks/useChat.ts` — chat data hook: messages, reactions, reads, realtime,
  optimistic sends, pagination, markRead. Channel "hoppz-chat".
- `hooks/useCamera.ts` — camera hook: getUserMedia, flip, capture (canvas →
  JPEG data URL), retake, permission/error states. Returns videoRef.
- `lib/chat.ts` — chat types (MessageRow, ReactionRow, ReadRow), helpers
  (formatMessageTime, formatDayDivider, isDifferentDay, shouldGroup),
  constants (CHAT_PAGE_SIZE = 50, GALLERY_PAGE_SIZE = 30, EMOJI_REACTIONS).
- `lib/storage.ts` — Supabase storage helper. uploadChatImage(file) uploads
  to hoppz-media bucket (path: chat/{timestamp}-{uuid}.{ext}), returns
  UploadResult (ok+url or error). 10MB max, never throws. uploadAvatar(blob,
  voterId) uploads to avatars/{voterId}.jpg with upsert.
- `lib/roles.ts` — Role system: getRoleForVoter, isSuperAdmin, isModerator,
  role labels/badges, moderator permissions/restrictions constants.
- `components/Avatar.tsx` — Unified avatar component (photo or initials
  fallback). Used by ProfileAvatar, ProfileOverlay, chat SenderAvatar,
  Hopperz page, and VoterProfileSheet.
- `components/AvatarCropper.tsx` — Canvas-based avatar crop overlay. Pinch
  to zoom, drag to pan, circular mask, exports 400x400 JPEG.
- `components/ProfileAvatar.tsx` — top-right avatar button. Moderators
  (not super admin) get a 500ms long-press → /plan/moderator via useAdminHold(500).
- `components/TripSetupPanel.tsx` — shared trip setup UI (city, dates,
  hotels, assignments). Props: canClear (true for admin, false for mod).
  Used by both /plan/admin and /plan/moderator.
- `components/ActiveLocationsPanel.tsx` — shared active locations list
  with force-expire. Self-contained (own fetch). Used by admin + moderator.
- `components/TripResetsPanel.tsx` — shared reset votes / availability
  buttons with confirmation dialogs. Used by admin + moderator.
- `lib/push.ts` — Client-side push notification helpers: isPushSupported,
  getNotificationPermission, subscribeToPush, getExistingSubscription,
  unsubscribeFromPush, extractSubscriptionKeys. VAPID key from env var.
- `lib/pushServer.ts` — Server-side push utility stubs: sendPushToVoter,
  sendPushToAll. Typed but not functional until VAPID keys are configured
  and web-push is installed.
- `hooks/usePushNotifications.ts` — React hook: supported, permission,
  subscribed, requesting, requestPermission(), unsubscribe(). Saves/removes
  subscriptions in v2_push_subscriptions via Supabase.
- `components/ImageViewer.tsx` — full-screen image viewer overlay. Fixed
  inset-0, close/download buttons, escape key, body scroll lock, fade-in.
- `components/Toast.tsx` — ephemeral notification for upload errors.
  Fixed above HopNav, auto-dismiss after duration, fade in/out.

---

## Routes & Navigation (dual-wing shell)
Cold open hits `/` → client checks `isAuthenticated()`:
- **not authenticated → `/login`** · **authenticated → `/home`** (always).

- `/login` — full-screen sign-in / create screen. No AppShell chrome. Sign In is
  the default mode (free-form first name + last initial + PIN, matched
  case-insensitively against v2_voters.display_name). Create new account is the
  secondary option. "Add to Home Screen" section below a divider: Android
  (`beforeinstallprompt`) + iOS (inline Safari instructions), both hidden in
  standalone mode. On success → `setLastWing("plan")` → `/home`.
- `/home` — trip dashboard. AppShell header only (no bottom nav, suppressed
  explicitly). Four sections: trip status hero (planning/upcoming/active),
  quick stats row (votes, leading city, best date, on-trip count), who's in
  (avatar row of on_trip members + remote sub-row), quick actions (2x2 grid:
  vote, availability, chat, locate). Own bottom bar with Plan and Hopp entry
  points (fixed, same dimensions as wing nav bars).
- **Plan wing — `/plan/*`** (`plan/layout.tsx` sets last wing = plan):
  - `/plan` → redirects to `/plan/cities`.
  - `/plan/cities`, `/plan/city/[id]`, `/plan/calendar`, `/plan/board`,
    `/plan/hopperz`, `/plan/admin` (3s-hold Results or Hopp tab to reach admin),
    `/plan/moderator` (500ms long-press on own avatar for moderators).
  - PlanNav renders 5 bottom tabs (Cities / Availability / Results / Hopperz / Hopp)
    as a flex row with a vertical divider before the cross-wing Hopp tab.
    + the 80px desktop rail at ≥840px. Hopp is a cross-wing link to `/social`
    (sports_bar icon, --ink-dim color) — it does not get active highlight on
    /plan/* routes. Admin long-press is on both the Results tab and the Hopp tab.
    The wordmark bar (TopBar) has only the wordmark left and avatar right.
- **Hopp wing — `/social/*`** (`social/layout.tsx` sets last wing = social):
  - `/social` (Chat), `/social/camera` (Camera — full-screen, own layout, no HopShell),
    `/social/gallery` (photo gallery — 3-col grid, day groups, jump-to-date),
    `/social/locate` (live group map — accepts `?focus=voter_id` deep link
    from Hopperz page to fly to a specific person on mount).
  - HopShell renders TopBar + HopNav bottom bar (Chat / Camera / Gallery / Locate / Plan)
    as a flex row with a vertical divider before the cross-wing Plan tab.
    Camera route has its own layout.tsx that bypasses HopShell (full-bleed viewfinder).
  - Camera context: `?from=chat` param → post-capture uploads and navigates to
    `/social?pendingImage=...`. Standalone mode offers Send to Chat or Save to Device.
  - Chat page reads `pendingImage` query param on mount to auto-send camera photos.
    Plan is a cross-wing link to `/plan` (list_alt icon) — it does not get
    active highlight on /social/* routes. Admin long-press is on the Plan tab.

AppShell (`components/AppShell.tsx`) is global (root layout) and pathname-aware:
bare on `/login`, `/`, and `/social/*`; TopBar everywhere else except pages with
their own sticky header (`/plan/city/*`, `/plan/admin`); PlanNav only on `/plan/*`.
On `/social/*`, AppShell passes children through; the HopShell (via social layout)
provides its own TopBar + HopNav — no double rendering.

**Auth guard:** `src/middleware.ts` matches `/home`, `/plan/:path*`,
`/social/:path*` and redirects to `/login` when the `bh2-auth` cookie is absent.
It's a **soft guard** (prevents blank protected screens), not security — the real
identity check stays localStorage-based.

---

## Identity & Auth
- Per-device identity in localStorage, backed by a `v2_voters` row whose 2-digit
  PIN (bcrypt hash) lets the same person sign in from any device.
- `lib/identity.ts` owns `bh2-voter-id` / `bh2-voter-name` / `bh2-pin-color` /
  `bh2-avatar-url`. `clearIdentity()` (sign-out) also clears the `bh2-auth` cookie.
- `lib/auth.ts` is the soft-auth layer: `isAuthenticated()` (true when id + name
  are stored; mirrors the `bh2-auth` presence cookie as a side effect),
  `getLastWing()` / `setLastWing()`, `mirrorAuthCookie()`, `clearAuthCookie()`.

### localStorage / cookie contract
All keys are product contract:
- `bh2-voter-id` — voter uuid.
- `bh2-voter-name` — display name ("Nick B").
- `bh2-pin-color` — cached auto-assigned avatar color.
- `bh2-avatar-url` — cached avatar image URL for fast initial render.
- `bh2-last-wing` — `"plan"` | `"social"`; written on entering either wing.
- `bh2-city-sort` — cities sort preference.
- `bh2-city-vote-cache` / `bh2-hotel-vote-cache` / `bh2-avail-cache` — silent
  offline fallback caches mirroring this voter's writes.
- `bh2-muted-ids` / `bh2-sharing-preference` / `bh2-session-id` — location sharing.
- `bh2-hopperz-view` — `"list"` | `"grid"`; Hopperz page view toggle preference.
- **`bh2-auth`** — *cookie*, value `"1"`, session-scoped, `SameSite=Lax`. Set by
  `isAuthenticated()`/`mirrorAuthCookie()`, cleared by `clearIdentity()`. Read by
  the middleware (existence only).

---

## PWA
- `public/manifest.json` — name/short_name "Hoppz", `start_url` "/",
  `display` standalone, portrait, bg/theme `#0A0D14`, icon placeholders
  (192/512/180; drop real PNGs in `public/icons/`, see its README).
- `public/sw.js` — cache `hoppz-v1`. Navigations network-first with
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
  `is_active` (admin soft-disable), `avatar_url` (profile photo URL),
  `role` ('moderator' | null), `updated_at`.
- `v2_voter_notes` — `id` uuid PK, `voter_id` FK→v2_voters, `content` text,
  `sort_order` integer, `created_at` timestamptz. Personal "about me" notes.
- `v2_city_votes` — one row per voter (`voter_id`, `city_id`, `updated_at`).
- `v2_hotel_votes` — one per voter per city (`hotel_place_id`, `hotel_name`, …).
- `v2_hotels` / `v2_bars` / `v2_food` — curated venue rows (`DbVenueRow`), the
  canonical venue source per `city_id`.
- `v2_availability` — `voter_id`, `date` (YYYY-MM-DD), `status`
  available/unavailable; no row = no answer.
- `v2_locations` — live shares, 72h lifetime, `muted_ids[]`, `session_id`
  broadcast lock.
- `v2_messages` — `id` uuid PK, `voter_id` FK→v2_voters, `content` text
  (nullable), `image_url` text (nullable), `reply_to_id` FK→v2_messages
  (nullable), `is_deleted` boolean default false, `created_at` timestamptz.
- `v2_message_reads` — `message_id` FK→v2_messages, `voter_id` FK→v2_voters,
  `read_at` timestamptz. PK (message_id, voter_id).
- `v2_message_reactions` — `message_id` FK→v2_messages, `voter_id` FK→v2_voters,
  `emoji` text, `created_at` timestamptz. PK (message_id, voter_id).
- `v2_push_subscriptions` — `id` uuid PK, `voter_id` FK→v2_voters (cascade),
  `endpoint` text (unique), `p256dh` text, `auth` text, `user_agent` text,
  `created_at`/`updated_at` timestamptz. One subscription per endpoint; a voter
  can have multiple devices.
- `v2_trip` — singleton row: `id`, `status` (planning/upcoming/active),
  `city_id` nullable FK to cities data, `start_date` / `end_date` (YYYY-MM-DD,
  nullable), `created_at`, `updated_at`. Status auto-transitions based on dates.
- `v2_trip_hotels` — `id`, `trip_id` FK→v2_trip, `hotel_name`, `sort_order`,
  `created_at`. Confirmed hotels for the upcoming trip.
- `v2_trip_hotel_assignments` — `voter_id`, `trip_hotel_id` FK→v2_trip_hotels.
  One hotel per voter.
- `v2_trip_members` — `voter_id` PK, `trip_status` (on_trip/remote/out),
  `updated_at`. Default "on_trip" when no row exists.

Storage buckets:
- `hoppz-media` — public bucket for chat image uploads. Path pattern:
  `chat/{timestamp}-{uuid}.{ext}`. 10MB max per file. Used by
  `lib/storage.ts` uploadChatImage.

---

## Non-Negotiable Rules
1. Never break existing features — every session ends with all prior
   functionality working. Mobile-first; think at 375px first.
2. Supabase is shared data only; everything else is localStorage. Supabase
   failures fall back silently — never an error toast.
3. Material Symbols + Manrope only. No emoji. Inline SVG icons only for platform
   logos (Android/Apple on the login install section).
4. Dark only. Use the semantic tokens; no inline hex, no new radii.
5. `cities` array is variable in length — never hardcode a count.
6. The plan-wing pages and their hooks/lib are stable; don't refactor them
   without cause.

---

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — VAPID public key for Web Push (client-side)
- `VAPID_PRIVATE_KEY` — VAPID private key (server-side only)
- `VAPID_MAILTO` — VAPID contact email (server-side only)
- `NEXT_PUBLIC_SUPER_ADMIN_ID` — voter_id of the permanent super admin

---

## Migrations Log
- `create_v2_push_subscriptions` — v2_push_subscriptions table with RLS + index (Session E)

---

## Current State
Last updated: 2026-06-14
Last change: **Full Polish Pass — Known Issues + UX Fixes.**
- Verified and fixed all known UX issues across login, camera, chat, nav, and profile.
- Login: Android install button opacity fixed (opacity-50 when disabled).
- TopBar: trip status pip labels fixed ("Today!", "d away" suffix).
- CONTEXT.md: localStorage contract updated (added bh2-hopperz-view).
- All other items verified correct as-is (sign-in lookup, camera controls,
  chat scroll, nav dividers, AppShell, profile tabs, avatar fallback, Supabase
  voter select, moderator routing, Hopperz view persistence).
Next up: Wire push notification triggers (new message, reaction, etc.).
