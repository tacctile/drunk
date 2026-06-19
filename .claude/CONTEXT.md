# Codebase Context

## Project structure
- `app/` — Next.js 14 app (src layout)
  - `src/app/` — pages (plan, social, home, login, layout)
  - `src/hooks/` — React hooks (useGroupData, useChat, useLocations, etc.)
  - `src/lib/` — pure utilities (supabase client, auth, identity, chat helpers, colors, roles, superadmin)
  - `src/components/` — shared UI components

## Key files

### Identity & auth
- `src/lib/identity.ts` — localStorage keys, `getVoterId()`, `storeIdentity()`
- `src/lib/auth.ts` — auth cookie, role cookie helpers
- `src/lib/roles.ts` — `getRoleForVoter()`, `isSuperAdmin()`

### Superadmin
- `src/lib/superadmin.ts` — **NEW**
  - `SUPERADMIN_VOTER_ID = "00000000-0000-0000-0000-000000000001"` (stable hardcoded uuid)
  - `ensureSuperadmin(supabase)` — upserts Nick V row, PIN "12", role "super_admin", color PIN_COLORS[0]
  - Called from `useGroupData.tsx` bootstrap useEffect on every cold load

### Data layer
- `src/lib/supabase.ts` — `getSupabase()` singleton, table row type interfaces
- `src/hooks/useGroupData.tsx` — `GroupDataProvider`, voter roster, city/hotel votes, identity
- `src/hooks/useChat.ts` — chat messages, reactions, reads; `hardDeleteMessage` exposed

### Chat tables (Supabase)
- `v2_messages` — chat messages (`id`, `voter_id`, `content`, `image_url`, `reply_to_id`, `is_deleted`)
- `v2_message_reads` — read receipts (`message_id`, `voter_id`, `read_at`)
- `v2_message_reactions` — emoji reactions (`message_id`, `voter_id`, `emoji`, `created_at`)

### PIN colors
- `src/lib/colors.ts` — `PIN_COLORS` array; index 0 = `#FF8C42` (superadmin's color)

## localStorage contract
- `bh2-voter-id` — voter uuid
- `bh2-voter-name` — display name
- `bh2-pin-color` — cached pin color
- `bh2-avatar-url` — cached avatar URL
- `bh2-auth` — session cookie ("1")
- `bh2-role` — role cookie ("super_admin" | "moderator")

## Supabase voters table (v2_voters)
Columns: `voter_id`, `name`, `display_name`, `pin_hash`, `pin_plain`, `pin_color`, `is_active`, `avatar_url`, `role`, `created_at`, `updated_at`

## Admin page
- `src/app/plan/admin/page.tsx` — user management, trip resets, danger zone
- Superadmin voter ID is protected: delete button hidden, early return in deleteUser
- Wipe All Users excludes superadmin row, calls ensureSuperadmin after
- Wipe All Chat Messages: deletes reads → reactions → messages

## Chat page
- `src/app/social/page.tsx` — chat UI with long-press reaction picker
- Superadmin sees trash icon in reaction picker overlay for hard-delete on any message
- Hard-deleted messages removed from DB and local state entirely (no is_deleted placeholder)
