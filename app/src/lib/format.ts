// Date helpers. Dates are always handled as local-time YYYY-MM-DD strings —
// never Date.toISOString(), which shifts days across timezones.

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Sat, Jun 28" */
export function formatShortDate(key: string): string {
  const d = fromDateKey(key);
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** "June 2026" */
export function formatMonthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export interface CalendarCell {
  key: string;
  day: number;
  inMonth: boolean;
  isPast: boolean;
  isToday: boolean;
}

/** 6 fixed weeks starting on Sunday, covering the given month. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const today = todayKey();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = toDateKey(d);
    cells.push({
      key,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      isPast: key < today,
      isToday: key === today,
    });
  }
  return cells;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
