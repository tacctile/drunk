"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { NamePrompt } from "@/components/NamePrompt";

export function IdentityGate() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 pt-10 text-center">
      <Icon name="person" size={40} className="text-ink-dim" />
      <h2 className="text-title text-ink">No identity yet</h2>
      <p className="text-meta font-normal text-ink-muted">
        Create your identity to vote, mark dates, and share your location.
      </p>
      <button type="button" className="btn-accent w-full max-w-sm" onClick={() => setOpen(true)}>
        Create identity
      </button>
      <NamePrompt open={open} flow="new" onCancel={() => setOpen(false)} onDone={() => setOpen(false)} />
    </div>
  );
}
