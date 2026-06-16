import { getSupabase } from "@/lib/supabase";

export function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable
  }
}

export function lsRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
}

export function lsGetJson<T>(key: string): T | null {
  try {
    const raw = lsGet(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function lsSetJson(key: string, value: unknown): void {
  try {
    lsSet(key, JSON.stringify(value));
  } catch {
    // storage unavailable
  }
}

const BUCKET = "hoppz-media";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: "too-large" | "upload-failed" };

export async function uploadAvatar(
  blob: Blob,
  voterId: string,
): Promise<UploadResult> {
  if (blob.size > MAX_FILE_SIZE) return { ok: false, error: "too-large" };
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "upload-failed" };
  const path = `avatars/${voterId}.jpg`;
  try {
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(path, blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/jpeg",
      });
    if (error) return { ok: false, error: "upload-failed" };
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { ok: true, url: `${data.publicUrl}?t=${Date.now()}` };
  } catch {
    return { ok: false, error: "upload-failed" };
  }
}

export async function uploadChatImage(file: File): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: "too-large" };
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "upload-failed" };
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `chat/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  try {
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) return { ok: false, error: "upload-failed" };
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch {
    return { ok: false, error: "upload-failed" };
  }
}
