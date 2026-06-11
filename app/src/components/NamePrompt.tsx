"use client";

import { useEffect, useState } from "react";
import { MAX_NAME_LENGTH, sanitizeName } from "@/lib/identity";
import { Dialog } from "./Dialog";

interface NamePromptProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initial?: string;
  title?: string;
}

/** First-name-only identity prompt. No auth, no friction. */
export function NamePrompt({ open, onClose, onSave, initial = "", title = "What's your name?" }: NamePromptProps) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  const submit = () => {
    const clean = sanitizeName(value);
    if (!clean) return;
    onSave(clean);
  };

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-muted">
        First name only — it shows up next to your votes and dates so the crew knows who&apos;s in.
      </p>
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
        <button type="submit" className="btn-accent w-full" disabled={!sanitizeName(value)}>
          That&apos;s me
        </button>
      </form>
    </Dialog>
  );
}
