# Hoppz — Build Index
> A log of what's been built and where it lives, newest first. Companion to
> CONTEXT.md (the why/how) and ARCHITECTURE.md (the structure).

---

## Audit 2 Remediation — Architecture Health Fixes — 2026-06-14

### Route protection
- `app/src/middleware.ts` — rewritten: checks bh2-auth + bh2-role cookies,
  redirects /plan/admin (super_admin only) and /plan/moderator (moderator or
  super_admin) to /plan when role mismatch.
- `app/src/lib/auth.ts` — added setRoleCookie, clearRoleCookie.
- `app/src/hooks/useGroupData.tsx` — sets role cookie after refetch; clears on
  sign-out; calls resetLocationStore on sign-out.
- `app/src/lib/identity.ts` — clearIdentity also calls clearRoleCookie.
- `app/src/app/plan/moderator/page.tsx` — removed client-side role guard
  (middleware handles it).

### Error boundaries
- `app/src/components/ErrorBoundary.tsx` — created: class-based, fallback prop,
  retry button. Wraps root providers in layout.tsx.
- `app/src/app/layout.tsx` — ErrorBoundary wraps GroupDataProvider/TripDataProvider.
- `app/src/app/social/page.tsx` — chat message list wrapped in ErrorBoundary
  with chat-specific fallback.

### Performance fixes
- `app/src/app/social/page.tsx` — renderMessages replaced with useMemo
  (renderedMessages). deps: messages, reactions, reads, voterId, highlightedId,
  nudgedMessageId, voters.
- `app/src/app/social/gallery/page.tsx` — removed useChat import; gallery
  upload now inserts directly via Supabase (no full chat subscription).
- `app/src/hooks/useLocations.ts` — removed standalone v2_voters fetch for
  voterColors; now derived from useGroupData().voters via useMemo.
- `app/src/hooks/useLocations.ts` — added resetLocationStore() export; resets
  module-scoped shared state on sign-out.
- `app/src/hooks/useHopperz.ts` — note count useEffect now depends on stable
  voterIds string (sorted, joined) instead of activeVoters array reference.

### UX fixes
- `app/src/app/plan/board/page.tsx` — SeeButton h-8 → h-11 (44px tap target).
- `app/src/app/plan/admin/page.tsx` — back button navigates to /plan (was
  /social/locate). First name input: autoCapitalize="words".
- `app/src/app/plan/moderator/page.tsx` — first name input: autoCapitalize="words".
- `app/src/app/social/page.tsx` — aria-label on camera, upload, send buttons.
- `app/src/app/social/gallery/page.tsx` — aria-label on refresh button.

### Build verification
- TypeScript typecheck: pass
- ESLint: pass (pre-existing warnings only)
- `next build`: pass (44 routes)

### Build task index
- Fix auth / role protection / middleware → read middleware.ts, auth.ts, useGroupData.tsx

---

## Audit 1 Remediation — Code Health Refactoring — 2026-06-14

### Deletions
- Deleted legacy `index.html` (v1 single-file app, no longer needed).
- Deleted `app/src/lib/pushServer.ts` (dead stub, zero call sites).
- Removed unused `HeatCalendar` export from `app/src/components/Calendar.tsx`.
- Unexported `WeekdayRow` in Calendar.tsx (internal helper only).

### Shared primitive extraction
- `app/src/components/FieldError.tsx` — extracted from 5 consumers (NamePrompt,
  ProfileOverlay, admin, moderator, login).
- `app/src/components/Switch.tsx` — extracted from 3 consumers (ProfileOverlay,
  VoterProfileSheet, locate page).
- `app/src/components/Stars.tsx` — extracted from 2 consumers (board, CityDetail).

### localStorage centralization
- `app/src/lib/storage.ts` — added `lsGet`, `lsSet`, `lsRemove`, `lsGetJson`,
  `lsSetJson` wrappers. Updated consumers: useGroupData, useLocations,
  CityList, hopperz page.

### Constants & types consolidation
- `app/src/lib/supabase.ts` — added `LOCATION_COLUMNS` constant. Consumers:
  useLocations, ActiveLocationsPanel.
- `app/src/lib/chat.ts` — `ReactionRow` and `ReadRow` re-exported as type
  aliases from supabase types.

### Hook extraction
- `app/src/hooks/useVoterNotes.ts` — extracted from ProfileOverlay NotesSection
  and VoterProfileSheet. Optimistic add/delete with rollback.
- Updated consumers: ProfileOverlay NotesSection, VoterProfileSheet.

### Component extractions
- `app/src/components/chat/MessageBubble.tsx` — extracted from social/page.tsx
  (~230 lines). Barrel export via `chat/index.ts`.
- `app/src/components/profile/` — split ProfileOverlay.tsx into 11 sub-components:
  TripStatusCard, VoteCard, AvailabilityCard, LocationCard, NotificationsCard,
  IdentityCard, RoleCard, NotesSection, IdentityGate, SwitchIdentityRow,
  ProfileBody. Barrel export via `profile/index.ts`. ProfileOverlay.tsx reduced
  to thin dialog shell (~100 lines, was ~1180).

### ActiveLocationsPanel prop change
- `app/src/components/ActiveLocationsPanel.tsx` — now accepts `locations` prop
  instead of self-fetching. Updated admin/page.tsx and moderator/page.tsx to
  pass `activeLocations` from useLocations.

### Documentation
- `.claude/CONTEXT.md` — rewritten: removed legacy v1 references, updated file
  map with all new components/hooks/libs, current state section updated.
- `.claude/ARCHITECTURE.md` — created: stack decisions, data flow, component
  hierarchy, hook responsibilities, import rules, file naming.
- `.claude/BUILD_INDEX.md` — added this session entry, updated header.
- `.claude/STATE.yml` — updated phase, last_change, verification.

### Build verification
- TypeScript typecheck: pass
- ESLint: pass (pre-existing warnings only)
- `next build`: pass (44 routes)

### Build task index
- Fix code health / refactoring → read `src/components/profile/index.ts`, `src/components/chat/index.ts`, `src/hooks/useVoterNotes.ts`, `src/lib/storage.ts`

---

## Full Polish Pass — Known Issues + UX Fixes — 2026-06-14

### Fixes applied
- `app/src/app/login/page.tsx` — Android install button: changed
  `disabled:opacity-100` to `disabled:opacity-50` for proper dimming.
- `app/src/components/TopBar.tsx` — trip status pip: added "Today!" label
  for daysUntil===0, changed "Nd" to "Nd away" suffix.
- `.claude/CONTEXT.md` — added `bh2-hopperz-view` to localStorage contract.

### Verified correct (no changes needed)
- Login sign-in lookup (case-insensitive, trimmed, generic error)
- Camera (shutter centering, icon styling, retake overlay, send+save, flip label, back button)
- Chat scroll (rAF+scrollTop, overflow-y-scroll, spacer, new message pill)
- Chat input bar (py-0, border-t, safe area, h-10 buttons, min/max textarea)
- TopBar three-column flex layout (wordmark, pip, avatar)
- PlanNav + HopNav (flex row, divider, ink-dim cross-wing tabs)
- AppShell suppressNav on /home
- ProfileOverlay three-tab structure (Me, Trip, About)
- Hopperz view toggle persistence (bh2-hopperz-view)
- Avatar component image fallback (onLoad/onError, initials)
- Supabase voter select (avatar_url, role in select, overlayLocal, refetch sync)
- Moderator routing (500ms long-press → /plan/moderator)

---

## Home Screen Dashboard Overhaul — 2026-06-14

### Home page rebuild
- `app/src/app/home/page.tsx` — full trip dashboard: trip status hero
  (planning/upcoming/active), quick stats row (4 chips), who's in section
  (avatar scroll with on_trip + remote), quick actions 2x2 grid,
  home bottom bar (Plan | Hopp entry points).

### AppShell update
- `app/src/components/AppShell.tsx` — suppressNav on `/home`: renders
  TopBar only, no PlanNav, no desktop flex layout.

### Build task index
- Fix home screen / dashboard → read `src/app/home/page.tsx`, `src/hooks/useTripData.tsx`, `src/hooks/useVotes.ts`, `src/hooks/useAvailability.ts`

---

## Moderator Admin Screen — 2026-06-14

### Moderator route
- `app/src/app/plan/moderator/page.tsx` — moderator-only admin page:
  Your Role card, TripSetupPanel (no clear), Crew Members (edit name,
  reset PIN, trip status), ActiveLocationsPanel, TripResetsPanel.
  Access guard redirects non-moderators to /plan.

### Shared admin panels
- `app/src/components/TripSetupPanel.tsx` — trip setup UI (city, dates,
  hotels, assignments). Props: canClear. Used by admin + moderator.
- `app/src/components/ActiveLocationsPanel.tsx` — active locations with
  force-expire. Self-contained data fetching.
- `app/src/components/TripResetsPanel.tsx` — reset votes/availability
  buttons with confirmation dialogs.

### Admin page refactor
- `app/src/app/plan/admin/page.tsx` — inline Trip Setup, Locations, and
  Resets sections replaced with shared panel components. Retains Registered
  Users (full actions), Data Health, and Danger Zone.

### Moderator routing
- `app/src/components/ProfileAvatar.tsx` — moderator long-press now routes
  to /plan/moderator instead of /plan/admin.
- `app/src/hooks/useAdminHold.ts` — accepts optional destination parameter.
- `app/src/components/TopBar.tsx` — hides on /plan/moderator (own header).

### Role system
- `app/src/lib/roles.ts` — MODERATOR_PERMISSIONS updated: "Edit user
  display names", "Reset user PINs" (was "View user PINs").

### Build task index
- Fix moderator screen / role access → read `src/app/plan/moderator/page.tsx`, `src/lib/roles.ts`, `src/components/TripSetupPanel.tsx`, `src/components/ActiveLocationsPanel.tsx`, `src/components/TripResetsPanel.tsx`

---

## Trip Entity — Core System — 2026-06-14

### Trip data layer
- `app/src/lib/supabase.ts` — TripRow, TripHotelRow, TripHotelAssignmentRow,
  TripMemberRow types; TripStatus, TripMemberStatus enums.
- `app/src/hooks/useTrip.ts` — trip hook: fetch all 4 tables, realtime
  (channel "hoppz-trip"), syncTripStatus, effectiveStatus, daysUntil,
  all mutations (dates, city, hotels, assignments, member status).
- `app/src/hooks/useTripData.tsx` — TripDataProvider context + useTripData hook.
- `app/src/app/layout.tsx` — TripDataProvider mounted inside GroupDataProvider.

### Trip status indicator
- `app/src/components/TopBar.tsx` — three-column flex: wordmark, trip pill
  (upcoming countdown / active "On Trip"), avatar. Uses useTripData.

### Trip management (admin)
- `app/src/app/plan/admin/page.tsx` — TripSetupSection component: status
  display, city selector, date pickers, hotels with assignments, clear trip,
  votes lock banner. Visible to super_admin + moderator.

### Vote locking
- `app/src/components/CityList.tsx` — vote button disabled when effectiveStatus
  is upcoming/active. Uses useTripData.
- `app/src/app/plan/city/[id]/CityDetail.tsx` — ActionBar vote button shows
  "Voting locked" when locked. Uses useTripData.

### Trip status in profiles
- `app/src/components/VoterProfileSheet.tsx` — trip status section: status
  pill + buttons (own / super admin / moderator can change).
- `app/src/components/ProfileOverlay.tsx` — TripStatusCard at top of Trip tab:
  on_trip/remote/out buttons.

### Trip status in Hopperz
- `app/src/hooks/useHopperz.ts` — tripStatus field on HopperzVoter, sorted
  by status group (on_trip → remote → out).
- `app/src/app/plan/hopperz/page.tsx` — remote/out indicators in list + grid.

### Build task index
- Fix trip / dates / status → read `src/hooks/useTrip.ts`, `src/hooks/useTripData.tsx`, `src/app/plan/admin/page.tsx`

---

## Hopperz Screen + Role Badges + Cross-Wing Locate Deep Link — 2026-06-14

### Hopperz tab & page
- `app/src/components/PlanNav.tsx` — 5-tab flex row: Cities, Availability,
  Results, Hopperz, Hopp. Vertical divider before cross-wing Hopp tab.
  Hopp uses --ink-dim color.
- `app/src/app/plan/hopperz/page.tsx` — member list/grid with view toggle,
  tapping a member opens VoterProfileSheet.
- `app/src/hooks/useHopperz.ts` — data hook: voters + locations + roles +
  note counts → HopperzVoter[]. Sorted: you first, then A–Z.

### Role badges
- `app/src/components/RoleBadge.tsx` — pill badge (sm/md): crown/Admin for
  super_admin, shield/Moderator for moderator. Used in Hopperz page,
  ProfileOverlay Me tab hero, admin page user cards, VoterProfileSheet.

### Voter profile sheet
- `app/src/components/VoterProfileSheet.tsx` — BottomSheet: avatar, name,
  role badge, locate button (if sharing), about notes (fetched on demand),
  moderator toggle (super admin only).

### Cross-wing locate deep link
- `app/src/app/social/locate/page.tsx` — reads `?focus=voter_id` on mount,
  flies to that person's pin (or silently ignores if not sharing).
  Wrapped in Suspense for useSearchParams.

### Nav dividers
- `app/src/components/HopNav.tsx` — flex row with vertical divider before
  cross-wing Plan tab. Plan tab uses --ink-dim color.

### Moderator avatar long-press
- `app/src/components/ProfileAvatar.tsx` — moderators get 500ms long-press
  → /plan/admin via useAdminHold(500).
- `app/src/hooks/useAdminHold.ts` — accepts optional holdMs parameter.

### Admin page role display
- `app/src/app/plan/admin/page.tsx` — AdminVoter includes role field;
  fetch select updated; RoleBadge shown next to voter name.

### Build task index
- Fix Hopperz screen / voter profiles / role badges → read `src/hooks/useHopperz.ts`, `src/app/plan/hopperz/page.tsx`, `src/components/VoterProfileSheet.tsx`, `src/components/RoleBadge.tsx`, `src/lib/roles.ts`

---

## Profile Overhaul — Avatar Upload + Notes + Tabbed Layout + Role Foundation — 2026-06-14

### Profile tabbed layout
- `app/src/components/ProfileOverlay.tsx` — rebuilt with 3-tab structure:
  Me (avatar upload, role card, identity edit, switch identity),
  Trip (vote, availability, location, notifications),
  About (voter notes with add/delete).

### Avatar system
- `app/src/components/Avatar.tsx` — unified avatar component (photo or
  initials fallback). Used by ProfileAvatar, ProfileOverlay, and chat.
- `app/src/components/AvatarCropper.tsx` — canvas-based crop overlay:
  pinch to zoom, drag to pan, circular mask, 400x400 JPEG export.
- `app/src/components/ProfileAvatar.tsx` — updated to use Avatar component,
  reads avatar_url from voters array and localStorage cache.

### Role foundation
- `app/src/lib/roles.ts` — role system: getRoleForVoter, isSuperAdmin,
  isModerator, role labels/badge icons, moderator permissions/restrictions.
- RoleCard in ProfileOverlay: admin crown or moderator shield with
  permissions/restrictions columns.

### Data layer updates
- `app/src/lib/supabase.ts` — VoterRow extended with avatar_url, role;
  VoterNoteRow type added.
- `app/src/hooks/useGroupData.tsx` — select string updated for avatar_url
  and role; updateProfile supports avatar_url; setModeratorRole mutation;
  refetch syncs avatar_url to localStorage.
- `app/src/lib/identity.ts` — avatar URL localStorage cache
  (getStoredAvatarUrl, storeAvatarUrl); clearIdentity clears it.
- `app/src/lib/storage.ts` — uploadAvatar(blob, voterId) function.

### Chat avatar integration
- `app/src/app/social/page.tsx` — SenderAvatar updated to use Avatar
  component; voterMap includes avatar_url.

### Build task index
- Fix profile / avatar / notes → read `src/components/ProfileOverlay.tsx`, `src/components/AvatarCropper.tsx`, `src/components/Avatar.tsx`, `src/lib/storage.ts`, `src/lib/roles.ts`

---

## Chat Session E — Push Notification Foundation — 2026-06-14

### Push notification infrastructure
- `app/src/lib/push.ts` — client push helpers: isPushSupported, subscribeToPush,
  getExistingSubscription, unsubscribeFromPush, extractSubscriptionKeys.
- `app/src/lib/pushServer.ts` — server-side stubs: sendPushToVoter, sendPushToAll.
  Typed but no-op until VAPID keys configured + web-push installed.
- `app/src/hooks/usePushNotifications.ts` — React hook: permission, subscribed,
  requestPermission, unsubscribe. Saves to v2_push_subscriptions via Supabase.

### Service worker push handler
- `app/public/sw.js` — push event handler (parse JSON payload, showNotification)
  + notificationclick handler (focus existing window or open new one).

### Profile overlay notifications card
- `app/src/components/ProfileOverlay.tsx` — NotificationsCard inline component:
  Switch toggle, permission denied/default/granted states.

### Supabase migration
- `v2_push_subscriptions` table: voter_id, endpoint (unique), p256dh, auth,
  user_agent, timestamps. RLS anon_all policy. Index on voter_id.

### Build task index
- Wire push notification trigger → read `src/lib/push.ts`, `src/lib/pushServer.ts`, `src/hooks/usePushNotifications.ts`, `public/sw.js`

---

## Chat Session D — Camera Capture + Send — 2026-06-14

### Camera hook
- `app/src/hooks/useCamera.ts` — getUserMedia with ideal facingMode, flip between
  environment/user, canvas capture to JPEG data URL (0.92 quality), retake,
  permission denied / error states. Mirrors front camera in both viewfinder and capture.

### Camera page
- `app/src/app/social/camera/page.tsx` — full-screen camera: viewfinder with shutter
  and flip controls, post-capture with retake/send, permission denied and error states.
  Context detection via `?from=chat` param. From chat: uploads → navigates to
  `/social?pendingImage=...`. Standalone: Send to Chat or Save to Device options.
- `app/src/app/social/camera/layout.tsx` — bare layout (no HopShell), full-bleed camera.

### Chat page camera integration
- `app/src/app/social/page.tsx` — camera icon wired to `/social/camera?from=chat`.
  Handles `pendingImage` query param on mount (auto-sends uploaded camera photo via
  sendMessage, then clears param from URL).

### Build task index
- Fix camera / capture / send → read `src/hooks/useCamera.ts`, `src/app/social/camera/page.tsx`, `src/app/social/camera/layout.tsx`

---

## Chat Session C — Image Upload + Gallery + ImageViewer — 2026-06-14

### Storage helper
- `app/src/lib/storage.ts` — uploadChatImage: uploads to hoppz-media bucket,
  10MB cap, returns UploadResult (ok+url or error). Never throws.

### Image upload from input bar
- `app/src/app/social/page.tsx` — hidden file input (accept image/video/heic/heif/webp),
  add_photo_alternate icon triggers picker. handleImageUpload: validates size, shows
  optimistic uploading bubble, calls uploadChatImage, on success sendMessage(null, url),
  on error shows Toast.
- `app/src/hooks/useChat.ts` — sendMessage signature updated to
  (content: string | null, imageUrl?: string | null). At least one must be non-null.

### Image display + viewer
- `app/src/app/social/page.tsx` — image in bubble: lazy loading, aspect-ratio 4/3
  placeholder, tap expands to ImageViewer. Both image+text: image above, text below pt-1.
- `app/src/components/ImageViewer.tsx` — full-screen viewer: fixed inset-0 z-50,
  close (top-left), download (bottom-right), escape key, body scroll lock, fade-in.

### Gallery page
- `app/src/app/social/gallery/page.tsx` — 3-col square grid, day grouping with
  sticky headers, cursor pagination (30/page via GALLERY_PAGE_SIZE), jump-to-date
  BottomSheet, refresh button, empty/loading states, tap opens ImageViewer.
- `app/src/lib/chat.ts` — added GALLERY_PAGE_SIZE = 30.

### HopNav 5 tabs
- `app/src/components/HopNav.tsx` — added Gallery tab (photo_library icon,
  /social/gallery), grid-cols-5.

### Toast
- `app/src/components/Toast.tsx` — ephemeral notification above HopNav,
  auto-dismiss, fade in/out.

### Build task index
- Fix gallery / image upload / storage → read `src/lib/storage.ts`, `src/app/social/gallery/page.tsx`, `src/hooks/useChat.ts`

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
