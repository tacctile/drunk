import type { City, Coords, VenueKind } from "@/data/types";

const VB_W = 360;
const VB_H = 170;
const PAD = 28;
const MIN_EXTENT = 0.0005; // degrees — keeps single-point cities from collapsing

interface Star {
  kind: VenueKind;
  x: number;
  y: number;
}

function project(city: City): Star[] {
  const pts: { kind: VenueKind; coords: Coords }[] = [
    ...city.food.flatMap((f) => (f.coords ? [{ kind: "food" as const, coords: f.coords }] : [])),
    ...city.bars.flatMap((b) => (b.coords ? [{ kind: "bar" as const, coords: b.coords }] : [])),
    ...city.hotels.flatMap((h) => (h.coords ? [{ kind: "hotel" as const, coords: h.coords }] : [])),
  ];
  if (pts.length === 0) return [];

  const lats = pts.map((p) => p.coords.lat);
  const lngs = pts.map((p) => p.coords.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // Equirectangular at city scale: shrink longitude by cos(lat) so the field
  // keeps its real-world aspect, then fit centered inside the viewBox.
  const kx = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const geoW = Math.max((maxLng - minLng) * kx, MIN_EXTENT);
  const geoH = Math.max(maxLat - minLat, MIN_EXTENT);
  const scale = Math.min((VB_W - 2 * PAD) / geoW, (VB_H - 2 * PAD) / geoH);
  const x0 = (VB_W - geoW * scale) / 2;
  const y0 = (VB_H - geoH * scale) / 2;

  return pts.map((p) => ({
    kind: p.kind,
    x: x0 + (p.coords.lng - minLng) * kx * scale,
    y: y0 + (maxLat - p.coords.lat) * scale,
  }));
}

/**
 * The city's identity mark: every mapped venue as a dot on the blue-black,
 * no streets, no labels. Hotels are accent squares, bars near-white dots,
 * food outlined muted circles — the same shape language as the live map.
 */
export function ConstellationMap({ city }: { city: City }) {
  const stars = project(city);

  if (stars.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-dim">Map data pending</p>
      </div>
    );
  }

  return (
    <svg
      role="img"
      aria-label={`Dot map of ${city.name}: hotels, bars, and food spots`}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      {stars.map((s, i) => {
        if (s.kind === "hotel") {
          return (
            <rect
              key={i}
              x={s.x - 4.5}
              y={s.y - 4.5}
              width={9}
              height={9}
              fill="var(--accent)"
            />
          );
        }
        if (s.kind === "bar") {
          return <circle key={i} cx={s.x} cy={s.y} r={3.5} fill="var(--ink)" fillOpacity={0.92} />;
        }
        return (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={3.5}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}
