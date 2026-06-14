/**
 * SETUP REQUIRED BEFORE PUSH NOTIFICATIONS WORK:
 * 1. Run: npx web-push generate-vapid-keys
 * 2. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local and Vercel env vars
 * 3. Add VAPID_PRIVATE_KEY to .env.local and Vercel env vars (server-side only)
 * 4. Add VAPID_MAILTO to .env.local and Vercel env vars
 * 5. Deploy — the service worker will pick up the public key automatically
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "default";
  return Notification.permission;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
    return subscription;
  } catch {
    return null;
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getExistingSubscription();
  if (subscription) await subscription.unsubscribe();
}

export function extractSubscriptionKeys(sub: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
} {
  const keys = sub.toJSON().keys ?? {};
  return {
    endpoint: sub.endpoint,
    p256dh: keys.p256dh ?? "",
    auth: keys.auth ?? "",
  };
}
