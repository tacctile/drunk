"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGroupData } from "@/hooks/useGroupData";
import { isAuthenticated, mirrorAuthCookie, setLastWing } from "@/lib/auth";
import { isValidPin, MAX_FIRST_NAME_LENGTH } from "@/lib/identity";
import { FieldError } from "@/components/FieldError";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function LoginPage() {
  const router = useRouter();
  const { voters, createIdentity, signIn } = useGroupData();

  const [mode, setMode] = useState<"signin" | "create">("signin");

  // Sign-in fields
  const [siFirst, setSiFirst] = useState("");
  const [siInitial, setSiInitial] = useState("");
  const [siPin, setSiPin] = useState("");
  const [siErrors, setSiErrors] = useState<{ first?: string; initial?: string; pin?: string }>({});
  const [siAuthError, setSiAuthError] = useState("");
  const [siBusy, setSiBusy] = useState(false);

  // Create fields
  const [crFirst, setCrFirst] = useState("");
  const [crInitial, setCrInitial] = useState("");
  const [crPin, setCrPin] = useState("");
  const [crErrors, setCrErrors] = useState<{ first?: string; initial?: string; pin?: string }>({});
  const [crBusy, setCrBusy] = useState(false);

  // Install section
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/home");
  }, [router]);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const enterApp = () => {
    mirrorAuthCookie();
    setLastWing("plan");
    router.replace("/home");
  };

  const swapMode = (next: "signin" | "create") => {
    setMode(next);
    setSiErrors({});
    setSiAuthError("");
    setSiPin("");
    setCrErrors({});
    setCrPin("");
  };

  // ── Sign In ──────────────────────────────────────────────────────────────

  const submitSignIn = async () => {
    if (siBusy) return;
    const next: typeof siErrors = {};
    const trimmedFirst = siFirst.trim();
    if (!/^[A-Za-z]{1,15}$/.test(trimmedFirst)) next.first = "Letters only, 1–15 characters.";
    if (!/^[A-Za-z]$/.test(siInitial.trim())) next.initial = "Exactly one letter.";
    if (!isValidPin(siPin)) next.pin = "Exactly 2 digits (00–99).";
    setSiErrors(next);
    setSiAuthError("");
    if (next.first || next.initial || next.pin) return;

    setSiBusy(true);

    const expectedName = `${trimmedFirst} ${siInitial.trim().toUpperCase()}`;
    const match = voters.find(
      (v) => (v.display_name ?? v.name).toLowerCase() === expectedName.toLowerCase(),
    );

    if (!match) {
      setSiBusy(false);
      setSiAuthError("Name or PIN didn't match. Try again.");
      return;
    }

    const result = await signIn(match.voter_id, siPin);
    if (result === "ok") {
      enterApp();
      return;
    }
    setSiBusy(false);
    setSiAuthError("Name or PIN didn't match. Try again.");
  };

  // ── Create ───────────────────────────────────────────────────────────────

  const submitCreate = async () => {
    if (crBusy) return;
    const next: typeof crErrors = {};
    if (!/^[A-Za-z]{1,15}$/.test(crFirst.trim())) next.first = "Letters only, 1–15 characters.";
    if (!/^[A-Za-z]$/.test(crInitial)) next.initial = "Exactly one letter.";
    if (!isValidPin(crPin)) next.pin = "Exactly 2 digits (00–99).";
    setCrErrors(next);
    if (next.first || next.initial || next.pin) return;
    setCrBusy(true);
    if (await createIdentity(crFirst.trim(), crInitial, crPin)) {
      enterApp();
      return;
    }
    setCrBusy(false);
  };

  // ── Install handlers ─────────────────────────────────────────────────────

  const installAndroid = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
      <header className="pt-16 text-center">
        <h1 className="text-display text-ink">Hoppz</h1>
        <p className="mt-2 text-base text-ink-muted">Plan the perfect overnight bar hop</p>
      </header>

      <div className="mt-10">
        {mode === "signin" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitSignIn();
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <input
                className="input"
                placeholder="First name"
                autoComplete="off"
                autoCapitalize="words"
                value={siFirst}
                maxLength={MAX_FIRST_NAME_LENGTH}
                onChange={(e) => setSiFirst(e.target.value)}
                aria-label="First name"
              />
              {siErrors.first && <FieldError>{siErrors.first}</FieldError>}
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input"
                placeholder="Last initial"
                autoComplete="off"
                autoCapitalize="characters"
                value={siInitial}
                maxLength={1}
                onChange={(e) =>
                  setSiInitial(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())
                }
                aria-label="Last initial"
              />
              {siErrors.initial && <FieldError>{siErrors.initial}</FieldError>}
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="PIN"
                value={siPin}
                maxLength={2}
                onChange={(e) => setSiPin(e.target.value.replace(/\D/g, "").slice(0, 2))}
                aria-label="PIN"
              />
              {siErrors.pin && <FieldError>{siErrors.pin}</FieldError>}
              {siAuthError && <FieldError>{siAuthError}</FieldError>}
            </div>
            <button type="submit" className="btn-accent w-full" disabled={siBusy}>
              Sign In
            </button>
            <button
              type="button"
              onClick={() => swapMode("create")}
              className="h-11 text-meta font-semibold text-accent"
            >
              New here? Create an account
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitCreate();
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <input
                className="input"
                placeholder="First name"
                autoComplete="off"
                autoCapitalize="words"
                value={crFirst}
                maxLength={MAX_FIRST_NAME_LENGTH}
                onChange={(e) => setCrFirst(e.target.value)}
                aria-label="First name"
              />
              {crErrors.first && <FieldError>{crErrors.first}</FieldError>}
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input"
                placeholder="Last initial"
                autoComplete="off"
                autoCapitalize="characters"
                value={crInitial}
                maxLength={1}
                onChange={(e) =>
                  setCrInitial(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())
                }
                aria-label="Last initial"
              />
              {crErrors.initial && <FieldError>{crErrors.initial}</FieldError>}
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="2-digit PIN"
                value={crPin}
                maxLength={2}
                onChange={(e) => setCrPin(e.target.value.replace(/\D/g, "").slice(0, 2))}
                aria-label="2-digit PIN"
              />
              {crErrors.pin && <FieldError>{crErrors.pin}</FieldError>}
              <p className="text-meta font-normal text-ink-dim">
                Name, initial, and PIN let you vote from another device.
              </p>
            </div>
            <button type="submit" className="btn-accent w-full" disabled={crBusy}>
              Save
            </button>
            <button
              type="button"
              onClick={() => swapMode("signin")}
              className="h-11 text-meta font-semibold text-accent"
            >
              Already have an account? Sign in
            </button>
          </form>
        )}
      </div>

      {/* ── Add to Home Screen ─────────────────────────────────────────── */}
      {!standalone && (
        <>
          <div className="my-6 h-px w-full bg-border" />
          <section>
            <h2 className="label pb-3">Add to Home Screen</h2>
            <div className="flex items-stretch gap-3">
              <button
                type="button"
                onClick={() => void installAndroid()}
                disabled={!installPrompt}
                className="btn-ghost flex h-11 flex-1 items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.592.592 0 00-.83.22l-1.88 3.24C14.93 8.33 13.5 8 12 8s-2.93.33-4.47.91L5.65 5.67a.592.592 0 00-.87-.2c-.28.18-.37.54-.19.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"
                    fill="#3DDC84"
                  />
                </svg>
                Android
              </button>
              <div className="w-px self-stretch bg-border" />
              <button
                type="button"
                onClick={() => setShowIosHint((v) => !v)}
                className="btn-ghost flex h-11 flex-1 items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                    fill="currentColor"
                  />
                </svg>
                iPhone
              </button>
            </div>
            <div
              className="grid transition-[max-height] duration-200 ease-in-out"
              style={{ maxHeight: showIosHint ? "200px" : "0px", overflow: "hidden" }}
            >
              <p className="mt-3 rounded-card bg-raised p-4 text-meta font-normal text-ink-muted">
                Tap the Share button (⎙) at the bottom of Safari, then select &lsquo;Add to Home
                Screen&rsquo; and tap Add.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
