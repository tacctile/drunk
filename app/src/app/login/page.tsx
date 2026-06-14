"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { IdentityForm } from "@/components/NamePrompt";
import { isAuthenticated, mirrorAuthCookie, setLastWing } from "@/lib/auth";

/** The slice of the Add-to-Home-Screen event we actually use. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Full-screen login / create screen — its own layout, no AppShell chrome
 * (the AppShell renders bare on /login). Wordmark + tagline up top, the shared
 * identity form in the middle, and an Install App section at the bottom that
 * adapts to the platform.
 */
export default function LoginPage() {
  const router = useRouter();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  // A deep link bounced here while already signed in — go straight in.
  useEffect(() => {
    if (isAuthenticated()) router.replace("/home");
  }, [router]);

  // Capture the install prompt (Android/desktop Chrome) and notice when we're
  // already running as an installed app.
  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const enterApp = () => {
    mirrorAuthCookie();
    setLastWing("plan");
    router.replace("/plan");
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
      <header className="pt-16 text-center">
        <h1 className="text-display text-ink">Bar Hoppers</h1>
        <p className="mt-2 text-base text-ink-muted">Plan the perfect overnight bar hop</p>
      </header>

      <div className="mt-10">
        <IdentityForm flow="new" autoFocus={false} onDone={enterApp} />
      </div>

      {!standalone && (
        <section className="mt-auto border-t pt-6">
          <h2 className="label pb-3">Install App</h2>
          {installEvent && (
            <button type="button" onClick={() => void install()} className="btn-ghost w-full">
              <Icon name="add_to_home_screen" size={20} />
              Add to Home Screen
            </button>
          )}
          <p className="mt-3 text-meta font-normal text-ink-dim">
            On iPhone: tap the Share button (□↑) then &lsquo;Add to Home Screen&rsquo;
          </p>
        </section>
      )}
    </main>
  );
}
