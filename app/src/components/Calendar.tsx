"use client";

import { buildMonthGrid, formatMonthTitle } from "@/lib/format";
import type { DayStatus } from "@/hooks/useAvailability";
import { Icon } from "./Icon";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthNav({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onChange(d.getFullYear(), d.getMonth());
  };
  return (
    <div className="mb-2 flex items-center justify-between">
      <button
        type="button"
        onClick={() => shift(-1)}
        aria-label="Previous month"
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
      >
        <Icon name="chevron_left" size={24} />
      </button>
      <h3 className="text-base font-extrabold">{formatMonthTitle(year, month)}</h3>
      <button
        type="button"
        onClick={() => shift(1)}
        aria-label="Next month"
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
      >
        <Icon name="chevron_right" size={24} />
      </button>
    </div>
  );
}

function WeekdayHeader() {
  return (
    <div className="mb-1 grid grid-cols-7 gap-1">
      {WEEKDAYS.map((d, i) => (
        <div key={i} className="text-center text-2xs font-extrabold text-faint">
          {d}
        </div>
      ))}
    </div>
  );
}

/** Personal tri-state calendar: tap cycles neutral → available → unavailable → neutral. */
export function MyCalendar({
  year,
  month,
  mine,
  onCycle,
}: {
  year: number;
  month: number;
  mine: Record<string, DayStatus>;
  onCycle: (dateKey: string, current: DayStatus | undefined) => void;
}) {
  const cells = buildMonthGrid(year, month);
  return (
    <div>
      <WeekdayHeader />
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const status = mine[cell.key];
          const base =
            "h-11 rounded text-sm font-bold tabular-nums transition flex items-center justify-center";
          const tone =
            status === "available"
              ? "bg-good text-white"
              : status === "unavailable"
                ? "bg-bad text-white"
                : "bg-surface-2 text-ink hover:bg-surface-3";
          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.isPast}
              onClick={() => onCycle(cell.key, status)}
              aria-label={`${cell.key}${status ? ` — ${status}` : ""}`}
              className={`${base} ${tone} ${!cell.inMonth ? "opacity-40" : ""} ${
                cell.isPast ? "cursor-not-allowed opacity-25" : ""
              } ${cell.isToday ? "ring-2 ring-inset ring-accent" : ""}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-2xs font-bold text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-good" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-bad" /> Busy
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-line-strong bg-surface-2" /> Tap to cycle
        </span>
      </div>
    </div>
  );
}

/** Group heat map: cell intensity = share of the roster marked available. */
export function GroupCalendar({
  year,
  month,
  heatFor,
  availableCountFor,
  hasResponsesFor,
  onPick,
}: {
  year: number;
  month: number;
  heatFor: (date: string) => number;
  availableCountFor: (date: string) => number;
  hasResponsesFor: (date: string) => boolean;
  onPick: (dateKey: string) => void;
}) {
  const cells = buildMonthGrid(year, month);
  return (
    <div>
      <WeekdayHeader />
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const heat = heatFor(cell.key);
          const count = availableCountFor(cell.key);
          const hasData = hasResponsesFor(cell.key);
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!hasData}
              onClick={() => onPick(cell.key)}
              aria-label={`${cell.key} — ${count} available`}
              className={`relative flex h-11 flex-col items-center justify-center rounded text-sm font-bold tabular-nums transition ${
                hasData ? "hover:ring-2 hover:ring-inset hover:ring-accent" : "cursor-default"
              } ${!cell.inMonth ? "opacity-40" : ""} ${cell.isPast ? "opacity-25" : ""} ${
                cell.isToday ? "ring-2 ring-inset ring-accent" : ""
              }`}
              style={{
                background: heat > 0 ? `rgba(76, 175, 80, ${0.12 + heat * 0.78})` : "var(--surface-2)",
                color: heat > 0.55 ? "#fff" : "var(--ink)",
              }}
            >
              <span className="leading-none">{cell.day}</span>
              {count > 0 && <span className="mt-0.5 text-[9px] font-extrabold leading-none opacity-90">{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-2xs font-bold text-muted">
        Fewer free
        <span className="flex h-2.5 flex-1 overflow-hidden rounded-full">
          {[0.15, 0.32, 0.5, 0.68, 0.9].map((a) => (
            <span key={a} className="flex-1" style={{ background: `rgba(76,175,80,${a})` }} />
          ))}
        </span>
        More free
      </div>
    </div>
  );
}
