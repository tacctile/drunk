"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { HopShell } from "@/components/HopShell";
import { setLastWing } from "@/lib/auth";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => { setLastWing("social"); }, []);

  if (pathname.startsWith("/social/camera")) {
    return <>{children}</>;
  }

  return <HopShell>{children}</HopShell>;
}
