"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { CityList, SORT_OPTIONS, loadSort, storeSort, type CitySort } from "@/components/CityList";
import { Icon } from "@/components/Icon";

export default function CitiesPage() {
  const [sort, setSort] = useState<CitySort>("distance");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSort(loadSort());
  }, []);

  const choose = (next: CitySort) => {
    setSort(next);
    storeSort(next);
    setSheetOpen(false);
  };

  const current = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div className="mx-auto max-w-2xl">
      <CityList sort={sort} withHeader />

      {/* Floating sort pill — centered above bottom nav */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 mb-3 flex justify-center min-[840px]:sticky min-[840px]:inset-x-auto min-[840px]:bottom-4 min-[840px]:mt-6">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="pointer-events-auto flex h-11 items-center gap-1 rounded-full border border-border-strong bg-raised px-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform active:scale-95"
        >
          <Icon name="swap_vert" size={20} className="text-accent" />
          <span className="text-label font-semibold text-ink">Sorted by {current.pillLabel}</span>
        </button>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="Sort cities">
        <h2 className="label px-1 pb-2">Sort by</h2>
        <ul className="pb-2">
          {SORT_OPTIONS.map((option) => {
            const active = option.value === sort;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => choose(option.value)}
                  className={`flex h-11 w-full items-center justify-between rounded-btn px-3 text-base font-semibold transition ${
                    active ? "text-accent" : "text-ink hover:bg-raised"
                  }`}
                >
                  {option.label}
                  {active && <Icon name="check" size={20} />}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </div>
  );
}
