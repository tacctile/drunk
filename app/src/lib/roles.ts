export type UserRole = "super_admin" | "moderator" | null;

// Hardcoded superadmin voter ids. Kept in sync with SUPERADMIN_SEEDS in
// lib/superadmin.ts (and the matching list in middleware.ts, which can't import
// from here without pulling bcrypt into the edge bundle). An optional env id is
// appended so a deploy can name its own superadmin.
const SUPER_ADMIN_IDS: string[] = [
  "00000000-0000-0000-0000-000000000001", // Nick V
  "00000000-0000-0000-0000-000000000002", // Knox V
];
const ENV_SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
if (ENV_SUPER_ADMIN_ID && !SUPER_ADMIN_IDS.includes(ENV_SUPER_ADMIN_ID)) {
  SUPER_ADMIN_IDS.push(ENV_SUPER_ADMIN_ID);
}

export function getRoleForVoter(voterId: string, roleField: string | null): UserRole {
  if (!voterId) return null;
  if (isSuperAdmin(voterId)) return "super_admin";
  if (roleField === "moderator") return "moderator";
  return null;
}

export function isSuperAdmin(voterId: string): boolean {
  return Boolean(voterId) && SUPER_ADMIN_IDS.includes(voterId);
}

export function isModerator(roleField: string | null): boolean {
  return roleField === "moderator";
}

export const ROLE_LABELS: Record<NonNullable<UserRole>, string> = {
  super_admin: "Admin",
  moderator: "Moderator",
};

export const ROLE_BADGE_ICONS: Record<NonNullable<UserRole>, string> = {
  super_admin: "crown",
  moderator: "shield",
};

export const MODERATOR_PERMISSIONS = [
  "Edit user display names",
  "Reset user PINs",
  "Toggle trip status for any user",
  "Force-expire user locations",
  "Reset all votes",
  "Reset all availability",
  "Manage trip dates",
];

export const MODERATOR_RESTRICTIONS = [
  "Delete users",
  "Wipe all data",
  "Assign or revoke roles",
  "Access destructive admin actions",
];
