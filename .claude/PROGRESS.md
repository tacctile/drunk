# Progress Log

## 2026-06-19 — Superadmin protection + chat management

### Features added

**`src/lib/superadmin.ts`** (new file)
- `SUPERADMIN_VOTER_ID = "00000000-0000-0000-0000-000000000001"` — stable hardcoded uuid
- `ensureSuperadmin(supabase)` — idempotent upsert of Nick V / PIN "12" / role "super_admin"

**`src/hooks/useGroupData.tsx`**
- Bootstrap useEffect now calls `ensureSuperadmin(sb)` on every cold app load (silent, no UI)

**`src/hooks/useChat.ts`**
- Added `hardDeleteMessage(messageId)` — deletes reads/reactions/message row entirely
- Added realtime DELETE listener for `v2_messages` so all clients drop the row from state
- `hardDeleteMessage` exposed in hook return value

**`src/app/plan/admin/page.tsx`**
- `deleteUser`: early return guard when `voterId === SUPERADMIN_VOTER_ID`
- `wipeAllUsers`: all 5 delete calls exclude superadmin via `.neq('voter_id', SUPERADMIN_VOTER_ID)`; `ensureSuperadmin` called after wipe
- Superadmin voter card: delete button conditionally hidden
- New "Wipe All Chat Messages" danger zone button with BottomSheet + DELETE confirmation
- Chat wipe deletes `v2_message_reads` → `v2_message_reactions` → `v2_messages`

**`src/app/social/page.tsx`**
- Imports `SUPERADMIN_VOTER_ID` from `@/lib/superadmin`
- Destructures `hardDeleteMessage` from `useChat()`
- Reaction picker overlay: trash icon appended for superadmin on every message
- Hard-deleted messages vanish entirely; no "deleted" placeholder
