"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_NAME_LENGTH, sanitizeName } from "@/lib/identity";
import { useGroupData } from "@/hooks/useGroupData";
import { Dialog } from "./Dialog";

interface NamePromptProps {
  open: boolean;
  onCancel: () => void;
  onSave: (name: string) => void;
}

/**
 * First-name identity prompt — triggers on first vote or first calendar tap.
 * Once a name is saved it is never asked again (unless localStorage is cleared).
 */
export function NamePrompt({ open, onCancel, onSave }: NamePromptProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  const submit = () => {
    const clean = sanitizeName(value);
    if (!clean) return;
    onSave(clean);
  };

  return (
    <Dialog open={open} onClose={onCancel} title="What's your name?">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4"
      >
        <input
          autoFocus
          className="input"
          placeholder="First name"
          value={value}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Your first name"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn px-4 text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button type="submit" className="btn-accent" disabled={!sanitizeName(value)}>
            Save
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export interface NameGate {
  /** Run the action now if a name exists, else prompt first and run it after Save. */
  requireName: (action: () => void) => void;
  /** Render this somewhere in the page. */
  prompt: JSX.Element;
}

/** Shared gate: every write that identifies the user funnels through this. */
export function useNameGate(): NameGate {
  const { name, saveName } = useGroupData();
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

  const handleSave = async (n: string) => {
    await saveName(n);
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
    prompt: <NamePrompt open={open} onCancel={handleCancel} onSave={handleSave} />,
  };
}
