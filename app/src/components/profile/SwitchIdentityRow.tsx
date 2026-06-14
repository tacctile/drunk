"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";

export function SwitchIdentityRow({
  displayName,
  onConfirm,
}: {
  displayName: string;
  onConfirm: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="flex h-11 w-full items-center justify-center text-base font-semibold text-ink-dim"
      >
        Not {displayName}? Switch identity
      </button>
      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} label="Switch identity">
        <p className="px-1 pb-3 pt-1 text-base text-ink">
          Sign out as {displayName}? You&apos;ll need your PIN to sign back in.
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(false)}
          className="flex h-11 w-full items-center justify-center text-base font-medium text-ink-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-11 w-full items-center justify-center text-base font-semibold text-red"
        >
          Sign out
        </button>
      </BottomSheet>
    </div>
  );
}
