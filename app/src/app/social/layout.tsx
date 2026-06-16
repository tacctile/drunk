"use client";

import { useEffect } from "react";
import { HopShell } from "@/components/HopShell";
import { setLastWing } from "@/lib/auth";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => { setLastWing("social"); }, []);
  return <HopShell>{children}</HopShell>;
}
