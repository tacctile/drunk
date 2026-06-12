"use client";

// Identity: a voter uuid + display name ("Nick B") in localStorage, backed by
// a v2_voters row whose 2-digit PIN (bcrypt hash, never plain text) lets the
// same person sign in from any device. localStorage keys are part of the
// product contract: bh2-voter-id, bh2-voter-name (see CONTEXT.md).

const ID_KEY = "bh2-voter-id";
const NAME_KEY = "bh2-voter-name";

export const MAX_FIRST_NAME_LENGTH = 15;

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode etc.) — identity lives for the session only
  }
}

export function newVoterId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable per-device voter id, generated on first call. */
export function getVoterId(): string {
  let id = safeGet(ID_KEY);
  if (!id) {
    id = newVoterId();
    safeSet(ID_KEY, id);
  }
  return id;
}

export function getStoredName(): string {
  return safeGet(NAME_KEY) ?? "";
}

/** Adopt an identity on this device — new account or cross-device sign-in. */
export function storeIdentity(voterId: string, displayName: string) {
  safeSet(ID_KEY, voterId);
  safeSet(NAME_KEY, displayName);
}

/** "Nick" + "b" → "Nick B"; null when either part is invalid. */
export function buildDisplayName(first: string, lastInitial: string): string | null {
  const f = first.trim().replace(/\s+/g, " ");
  const i = lastInitial.trim().toUpperCase();
  if (f.length < 1 || f.length > MAX_FIRST_NAME_LENGTH) return null;
  if (!/^[A-Za-z]$/.test(i)) return null;
  return `${f} ${i}`;
}

/** PINs are exactly two digits, 00–99. */
export function isValidPin(pin: string): boolean {
  return /^\d{2}$/.test(pin);
}
