"use client";

import { useCallback, useEffect, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { getSupabase } from "@/lib/supabase";
import {
  extractSubscriptionKeys,
  getExistingSubscription,
  getNotificationPermission,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

export interface PushNotificationsValue {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  requesting: boolean;
  requestPermission: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): PushNotificationsValue {
  const { voterId } = useGroupData();
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setPermission(getNotificationPermission());
    void getExistingSubscription().then((sub) => {
      setSubscribed(!!sub);
    });
  }, []);

  const saveSubscriptionToSupabase = useCallback(
    async (sub: PushSubscription) => {
      if (!voterId) return;
      const sb = getSupabase();
      if (!sb) return;
      const keys = extractSubscriptionKeys(sub);
      try {
        await sb.from("v2_push_subscriptions").upsert(
          {
            voter_id: voterId,
            endpoint: keys.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            user_agent:
              typeof navigator !== "undefined"
                ? navigator.userAgent.slice(0, 255)
                : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );
      } catch {
        // Silent — subscription still works locally even if storage fails
      }
    },
    [voterId],
  );

  const removeSubscriptionFromSupabase = useCallback(
    async (endpoint: string) => {
      if (!voterId) return;
      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb
          .from("v2_push_subscriptions")
          .delete()
          .eq("endpoint", endpoint)
          .eq("voter_id", voterId);
      } catch {
        // Silent
      }
    },
    [voterId],
  );

  const requestPermission = useCallback(async () => {
    if (requesting || !voterId) return;
    setRequesting(true);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setPermission("granted");
        setSubscribed(true);
        await saveSubscriptionToSupabase(sub);
      } else {
        setPermission(getNotificationPermission());
        setSubscribed(false);
      }
    } finally {
      setRequesting(false);
    }
  }, [requesting, voterId, saveSubscriptionToSupabase]);

  const unsubscribe = useCallback(async () => {
    const sub = await getExistingSubscription();
    if (sub) {
      await removeSubscriptionFromSupabase(sub.endpoint);
      await unsubscribeFromPush();
    }
    setSubscribed(false);
    setPermission(getNotificationPermission());
  }, [removeSubscriptionFromSupabase]);

  return {
    supported: isPushSupported(),
    permission,
    subscribed,
    requesting,
    requestPermission,
    unsubscribe,
  };
}
