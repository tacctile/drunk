import { getSupabase } from "@/lib/supabase";

const BUCKET = "hoppz-media";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: "too-large" | "upload-failed" };

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
