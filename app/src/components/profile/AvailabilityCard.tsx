"use client";

import { useAvailability } from "@/hooks/useAvailability";
import { formatMonthTitle, plural } from "@/lib/format";
import { SectionLabel, Card, LinkRow } from "@hoppz-ui";

export function AvailabilityCard({ onMarkDates }: { onMarkDates: () => void }) {
  const { mine } = useAvailability();
  const dates = Object.keys(mine);
  const availCount = dates.filter((d) => mine[d] === "available").length;
  const unavailCount = dates.length - availCount;

  let lastUpdated: string | null = null;
  if (dates.length > 0) {
    const latest = [...dates].sort()[dates.length - 1];
    const [y, m] = latest.split("-").map(Number);
    lastUpdated = formatMonthTitle(y, m - 1);
  }

  return (
    <section>
      <SectionLabel>My availability</SectionLabel>
      <Card className="mt-2">
        {dates.length > 0 ? (
          <>
            <p className="text-title text-green">{plural(availCount, "day")} available</p>
            <p className="mt-1 text-title text-red">{plural(unavailCount, "day")} unavailable</p>
            {lastUpdated && (
              <p className="mt-2 text-meta font-normal text-ink-dim">Last updated {lastUpdated}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-base text-ink-dim">No dates marked yet</p>
            <LinkRow label="Mark dates" onClick={onMarkDates} />
          </>
        )}
      </Card>
    </section>
  );
}
