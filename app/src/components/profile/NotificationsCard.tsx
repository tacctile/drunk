"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { SectionLabel, Card, SettingsToggleRow } from "@hoppz-ui";

export function NotificationsCard() {
  const { supported, permission, subscribed, requesting, requestPermission, unsubscribe } =
    usePushNotifications();

  if (!supported) return null;

  return (
    <section>
      <SectionLabel>Notifications</SectionLabel>
      <Card className="mt-2">
        <SettingsToggleRow
          icon="notifications"
          title="Push notifications"
          description={subscribed ? "Notifications enabled" : permission === "denied" ? "Blocked in browser settings" : "Get notified when your crew sends messages"}
          checked={subscribed}
          onChange={() => (subscribed ? void unsubscribe() : void requestPermission())}
          disabled={requesting || permission === "denied"}
        />
        <p className="mt-1 text-meta font-normal text-ink-dim">
          This only affects Hoppz notifications.
        </p>
      </Card>
    </section>
  );
}
