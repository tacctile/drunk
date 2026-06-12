# BUILD INDEX — what to read per task

Read CONTEXT.md first in every session. Then read ONLY what the task needs:

## Task: Edit city data (walk scores, grades, districts, miles, new city)
READ: src/data/cities.ts (and src/data/types.ts if shape changes)
DO NOT READ: anything else. Walkability is hardcoded research — never add math.

## Task: Fix venue lists / Places fetching / chain filter
READ: src/hooks/usePlaces.ts, src/lib/venues.ts, src/lib/maps.ts
DO NOT READ: data files (venues never come from cities.ts), calendar code

## Task: Fix the map / pins
READ: src/components/CityMap.tsx, src/lib/maps.ts, src/components/VenueSheet.tsx
DO NOT READ: data files, supabase files, calendar code

## Task: Fix city voting or hotel preference
READ: src/hooks/useGroupData.tsx, src/hooks/useVotes.ts,
src/app/city/[id]/CityDetail.tsx, src/components/CityList.tsx
DO NOT READ: map internals, calendar code

## Task: Fix availability / personal calendar / heat map
READ: src/hooks/useGroupData.tsx, src/hooks/useAvailability.ts,
src/components/Calendar.tsx, src/app/calendar/page.tsx, src/app/board/page.tsx,
src/lib/format.ts
DO NOT READ: data files, map components, vote code

## Task: Fix The Board (standings, hot dates)
READ: src/app/board/page.tsx, src/hooks/useVotes.ts, src/hooks/useAvailability.ts,
src/components/Calendar.tsx
DO NOT READ: map components, data files

## Task: Fix Supabase / realtime / offline fallback
READ: src/lib/supabase.ts, src/hooks/useGroupData.tsx, CONTEXT.md (schema section)
DO NOT READ: components, data files

## Task: Identity / name prompt
READ: src/lib/identity.ts, src/components/NamePrompt.tsx, src/hooks/useGroupData.tsx
DO NOT READ: data files, map components

## Task: Cities list / sort / index rows
READ: src/app/cities/page.tsx, src/components/CityList.tsx,
src/components/ActionBar.tsx
DO NOT READ: hooks internals, map components

## Task: City detail layout
READ: src/app/city/[id]/CityDetail.tsx, src/components/CityMap.tsx,
src/components/VenueSheet.tsx, src/components/ActionBar.tsx
DO NOT READ: hooks internals, calendar code

## Task: Theme / design tokens / global styles
READ: src/app/globals.css, tailwind.config.ts
DO NOT READ: pages, hooks, data. Dark only — there is no theme system.

## Task: Navigation / app shell / long-press admin trigger
READ: src/components/AppShell.tsx, src/app/layout.tsx, next.config.mjs
DO NOT READ: pages, hooks, data

## Task: Locate tab / location sharing / pins / people panel / mutes
READ: src/app/locate/page.tsx, src/hooks/useLocations.ts, src/lib/maps.ts,
src/lib/supabase.ts (LocationRow), CONTEXT.md (v2_locations schema)
DO NOT READ: voting code, calendar code, city detail, venue hooks

## Task: Admin screen (users, PIN resets, trip resets, location oversight)
READ: src/app/admin/page.tsx, src/components/AppShell.tsx (the long-press
trigger), src/lib/identity.ts, CONTEXT.md (schema section)
DO NOT READ: map components, calendar code, venue hooks

## After ANY session
UPDATE: .claude/STATE.yml (always), .claude/PROGRESS.md (if features changed),
.claude/CONTEXT.md (if architecture/files/schema changed)
