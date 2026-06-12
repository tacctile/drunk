import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { IdentityWatcher } from "@/components/NamePrompt";
import { GroupDataProvider } from "@/hooks/useGroupData";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bar Hoppers",
  description:
    "Plan the next overnight bar-hop from Ralston: pick a city, pick a hotel steps from the bars, find the weekend everyone's free.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0D14",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400..700,0..1,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <GroupDataProvider>
          <AppShell>{children}</AppShell>
          {/* Auto-opens the return-user flow when the stored identity can't be verified */}
          <IdentityWatcher />
        </GroupDataProvider>
      </body>
    </html>
  );
}
