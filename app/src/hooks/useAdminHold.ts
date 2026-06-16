"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { setRoleCookie } from "@/lib/auth";
import { getVoterId } from "@/lib/identity";
import { getRoleForVoter } from "@/lib/roles";

const ADMIN_HOLD_MS = 3000;

export function useAdminHold(holdMs = ADMIN_HOLD_MS, destination = "/plan/admin") {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const [holding, setHolding] = useState(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) return;
    firedRef.current = false;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      firedRef.current = true;
      setHolding(false);
      const voterId = getVoterId();
      if (voterId) {
        const role = getRoleForVoter(voterId, null);
        if (role) setRoleCookie(role);
      }
      window.location.href = destination;
    }, holdMs);
  }, [holdMs, destination]);

  useEffect(() => cancel, [cancel]);

  const onClick = useCallback((e: MouseEvent) => {
    if (firedRef.current) {
      e.preventDefault();
      firedRef.current = false;
    }
  }, []);

  return {
    holding,
    handlers: {
      onMouseDown: start,
      onTouchStart: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchEnd: cancel,
      onTouchCancel: cancel,
      onClick,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
      draggable: false,
    },
  };
}
