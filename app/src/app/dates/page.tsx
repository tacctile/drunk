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
type Mode = "free" | "busy";

export default function DatesPage() {
  const { name, saveName, setAvailability } = useGroupData();
  const avail = useAvailability();

  const now = new Date();
  // Both tabs share month navigation state on purpose.
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<Tab>("mine");
  const [mode, setMode] = useState<Mode>("free");
  const [breakdownDate, setBreakdownDate] = useState<string | null>(null);
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [pendingTap, setPendingTap] = useState<{ date: string; next: DayStatus | null } | null>(
    null,
  );

  // Mode-toggle model: tap applies the active mode; same tap clears. No cycle.
  const tap = (date: string, current: DayStatus | undefined) => {
    const target: DayStatus = mode === "free" ? "available" : "unavailable";
    const next: DayStatus | null = current === target ? null : target;
    if (!name) {
      setPendingTap({ date, next });
      setNamePromptOpen(true);
      return;
    }
    void setAvailability(date, next);
  };

  const breakdown = breakdownDate ? avail.breakdownFor(breakdownDate) : null;

  return (
    <div className="anim-fade flex flex-col gap-8">
      <section>
        <h1 className="text-display tracking-tight">Dates</h1>
        <p className="mt-2 text-base text-muted">
          Mark the nights you could go. The heat map finds the weekend that works.
        </p>
        {avail.bestDate && (
          <p className="mt-3 text-base text-muted">
            Best weekend so far: {formatShortDate(avail.bestDate.date)} —{" "}
            <span className="tabular-nums">
              {avail.bestDate.available} of {avail.bestDate.total}
            </span>{" "}
            free
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        {/* My / Group tabs */}
        <div
          className="grid h-11 grid-cols-2 overflow-hidden rounded border border-line bg-surface"
          role="tablist"
        >
          {(
            [
              { id: "mine", label: "My Dates" },
              { id: "group", label: "Group View" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex h-11 items-center justify-center text-base font-semibold transition ${
                tab === t.id ? "bg-raised text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Marking mode — only relevant to my own calendar */}
        {tab === "mine" && (
          <div
            className="grid h-11 grid-cols-2 overflow-hidden rounded border border-line bg-surface"
            role="group"
            aria-label="Marking mode"
          >
            <button
              type="button"
              onClick={() => setMode("free")}
              aria-pressed={mode === "free"}
              className={`flex h-11 items-center justify-center gap-1.5 text-base font-semibold transition ${
                mode === "free" ? "bg-good-soft text-good" : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="check" size={18} />
              I&apos;m Free
            </button>
            <button
              type="button"
              onClick={() => setMode("busy")}
              aria-pressed={mode === "busy"}
              className={`flex h-11 items-center justify-center gap-1.5 text-base font-semibold transition ${
                mode === "busy" ? "bg-bad-soft text-bad" : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="block" size={18} />
              I&apos;m Busy
            </button>
          </div>
        )}

        <div className="card p-5">
          <MonthNav
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
          {tab === "mine" ? (
            <MyCalendar year={year} month={month} mine={avail.mine} onTap={tap} />
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
        </div>
      </section>

      {/* All responses, chronological */}
      <section>
        <h2 className="label mb-3">All responses</h2>
        {avail.allResponseDates.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-8 text-center">
            <Icon name="calendar_month" size={32} className="text-dim" />
            <p className="text-base text-muted">Nobody&apos;s marked a date yet.</p>
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
                  className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-raised/40"
                >
                  <span className="w-24 flex-none text-base font-bold">
                    {formatShortDate(date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {b.available.length > 0 &&
                      b.available.map((v) => (v.isYou ? "You" : v.name)).join(", ")}
                    {b.available.length > 0 && b.unavailable.length > 0 && " · "}
                    {b.unavailable.length > 0 && (
                      <span className="text-dim">
                        out: {b.unavailable.map((v) => (v.isYou ? "You" : v.name)).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="flex-none text-sm font-semibold tabular-nums text-good">
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
            <h3 className="text-xl font-bold tracking-tight">{formatShortDate(breakdown.date)}</h3>
            <p className="mt-1 text-sm font-semibold tabular-nums text-good">
              {breakdown.available.length} of {avail.rosterSize} free
            </p>
            <BreakdownGroup label="Free" tone="text-good" people={breakdown.available} />
            <BreakdownGroup label="Busy" tone="text-bad" people={breakdown.unavailable} />
            <BreakdownGroup label="No response" tone="text-dim" people={breakdown.noResponse} />
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
            void setAvailability(pendingTap.date, pendingTap.next);
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
  people,
}: {
  label: string;
  tone: string;
  people: { voterId: string; name: string; isYou: boolean }[];
}) {
  if (people.length === 0) return null;
  return (
    <div className="mt-4">
      <p className={`label mb-2 ${tone}`}>
        {label} · <span className="tabular-nums">{people.length}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {people.map((p) => (
          <span
            key={p.voterId}
            className={`inline-flex items-center rounded px-3 py-1.5 text-sm font-semibold ${
              p.isYou ? "bg-accent text-accent-ink" : "bg-raised"
            }`}
          >
            {p.isYou ? "You" : p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
