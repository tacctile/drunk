# Hoppz — Architecture

## Stack decisions
- **Next.js 14 App Router** — server runtime (middleware, redirects), not static export.
  All pages are client components (`"use client"`); server components not used.
- **React 18** — no Suspense boundaries except where useSearchParams requires it.
- **TypeScript strict** — `noEmit` typecheck via `tsc`, enforced at build time.
- **Tailwind + CSS custom properties** — semantic tokens on `:root` in globals.css,
  mapped 1:1 in tailwind.config.ts. No inline hex values or arbitrary radii.
- **Supabase JS v2** — singleton client via `getSupabase()`. Realtime channels
  for locations, chat, and trip data. All reads wrapped in `safeSelect` (silent
  failure). All writes optimistic with localStorage cache fallback.
- **No server actions or API routes** — all data flows through Supabase client.

## Data flow
```
Supabase ←→ hooks (useGroupData, useLocations, useChat, useTrip, ...)
                ↓
         React context providers (GroupDataProvider, TripDataProvider)
                ↓
         Page components → UI components
                ↓
         localStorage (identity, caches, preferences)
```

### Provider hierarchy (layout.tsx)
```
GroupDataProvider
  └─ TripDataProvider
       └─ AppShell
            └─ {children}  (page routes)
```

### Shared state patterns
1. **Context providers** — GroupDataProvider (voters, votes, profiles) and
   TripDataProvider (trip, hotels, assignments, members). Mounted once in
   root layout, consumed by any descendant.
2. **Module-scope shared state** — useLocations uses module-level stores
   (`createShared`) so multiple hook instances (locate page + profile overlay)
   share the same data without prop drilling or extra context.
3. **Optimistic updates** — writes update local state immediately, then fire
   the Supabase mutation. On failure, revert to previous state or refetch.
4. **localStorage caching** — votes, availability, and identity data cached
   locally via `lsGetJson`/`lsSetJson` for offline resilience.

## Component hierarchy

### Shell structure
```
AppShell (root layout, pathname-aware)
├─ /login, / — bare passthrough
├─ /home — TopBar only (suppressNav)
├─ /plan/* — TopBar + PlanNav
└─ /social/* — bare passthrough → HopShell (TopBar + HopNav)
     └─ /social/camera — own layout (no HopShell)
```

### Component organization
- `components/` — flat for standalone components (Avatar, BottomSheet, Icon, etc.)
- `components/profile/` — ProfileOverlay sub-components with barrel export.
  ProfileOverlay.tsx is the thin dialog shell; ProfileBody.tsx is the main content.
- `components/chat/` — extracted chat components with barrel export.
  MessageBubble.tsx is the message rendering unit.

## Hook responsibilities
| Hook | Owns | Realtime | Shared state |
|------|------|----------|--------------|
| useGroupData | voters, votes, hotels | v2_voters channel | Context provider |
| useLocations | location rows, sharing toggle | v2_locations channel | Module-scope stores |
| useTrip | trip, hotels, assignments, members | hoppz-trip channel | Via useTripData context |
| useChat | messages, reactions, reads | hoppz-chat channel | Local state |
| useVoterNotes | voter notes CRUD | None (refetch on demand) | Local state |
| useVotes | city/hotel vote state | Via useGroupData | Local state |
| useAvailability | date availability | None (refetch on mount/focus) | Local state |
| useHopperz | merged voter list | Via useGroupData + useLocations | Local state |
| useCamera | media stream, capture | N/A | Local state |
| usePushNotifications | push permission, subscription | N/A | Local state |

## Import rules
- Components import from `@/components/...` (barrel exports for subdirectories).
- Hooks import from `@/hooks/...`.
- Lib imports from `@/lib/...`.
- Data imports from `@/data/...`.
- No circular imports. Hooks may import lib but not other hooks' internals.
  Cross-hook data flows through context providers.
- Type-only re-exports use `export type { ... }` to avoid runtime overhead.

## File naming
- Components: PascalCase (`MessageBubble.tsx`).
- Hooks: camelCase with `use` prefix (`useVoterNotes.ts`).
- Lib modules: camelCase (`scrollLock.ts`).
- Route pages: `page.tsx` / `layout.tsx` (Next.js convention).
- Barrel exports: `index.ts`.
- No default exports except route pages.
