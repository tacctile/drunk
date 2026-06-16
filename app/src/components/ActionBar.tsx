"use client";

import type { ReactNode } from "react";

/**
 * The single floating control slot just above the bottom nav: the sort pill
 * on the cities list, the vote button on city detail. Place it at the end of
 * the page content — on mobile it fixes above the nav; at >= 840px (no bottom
 * nav) it sticks to the bottom of the content column instead.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 px-4 min-[840px]:sticky min-[840px]:inset-x-auto min-[840px]:bottom-4 min-[840px]:mt-6">
      <div className="pointer-events-auto mx-auto max-w-2xl">{children}</div>
    </div>
  );
}
