# ARCHITECTURE

## Stack decisions and why

| Decision | Why |
| --- | --- |
| Next.js 14 App Router | File-system routing for dual-wing layout; static pre-render of all 27 city pages; Vercel-native. |
| All interactive views are client components | Every view consumes Supabase realtime; RSC can't hold subscriptions. Server components exist only as thin wrappers (`plan/city/[id]/page.tsx` for `generateStaticParams`/`notFound`). |
| One provider (`GroupDataProvider`) owns core remote state | One websocket, one fetch cycle, one fallback path. Pages consume derived views (`useVotes`, `useAvailability`) that are pure `useMemo` projections. `TripDataProvider` layers on trip entity state. |
| Refetch-on-change realtime (not row patching) | Tables are tiny (a few hundred rows max). On any postgres_changes event we refetch the affected tables (debounced 250ms). Zero cache-invalidation bugs by construction. |
| Optimistic writes + write-through caches | Taps must feel instant on a phone. State updates synchronously, caches mirror the write, Supabase follows; a later refetch converges everyone. |
| Static data in a TS module (`data/cities.ts`) | The city list changes by commit, not at runtime. Type-checked, tree-shaken, zero loading state. |
| Dual-wing architecture (`/plan/*` + `/social/*`) | Plan wing handles trip planning (cities, voting, calendar, results, crew). Social wing handles real-time interaction (chat, camera, gallery, locate). Each wing has its own nav bar and layout shell. |
| PWA with service worker | Offline shell fallback, push notification foundation, installable to home screen on mobile. |
| RBAC via roles column + middleware | `v2_voters.role` (super_admin / moderator) gates admin and moderator routes at the edge. Cookie mirrors (`bh2-auth`, `bh2-role`, `bh2-voter-id`) provide middleware-readable auth without server sessions. |
| Classic `google.maps.Marker` + custom `Symbol` paths | Pins differentiate by shape and color. AdvancedMarker requires a cloud mapId which conflicts with local JSON styling. |
| Dark only — tokens directly on `:root` | One palette, no theme state, no boot script, no flash. `color-scheme: dark` and a single `themeColor`. |
| No UI libraries | Spec mandate; also keeps every interactive element >=44px tall without fighting a kit. |

## Data flow

```
                       +------------------------------+
                       |   Supabase (v2_* tables)     |
                       |  postgres_changes - realtime  |
                       +------+-----------^-----------+
                       fetch  |           | upserts/deletes
                              v           |
            +---------------------------------+   mirror   +------------------+
            |   GroupDataProvider (context)    |<---------->|  localStorage    |
            |  voters . cityVotes .           |  write-thru|  bh2-* caches    |
            |  hotelVotes . availability      |  + fallback+------------------+
            |  identity . profile . signOut   |
            +-------+-----------------+-------+
             useVotes (memo)     useAvailability (memo)
                    |                 |
            +---+---+---+---+---+----+----+---+
            v   v   v   v   v   v    v    v   v
         Home Plan  Board Calendar Hopperz CityDetail
                                               |
                                               +-> CityMap (live map, venue pins)
                                               +-> VenueSheet (pin tap detail)

            +----------------------------+
            |   TripDataProvider         |
            |   useTrip (v2_trip_*)      |
            +---+----+---+---+-----------+
                v    v   v   v
            TopBar Home Admin Moderator ProfileOverlay

            +--------------------------+
            |   useChat (v2_messages)  |
            |   reactions + reads      |
            +----+-----+----+---------+
                 v     v    v
             Chat  Gallery  Camera

            +----------------------------+
            |   useLocations (v2_locations) |
            +---+--------+-----------+
                v        v           v
            Locate   ProfileOverlay  Home
```

## Component hierarchy

```
RootLayout (fonts, providers, ErrorBoundary, AppShell, IdentityWatcher)
+- GroupDataProvider
   +- TripDataProvider
      +- AppShell (TopBar + PlanNav, scoped to /plan/*)
      |  +- TopBar (wordmark + trip pill + ProfileAvatar)
      |  +- PlanNav (Cities, Availability, Results, Hopperz, Hopp)
      |
      +- /plan/* routes
      |  +- cities/page.tsx - CityList + ActionBar (sort pill)
      |  +- city/[id]/CityDetail.tsx - CityMap + venue tabs + ActionBar (vote CTA)
      |  +- calendar/page.tsx - Calendar (personal tri-state)
      |  +- board/page.tsx - Results (top cities, hot dates, hotel prefs)
      |  +- hopperz/page.tsx - crew list/grid + VoterProfileSheet
      |  +- admin/page.tsx - super admin (users, trip setup, resets, danger zone)
      |  +- moderator/page.tsx - moderator (crew mgmt, trip setup, resets)
      |
      +- HopShell (TopBar + HopNav, scoped to /social/*)
      |  +- HopNav (Chat, Camera, Gallery, Locate, Plan)
      |
      +- /social/* routes
      |  +- page.tsx (Chat) - message list + input bar + reactions + replies
      |  +- camera/page.tsx - full-screen camera capture + send
      |  +- gallery/page.tsx - photo grid + pagination + jump-to-date
      |  +- locate/page.tsx - live map + people strip + location options
      |
      +- /home - dashboard (trip anchor, who's going, my status, actions)
      +- /login - sign-in / create account + install prompts
      +- ProfileOverlay (full-screen sheet from avatar tap, 3-tab: Me/Trip/About)
      +- NamePrompt (identity modal: create or sign-in)
```

## Hook responsibilities

- **useGroupData** (the only core stateful hook): identity bootstrap, four-table fetch
  (voters/cityVotes/hotelVotes/availability), realtime channel, focus refetch,
  optimistic mutations (setCityVote/setHotelPref/setAvailability/createIdentity/
  signIn/updateProfile/signOut), cache mirroring/fallback. Throws if used outside
  the provider.
- **useVotes**: projection -> city ranking, per-city hotel ranking, leader, my vote.
  Group tallies exclude is_active === false voters.
- **useAvailability**: projection -> my date map, per-date breakdowns, heat ratio,
  best upcoming date. Group views exclude inactive voters. No IO.
- **useTrip**: v2_trip + v2_trip_hotels + v2_trip_hotel_assignments + v2_trip_members
  fetch + realtime. Trip status sync, date/city/hotel mutations, member status.
- **useTripData**: TripDataProvider context wrapper for useTrip.
- **useLocations**: v2_locations realtime + 30s clock. Module-scoped shared store
  (rows, mute list, in-flight intent). Sharing toggle, mute/unmute, amDisabled
  guard, single-device broadcast via session_id.
- **useChat**: v2_messages + reactions + reads. Pagination, optimistic send/delete,
  realtime subscription, markRead via IntersectionObserver.
- **useVenues**: v2_hotels (stars >= 3) / v2_bars / v2_food per city. Session-cached,
  the only venue-list source.
- **useHopperz**: voters + locations + roles + note counts -> HopperzVoter[].
- **useVoterNotes**: v2_voter_notes CRUD for profile About tab.
- **useCamera**: getUserMedia, flip, canvas capture, retake, permission/error states.
- **usePushNotifications**: push subscription management via v2_push_subscriptions.
- **useAdminHold**: 3s long-press hook for admin/moderator navigation triggers.

## File naming conventions

- Components: PascalCase `.tsx`, one main export per file, co-located helpers allowed.
- Hooks: `useX.ts(x)` — `.tsx` only when the file contains JSX (the provider).
- Lib: lowercase nouns (`maps.ts`, `format.ts`, `roles.ts`, `venues.ts`).
- Routes follow App Router conventions; client page bodies live next to their
  server wrapper (`CityDetail.tsx` beside `page.tsx`).

## Import rules

- Always `@/` alias, never relative `../../`.
- `data/` imports nothing from `lib/`, `hooks/`, or `components/` (pure data).
- `lib/` may import from `data/` only; never from hooks/components.
- `hooks/` may import `lib/` + `data/`; never components.
- `components/` may import anything except pages; pages import anything.
- Nothing imports from `app/` except Next itself.
