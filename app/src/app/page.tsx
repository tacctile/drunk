"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

/**
 * Cold-open gate. Authenticated visitors land on the home wing-picker;
 * everyone else goes to the login screen. Renders nothing until the
 * localStorage check resolves so there's no flash of the wrong screen.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? "/home" : "/login");
  }, [router]);

  return null;
}
