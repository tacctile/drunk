export type UserRole = "super_admin" | "moderator" | null;

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID ?? "";

export function getRoleForVoter(voterId: string, roleField: string | null): UserRole {
  if (!voterId) return null;
  if (SUPER_ADMIN_ID && voterId === SUPER_ADMIN_ID) return "super_admin";
  if (roleField === "moderator") return "moderator";
  return null;
}

export function isSuperAdmin(voterId: string): boolean {
  return Boolean(SUPER_ADMIN_ID && voterId === SUPER_ADMIN_ID);
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
  "Edit user display names and PINs",
  "View user PINs",
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
