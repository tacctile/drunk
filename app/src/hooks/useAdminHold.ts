"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const ADMIN_HOLD_MS = 3000;

// Module-level flag set true the moment a hold fires. Lets consuming
// components know a long-press just triggered navigation if they need it.
let didFire = false;

export function useAdminHold(holdMs = ADMIN_HOLD_MS, destination = "/plan/admin") {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) return;
    didFire = false;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      didFire = true;
      setHolding(false);
      router.push(destination);
    }, holdMs);
  }, [router, holdMs, destination]);

  useEffect(() => clear, [clear]);

  return {
    holding,
    handlers: {
      onPointerDown: start,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  };
}
