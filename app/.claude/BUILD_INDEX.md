# BUILD INDEX — what to read per task

Read CONTEXT.md first in every session. Then read ONLY what the task needs:

## Task: Edit city data (venues, addresses, vibe tags, new city)
READ: src/data/cities.ts (and src/data/types.ts if shape changes)
DO NOT READ: anything else

## Task: Tune scoring / walkability tiers
READ: src/lib/score.ts, src/lib/geo.ts
DO NOT READ: data files (the formulas read coords generically), UI components

## Task: Fix voting logic
READ: src/hooks/useGroupData.tsx, src/hooks/useVotes.ts, src/components/VoteFlow.tsx, src/app/vote/page.tsx
DO NOT READ: data files, map components, calendar code

## Task: Fix availability / calendar
READ: src/hooks/useGroupData.tsx, src/hooks/useAvailability.ts, src/components/Calendar.tsx, src/app/dates/page.tsx, src/lib/format.ts
DO NOT READ: data files, map components, vote code

## Task: Fix map
READ: src/components/CityMap.tsx, src/lib/maps.ts
DO NOT READ: data files, supabase files, hooks

## Task: Fix Supabase / realtime / offline fallback
READ: src/lib/supabase.ts, src/hooks/useGroupData.tsx, CONTEXT.md (schema section)
DO NOT READ: components, data files

## Task: Identity / name prompt
READ: src/lib/identity.ts, src/components/NamePrompt.tsx, src/hooks/useGroupData.tsx
DO NOT READ: data files, map components

## Task: Dashboard changes
READ: src/app/page.tsx, src/hooks/useVotes.ts, src/hooks/useAvailability.ts
DO NOT READ: data files, map components

## Task: Cities list / filters / sort
READ: src/app/cities/page.tsx, src/components/CityCard.tsx
DO NOT READ: hooks internals, map components

## Task: City detail layout
READ: src/app/city/[id]/CityDetail.tsx, src/components/HotelCard.tsx, src/components/VenueRow.tsx, src/components/VenueSheet.tsx
DO NOT READ: hooks internals, calendar code

## Task: Theme / design tokens / global styles
READ: src/app/globals.css, tailwind.config.ts, src/components/ThemeProvider.tsx
DO NOT READ: pages, hooks, data

## Task: Navigation / app shell
READ: src/components/AppShell.tsx, src/app/layout.tsx
DO NOT READ: pages, hooks, data

## After ANY session
UPDATE: .claude/STATE.yml (always), .claude/PROGRESS.md (if features changed),
.claude/CONTEXT.md (if architecture/files/schema changed)
