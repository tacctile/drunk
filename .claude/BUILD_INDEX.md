# Bar Hoppers — Build Index
> A log of what's been built and where it lives, newest first. Companion to
> CONTEXT.md (the why/how). v2 = the Next.js app under `app/`.

---

## PWA Foundation + Auth Flow + Home Screen + Dual-Wing Navigation — 2026-06-14

### PWA / service worker
- `app/public/manifest.json` — installable manifest (Bar Hoppers, standalone,
  portrait, `#0A0D14`, icon placeholders 192/512/180).
- `app/public/sw.js` — `bar-hoppers-v1`; navigations network-first → `/offline.html`,
  static/fonts cache-first, supabase/googleapis network-first, skipWaiting + claim.
- `app/public/offline.html` — standalone offline page (no app-shell deps).
- `app/public/icons/README.txt` — where to drop real PNG icons.
- `app/src/components/ServiceWorkerRegistrar.tsx` — registers `/sw.js` post-load.
- `app/src/app/layout.tsx` — manifest link + apple-mobile-web-app meta tags;
  mounts the registrar inside `GroupDataProvider`.

### Auth / login screen
- `app/src/lib/auth.ts` — `isAuthenticated` (+ `bh2-auth` cookie mirror),
  `getLastWing` / `setLastWing`, `mirrorAuthCookie` / `clearAuthCookie`.
- `app/src/lib/identity.ts` — `clearIdentity` now also clears `bh2-auth`.
- `app/src/app/page.tsx` — client cold-open gate → `/home` or `/login`.
- `app/src/app/login/page.tsx` — full-screen login; inline `IdentityForm` +
  Install App section (Android prompt / iOS hint / hidden in standalone).
- `app/src/components/NamePrompt.tsx` — extracted reusable `IdentityForm`
  (modal + login share it); NamePrompt is now a thin Dialog wrapper.
- `app/src/middleware.ts` — matcher `/home`, `/plan/:path*`, `/social/:path*`;
  redirects to `/login` when `bh2-auth` is missing.

### Home screen
- `app/src/app/home/page.tsx` — "Where to?" wing picker, two tappable cards
  (Plan a Trip / Night Out), AppShell header, no bottom nav.

### Dual-wing navigation
- `app/src/components/AppShell.tsx` — pathname-aware chrome: bare on `/login`/`/`,
  header elsewhere, plan tabs + rail only on `/plan/*`, cross-wing Night Out
  button in the wordmark bar.
- Plan wing: `app/src/app/plan/{layout,page}.tsx` + moved routes
  (`cities`, `city/[id]`, `calendar`, `board`, `locate`, `admin`).
- Social wing: `app/src/app/social/{layout,page}.tsx` + `social/camera/page.tsx`
  (own bottom nav: Chat / Camera / Switch-to-Plan).
- `app/next.config.mjs` — removed the `/`→`/cities` redirect (page.tsx routes now).

---

## Earlier (pre-index) — the v2 Next.js rebuild
The cities walkability index, city detail + Google Maps venue pins, city/hotel
voting, two-tab availability + The Board, live Locate map, PIN identity + profile
overlay, and admin. See CONTEXT.md "Supabase Schema" and the `app/src` tree.
