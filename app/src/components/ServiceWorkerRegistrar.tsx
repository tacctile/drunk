"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker once, after first load so it never
 * competes with first paint. Mounted in the root layout; a no-op where the
 * browser has no service worker support.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failed — the app still works fully online.
      });
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
