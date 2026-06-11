# ARCHITECTURE

## Stack decisions and why

| Decision | Why |
| --- | --- |
| Next.js 14 App Router | File-system routing for the 5 views; static pre-render of all 27 city pages; Vercel-native. |
| All interactive views are client components | Every view consumes Supabase realtime; RSC can't hold subscriptions. Server components exist only as thin wrappers (`city/[id]/page.tsx` for `generateStaticParams`/`notFound`). |
| One provider (`GroupDataProvider`) owns ALL remote state | One websocket, one fetch cycle, one fallback path — instead of four hooks each managing their own. Pages consume derived views (`useVotes`, `useAvailability`) that are pure `useMemo` projections. |
| Refetch-on-change realtime (not row patching) | Tables are tiny (≤ a few hundred rows). On any postgres_changes event we refetch the four tables (debounced 250ms). Zero cache-invalidation bugs by construction. |
| Optimistic writes + write-through caches | Taps must feel instant on a phone. State updates synchronously, caches mirror the write, Supabase follows; a later refetch converges everyone. |
| Static data in a TS module (`data/cities.ts`) | The city list changes by commit, not at runtime. Type-checked, tree-shaken, zero loading state. |
| Derived metrics computed at module load (`lib/score.ts`) | Scores/tiers are pure functions of coords; computing once beats memo bookkeeping in 27 places. |
| Classic `google.maps.Marker` + `SymbolPath.CIRCLE` | The spec wants flat colored circle pins. AdvancedMarker requires a cloud mapId which conflicts with local JSON styling. |
| CSS-variable design tokens + Tailwind `darkMode: "class"` | Theme flip = one class on `<html>`; both themes share every component. Boot script sets the class pre-paint (no flash). |
| No UI libraries | Spec mandate; also keeps every interactive element exactly 44px tall without fighting a kit. |

## Data flow

```
                       ┌──────────────────────────────┐
                       │   Supabase (v2_* tables)     │
                       │  postgres_changes ─ realtime │
                       └──────┬───────────▲───────────┘
                       fetch  │           │ upserts/deletes
                              ▼           │
            ┌─────────────────────────────┴───┐    mirror   ┌─────────────────┐
            │   GroupDataProvider (context)   │◄───────────►│  localStorage    │
            │  voters · cityVotes ·           │  write-thru │  bh2-* caches    │
            │  hotelVotes · availability      │  + fallback └─────────────────┘
            │  saveName · castVote · setAvail │
            └───────┬─────────────────┬───────┘
             useVotes (memo)   useAvailability (memo)
                    │                 │
        ┌───────────┼─────────────────┼──────────────┐
        ▼           ▼                 ▼              ▼
    Dashboard     Vote             Dates        CityDetail ──► VoteFlow
        │                                            │
        └────────► Cities ──► CityCard               ├─► CityMap (pins/labels)
                                                     ├─► HotelCard (walk distances)
                                                     └─► VenueRow ──► VenueSheet

    data/cities.ts ──► lib/score.ts (cityMeta, computed once) ──► all city UI
```

## Component hierarchy

```
RootLayout
└ ThemeProvider
  └ GroupDataProvider
    └ AppShell (header / bottom nav / desktop rail / theme toggle)
      ├ DashboardPage
      ├ CitiesPage ─ CityCard*
      ├ CityPage ─ CityDetail
      │   ├ CityMap
      │   ├ VoteFlow ─ (NamePrompt | Dialog)
      │   ├ HotelCard*
      │   ├ VenueRow* ─ VenueSheet (BottomSheet)
      ├ VotePage ─ ResultRow* · Dialog (city picker) · VoteFlow · NamePrompt
      └ DatesPage ─ MonthNav · MyCalendar | GroupCalendar · BottomSheet · NamePrompt
```

## Hook responsibilities

- **useGroupData** (the only stateful hook): identity bootstrap, four-table fetch,
  realtime channel, focus refetch, optimistic mutations, cache mirroring/fallback.
  Throws if used outside the provider.
- **useVotes**: pure projection → city ranking, per-city hotel ranking, leader,
  runner-up, my vote. No IO.
- **useAvailability**: pure projection → my tri-state map, per-date breakdowns,
  heat ratio (available / roster size), best upcoming date. No IO.
- **useTheme**: theme value + toggle; persistence in `bh2-theme`.

## File naming conventions

- Components: PascalCase `.tsx`, one main export per file, co-located helpers allowed.
- Hooks: `useX.ts(x)` — `.tsx` only when the file contains JSX (the provider).
- Lib: lowercase nouns (`geo.ts`, `maps.ts`, `score.ts`, `format.ts`).
- Routes follow App Router conventions; client page bodies live next to their
  server wrapper (`CityDetail.tsx` beside `page.tsx`).

## Import rules

- Always `@/` alias, never relative `../../`.
- `data/` imports nothing from `lib/`, `hooks/`, or `components/` (pure data).
- `lib/` may import from `data/` only (`score.ts` does); never from hooks/components.
- `hooks/` may import `lib/` + `data/`; never components.
- `components/` may import anything except pages; pages import anything.
- Nothing imports from `app/` except Next itself.
