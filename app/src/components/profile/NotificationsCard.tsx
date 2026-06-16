"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Switch } from "@/components/Switch";

export function NotificationsCard() {
  const { supported, permission, subscribed, requesting, requestPermission, unsubscribe } =
    usePushNotifications();

  if (!supported) return null;

  return (
    <section>
      <h2 className="label">Notifications</h2>
      <div className="card mt-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base text-ink">Push notifications</p>
          <Switch
            checked={subscribed}
            disabled={requesting || permission === "denied"}
            onToggle={() => (subscribed ? void unsubscribe() : void requestPermission())}
            ariaLabel="Enable push notifications"
          />
        </div>
        {permission === "denied" && (
          <p className="text-meta font-normal text-ink-dim">
            Notifications blocked. Enable them in your browser settings.
          </p>
        )}
        {permission === "default" && !subscribed && (
          <p className="text-meta font-normal text-ink-dim">
            Get notified when your crew sends messages.
          </p>
        )}
        {subscribed && (
          <p className="text-meta font-normal text-green">Notifications enabled</p>
        )}
        <p className="mt-1 text-meta font-normal text-ink-dim">
          This only affects Hoppz notifications.
        </p>
      </div>
    </section>
  );
}
