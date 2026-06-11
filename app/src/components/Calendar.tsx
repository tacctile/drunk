"use client";

import { buildMonthGrid, formatMonthTitle } from "@/lib/format";
import type { DayStatus } from "@/hooks/useAvailability";
import { Icon } from "./Icon";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const isWeekendIndex = (i: number) => i % 7 === 5 || i % 7 === 6; // Fri / Sat — trip nights

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
        className="flex h-11 w-11 items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink"
      >
        <Icon name="chevron_left" size={24} />
      </button>
      <h3 className="text-base font-bold">{formatMonthTitle(year, month)}</h3>
      <button
        type="button"
        onClick={() => shift(1)}
        aria-label="Next month"
        className="flex h-11 w-11 items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink"
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
        <div
          key={i}
          className={`label text-center ${isWeekendIndex(i) ? "text-muted" : ""}`}
        >
          {d}
        </div>
      ))}
    </div>
  );
}

/**
 * Personal calendar, mode-toggle model: a tap applies the active mode's
 * status; tapping a day already set to that status clears it. No cycling.
 * Friday/Saturday read brighter — those are the nights that matter.
 */
export function MyCalendar({
  year,
  month,
  mine,
  onTap,
}: {
  year: number;
  month: number;
  mine: Record<string, DayStatus>;
  onTap: (dateKey: string, current: DayStatus | undefined) => void;
}) {
  const cells = buildMonthGrid(year, month);
  return (
    <div>
      <WeekdayHeader />
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const status = mine[cell.key];
          const weekend = isWeekendIndex(i);
          const tone =
            status === "available"
              ? "bg-good text-bg"
              : status === "unavailable"
                ? "bg-bad text-bg"
                : weekend
                  ? "bg-raised text-ink"
                  : "bg-surface text-muted";
          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.isPast}
              onClick={() => onTap(cell.key, status)}
              aria-label={`${cell.key}${status ? ` — ${status === "available" ? "free" : "busy"}` : ""}`}
              className={`flex h-11 items-center justify-center rounded text-base font-semibold tabular-nums transition ${tone} ${
                !cell.inMonth ? "opacity-40" : ""
              } ${cell.isPast ? "cursor-not-allowed opacity-25" : ""} ${
                cell.isToday ? "ring-2 ring-inset ring-accent" : ""
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="label mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-good" aria-hidden /> Free
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-bad" aria-hidden /> Busy
        </span>
        <span>Tap sets · same tap clears</span>
      </div>
    </div>
  );
}

/** Group heat map: cell intensity = share of the roster marked free. */
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
        {cells.map((cell, i) => {
          const heat = heatFor(cell.key);
          const count = availableCountFor(cell.key);
          const hasData = hasResponsesFor(cell.key);
          const weekend = isWeekendIndex(i);
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!hasData}
              onClick={() => onPick(cell.key)}
              aria-label={`${cell.key} — ${count} free`}
              className={`flex h-11 items-center justify-center rounded text-base font-semibold tabular-nums transition ${
                hasData ? "hover:ring-2 hover:ring-inset hover:ring-line-strong" : "cursor-default"
              } ${!cell.inMonth ? "opacity-40" : ""} ${cell.isPast ? "opacity-25" : ""} ${
                cell.isToday ? "ring-2 ring-inset ring-accent" : ""
              }`}
              style={{
                background:
                  heat > 0
                    ? `rgba(52, 211, 153, ${0.14 + heat * 0.72})`
                    : weekend
                      ? "var(--raised)"
                      : "var(--surface)",
                color: heat > 0.55 ? "var(--bg)" : heat > 0 ? "var(--ink)" : weekend ? "var(--ink)" : "var(--muted)",
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="label mt-3 flex items-center gap-2">
        Fewer free
        <span className="flex h-2.5 flex-1 overflow-hidden rounded-full" aria-hidden>
          {[0.18, 0.34, 0.5, 0.68, 0.86].map((a) => (
            <span key={a} className="flex-1" style={{ background: `rgba(52, 211, 153, ${a})` }} />
          ))}
        </span>
        More free
      </div>
    </div>
  );
}
