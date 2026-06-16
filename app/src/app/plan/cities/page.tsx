"use client";

import { useEffect, useState } from "react";
import { ActionBar } from "@/components/ActionBar";
import { BottomSheet } from "@/components/BottomSheet";
import { CityList, SORT_OPTIONS, loadSort, storeSort, type CitySort } from "@/components/CityList";
import { Icon } from "@/components/Icon";
import { FloatingPill, SectionLabel } from "@hoppz-ui";

/** The walkability index — the first screen. */
export default function CitiesPage() {
  const [sort, setSort] = useState<CitySort>("distance");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Stored preference applies after hydration so server and client first
  // paint identically.
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

      <ActionBar>
        <FloatingPill
          variant="sort"
          label={`Sorted by ${current.pillLabel}`}
          icon="swap_vert"
          onClick={() => setSheetOpen(true)}
        />
      </ActionBar>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="Sort cities">
        <div className="px-1 pb-2">
          <SectionLabel>Sort by</SectionLabel>
        </div>
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
