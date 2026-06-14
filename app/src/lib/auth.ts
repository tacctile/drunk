"use client";

// Soft auth layer for the dual-wing shell. The real identity still lives in
// localStorage (bh2-voter-id + bh2-voter-name, written by the identity layer);
// here we read it, remember which wing the user was last in, and mirror a
// presence flag into a session cookie so the middleware can keep
// unauthenticated visitors off /home, /plan/*, and /social/* without a
// blank-screen flash. The cookie is NOT a security boundary — it only carries
// "1", never the identity itself.
//
// localStorage / cookie contract (see CONTEXT.md):
//   bh2-voter-id   — voter uuid (identity layer)
//   bh2-voter-name — display name (identity layer)
//   bh2-last-wing  — "plan" | "social", last wing entered
//   bh2-auth       — session cookie, "1" while a name is stored

const VOTER_ID_KEY = "bh2-voter-id";
const VOTER_NAME_KEY = "bh2-voter-name";
const LAST_WING_KEY = "bh2-last-wing";
const AUTH_COOKIE = "bh2-auth";

export type Wing = "plan" | "social";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Session-scoped (no expiry) presence flag the middleware reads. */
export function mirrorAuthCookie(): void {
  try {
    document.cookie = `${AUTH_COOKIE}=1; path=/; SameSite=Lax`;
  } catch {
    // cookies unavailable — the soft guard simply won't apply
  }
}

/** Drop the presence flag — called from clearIdentity on sign-out. */
export function clearAuthCookie(): void {
  try {
    document.cookie = `${AUTH_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    // nothing to forget
  }
}

/**
 * True when a usable identity is stored on this device. As a side effect it
 * mirrors the presence flag into the auth cookie so the next protected
 * navigation passes the middleware.
 */
export function isAuthenticated(): boolean {
  const id = safeGet(VOTER_ID_KEY);
  const name = safeGet(VOTER_NAME_KEY);
  const ok = Boolean(id && name);
  if (ok) mirrorAuthCookie();
  return ok;
}

/** Which wing to resume into; defaults to the plan wing. */
export function getLastWing(): Wing {
  return safeGet(LAST_WING_KEY) === "social" ? "social" : "plan";
}

/** Remember the wing the user just entered. */
export function setLastWing(wing: Wing): void {
  try {
    window.localStorage.setItem(LAST_WING_KEY, wing);
  } catch {
    // storage unavailable — resume defaults to the plan wing
  }
}
