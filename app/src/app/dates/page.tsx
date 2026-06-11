"use client";

import { useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { useAvailability, type DayStatus } from "@/hooks/useAvailability";
import { GroupCalendar, MonthNav, MyCalendar } from "@/components/Calendar";
import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";
import { NamePrompt } from "@/components/NamePrompt";
import { formatShortDate } from "@/lib/format";

type Tab = "mine" | "group";

export default function DatesPage() {
  const { name, saveName, setAvailability } = useGroupData();
  const avail = useAvailability();

  const now = new Date();
  // Both tabs share month navigation state on purpose.
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<Tab>("mine");
  const [breakdownDate, setBreakdownDate] = useState<string | null>(null);
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [pendingTap, setPendingTap] = useState<{ date: string; current: DayStatus | undefined } | null>(null);

  // neutral → available → unavailable → neutral
  const cycle = (date: string, current: DayStatus | undefined) => {
    if (!name) {
      setPendingTap({ date, current });
      setNamePromptOpen(true);
      return;
    }
    const next: DayStatus | null =
      current === undefined ? "available" : current === "available" ? "unavailable" : null;
    void setAvailability(date, next);
  };

  const breakdown = breakdownDate ? avail.breakdownFor(breakdownDate) : null;

  return (
    <div className="anim-fade flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-extrabold tracking-tight">Dates</h1>
        <p className="mt-1 text-sm text-muted">
          Mark the nights you could go. The heat map finds the weekend that works.
        </p>
      </section>

      {avail.bestDate && (
        <section className="card flex items-center gap-3 border-good/40 bg-good-soft p-4">
          <Icon name="event_available" size={24} className="text-good" />
          <p className="text-sm font-bold">
            Best so far: {formatShortDate(avail.bestDate.date)}
            <span className="ml-1 font-extrabold text-good">
              — {avail.bestDate.available} of {avail.bestDate.total} available
            </span>
          </p>
        </section>
      )}

      {/* Tabs */}
      <div className="grid h-11 grid-cols-2 rounded-lg border border-line bg-surface p-1" role="tablist">
        {(
          [
            { id: "mine", label: "My Dates", icon: "person" },
            { id: "group", label: "Group View", icon: "group" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center justify-center gap-1.5 rounded text-sm font-extrabold transition ${
              tab === t.id ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name={t.icon} size={17} />
            {t.label}
          </button>
        ))}
      </div>

      <section className="card p-4">
        <MonthNav
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />
        {tab === "mine" ? (
          <MyCalendar year={year} month={month} mine={avail.mine} onCycle={cycle} />
        ) : (
          <GroupCalendar
            year={year}
            month={month}
            heatFor={avail.heatFor}
            availableCountFor={avail.availableCountFor}
            hasResponsesFor={avail.hasResponsesFor}
            onPick={setBreakdownDate}
          />
        )}
      </section>

      {/* All responses, chronological */}
      <section>
        <h2 className="mb-3 text-base font-extrabold">All responses</h2>
        {avail.allResponseDates.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-8 text-center text-muted">
            <Icon name="calendar_apps_script" size={32} />
            <p className="text-sm font-semibold">Nobody&apos;s marked a date yet.</p>
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {avail.allResponseDates.map((date) => {
              const b = avail.breakdownFor(date);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setBreakdownDate(date)}
                  className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-surface-2"
                >
                  <span className="w-24 flex-none text-sm font-extrabold">{formatShortDate(date)}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted">
                    {b.available.length > 0 && (
                      <span className="font-bold text-good">
                        {b.available.map((v) => (v.isYou ? "You" : v.name)).join(", ")}
                      </span>
                    )}
                    {b.available.length > 0 && b.unavailable.length > 0 && " · "}
                    {b.unavailable.length > 0 && (
                      <span className="text-bad">
                        out: {b.unavailable.map((v) => (v.isYou ? "You" : v.name)).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="inline-flex h-6 flex-none items-center rounded-full bg-good-soft px-2 text-2xs font-extrabold text-good">
                    {b.available.length} free
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Date breakdown sheet */}
      <BottomSheet
        open={breakdown !== null}
        onClose={() => setBreakdownDate(null)}
        label={breakdown ? formatShortDate(breakdown.date) : "Date"}
      >
        {breakdown && (
          <div className="pt-1">
            <h3 className="text-xl font-extrabold tracking-tight">{formatShortDate(breakdown.date)}</h3>
            <p className="mt-0.5 text-sm font-bold text-good">
              {breakdown.available.length} of {avail.rosterSize} available
            </p>
            <BreakdownGroup label="Available" tone="text-good" icon="check_circle" people={breakdown.available} />
            <BreakdownGroup label="Busy" tone="text-bad" icon="cancel" people={breakdown.unavailable} />
            <BreakdownGroup label="No response" tone="text-faint" icon="help" people={breakdown.noResponse} />
          </div>
        )}
      </BottomSheet>

      <NamePrompt
        open={namePromptOpen}
        onClose={() => {
          setNamePromptOpen(false);
          setPendingTap(null);
        }}
        onSave={(n) => {
          void saveName(n);
          setNamePromptOpen(false);
          // finish the tap that triggered the prompt
          if (pendingTap) {
            const next: DayStatus | null =
              pendingTap.current === undefined
                ? "available"
                : pendingTap.current === "available"
                  ? "unavailable"
                  : null;
            void setAvailability(pendingTap.date, next);
            setPendingTap(null);
          }
        }}
      />
    </div>
  );
}

function BreakdownGroup({
  label,
  tone,
  icon,
  people,
}: {
  label: string;
  tone: string;
  icon: string;
  people: { voterId: string; name: string; isYou: boolean }[];
}) {
  if (people.length === 0) return null;
  return (
    <div className="mt-4">
      <p className={`mb-1.5 flex items-center gap-1 text-2xs font-extrabold uppercase tracking-wider ${tone}`}>
        <Icon name={icon} size={14} />
        {label} · {people.length}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {people.map((p) => (
          <span
            key={p.voterId}
            className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold ${
              p.isYou ? "bg-accent text-accent-ink" : "bg-surface-2"
            }`}
          >
            {p.isYou ? "You" : p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
