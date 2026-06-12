"use client";

import { useEffect, useState } from "react";
import { buildMonthGrid, formatMonthTitle } from "@/lib/format";
import { useAvailability } from "@/hooks/useAvailability";
import { useGroupData } from "@/hooks/useGroupData";
import { useNameGate } from "./NamePrompt";
import { Icon } from "./Icon";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Month navigation state. `ready` flips after mount — calendars render
 * nothing until then, because "today" at static-build time and "today" on
 * the user's phone are different days and would mismatch on hydration.
 */
export function useMonthNav() {
  const [ready, setReady] = useState(false);
  const [ym, setYm] = useState({ year: 2026, month: 0 });
  useEffect(() => {
    const d = new Date();
    setYm({ year: d.getFullYear(), month: d.getMonth() });
    setReady(true);
  }, []);
  const shift = (delta: number) =>
    setYm(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  return { ...ym, ready, prev: () => shift(-1), next: () => shift(1) };
}

interface MonthHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthHeader({ year, month, onPrev, onNext }: MonthHeaderProps) {
  return (
    <div className="flex h-11 items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous month"
        className="flex h-11 w-11 items-center justify-center rounded-btn text-ink-muted transition hover:bg-raised hover:text-ink"
      >
        <Icon name="chevron_left" size={24} />
      </button>
      <h2 className="text-title font-bold">{formatMonthTitle(year, month)}</h2>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next month"
        className="flex h-11 w-11 items-center justify-center rounded-btn text-ink-muted transition hover:bg-raised hover:text-ink"
      >
        <Icon name="chevron_right" size={24} />
      </button>
    </div>
  );
}

export function WeekdayRow() {
  return (
    <div className="mb-1 grid grid-cols-7 gap-1">
      {WEEKDAYS.map((d) => (
        <div key={d} className="py-1 text-center text-label font-semibold uppercase tracking-label text-ink-dim">
          {d}
        </div>
      ))}
    </div>
  );
}

/**
 * Personal availability. One gesture, three states:
 * tap neutral → available → not available → clear.
 */
export function PersonalCalendar({ year, month }: { year: number; month: number }) {
  const { setAvailability } = useGroupData();
  const { mine } = useAvailability();
  const { requireName, prompt } = useNameGate();

  const cycle = (dateKey: string) => {
    const current = mine[dateKey];
    const next =
      current === "available" ? "unavailable" : current === "unavailable" ? null : "available";
    void setAvailability(dateKey, next);
  };

  return (
    <div>
      <WeekdayRow />
      <div className="grid grid-cols-7 gap-1">
        {buildMonthGrid(year, month).map((cell) => {
          if (!cell.inMonth) return <div key={cell.key} aria-hidden="true" />;
          const status = mine[cell.key];
          const palette =
            status === "available"
              ? "bg-green-dim text-green"
              : status === "unavailable"
                ? "bg-red-dim text-red"
                : "bg-raised text-ink";
          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.isPast}
              onClick={() => requireName(() => cycle(cell.key))}
              aria-label={`${cell.key}${
                status ? ` — ${status === "available" ? "available" : "not available"}` : ""
              }`}
              className={`flex h-14 min-h-11 flex-col items-center justify-center rounded-btn text-base font-semibold transition ${palette} ${
                cell.isToday ? "border-[1.5px] border-accent" : ""
              } ${cell.isPast ? "opacity-40" : ""}`}
            >
              {cell.day}
              <span className="flex h-4 items-center" aria-hidden="true">
                {status === "available" && <Icon name="check" size={16} />}
                {status === "unavailable" && <Icon name="close" size={16} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-5">
        <span className="flex items-center gap-2 text-meta font-normal text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-green" />
          Available
        </span>
        <span className="flex items-center gap-2 text-meta font-normal text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-red" />
          Not available
        </span>
      </div>
      {prompt}
    </div>
  );
}

/**
 * Read-only heat map for The Board. Cells color by the share of respondents
 * who are available; tapping a cell with responses reports who's in and out.
 */
export function HeatCalendar({
  year,
  month,
  onDayTap,
}: {
  year: number;
  month: number;
  onDayTap: (dateKey: string) => void;
}) {
  const { breakdownFor } = useAvailability();

  return (
    <div>
      <WeekdayRow />
      <div className="grid grid-cols-7 gap-1">
        {buildMonthGrid(year, month).map((cell) => {
          if (!cell.inMonth) return <div key={cell.key} aria-hidden="true" />;
          const { available, unavailable } = breakdownFor(cell.key);
          const responded = available.length + unavailable.length;
          const pct = responded === 0 ? null : (available.length / responded) * 100;
          const heat =
            pct === null
              ? "bg-raised"
              : pct <= 33
                ? "bg-red-dim"
                : pct <= 66
                  ? "bg-accent-dim"
                  : pct <= 89
                    ? "bg-green-dim"
                    : "bg-[rgba(52,211,153,0.30)]"; // --green at 30%
          return (
            <button
              key={cell.key}
              type="button"
              disabled={responded === 0}
              onClick={() => onDayTap(cell.key)}
              aria-label={
                responded === 0
                  ? `${cell.key} — no responses`
                  : `${cell.key} — ${available.length} of ${responded} available`
              }
              className={`flex h-14 min-h-11 flex-col items-center justify-center rounded-btn transition ${heat} ${
                cell.isToday ? "border-[1.5px] border-accent" : ""
              } ${cell.isPast ? "opacity-40" : ""}`}
            >
              <span className="text-base font-semibold text-ink">{cell.day}</span>
              <span className="flex h-4 items-center text-[11px] font-medium text-ink-muted">
                {responded > 0 ? `${available.length}/${responded}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
