"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { MAX_FIRST_NAME_LENGTH, isValidPin } from "@/lib/identity";
import { Dialog } from "./Dialog";

export type IdentityFlow = "new" | "return";

interface NamePromptProps {
  open: boolean;
  /** Which form the modal opens on — each links to the other. */
  flow?: IdentityFlow;
  onCancel: () => void;
  /** Identity established — account created or signed in. */
  onDone: () => void;
}

function FieldError({ children }: { children: string }) {
  return (
    <p className="text-[12px] font-medium text-red" role="alert">
      {children}
    </p>
  );
}

/**
 * Identity modal — ONE screen, no steps. New users enter first name + last
 * initial + 2-digit PIN and hit Save; "Sign in as existing user" swaps the
 * same modal to a roster dropdown + PIN check. PINs are stored bcrypt-hashed
 * in v2_voters, never plain text. Triggers on the first identifying write
 * (vote, calendar tap) via useNameGate, and auto-opens in sign-in mode when
 * localStorage holds an identity the server can't verify.
 */
export function NamePrompt({ open, flow = "new", onCancel, onDone }: NamePromptProps) {
  const { voters, createIdentity, signIn } = useGroupData();
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [first, setFirst] = useState("");
  const [initial, setInitial] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState<{ first?: string; initial?: string; pin?: string }>({});
  const [selectedId, setSelectedId] = useState("");
  const [signInPin, setSignInPin] = useState("");
  const [signInError, setSignInError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(flow === "return" ? "signin" : "create");
    setFirst("");
    setInitial("");
    setPin("");
    setErrors({});
    setSelectedId("");
    setSignInPin("");
    setSignInError("");
    setBusy(false);
  }, [open, flow]);

  const roster = useMemo(
    () =>
      voters
        .map((v) => ({ id: v.voter_id, label: v.display_name ?? v.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [voters],
  );

  const swapMode = (next: "create" | "signin") => {
    setMode(next);
    setErrors({});
    setSignInError("");
    setPin("");
    setSignInPin("");
  };

  const submitSave = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (!/^[A-Za-z]{1,15}$/.test(first.trim())) next.first = "Letters only, 1–15 characters.";
    if (!/^[A-Za-z]$/.test(initial)) next.initial = "Exactly one letter.";
    if (!isValidPin(pin)) next.pin = "Exactly 2 digits (00–99).";
    setErrors(next);
    if (next.first || next.initial || next.pin) return;
    setBusy(true);
    if (await createIdentity(first.trim(), initial, pin)) {
      onDone();
      return;
    }
    setBusy(false);
  };

  const submitSignIn = async () => {
    if (!selectedId || !isValidPin(signInPin) || busy) return;
    setBusy(true);
    const result = await signIn(selectedId, signInPin);
    if (result === "ok") {
      onDone();
      return;
    }
    setBusy(false);
    setSignInPin("");
    setSignInError(
      result === "wrong-pin" ? "PIN doesn't match. Try again." : "Couldn't sign in. Try again.",
    );
  };

  return (
    <Dialog open={open} onClose={onCancel} title="Who are you?">
      {mode === "create" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitSave();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <input
              autoFocus
              className="input"
              placeholder="First name"
              autoComplete="off"
              value={first}
              maxLength={MAX_FIRST_NAME_LENGTH}
              onChange={(e) => setFirst(e.target.value)}
              aria-label="First name"
            />
            {errors.first && <FieldError>{errors.first}</FieldError>}
          </div>
          <div className="flex flex-col gap-1">
            <input
              className="input"
              placeholder="Initial"
              autoComplete="off"
              autoCapitalize="characters"
              value={initial}
              maxLength={1}
              onChange={(e) =>
                setInitial(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())
              }
              aria-label="Last initial"
            />
            {errors.initial && <FieldError>{errors.initial}</FieldError>}
          </div>
          <div className="flex flex-col gap-1">
            <input
              className="input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="2-digit PIN"
              value={pin}
              maxLength={2}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 2))}
              aria-label="2-digit PIN"
            />
            {errors.pin && <FieldError>{errors.pin}</FieldError>}
            <p className="text-meta font-normal text-ink-dim">
              Name, initial, and PIN let you vote from another device.
            </p>
          </div>
          <button type="submit" className="btn-accent w-full" disabled={busy}>
            Save
          </button>
          <button
            type="button"
            onClick={() => swapMode("signin")}
            className="h-11 text-meta font-semibold text-accent"
          >
            Sign in as existing user
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitSignIn();
          }}
          className="flex flex-col gap-3"
        >
          <select
            autoFocus
            className="input"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setSignInError("");
            }}
            aria-label="Choose your name"
          >
            <option value="" disabled>
              {roster.length === 0 ? "No names yet" : "Choose your name"}
            </option>
            {roster.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-1">
            <input
              className="input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="2-digit PIN"
              value={signInPin}
              maxLength={2}
              onChange={(e) => setSignInPin(e.target.value.replace(/\D/g, "").slice(0, 2))}
              aria-label="Your 2-digit PIN"
            />
            {signInError && <FieldError>{signInError}</FieldError>}
          </div>
          <button
            type="submit"
            className="btn-accent w-full"
            disabled={!selectedId || !isValidPin(signInPin) || busy}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => swapMode("create")}
            className="h-11 text-meta font-semibold text-accent"
          >
            Never mind, create new
          </button>
        </form>
      )}
    </Dialog>
  );
}

export interface NameGate {
  /** Run the action now if an identity exists, else prompt first and run it after. */
  requireName: (action: () => void) => void;
  /** Render this somewhere in the page. */
  prompt: JSX.Element;
}

/** Shared gate: every write that identifies the user funnels through this. */
export function useNameGate(): NameGate {
  const { name } = useGroupData();
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const requireName = (action: () => void) => {
    if (name) {
      action();
      return;
    }
    pending.current = action;
    setOpen(true);
  };

  const handleDone = () => {
    setOpen(false);
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const handleCancel = () => {
    pending.current = null;
    setOpen(false);
  };

  return {
    requireName,
    prompt: <NamePrompt open={open} flow="new" onCancel={handleCancel} onDone={handleDone} />,
  };
}

/**
 * Mounted once in the root layout. When localStorage holds an identity the
 * live roster can't verify, the sign-in form auto-opens so the person can
 * sign back in (or create a fresh name). Dismissable per session.
 */
export function IdentityWatcher() {
  const { identityInvalid } = useGroupData();
  const [open, setOpen] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    if (identityInvalid && !dismissed.current) setOpen(true);
  }, [identityInvalid]);

  return (
    <NamePrompt
      open={open}
      flow="return"
      onCancel={() => {
        dismissed.current = true;
        setOpen(false);
      }}
      onDone={() => setOpen(false)}
    />
  );
}

/** "You're Nick B · Not you?" — opens the sign-in form to switch identity. */
export function NotYouLink() {
  const { name } = useGroupData();
  const [open, setOpen] = useState(false);
  if (!name) return null;
  return (
    <>
      <span className="inline-flex min-h-11 items-center gap-1.5 text-meta font-normal text-ink-dim">
        You&apos;re <span className="text-ink-muted">{name}</span> ·
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 items-center font-semibold text-accent"
        >
          Not you?
        </button>
      </span>
      <NamePrompt open={open} flow="return" onCancel={() => setOpen(false)} onDone={() => setOpen(false)} />
    </>
  );
}
