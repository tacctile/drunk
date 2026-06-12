# PROGRESS

Legend: [x] complete · [~] partial · [ ] pending

## Foundation
- [x] Next.js 14 App Router + TypeScript strict scaffold in /app (own package.json, own ecosystem)
- [x] Tailwind v3 with CSS-variable design tokens (4px grid, 44px interactive height, 160ms ease)
- [x] Manrope (400–800) + Material Symbols Outlined via Google Fonts CDN
- [x] Dark only — no light variables, no theme toggle, no boot script, no light Maps style
- [x] prefers-reduced-motion respected (all animation collapses)
- [x] Mobile-first; desktop ≥840px gets an 80px icon rail + push layout on city detail
- [x] Tabular numerals globally (font-variant-numeric on body)

## Data
- [x] 27-city dataset with HARDCODED walkability research: walkScore (0–100), walkGrade (A+…F), district name
- [x] City type slimmed to id/name/state/miles/drive/walkScore/walkGrade/district/mapCenter/mapZoom
- [x] Legacy hotel/bar/food/vibes/tagline arrays retained in cities.ts as reference only (out of the type, never read by UI)
- [x] Venue lists live from Google Places Nearby Search (lodging 2000m / bar 1000m / restaurant 800m, prominence)
- [x] Chain filter (name regex) on bars + food; non-OPERATIONAL results dropped
- [x] Silent fallback chain: Places → curated v2_hotels/v2_bars/v2_food tables → empty state

## Supabase
- [x] v2 user tables (v2_voters, v2_city_votes, v2_hotel_votes, v2_availability) + anon RLS — live
- [x] v2_hotel_votes in place_id shape: PK (voter_id, city_id), hotel_place_id, hotel_name
- [x] Curated venue fallback tables v2_hotels/v2_bars/v2_food (anon read, ~206 rows) — live
- [x] All four user tables in supabase_realtime publication; single channel, debounced refetch, refetch on focus
- [x] Silent localStorage fallback for every read and write (six bh2-* keys, no error UI)

## Identity
- [x] UUID per device (bh2-voter-id) generated on first visit
- [x] "What's your name?" dialog (Save/Cancel, first name, max 20 chars) on first vote or first calendar tap
- [x] useNameGate() — every identifying write funnels through it; never asked again once set

## Views
- [x] CITIES (first screen): walkability index — 72px rows: name + state + district · score (display, grade color) + grade badge · miles + drive · 44px inline vote icon
- [x] Sort pill above bottom nav → bottom sheet: Distance from Ralston (default) / Walkability Score / City Name A–Z / By State (grouped sections); persisted to bh2-city-sort
- [x] CITY DETAIL: sticky header (back / name + state / vote icon), 280–380px dark map, cooperative gestures, circle pins (hotel accent / bar green / food blue), pin tap → venue sheet (name, tappable address, rating, price)
- [x] Hotels / Bars / Food tab bar (44px, accent indicator) over Places-fed lists; hotel rows carry $-symbols + rating + "prefer this hotel" radio (one per user per city, place_id keyed)
- [x] Full-width vote CTA above the nav: "Vote for X" ↔ "Your pick — X ✓" (tap to undo), optimistic
- [x] CALENDAR: personal only — tap cycles available → not available → clear; check/X icons in cells, today ring, past dates dimmed/disabled, green/red legend; upsert/delete to v2_availability
- [x] THE BOARD: hot-dates heat map (respondent-share buckets, yes/total fractions, month nav, tap → who's in/out sheet) + standings (rank, count, accent meter, voter pills, hotel preference sub-rows) + empty state
- [x] / → /cities redirect (server redirect + page fallback); 404 for unknown city ids
- [x] Tappable addresses everywhere → maps.google.com in a new tab

## Guardrails honored
- [x] Root index.html untouched; all work inside /app
- [x] No UI component libraries; no spinners on writes; no Supabase errors surfaced
- [x] No walk strips / constellation maps / score circles / tier pills / vibe tags / Trip tab
- [x] No hardcoded venue lists; walkability never calculated
- [x] React JSX escaping for all user strings

## Backlog
- [ ] Vercel deploy (root dir app/) + env vars + Maps key domain restriction
- [ ] Confirm Places API (Nearby Search) quota/billing on the production key
- [ ] Spot-check Places result quality for the smallest towns (fallback tables cover gaps)
- [ ] Per-city availability (current model is one shared group calendar — matches v1)
