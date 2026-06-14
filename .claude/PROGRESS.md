# Hoppz — Progress
> Feature checklist for the v2 Next.js app (`app/`). Newest phase on top.

## Phase: Component Architecture Cleanup + Nav Refactor (2026-06-14)
- [x] Extracted TopBar.tsx — sticky wordmark bar, hidden on city detail/admin
- [x] Extracted PlanNav.tsx — plan nav (Cities, Availability, Results, Hopp) + desktop rail
- [x] Created HopNav.tsx — hopp nav (Chat, Camera, Locate, Plan)
- [x] Created HopShell.tsx — hopp-wing shell (TopBar + children + HopNav)
- [x] Extracted useAdminHold.ts — 3s hold hook shared by PlanNav and HopNav
- [x] AppShell simplified to compose TopBar + PlanNav only (no inline nav markup)
- [x] social/layout.tsx uses HopShell (no inline nav markup)
- [x] Locate moved from /plan/locate to /social/locate (zero logic changes)
- [x] Admin back button updated from /plan/locate to /social/locate
- [x] All "Night Out" UI strings replaced with "Hopp"
- [x] Admin long-press on Results + Hopp (plan nav) and Plan (hopp nav)
- [x] typecheck, lint, and build all pass clean

## Phase: Nav Restructure — Cross-Wing Switching (2026-06-14)
- [x] Plan nav: Cities, Availability, Results, Hopp (cross-wing to /social)
- [x] Removed Locate from plan nav
- [x] Removed local_bar cross-wing button from wordmark bar header
- [x] Hopp nav: Chat, Camera, Locate, Plan (cross-wing) — 4-tab grid
- [x] Cross-wing tabs: router.push + setLastWing, no active highlight
- [x] Admin 3s long-press moved from Locate tab to Results tab
- [x] All nav icons use Icon component with filled/unfilled active state
- [x] Hopp nav matches plan nav dimensions (64px + safe-area, grid-cols-4)

## Phase: Hoppz Rebrand + Login Overhaul (2026-06-14)
- [x] Rebrand all "Bar Hoppers" → "Hoppz" (manifest, sw, offline page, layout,
      AppShell header, locate page, profile overlay, comments)
- [x] Login screen defaults to Sign In (free-form name + initial + PIN lookup)
- [x] Create account is now the secondary toggle option
- [x] Sign-in lookup matches display_name case-insensitively, generic error message
- [x] Add to Home Screen section: Android + iOS buttons (SVG logos, side-by-side)
- [x] Android button uses beforeinstallprompt, disabled when ineligible
- [x] iOS button toggles inline Safari instructions with max-height transition
- [x] Install section hidden in standalone mode

## Phase: PWA + Auth + Dual-Wing (2026-06-14)
- [x] PWA manifest (`public/manifest.json`) + icon placeholders + README
- [x] Service worker (`public/sw.js`) — offline shell, `/offline.html` fallback
- [x] Service worker registration (`ServiceWorkerRegistrar`, mounted in layout)
- [x] PWA `<head>` tags (manifest + apple-mobile-web-app meta + apple-touch-icon)
- [x] Soft auth layer (`lib/auth.ts`): `isAuthenticated`, `getLastWing`/`setLastWing`,
      `bh2-auth` cookie mirror; `clearIdentity` clears the cookie
- [x] Root cold-open gate (`app/page.tsx`) → `/home` or `/login`
- [x] Login / create screen (`/login`) with shared `IdentityForm` + Install App
- [x] Home wing picker (`/home`) — Plan a Trip / Hopp cards
- [x] Plan wing (`/plan/*`) — layout sets last wing; existing pages relocated
- [x] Social wing (`/social`, `/social/camera`, `/social/locate`) — own nav via HopShell
- [x] Pathname-aware AppShell — TopBar + PlanNav scoped to `/plan/*`
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
- [ ] Hopp (social) wing — actual features
- [ ] More cities in `data/cities.ts`
