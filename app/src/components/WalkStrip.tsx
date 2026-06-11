import type { City, Hotel } from "@/data/types";
import { formatWalkDistance, haversineMiles } from "@/lib/geo";
import { cityMeta } from "@/lib/score";

const AXIS_MI = 1; // fixed shared axis, 0 -> 1 mile, everywhere, always
const TICK_MI = 0.25;

interface WalkStripProps {
  city: City;
  /** When set, distances are measured from this hotel instead of the bar district's center. */
  hotel?: Hotel;
  compact?: boolean;
}

interface StripScene {
  /** Bar distances from the axis origin, miles (unclamped). */
  barMiles: number[];
  /** Hotel square position on the axis, miles, or null when it can't be placed. */
  hotelMi: number | null;
  /** Hotel-to-bar-district distance the label reads out, or null. */
  labelMi: number | null;
}

function buildScene(city: City, hotel?: Hotel): StripScene {
  const meta = cityMeta[city.id];
  if (hotel) {
    if (!hotel.coords) return { barMiles: [], hotelMi: null, labelMi: null };
    const origin = hotel.coords;
    return {
      barMiles: city.bars.flatMap((b) => (b.coords ? [haversineMiles(origin, b.coords)] : [])),
      hotelMi: 0,
      labelMi: meta.barCentroid ? haversineMiles(origin, meta.barCentroid) : null,
    };
  }
  const origin = meta.barCentroid;
  return {
    barMiles: origin
      ? city.bars.flatMap((b) => (b.coords ? [haversineMiles(origin, b.coords)] : []))
      : [],
    hotelMi: meta.nearestHotelMi,
    labelMi: meta.nearestHotelMi,
  };
}

const pct = (mi: number) => `${Math.min(100, Math.max(0, (mi / AXIS_MI) * 100)).toFixed(2)}%`;

/**
 * The app's signature element: every city's night drawn on the same 0-1 mile
 * axis. Bar dots are near-white, the hotel square is the accent. The scale
 * NEVER adapts per city — a tight strip piles dots near the origin, a
 * scattered one spreads honestly, and anything past a mile snaps to the edge.
 */
export function WalkStrip({ city, hotel, compact = false }: WalkStripProps) {
  const { barMiles, hotelMi, labelMi } = buildScene(city, hotel);

  if (barMiles.length === 0) {
    return (
      <div className={`flex items-center ${compact ? "h-4" : "h-10"}`}>
        <p className="text-sm text-dim">Map data pending</p>
      </div>
    );
  }

  const needsRide = labelMi !== null && labelMi > AXIS_MI;
  const ariaLabel =
    labelMi === null
      ? `${barMiles.length} bars within ${AXIS_MI} mile`
      : needsRide
        ? `Hotel ${labelMi.toFixed(1)} miles from ${barMiles.length} bars — beyond walking range`
        : `Hotel ${formatWalkDistance(labelMi)} from ${barMiles.length} bars within ${AXIS_MI} mile`;

  const h = compact ? 16 : 40;
  const axisY = compact ? 8 : 16;
  const dotR = compact ? 3 : 4.5;
  const sq = compact ? 7 : 9;

  return (
    <div>
      <svg
        role="img"
        aria-label={ariaLabel}
        width="100%"
        height={h}
        className="block overflow-visible"
      >
        {/* fixed 0 -> 1 mi axis */}
        <line
          x1="0"
          y1={axisY}
          x2="100%"
          y2={axisY}
          stroke="var(--line-strong)"
          strokeWidth={compact ? 1.5 : 2}
          strokeLinecap="round"
        />
        {/* quarter-mile tick */}
        <line
          x1={pct(TICK_MI)}
          y1={axisY - (compact ? 3 : 5)}
          x2={pct(TICK_MI)}
          y2={axisY + (compact ? 3 : 5)}
          stroke="var(--dim)"
          strokeWidth={1.5}
        />
        {!compact && (
          <text
            x={pct(TICK_MI)}
            y={axisY + 19}
            textAnchor="middle"
            fill="var(--dim)"
            fontSize="12"
            fontWeight="600"
          >
            ¼ mi
          </text>
        )}
        {/* bar dots — near-white, piled or spread exactly as the city is */}
        {barMiles.map((mi, i) => (
          <circle
            key={i}
            cx={pct(mi)}
            cy={axisY}
            r={dotR}
            fill="var(--ink)"
            fillOpacity={0.92}
          />
        ))}
        {/* the hotel — the accent square; snaps to the right edge past a mile */}
        {hotelMi !== null && (
          <svg x={pct(hotelMi)} y={0} overflow="visible">
            <rect
              x={-sq / 2}
              y={axisY - sq / 2}
              width={sq}
              height={sq}
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth={1.5}
            />
          </svg>
        )}
      </svg>
      {!compact && (
        <p aria-hidden="true" className="mt-1 text-sm text-muted">
          {labelMi === null ? (
            <span>{barMiles.length} bars mapped</span>
          ) : needsRide ? (
            <span>
              <span className="tabular-nums">{labelMi.toFixed(1)} mi</span> — you&apos;ll need a ride
            </span>
          ) : (
            <span>
              Hotel <span className="tabular-nums">{formatWalkDistance(labelMi)}</span> from{" "}
              <span className="tabular-nums">{barMiles.length}</span> bars
            </span>
          )}
        </p>
      )}
    </div>
  );
}
