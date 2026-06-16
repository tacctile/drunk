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
| Derived metrics computed at module load (`lib/score.ts`) | Centroid/nearest-hotel/score are pure functions of coords; computing once beats memo bookkeeping in 27 places. The score itself never renders — it is only the "Best walk" sort key. |
| Classic `google.maps.Marker` + custom `Symbol` paths | Pins differentiate by shape (accent square / near-white circle / outlined muted circle), not color. AdvancedMarker requires a cloud mapId which conflicts with local JSON styling. |
| Expand-only live map; SVG constellation as the collapsed peek | The Google map never mounts collapsed — zero map cost until asked for. The container's height/clip animates; the map element's size never does (no resize thrash). |
| Dark only — tokens directly on `:root` | One palette, no theme state, no boot script, no flash. `color-scheme: dark` and a single `themeColor`. |
| Hand-built SVG (`WalkStrip`, `ConstellationMap`) | The signature visuals are a fixed-scale strip and a dot-field — trivially expressed as inline SVG; a chart lib would fight the fixed 0→1 mi axis mandate. |
| No UI libraries | Spec mandate; also keeps every interactive element ≥44px tall without fighting a kit. |

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
             useVotes (memo +    useAvailability (memo)
             others-vote diff)        │
                    │                 │
        ┌───────────┼─────────────────┼──────────────┐
        ▼           ▼                 ▼              ▼
      Trip      VoteFlow (/vote)   Dates        CityDetail
        │                                            │
        └────────► Cities ──► CityCard               ├─► ConstellationMap (collapsed peek)
                                                     ├─► CityMap (mounted on expand only)
                                                     ├─► HotelCard ─► WalkStrip (per hotel)
                                                     └─► VenueRow ──► VenueSheet

    data/cities.ts ──► lib/score.ts (cityMeta, computed once) ──► WalkStrip everywhere
```

## Component hierarchy

```
RootLayout
└ GroupDataProvider
  └ AppShell (wordmark header + bottom nav mobile / 224px rail ≥840px;
    │         renders children bare on /vote — the flow owns the screen)
    ├ TripPage ─ hero (WalkStrip · VoterAvatars) · standings rows ·
    │            closest-picks scroller · roster · date nudge
    ├ CitiesPage ─ CityCard* (WalkStrip · VoterAvatars) · sticky vote pill
    ├ CityPage ─ CityDetail (two-pane ≥840px)
    │   ├ ConstellationMap (collapsed map peek) ⇄ CityMap (expanded live map)
    │   ├ HotelCard* (Stars · WalkStrip · VoterAvatars)
    │   ├ VenueRow* ─ (expands map + pans); pin tap ─ VenueSheet (BottomSheet)
    ├ VotePage ─ three beats: city list ─ hotel stack ─ confirm (+ inline name)
    └ DatesPage ─ mode toggle · MonthNav · MyCalendar | GroupCalendar ·
                  BottomSheet · NamePrompt
```

## Hook responsibilities

- **useGroupData** (the only stateful hook): identity bootstrap, four-table fetch,
  realtime channel, focus refetch, optimistic mutations, cache mirroring/fallback.
  Throws if used outside the provider.
- **useVotes**: projection → city ranking, per-city hotel ranking (skips hotel ids
  missing from city data), leader, runner-up, my vote — plus
  `recentlyChangedCityIds`: a diff of OTHER voters' city votes between renders,
  cleared after ~1.6s, which drives the one-shot row/hero pulse. Own optimistic
  writes never pulse.
- **useAvailability**: pure projection → my date map, per-date breakdowns,
  heat ratio (available / roster size), best upcoming date. No IO.

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
