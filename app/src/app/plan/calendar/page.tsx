"use client";

import { MonthHeader, PersonalCalendar, useMonthNav } from "@/components/Calendar";

/**
 * The Calendar tab — personal availability only. Tap cycles
 * available → not available → clear. Group truth lives on The Board.
 */
export default function CalendarPage() {
  const { year, month, ready, prev, next } = useMonthNav();
  if (!ready) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <MonthHeader year={year} month={month} onPrev={prev} onNext={next} />
      <p className="px-4 pb-2 text-meta text-ink-muted">
        Tap a date to mark your availability. Tap again to mark unavailable.
      </p>
      <div className="mt-2">
        <PersonalCalendar year={year} month={month} />
      </div>
    </div>
  );
}
