/**
 * Server-side push notification sender.
 *
 * REQUIRES: web-push npm package (do NOT install yet — add when first trigger is wired)
 * REQUIRES: VAPID keys in environment variables (see .env.example)
 *
 * Usage (future):
 *   import { sendPushToVoter } from "@/lib/pushServer";
 *   await sendPushToVoter(voterId, { title: "New message", body: "Nick B: Hey!" });
 */

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushToVoter(
  _voterId: string,
  _payload: PushPayload,
): Promise<void> {
  // TODO: Implement when VAPID keys are configured
  //
  // const webpush = await import("web-push");
  // webpush.setVapidDetails(
  //   process.env.VAPID_MAILTO!,
  //   process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  //   process.env.VAPID_PRIVATE_KEY!,
  // );
  //
  // const sb = getSupabaseAdmin(); // needs service role key for server use
  // const { data: subs } = await sb
  //   .from("v2_push_subscriptions")
  //   .select("*")
  //   .eq("voter_id", _voterId);
  //
  // await Promise.allSettled(
  //   (subs ?? []).map((sub) =>
  //     webpush.sendNotification(
  //       { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
  //       JSON.stringify(_payload),
  //     ),
  //   ),
  // );

  console.log("[pushServer] Push stub called — VAPID keys not yet configured");
}

export async function sendPushToAll(
  _excludeVoterId: string | null,
  _payload: PushPayload,
): Promise<void> {
  // TODO: Implement when VAPID keys are configured
  console.log("[pushServer] Push stub called — VAPID keys not yet configured");
}
