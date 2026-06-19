# Hoppz — Progress
> Feature checklist for the v2 Next.js app (`app/`). Newest phase on top.

### 2026-06-19 — audit-fix: Fix admin long-press not navigating to /plan/admin

**What:** The 3-second long-press on bottom nav icons was not navigating to /plan/admin. Root cause: NAV items in PlanNav (desktop rail + mobile bar) and HopNav were `<Link>` elements with all of `adminHold.handlers` spread on them. When the hold fires, `router.push('/plan/admin')` is called, but the subsequent synthetic click event on the Link triggers Next.js navigation to the tab's own `href`, overriding the admin navigation. Fix: converted all NAV `<Link>` items to `<button>` elements that call `holdClick(e)` then conditionally `router.push(href)` if not prevented — the same pattern already used by the Hopp/Plan cross-wing buttons.

**Key Decisions:** The Hopp (PlanNav) and Plan (HopNav) cross-wing buttons already used the correct `<button>` + `router.push` pattern; extended that to all NAV items. Inline lambda `onClick={(e: MouseEvent) => navClick(e, href)}` uses explicit type annotation to avoid TS7006 implicit-any error on the `e` parameter.

**Status:** Complete. TypeScript passes (pre-existing module warnings only).

### 2026-06-19 — audit-fix: Nick V superadmin + hardcoded ID + nav hold on all tabs

**What:** Corrected superadmin seed name back to 'Nick V' (both name and display_name) in superadmin.ts. Hardcoded the SUPER_ADMIN_ID fallback UUID in roles.ts so the env var is optional — the superadmin works on any deploy without it set. Extended the 3-second admin hold (→ /plan/admin) to every bottom nav tab in PlanNav (both desktop rail and mobile bar) and HopNav; previously only the Results tab in PlanNav fired the hold. Verified wipeAllUsers in admin/page.tsx already guards all 5 tables with `.neq(voter_id, SUPERADMIN_VOTER_ID)` and calls ensureSuperadmin after — no change needed.

**Key Decisions:** All NAV Link items in PlanNav now spread `adminHold.handlers` directly (including onClick to swallow post-hold release taps), matching the existing pattern on the Results tab. HopNav nav Links get the same treatment; the Plan cross-wing button already had the hold via `holdHandlers` + `planClick`. HOLD_CLASS applied to all tabs so native context menus don't hijack long-press.

**Status:** Complete. TypeScript passes (pre-existing module warnings only).

### 2026-06-19 — audit-fix: Superadmin Knox V rename + root .claude cleanup

**What:** Corrected superadmin seed name from 'Nick V' to 'Knox V' in both `name` and `display_name` fields of `app/src/lib/superadmin.ts`. Verified all three superadmin guards are present in `admin/page.tsx` (deleteUser early return, wipeAllUsers neq chain + ensureSuperadmin call, delete button hidden). Verified ensureSuperadmin is called in useGroupData bootstrap useEffect. Deleted three misplaced files from repo root `.claude/` (CONTEXT.md, PROGRESS.md, STATE.yml).

**Status:** Complete. TypeScript passes (pre-existing module warnings only).

### 2026-06-16 — audit-fix: ImageViewer revert to blob anchor download

**What:** Reverted ImageViewer download from Web Share API back to simple blob anchor download. Removed all navigator.share/canShare/AbortError logic. Kept the slide-down tray notification ("Image saved", anim-tray, auto-hides after 2s) and the downloading spinner state.

**Status:** Complete. TypeScript passes (pre-existing module warnings only). Build passes clean.

### 2026-06-16 — audit-fix: ImageViewer Web Share API download + tray notification

**What:** Replaced anchor-based download in ImageViewer with Web Share API for native save-to-Photos on iOS/Android, falling back to blob anchor on desktop. Removed Toast component import/render and replaced with the same slide-down tray notification used on the camera screen (anim-tray class, "Image saved", auto-hides after 2s). Cancelling the share sheet shows no tray and no error (AbortError suppressed).

**Key Decisions:** Reused existing anim-tray CSS keyframe rather than adding new animation — matches camera screen UX exactly. useEffect auto-dismiss timer (2s) for tray vs relying on CSS animation-end, since tray state needs to be cleaned up for re-trigger.

**Status:** Complete. TypeScript passes (pre-existing module warnings only). Build passes clean.

### 2026-06-16 — audit-fix: Scroll button position + image download toast

**What:** Repositioned scroll-to-bottom button from 12px to 88px above nav+safe-area so it sits clearly inside the chat body. Replaced ImageViewer anchor-click download with fetch-based blob download for reliable mobile save-to-device. Added downloading spinner and Toast confirmation on success/failure.

**Status:** Complete. Both files pass typecheck (pre-existing module warnings only).

### 2026-06-16 — audit-fix: Fix initial chat scroll + add scroll-to-bottom button

**What:** Fixed initial-load scroll miss by using double requestAnimationFrame to guarantee DOM paint before scrollIntoView fires. Added a scroll-to-bottom arrow button (expand_circle_down icon, 44px circle, bg-surface with border and shadow-overlay) that appears when the user scrolls up and hides on tap or when at bottom. Existing "New message" pill kept intact for the different use case.

**Key Decisions:** Double-rAF only on initial scroll branch — subsequent new-message scrolls keep single rAF since DOM nodes are already present. showScrollButton state separate from showNewPill to serve distinct UX purposes.

**Status:** Complete. Typecheck passes (pre-existing module warnings only).

### 2026-06-16 — audit-fix: Fix chat scroll + add image download button

**What:** Replaced unreliable scrollToBottom callback with bottomRef.scrollIntoView via requestAnimationFrame for initial mount, new messages, send, and image upload. Updated ImageViewer download handler to properly append/remove the anchor element, extract filename from URL, and set target/rel attributes. Moved download button from bottom-right to top-right (24px icon, matching close button styling).

**Key Decisions:** Used `behavior: "instant"` everywhere instead of mixing auto/smooth — eliminates visible jump on mount and keeps scroll snappy on new messages.

**Status:** Complete. Both files pass typecheck (pre-existing module warnings only).

## Phase: Home Rebuild + TopBar Home Icon (2026-06-16)
- [x] TopBar: persistent Home icon button (home, 24px, --ink-muted) at top-left
- [x] TopBar: "HOME" label below icon (text-label uppercase, --ink-muted)
- [x] TopBar: Home button min 44px tap target, navigates to /home
- [x] TopBar: Home button persists on all screens (via TopBar global render)
- [x] Home: removed Quick Stats Row (4 horizontal stat chips)
- [x] Home: removed Quick Actions grid (2×2 card grid)
- [x] Home: removed Remote voter sub-row (merged into single avatar stack)
- [x] Home: removed all overflow-x-auto (no horizontal scrolling)
- [x] Home Section 1: Trip Anchor Card (rounded-card bg-surface border p-4 mx-4 mt-4)
- [x] Home Section 1: Top City with walkGrade badge inline (grade color tokens)
- [x] Home Section 1: Top Hotel from ranking[0] hotelPrefs[0] (highest tally)
- [x] Home Section 1: Best Weekend date pair as two equal-width pills
- [x] Home Section 1: Weekend pair label for Fri–Sat / Sat–Sun
- [x] Home Section 1: Thin --border dividers between sub-sections
- [x] Home Section 1: Empty states ("No votes yet", "No preference yet", "No dates yet")
- [x] Home Section 2: Who's Going header (text-label uppercase text-ink-muted)
- [x] Home Section 2: Avatar stack (44px, -ml-3 overlap, group-chat style)
- [x] Home Section 2: Order — city voters first, then remaining alphabetically
- [x] Home Section 2: Collapse threshold 7 (first 6 + overflow +N chip)
- [x] Home Section 2: Overflow chip opens Dialog with alphabetical voter list
- [x] Home Section 2: Dialog close button top-right (44px)
- [x] Home Section 2: No name labels under avatars in stacked row
- [x] Home Section 3: My Status (text-label uppercase text-ink-muted)
- [x] Home Section 3: Trip status Going/Remote/Out segmented buttons
- [x] Home Section 3: Going active: bg-green-dim border-green text-green
- [x] Home Section 3: Remote active: bg-accent-dim border-accent text-accent
- [x] Home Section 3: Out active: bg-red-dim border-red text-red
- [x] Home Section 3: Trip status mutation via useTripData().setMemberStatus
- [x] Home Section 3: Location sharing toggle (Switch, useLocations().toggleSharing)
- [x] Home Section 3: amDisabled opacity-40 pointer-events-none + "Disabled by admin."
- [x] Home Section 3: "This only affects Hoppz." helper text
- [x] Home Section 4: My Trip Actions (flex gap-3 px-4 pt-6 pb-32)
- [x] Home Section 4: Vote pill — how_to_vote icon, accent/green states, → /plan/cities
- [x] Home Section 4: Availability pill — event_available icon, accent/green states, → /plan/calendar
- [x] Home: Kept inline bottom bar (Plan / Hopp tabs) as-is
- [x] Home: No new Supabase queries (existing hooks only)
- [x] Home: Every interactive element ≥44px tall
- [x] Home: Dark only, all existing CSS variable tokens
- [x] Next.js build passes clean (44 routes)
- [x] .claude/ files updated (STATE.yml, PROGRESS.md)

## Phase: Audit 2 Remediation — Architecture Health Fixes (2026-06-14)
- [x] Middleware: bh2-role cookie check for /plan/admin (super_admin) and /plan/moderator (moderator|super_admin)
- [x] auth.ts: setRoleCookie, clearRoleCookie functions
- [x] useGroupData: sets role cookie after refetch, clears on sign-out
- [x] identity.ts: clearIdentity calls clearRoleCookie
- [x] Moderator page: removed client-side useEffect role guard (middleware handles it)
- [x] ErrorBoundary component created (class-based, fallback prop, retry button)
- [x] Root layout: ErrorBoundary wraps GroupDataProvider/TripDataProvider
- [x] Chat page: message list wrapped in ErrorBoundary with chat-specific fallback
- [x] Chat renderMessages replaced with useMemo (renderedMessages)
- [x] Gallery page: removed useChat import, direct Supabase insert for uploads
- [x] useLocations: voterColors derived from useGroupData voters (removed redundant v2_voters fetch)
- [x] useLocations: resetLocationStore() export added, called on sign-out
- [x] useHopperz: note count useEffect depends on stable voterIds string
- [x] Board SeeButton: h-8 → h-11 (44px minimum tap target)
- [x] Admin back button: /social/locate → /plan
- [x] Admin EditUserDialog first name: autoCapitalize="words"
- [x] Moderator CrewCard first name: autoCapitalize="words"
- [x] Chat input bar: aria-label on camera, upload, send buttons
- [x] Gallery refresh button: aria-label="Refresh gallery"
- [x] TypeScript check passes clean
- [x] ESLint passes (only pre-existing warnings)
- [x] Next.js build passes clean (44 routes)
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)

## Phase: Full Polish Pass — Known Issues + UX Fixes (2026-06-14)
- [x] Login: sign-in lookup verified (case-insensitive, trimmed, generic error)
- [x] Login: toggle links present with 44px tap targets
- [x] Login: Android install button opacity fixed (disabled:opacity-50)
- [x] Login: iOS instruction panel verified (max-height transition, correct text)
- [x] Login: install section hidden in standalone mode
- [x] Camera: shutter centering verified (absolute left:50% translateX(-50%))
- [x] Camera: icon styling verified (white + drop shadow, no bg fills)
- [x] Camera: retake verified (video always mounted, overlay pattern)
- [x] Camera: send + auto-save verified (upload → save → navigate)
- [x] Camera: flip label verified ("Flip" below cameraswitch icon)
- [x] Camera: back button verified (pre-capture top-left, post-capture absent)
- [x] Chat: scroll implementation verified (rAF + scrollTop, overflow-y-scroll)
- [x] Chat: input bar dimensions verified (py-0, border-t, safe area, h-10 buttons)
- [x] TopBar: three-column flex layout verified (wordmark, pip, avatar)
- [x] TopBar: trip status pip labels fixed (added "Today!" and "d away")
- [x] PlanNav: flex row with divider verified (not grid)
- [x] PlanNav: Hopp tab ink-dim color verified
- [x] HopNav: divider before Plan tab verified
- [x] HopNav: Plan tab ink-dim color verified
- [x] AppShell: suppressNav on /home verified
- [x] ProfileOverlay: three-tab structure verified (Me, Trip, About)
- [x] Hopperz: view toggle persistence to localStorage verified
- [x] Avatar: image fallback (onLoad/onError, initials circle) verified
- [x] Supabase: voter select includes avatar_url and role verified
- [x] Supabase: overlayLocal includes both fields verified
- [x] Supabase: refetch syncs avatar_url to localStorage verified
- [x] ProfileAvatar: moderator 500ms long-press → /plan/moderator verified
- [x] CONTEXT.md: localStorage contract updated (added bh2-hopperz-view)
- [x] TypeScript check passes clean
- [x] ESLint passes (only pre-existing warnings)
- [x] Next.js build passes clean (44 routes)
- [x] .claude/ files updated (STATE.yml, PROGRESS.md, CONTEXT.md)

## Phase: Home Screen Dashboard Overhaul (2026-06-14)
- [x] AppShell suppressNav: /home gets TopBar only (no PlanNav, no desktop flex)
- [x] Trip status hero: planning mode (edit_location_alt icon, CTA → /plan/cities)
- [x] Trip status hero: upcoming mode (city name, dates, countdown, hotels link)
- [x] Trip status hero: active mode (green bg, city, dates, Open Hopp CTA)
- [x] Countdown: "N days away" / "Tomorrow!" / "Today!" with accent/green coloring
- [x] Quick stats row: 4 chips (votes cast, leading city, best date, on-trip count)
- [x] Stats row: horizontal scroll, scrollbar hidden, flex-none chips
- [x] Who's In section: header with count, avatar row of on_trip members
- [x] Who's In: remote sub-row with wifi icon overlay (14px, bottom-right)
- [x] Who's In: empty state ("No crew yet — share the app with your crew.")
- [x] Who's In: tap avatar → /plan/hopperz
- [x] Who's In: if no members set status, all active voters shown as on_trip
- [x] Quick actions: 2x2 grid (Vote, Availability, Chat, Locate)
- [x] Quick actions: Vote completion state (green icon + "Vote Cast ✓")
- [x] Quick actions: Availability completion state (green icon + "Dates Marked ✓")
- [x] Quick actions: hover:bg-raised transition on all cards
- [x] Home bottom bar: fixed, 64px + safe area, bg-surface, border-t
- [x] Home bottom bar: Plan (map icon) + Hopp (sports_bar icon) with divider
- [x] Home bottom bar: setLastWing + router.push on tap
- [x] Loading state: skeleton hero (h-48), stats (4x h-20), avatars (5x h-16)
- [x] Old wing picker cards removed
- [x] TypeScript check passes clean
- [x] ESLint passes (only pre-existing warnings)
- [x] Next.js build passes clean
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)

## Phase: Moderator Admin Screen (2026-06-14)
- [x] /plan/moderator route created (client component)
- [x] Moderator access guard: redirects non-moderators to /plan
- [x] Sticky header: back arrow → /plan, title "Crew Management"
- [x] Section 1: Your Role card (RoleBadge md, permissions/restrictions columns)
- [x] Section 2: TripSetupPanel (shared) with canClear=false
- [x] Section 3: Crew Members (active voters, A-Z sorted)
- [x] Crew cards: Avatar(40), name, RoleBadge sm, trip status chip
- [x] Crew: Edit Name inline expansion (first + initial, save/cancel)
- [x] Crew: Reset PIN inline expansion (new PIN + confirm, bcrypt hash)
- [x] Crew: Trip Status selector (on_trip/remote/out buttons)
- [x] Crew: No pin_plain display, no is_active toggle, no delete
- [x] Section 4: ActiveLocationsPanel (shared, self-contained)
- [x] Section 5: TripResetsPanel (shared, reset votes + availability)
- [x] TripSetupPanel extracted from admin/page.tsx (canClear prop)
- [x] ActiveLocationsPanel extracted from admin/page.tsx (self-contained fetch)
- [x] TripResetsPanel extracted from admin/page.tsx (ConfirmResetDialog included)
- [x] Admin page refactored to use shared components
- [x] Admin page retains: Registered Users, Data Health, Danger Zone
- [x] ProfileAvatar routes moderators to /plan/moderator (not /plan/admin)
- [x] useAdminHold accepts destination parameter (default /plan/admin)
- [x] TopBar hides on /plan/moderator (page has own header)
- [x] MODERATOR_PERMISSIONS updated: "Edit user display names", "Reset user PINs"
- [x] RBAC system complete (super_admin → admin, moderator → moderator screen)
- [x] Middleware /plan/:path* already covers /plan/moderator — verified
- [x] TypeScript check passes clean
- [x] ESLint passes (only pre-existing warnings)
- [x] Next.js build passes clean
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)

## Phase: Trip Entity — Core System (2026-06-14)
- [x] TripRow, TripHotelRow, TripHotelAssignmentRow, TripMemberRow types in supabase.ts
- [x] TripStatus, TripMemberStatus type enums in supabase.ts
- [x] useTrip.ts hook: fetch all 4 trip tables, realtime channel "hoppz-trip"
- [x] useTrip.ts: syncTripStatus auto-transitions based on date comparison
- [x] useTrip.ts: effectiveStatus, daysUntil, cityName derivations
- [x] useTrip.ts: setTripDates, setTripCity, clearTripDates mutations
- [x] useTrip.ts: addHotel, removeHotel, assignVoterToHotel, unassignVoterFromHotel mutations
- [x] useTrip.ts: setMemberStatus mutation (upsert with optimistic update)
- [x] useTripData.tsx: TripDataProvider context + useTripData hook
- [x] layout.tsx: TripDataProvider mounted inside GroupDataProvider
- [x] TopBar.tsx: three-column flex (wordmark, trip pill, avatar)
- [x] TopBar.tsx: upcoming pill (calendar_month + days count / "Tomorrow")
- [x] TopBar.tsx: active pill (sports_bar + "On Trip")
- [x] TopBar.tsx: planning renders empty center
- [x] admin/page.tsx: TripSetupSection component (Super Admin + Moderator only)
- [x] admin/page.tsx: status display with colored dot
- [x] admin/page.tsx: city selector dropdown (cities data)
- [x] admin/page.tsx: date pickers with validation (end >= start)
- [x] admin/page.tsx: hotels list with remove + assignment panel
- [x] admin/page.tsx: hotel assignment checkboxes (auto-unassign from other hotels)
- [x] admin/page.tsx: add hotel input
- [x] admin/page.tsx: clear trip dates with inline confirmation
- [x] admin/page.tsx: votes lock info banner
- [x] admin/page.tsx: existing "Trip management" renamed to "Trip resets"
- [x] CityList.tsx: vote button disabled + opacity-40 when voting locked
- [x] CityDetail.tsx: ActionBar shows "Voting locked" when locked
- [x] VoterProfileSheet.tsx: trip status section (on_trip/remote/out display)
- [x] VoterProfileSheet.tsx: status change buttons for own sheet
- [x] VoterProfileSheet.tsx: status change buttons for super admin + moderator viewing others
- [x] useHopperz.ts: tripStatus field on HopperzVoter
- [x] useHopperz.ts: sort by status group (on_trip → remote → out, then A-Z)
- [x] hopperz/page.tsx: remote indicator (wifi icon + "Remote") in list view
- [x] hopperz/page.tsx: out chip in list view
- [x] hopperz/page.tsx: remote wifi icon in grid view
- [x] hopperz/page.tsx: opacity-50 on out voters in grid view
- [x] ProfileOverlay.tsx: TripStatusCard at top of Trip tab
- [x] ProfileOverlay.tsx: on_trip/remote/out toggle buttons
- [x] TypeScript check passes clean
- [x] ESLint passes (only pre-existing warnings)
- [x] Next.js build passes clean
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)

## Phase: Hopperz Screen + Role Badges + Cross-Wing Locate Deep Link (2026-06-14)
- [x] PlanNav updated: 5-tab flex row (Cities, Availability, Results, Hopperz, Hopp)
- [x] PlanNav vertical divider before cross-wing Hopp tab
- [x] PlanNav Hopp tab uses --ink-dim color
- [x] PlanNav desktop rail includes Hopperz tab + horizontal divider before Hopp
- [x] /plan/hopperz page created (client component, uses AppShell via plan/layout)
- [x] Hopperz list view: avatar, name, role badge, note count, sharing indicator, chevron
- [x] Hopperz grid view: 3-col grid, avatar, name, role badge, sharing dot
- [x] Hopperz view toggle persisted to localStorage (bh2-hopperz-view)
- [x] Hopperz member count in page header
- [x] Hopperz empty state (group icon + "No crew yet")
- [x] Hopperz "You" row highlighted with bg-raised
- [x] useHopperz hook: voters + locations + roles + note counts → HopperzVoter[]
- [x] useHopperz fetches v2_voter_notes count per voter on mount
- [x] useHopperz sorted: you first, then display_name A–Z
- [x] RoleBadge component (sm: 14px icon + 11px text, md: 16px icon + 13px text)
- [x] RoleBadge: super_admin = crown + bg-accent-dim, moderator = shield + bg-green-dim
- [x] RoleBadge imported into Hopperz page (list + grid)
- [x] RoleBadge imported into ProfileOverlay Me tab hero (md size, below display name)
- [x] RoleBadge imported into admin page (sm size, next to voter name)
- [x] VoterProfileSheet component (BottomSheet, read-only voter profile)
- [x] VoterProfileSheet: avatar, name, role badge, "You" label
- [x] VoterProfileSheet: "Locate on map" button (only if sharing && !isYou)
- [x] VoterProfileSheet: about notes fetched on demand with loading skeleton
- [x] VoterProfileSheet: moderator toggle (super admin only, disabled for own sheet)
- [x] Cross-wing locate deep link: ?focus=voter_id on /social/locate
- [x] Locate page reads focus param, flies to voter, clears URL
- [x] Locate page wrapped in Suspense for useSearchParams
- [x] Hopperz onLocate handler: setLastWing("social") + router.push
- [x] HopNav updated: flex row with vertical divider before cross-wing Plan tab
- [x] HopNav Plan tab uses --ink-dim color
- [x] Moderator 500ms long-press on ProfileAvatar → /plan/admin
- [x] useAdminHold accepts optional holdMs parameter (default 3000)
- [x] Admin page AdminVoter interface includes role field
- [x] Admin page fetch select includes role column
- [x] Admin page voter cards show RoleBadge next to name
- [x] TypeScript check passes clean
- [x] ESLint passes (only pre-existing warnings)
- [x] Next.js build passes clean
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)

## Phase: Profile Overhaul — Avatar Upload + Notes + Tabbed Layout + Role Foundation (2026-06-14)
- [x] ProfileOverlay rebuilt with 3-tab layout (Me / Trip / About)
- [x] Tab bar: horizontal, full width, accent underline on active tab
- [x] Me tab: avatar upload + role card + identity edit + switch identity
- [x] Trip tab: vote card + availability card + location card + notifications card
- [x] About tab: voter notes with add/delete (v2_voter_notes)
- [x] Avatar component (src/components/Avatar.tsx) — photo or initials fallback
- [x] AvatarCropper component (src/components/AvatarCropper.tsx) — canvas crop overlay
- [x] Avatar upload flow: file picker → cropper → uploadAvatar → updateProfile
- [x] ProfileAvatar updated to use Avatar component with avatar_url support
- [x] Chat SenderAvatar updated to use Avatar component with avatar_url
- [x] src/lib/roles.ts — role system foundation (super_admin, moderator)
- [x] RoleCard in ProfileOverlay (admin crown / moderator shield + permissions)
- [x] VoterRow extended with avatar_url and role fields
- [x] VoterNoteRow type added to supabase.ts
- [x] useGroupData: select string updated, updateProfile supports avatar_url
- [x] useGroupData: setModeratorRole mutation added
- [x] useGroupData: refetch syncs avatar_url to localStorage
- [x] identity.ts: getStoredAvatarUrl, storeAvatarUrl, clearIdentity clears avatar
- [x] storage.ts: uploadAvatar function added
- [x] .env.example: NEXT_PUBLIC_SUPER_ADMIN_ID added
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)
- [x] TypeScript check passes clean
- [x] Next.js build passes clean

## Phase: Camera + Chat + Gallery Polish Pass (2026-06-14)
- [x] Chat scroll jitter fix — scrollTop instead of scrollIntoView, requestAnimationFrame
- [x] Chat scroll container — overflow-y-scroll, flex-col justify-start with spacer div
- [x] Chat initial scroll uses "auto", new messages use "smooth" only if near bottom
- [x] Camera shutter centering — absolute positioned independently (left:50% translateX)
- [x] Camera shutter style — 72px ring (4px white border) + 60px white fill
- [x] Camera flip button — absolute right:32px, icon + "Flip" label, drop shadow, no bg
- [x] Camera post-capture controls — clean icon + label only, no gray circles
- [x] Camera retake fix — video always mounted, captured image overlays, stream never stopped
- [x] Camera send flow unified — always uploads to Supabase + saves to device simultaneously
- [x] Camera standalone two-option flow removed — single Send button does both actions
- [x] Camera send loading state — animate-pulse on icon, non-interactive during upload
- [x] Gallery upload button — floating bottom-left, btn-ghost style, triggers file picker
- [x] Gallery upload flow — validates size, uploads via uploadChatImage, sends via useChat
- [x] Gallery Toast for upload errors
- [x] Supabase Storage policies corrected externally (storage.objects scope)
- [x] All Session A/B/C/D/E features verified intact (typecheck + lint + build pass clean)
- [x] .claude/ files updated (STATE.yml, PROGRESS.md)

## Phase: Chat Session E — Push Notification Foundation (2026-06-14)
- [x] v2_push_subscriptions Supabase table (migration applied, RLS, index)
- [x] PushSubscriptionRow type added to src/lib/supabase.ts
- [x] src/lib/push.ts — client push helpers (isPushSupported, subscribeToPush, etc.)
- [x] src/lib/pushServer.ts — server stubs (sendPushToVoter, sendPushToAll)
- [x] src/hooks/usePushNotifications.ts — React hook (permission, subscribe, unsubscribe)
- [x] public/sw.js — push event handler + notificationclick handler appended
- [x] NotificationsCard in ProfileOverlay (Switch toggle, permission states)
- [x] .env.example updated with VAPID key placeholders
- [x] VAPID comment added to sw.js header
- [x] No auto-prompt — permission requested only via profile toggle
- [x] All Session A/B/C/D features verified intact (typecheck + lint + build pass clean)
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)
- [x] Chat foundation complete (Sessions A–E)

## Phase: Chat Session D — Camera Capture + Send (2026-06-14)
- [x] src/hooks/useCamera.ts — getUserMedia, flip, canvas capture, retake, permission/error
- [x] src/app/social/camera/layout.tsx — bare layout (no HopShell, full-bleed camera)
- [x] src/app/social/camera/page.tsx — full-screen camera: viewfinder, shutter, flip, post-capture
- [x] Camera context detection via ?from=chat search param
- [x] Post-capture from chat: upload → navigate /social?pendingImage=...
- [x] Post-capture standalone: Send to Chat + Save to Device options
- [x] Chat page handles pendingImage query param (auto-sends, clears URL)
- [x] Camera icon in chat input bar wired to /social/camera?from=chat
- [x] Permission denied state: icon, message, Go back button
- [x] Error state: icon, error message, Try again + Go back buttons
- [x] Front camera mirroring (viewfinder scaleX(-1) + canvas mirrored capture)
- [x] Multiple camera detection via enumerateDevices (flip button hidden if single camera)
- [x] Suspense boundaries for useSearchParams on camera and chat pages
- [x] All Session A/B/C features verified intact (typecheck + build pass clean)
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)

## Phase: Chat Session C — Image Upload + Gallery (2026-06-14)
- [x] src/lib/storage.ts — uploadChatImage (hoppz-media bucket, 10MB cap, never throws)
- [x] Image upload from input bar — file picker, optimistic uploading bubble, error toast
- [x] sendMessage signature updated: (content: string | null, imageUrl?: string | null)
- [x] Image display in chat bubbles — lazy loading, aspect-ratio 4/3 placeholder, pt-1 spacing
- [x] ImageViewer component — full-screen overlay, close/download, escape, scroll lock, fade-in
- [x] Tap image in bubble → opens ImageViewer (replaced console.log placeholder)
- [x] Gallery page at /social/gallery — 3-col square grid, day grouping, sticky headers
- [x] Gallery cursor pagination (30/page via GALLERY_PAGE_SIZE, IntersectionObserver sentinel)
- [x] Gallery jump-to-date BottomSheet with date list and image counts
- [x] Gallery empty state + loading skeleton state
- [x] Gallery refresh button
- [x] HopNav updated to 5 tabs: Chat, Camera, Gallery, Locate, Plan (grid-cols-5)
- [x] Toast component for upload errors (ephemeral, auto-dismiss, fade in/out)
- [x] Input bar layout: camera (left), textarea, add_photo_alternate + send (right)
- [x] GALLERY_PAGE_SIZE = 30 added to lib/chat.ts
- [x] All Session A/B features verified intact (typecheck + build pass clean)
- [x] .claude/ files updated (CONTEXT.md, BUILD_INDEX.md, STATE.yml, PROGRESS.md)

## Phase: Chat Session B — Reactions + Read Receipts + Reply (2026-06-14)
- [x] Reactions: long-press (500ms) opens emoji picker (8 emojis from EMOJI_REACTIONS)
- [x] Reaction pills below bubbles — grouped by emoji, count, own-reaction accent border
- [x] One reaction per person per message (swap behavior via remove + add)
- [x] Optimistic addReaction / removeReaction in useChat hook
- [x] Read receipts: 1 reader → 16px avatar, 2 readers → overlapping avatars, 3+ → "Seen by X"
- [x] "Seen by X" tap → BottomSheet with reader list (avatar + name + time)
- [x] markRead fires optimistically (updates local reads state before server call)
- [x] Reply: swipe right on mobile (40px threshold, 8px nudge animation)
- [x] Reply: hover reply button on desktop (appears to side of bubble)
- [x] Reply preview bar above input with close button
- [x] Quoted reply preview inside message bubble with scroll-to-original on tap
- [x] Long-press / swipe conflict resolution (10px movement cancels long-press timer)
- [x] useChat reactions/reads refactored from flat arrays to Record<string, Row[]>
- [x] groupReactions helper in lib/chat.ts
- [x] sendMessage includes reply_to_id when replyingTo is set
- [x] Realtime subscription updates Record-keyed state correctly
- [x] All Session A features verified intact (grouping, day dividers, timestamps, etc.)
- [x] typecheck and build pass clean

## Phase: Chat Session A — Fix Double TopBar + Chat Core (2026-06-14)
- [x] Fixed double TopBar on /social/* routes (AppShell bypasses shell for social)
- [x] Chat page at /social — full message list with grouping, day dividers, scroll behavior
- [x] useChat hook — messages, reactions, reads, realtime (channel "hoppz-chat")
- [x] Optimistic sendMessage with temp id → server id swap
- [x] deleteMessage — optimistic is_deleted flip + server update
- [x] markRead via IntersectionObserver (fire-and-forget upsert)
- [x] Pagination — loadMore when scrolled near top, scroll position preserved
- [x] Input bar — auto-grow textarea, Enter to send (desktop), camera/gallery/send buttons
- [x] Empty state — sports_bar icon + "No messages yet" + "Send the first one"
- [x] "New message ↓" pill when scrolled up and new messages arrive
- [x] lib/chat.ts — MessageRow, ReactionRow, ReadRow types; helpers; constants
- [x] supabase.ts — re-exports MessageRow; adds MessageReadRow, MessageReactionRow
- [x] typecheck and build pass clean
- [x] Gallery button → file upload picker (Session C)
- [x] Image expand → ImageViewer overlay (Session C)
- [x] Camera button wired to /social/camera?from=chat (Session D)

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
- [x] Session D: camera capture
- [x] Session E: push notification foundation
- [ ] Wire push notification triggers (new message, reaction, etc.)
- [ ] Generate VAPID keys and configure env vars
- [ ] More cities in `data/cities.ts`
