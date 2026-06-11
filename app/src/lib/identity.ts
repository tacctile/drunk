"use client";

// Frictionless identity: a device-local UUID plus a first name. No auth, no
// cross-device sync. localStorage keys are part of the product contract:
// bh2-voter-id, bh2-voter-name (see CONTEXT.md for the full key list).

const ID_KEY = "bh2-voter-id";
const NAME_KEY = "bh2-voter-name";

export const MAX_NAME_LENGTH = 20;

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

/** Stable per-device voter id, generated on first call. */
export function getVoterId(): string {
  let id = safeGet(ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    safeSet(ID_KEY, id);
  }
  return id;
}

export function getStoredName(): string {
  return safeGet(NAME_KEY) ?? "";
}

export function storeName(name: string) {
  safeSet(NAME_KEY, name);
}

/** First name only, max 20 chars, never empty. */
export function sanitizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH).trim();
}
