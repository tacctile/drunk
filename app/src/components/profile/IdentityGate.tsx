"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { NamePrompt } from "@/components/NamePrompt";
import { ActionButton } from "@hoppz-ui";

export function IdentityGate() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 pt-10 text-center">
      <Icon name="person" size={40} className="text-ink-dim" />
      <h2 className="text-title text-ink">No identity yet</h2>
      <p className="text-meta font-normal text-ink-muted">
        Create your identity to vote, mark dates, and share your location.
      </p>
      <ActionButton label="Create identity" variant="filled" fullWidth onClick={() => setOpen(true)} />
      <NamePrompt open={open} flow="new" onCancel={() => setOpen(false)} onDone={() => setOpen(false)} />
    </div>
  );
}
