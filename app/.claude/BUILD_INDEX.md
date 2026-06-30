# BUILD INDEX — what to read per task

Read CONTEXT.md first in every session. Then read ONLY what the task needs:

## INVARIANT: the is_active filter applies to ALL group queries

Voters with `v2_voters.is_active = false` (admin soft-disable) are excluded
from EVERY group-facing view — vote counts, voter tags, hotel tallies, the
availability heat map / hot dates / breakdowns / roster denominator, the
location map, and every people list. The pattern: the roster select carries
`is_active`; group aggregations drop rows whose voter is KNOWN inactive
(`v.is_active === false` — an unreachable roster never hides anyone);
personal-facing values (own vote, own calendar, own profile) are NEVER
filtered. Any NEW group-facing query must apply the same filter. Disabled
users keep full app access (their writes store but don't count) and their
location sharing is locked off (useLocations.amDisabled). No data is ever
deleted by disable/enable.

## Task: Edit city data (walk scores, grades, districts, miles, new city)
READ: src/data/cities.ts (and src/data/types.ts if shape changes)
DO NOT READ: anything else. Walkability is hardcoded research — never add math.

## Task: Fix venue lists / venue display
READ: src/hooks/useVenues.ts, src/lib/venues.ts, src/lib/maps.ts
DO NOT READ: data files (venues never come from cities.ts), calendar code

## Task: Fix the map / pins (city detail)
READ: src/components/CityMap.tsx, src/lib/maps.ts, src/components/VenueSheet.tsx
DO NOT READ: data files, supabase files, calendar code

## Task: Fix city voting or hotel preference
READ: src/hooks/useGroupData.tsx, src/hooks/useVotes.ts,
src/app/plan/city/[id]/CityDetail.tsx, src/components/CityList.tsx
DO NOT READ: map internals, calendar code

## Task: Fix availability / personal calendar / heat map
READ: src/hooks/useGroupData.tsx, src/hooks/useAvailability.ts,
src/components/Calendar.tsx, src/app/plan/calendar/page.tsx,
src/app/plan/board/page.tsx, src/lib/format.ts
DO NOT READ: data files, map components, vote code

## Task: Fix The Board (standings, hot dates)
READ: src/app/plan/board/page.tsx, src/hooks/useVotes.ts,
src/hooks/useAvailability.ts, src/components/Calendar.tsx
DO NOT READ: map components, data files

## Task: Fix Supabase / realtime / offline fallback
READ: src/lib/supabase.ts, src/hooks/useGroupData.tsx, CONTEXT.md (schema section)
DO NOT READ: components, data files

## Task: Identity / name prompt / login
READ: src/lib/identity.ts, src/lib/auth.ts, src/components/NamePrompt.tsx,
src/hooks/useGroupData.tsx, src/app/login/page.tsx
DO NOT READ: data files, map components

## Task: Profile overlay (avatar tap — Me/Trip/About tabs)
READ: src/components/ProfileOverlay.tsx, src/components/profile/* (all),
src/components/AppShell.tsx (avatar trigger), src/hooks/useGroupData.tsx
(updateProfile/signOut), src/lib/identity.ts, src/lib/storage.ts (avatar upload),
CONTEXT.md (v2_voters schema)
DO NOT READ: map components, venue hooks, city data

## Task: Cities list / sort / index rows
READ: src/app/plan/cities/page.tsx, src/components/CityList.tsx,
src/components/ActionBar.tsx
DO NOT READ: hooks internals, map components

## Task: City detail layout
READ: src/app/plan/city/[id]/CityDetail.tsx, src/components/CityMap.tsx,
src/components/VenueSheet.tsx, src/components/ActionBar.tsx
DO NOT READ: hooks internals, calendar code

## Task: Theme / design tokens / global styles
READ: src/app/globals.css, tailwind.config.ts
DO NOT READ: pages, hooks, data. Dark only — there is no theme system.

## Task: Navigation / app shell / TopBar / wing switching
READ: src/components/AppShell.tsx, src/components/TopBar.tsx,
src/components/PlanNav.tsx, src/components/HopNav.tsx,
src/components/HopShell.tsx, src/app/layout.tsx, next.config.mjs
DO NOT READ: pages, hooks, data

## Task: Locate tab / location sharing / pins / people panel / mutes
READ: src/app/social/locate/page.tsx, src/hooks/useLocations.ts,
src/lib/maps.ts, src/lib/supabase.ts (LocationRow),
CONTEXT.md (v2_locations schema)
DO NOT READ: voting code, calendar code, city detail, venue hooks

## Task: Admin screen (users, PIN resets, trip setup, location oversight, danger zone)
READ: src/app/plan/admin/page.tsx, src/components/TripSetupPanel.tsx,
src/components/ActiveLocationsPanel.tsx, src/components/TripResetsPanel.tsx,
src/lib/identity.ts, src/lib/superadmin.ts, CONTEXT.md (schema section)
DO NOT READ: map components, calendar code, venue hooks

## Task: Moderator screen (crew management, trip setup, resets)
READ: src/app/plan/moderator/page.tsx, src/components/TripSetupPanel.tsx,
src/components/ActiveLocationsPanel.tsx, src/components/TripResetsPanel.tsx,
src/lib/roles.ts
DO NOT READ: map components, calendar code, venue hooks

## Task: Chat (messages, reactions, read receipts, replies)
READ: src/app/social/page.tsx, src/hooks/useChat.ts, src/lib/chat.ts,
src/components/chat/MessageBubble.tsx, src/components/chat/index.ts,
src/lib/supabase.ts (MessageRow types)
DO NOT READ: map components, city data, calendar code

## Task: Camera capture + send
READ: src/app/social/camera/page.tsx, src/app/social/camera/layout.tsx,
src/hooks/useCamera.ts, src/lib/storage.ts
DO NOT READ: map components, city data, calendar code

## Task: Gallery (photo grid, pagination, jump-to-date)
READ: src/app/social/gallery/page.tsx, src/lib/chat.ts (GALLERY_PAGE_SIZE),
src/components/ImageViewer.tsx
DO NOT READ: map components, city data, calendar code

## Task: Trip entity (status, hotels, assignments, members)
READ: src/hooks/useTrip.ts, src/hooks/useTripData.tsx,
src/components/TripSetupPanel.tsx, src/components/TopBar.tsx,
src/app/plan/admin/page.tsx, CONTEXT.md (v2_trip* schema)
DO NOT READ: map components, venue hooks

## Task: Hopperz / crew members
READ: src/app/plan/hopperz/page.tsx, src/hooks/useHopperz.ts,
src/components/VoterProfileSheet.tsx, src/components/RoleBadge.tsx,
src/hooks/useVoterNotes.ts
DO NOT READ: map components, calendar code

## Task: Home screen dashboard
READ: src/app/home/page.tsx, src/hooks/useTrip.ts,
src/hooks/useTripData.tsx, src/hooks/useVotes.ts,
src/hooks/useAvailability.ts, src/hooks/useLocations.ts
DO NOT READ: map components, venue hooks

## Task: RBAC / roles / superadmin
READ: src/lib/roles.ts, src/lib/superadmin.ts, src/lib/auth.ts,
src/middleware.ts, src/app/plan/admin/page.tsx,
src/app/plan/moderator/page.tsx
DO NOT READ: map components, calendar code, city data

## Task: Push notifications
READ: src/hooks/usePushNotifications.ts, src/lib/push.ts,
src/components/profile/NotificationsCard.tsx, public/sw.js
DO NOT READ: map components, city data, calendar code

## Task: PWA / service worker / offline
READ: public/sw.js, public/manifest.json, public/offline.html,
src/components/ServiceWorkerRegistrar.tsx, src/lib/auth.ts
DO NOT READ: map components, city data

## After ANY session
UPDATE: .claude/STATE.yml (always), .claude/PROGRESS.md (if features changed),
.claude/CONTEXT.md (if architecture/files/schema changed)
