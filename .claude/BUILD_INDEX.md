# Bar Hoppers — Build Index
> A log of what's been built and where it lives, newest first. Companion to
> CONTEXT.md (the why/how). v2 = the Next.js app under `app/`.

---

## Chat Session B — Reactions + Read Receipts + Reply — 2026-06-14

### Reactions
- `app/src/hooks/useChat.ts` — addReaction (optimistic upsert with swap), removeReaction
  (optimistic delete). reactions state refactored to Record<string, ReactionRow[]>.
- `app/src/lib/chat.ts` — groupReactions helper (groups by emoji, returns count + voterIds).
- `app/src/app/social/page.tsx` — reaction pills below bubbles (emoji + count, accent border
  for own reaction, tap to toggle). Long-press (500ms) opens emoji picker overlay (8 emojis
  from EMOJI_REACTIONS). Conflict resolution with swipe-to-reply.

### Read receipts
- `app/src/hooks/useChat.ts` — reads state refactored to Record<string, ReadRow[]>.
  markRead fires optimistically (updates local state before server upsert).
- `app/src/app/social/page.tsx` — read receipt display below timestamps: 1 reader → 16px
  avatar circle, 2 readers → overlapping avatars, 3+ → "Seen by X" text → BottomSheet
  with reader list (avatar + name + time, sorted by read_at asc).

### Reply
- `app/src/hooks/useChat.ts` — replyingTo state + setReplyingTo. sendMessage includes
  reply_to_id when replyingTo is set.
- `app/src/app/social/page.tsx` — swipe right on mobile (40px threshold, 8px nudge) to
  trigger reply. Desktop hover reply button. Reply preview bar above input. Quoted reply
  preview in bubble with scroll-to-original on tap. Handles deleted/image/missing originals.

### Build task index
- Fix reactions / read receipts / reply → read `src/hooks/useChat.ts`, `src/app/social/page.tsx`, `src/lib/chat.ts`

---

## Chat Session A — Fix Double TopBar + Chat Core — 2026-06-14

### Double TopBar fix
- `app/src/components/AppShell.tsx` — social routes now bypass AppShell entirely
  (bare passthrough like /login). HopShell renders the only TopBar on /social/*.

### Chat page + hook + types
- `app/src/app/social/page.tsx` — full chat interface: message list with grouping,
  day dividers, scroll behavior, input bar with auto-grow textarea, send button,
  camera/gallery placeholders.
- `app/src/hooks/useChat.ts` — chat data hook: initial load, pagination (loadMore),
  realtime (channel "hoppz-chat"), optimistic sendMessage, deleteMessage, markRead.
- `app/src/lib/chat.ts` — MessageRow, ReactionRow, ReadRow types; formatMessageTime,
  formatDayDivider, isDifferentDay, shouldGroup helpers; CHAT_PAGE_SIZE, EMOJI_REACTIONS.
- `app/src/lib/supabase.ts` — re-exports MessageRow from chat.ts; adds MessageReadRow,
  MessageReactionRow types.

### Build task index
- Fix chat / messages / realtime → read `src/hooks/useChat.ts`, `src/app/social/page.tsx`, `src/lib/chat.ts`

---

## Component Architecture Cleanup + Hopp Wing Locate + Nav Refactor — 2026-06-14

### Nav components extracted from AppShell
- `app/src/components/TopBar.tsx` — sticky wordmark bar (Hoppz + ProfileAvatar).
  Hidden on `/plan/city/*` and `/plan/admin`. Rendered by both AppShell and HopShell.
- `app/src/components/PlanNav.tsx` — plan-wing nav (Cities, Availability, Results,
  Hopp). Mobile bottom bar + desktop 80px rail. Admin long-press on Results + Hopp.
- `app/src/components/HopNav.tsx` — hopp-wing nav (Chat, Camera, Locate, Plan).
  Mobile bottom bar only. Admin long-press on Plan tab.
- `app/src/hooks/useAdminHold.ts` — 3s hold hook extracted from AppShell;
  shared by PlanNav and HopNav.

### Hopp shell
- `app/src/components/HopShell.tsx` — hopp-wing shell: TopBar + children + HopNav.
  Used by `social/layout.tsx`.

### Locate relocation
- Moved `app/src/app/plan/locate/page.tsx` → `app/src/app/social/locate/page.tsx`.
  Zero logic changes. Admin back button updated to `/social/locate`.
  All `/plan/locate` references removed from codebase.

### AppShell simplification
- `app/src/components/AppShell.tsx` — stripped to compose TopBar + PlanNav only.
  No inline nav markup, no NAV array, no HOLD_CLASS, no useAdminHold.

### Branding updates
- All "Night Out" UI strings → "Hopp" (home page, social page, camera page,
  nav labels, comments).

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
  (Plan a Trip / Hopp), AppShell header, no bottom nav.

### Dual-wing navigation
- `app/src/components/AppShell.tsx` — pathname-aware chrome: bare on `/login`/`/`,
  TopBar + PlanNav on `/plan/*`, TopBar-only elsewhere.
- Plan wing: `app/src/app/plan/{layout,page}.tsx` + moved routes
  (`cities`, `city/[id]`, `calendar`, `board`, `admin`).
- Social wing: `app/src/app/social/{layout,page}.tsx` + `social/camera/page.tsx`
  + `social/locate/page.tsx` (own bottom nav via HopShell).
- `app/next.config.mjs` — removed the `/`→`/cities` redirect (page.tsx routes now).

---

## Earlier (pre-index) — the v2 Next.js rebuild
The cities walkability index, city detail + Google Maps venue pins, city/hotel
voting, two-tab availability + The Board, live Locate map, PIN identity + profile
overlay, and admin. See CONTEXT.md "Supabase Schema" and the `app/src` tree.
