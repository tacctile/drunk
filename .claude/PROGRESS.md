# Bar Hoppers — Progress
> Feature checklist for the v2 Next.js app (`app/`). Newest phase on top.

## Phase: PWA + Auth + Dual-Wing (2026-06-14)
- [x] PWA manifest (`public/manifest.json`) + icon placeholders + README
- [x] Service worker (`public/sw.js`) — offline shell, `/offline.html` fallback
- [x] Service worker registration (`ServiceWorkerRegistrar`, mounted in layout)
- [x] PWA `<head>` tags (manifest + apple-mobile-web-app meta + apple-touch-icon)
- [x] Soft auth layer (`lib/auth.ts`): `isAuthenticated`, `getLastWing`/`setLastWing`,
      `bh2-auth` cookie mirror; `clearIdentity` clears the cookie
- [x] Root cold-open gate (`app/page.tsx`) → `/home` or `/login`
- [x] Login / create screen (`/login`) with shared `IdentityForm` + Install App
- [x] Home wing picker (`/home`) — Plan a Trip / Night Out cards
- [x] Plan wing (`/plan/*`) — layout sets last wing; existing pages relocated
- [x] Social wing (`/social`, `/social/camera`) — own bottom nav, placeholders
- [x] Pathname-aware AppShell — plan nav/rail scoped to `/plan/*`; cross-wing button
- [x] Auth-guard middleware (`src/middleware.ts`) over `/home`, `/plan/*`, `/social/*`

## Earlier — v2 rebuild (Next.js)
- [x] Cities walkability index + sort
- [x] City detail (Hotels / Bars / Food) + Google Maps venue pins
- [x] City + hotel voting (PIN identity, optimistic, offline fallback)
- [x] Availability (My Dates) + The Board (group results)
- [x] Locate — live group map with location sharing
- [x] Profile overlay + admin

## Backlog
- [ ] Real PNG app icons (192 / 512 / 180)
- [ ] Night Out (social) wing — actual features
- [ ] More cities in `data/cities.ts`
