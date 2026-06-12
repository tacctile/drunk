"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { MAX_FIRST_NAME_LENGTH, buildDisplayName, isValidPin } from "@/lib/identity";
import { Dialog } from "./Dialog";

export type IdentityFlow = "new" | "return";

type Step = "new-name" | "new-pin" | "return-name" | "return-pin";

const TITLES: Record<Step, string> = {
  "new-name": "What's your name?",
  "new-pin": "Choose a 2-digit PIN",
  "return-name": "Welcome back",
  "return-pin": "Enter your PIN",
};

interface NamePromptProps {
  open: boolean;
  /** Which flow the dialog opens in — each flow links to the other. */
  flow?: IdentityFlow;
  onCancel: () => void;
  /** Identity established — account created or signed in. */
  onDone: () => void;
}

function PinInput({
  value,
  onChange,
  placeholder,
  label,
  autoFocus = false,
}: {
  value: string;
  onChange: (pin: string) => void;
  placeholder: string;
  label: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      className="input text-center tracking-[0.3em]"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={2}
      placeholder={placeholder}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
      aria-label={label}
    />
  );
}

/**
 * Identity dialog — name + last initial + 2-digit PIN, stored in v2_voters
 * (PIN as a bcrypt hash). New users create an account; returning users pick
 * their name from the roster and verify their PIN to load their voter_id
 * onto this device. Triggers on the first identifying write (vote, calendar
 * tap) via useNameGate, and auto-opens in the return flow when localStorage
 * holds an identity the server can't verify.
 */
export function NamePrompt({ open, flow = "new", onCancel, onDone }: NamePromptProps) {
  const { voters, createIdentity, signIn } = useGroupData();
  const [step, setStep] = useState<Step>("new-name");
  const [first, setFirst] = useState("");
  const [initial, setInitial] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(flow === "return" ? "return-name" : "new-name");
    setFirst("");
    setInitial("");
    setPin("");
    setPin2("");
    setSelectedId("");
    setError("");
    setBusy(false);
  }, [open, flow]);

  const roster = useMemo(
    () =>
      voters
        .map((v) => ({ id: v.voter_id, label: v.display_name ?? v.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [voters],
  );
  const selectedLabel = roster.find((r) => r.id === selectedId)?.label ?? "";

  const goto = (next: Step) => {
    setStep(next);
    setError("");
    setPin("");
    setPin2("");
  };

  const submitNewName = () => {
    if (!buildDisplayName(first, initial)) return;
    goto("new-pin");
  };

  const submitNewPin = async () => {
    if (!isValidPin(pin) || !isValidPin(pin2) || busy) return;
    if (pin !== pin2) {
      setError("PINs don't match.");
      return;
    }
    setBusy(true);
    await createIdentity(first, initial, pin);
    onDone();
  };

  const submitSignIn = async () => {
    if (!selectedId || !isValidPin(pin) || busy) return;
    setBusy(true);
    const result = await signIn(selectedId, pin);
    if (result === "ok") {
      onDone();
      return;
    }
    setBusy(false);
    setPin("");
    setError(result === "wrong-pin" ? "That PIN doesn't match. Try again." : "Couldn't sign in. Try again.");
  };

  return (
    <Dialog open={open} onClose={onCancel} title={TITLES[step]}>
      {step === "new-name" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitNewName();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex gap-2">
            <input
              autoFocus
              className="input flex-1"
              placeholder="First name"
              value={first}
              maxLength={MAX_FIRST_NAME_LENGTH}
              onChange={(e) => setFirst(e.target.value)}
              aria-label="First name"
            />
            <input
              className="input w-12 px-0 text-center uppercase"
              placeholder="L"
              value={initial}
              maxLength={1}
              onChange={(e) => setInitial(e.target.value)}
              aria-label="Last initial"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onCancel} className="btn px-4 text-ink-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" className="btn-accent" disabled={!buildDisplayName(first, initial)}>
              Next
            </button>
          </div>
          <button
            type="button"
            onClick={() => goto("return-name")}
            className="h-11 text-meta font-semibold text-accent"
          >
            I have an account
          </button>
        </form>
      )}

      {step === "new-pin" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitNewPin();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-meta font-normal text-ink-muted">
            You&apos;ll need this to sign in on other devices. Don&apos;t forget it.
          </p>
          <div className="flex gap-2">
            <PinInput autoFocus value={pin} onChange={setPin} placeholder="PIN" label="2-digit PIN" />
            <PinInput value={pin2} onChange={setPin2} placeholder="Confirm" label="Confirm 2-digit PIN" />
          </div>
          {error && (
            <p className="text-meta font-normal text-red" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onCancel} className="btn px-4 text-ink-muted hover:text-ink">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent"
              disabled={!isValidPin(pin) || !isValidPin(pin2) || busy}
            >
              Save
            </button>
          </div>
        </form>
      )}

      {step === "return-name" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedId) goto("return-pin");
          }}
          className="flex flex-col gap-4"
        >
          <select
            autoFocus
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
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
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onCancel} className="btn px-4 text-ink-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" className="btn-accent" disabled={!selectedId}>
              Next
            </button>
          </div>
          <button
            type="button"
            onClick={() => goto("new-name")}
            className="h-11 text-meta font-semibold text-accent"
          >
            I&apos;m new here
          </button>
        </form>
      )}

      {step === "return-pin" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitSignIn();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-base font-semibold text-ink">{selectedLabel}</p>
          <PinInput autoFocus value={pin} onChange={setPin} placeholder="PIN" label="Your 2-digit PIN" />
          {error && (
            <p className="text-meta font-normal text-red" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onCancel} className="btn px-4 text-ink-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" className="btn-accent" disabled={!isValidPin(pin) || busy}>
              Sign in
            </button>
          </div>
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
 * live roster can't verify, the return-user flow auto-opens so the person
 * can sign back in (or create a fresh name). Dismissable per session.
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

/** "You're Nick B · Not you?" — opens the return-user flow to switch identity. */
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
