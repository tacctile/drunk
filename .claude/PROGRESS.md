# Hoppz — Progress
> Feature checklist for the v2 Next.js app (`app/`). Newest phase on top.

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
