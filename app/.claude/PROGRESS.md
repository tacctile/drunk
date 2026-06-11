# PROGRESS

Legend: [x] complete · [~] partial · [ ] pending

## Foundation
- [x] Next.js 14 App Router + TypeScript strict scaffold in /app (own package.json, own ecosystem)
- [x] Tailwind v3 with CSS-variable design tokens (4px grid, 44px interactive height)
- [x] Manrope (400–800) + Material Symbols Outlined via Google Fonts CDN
- [x] Dark mode default + fully built light mode, pre-paint boot script, persisted to bh2-theme
- [x] prefers-reduced-motion respected (all animation collapses)
- [x] Mobile-first 375px canvas; desktop ≥840px gets left rail + 2-col grids

## Data
- [x] 27-city dataset cleaned per research MD (closed venues removed, wrong-city venues removed, Candlewood Suites removed from Grand Island)
- [x] Verified addresses applied; unverified venues kept and flagged `verified: false`
- [x] hotel_id kebab-case slugs on every hotel (vote target ids)
- [x] Vibe tags: exactly 2–3 per city from the fixed 10-tag list
- [x] Walkability: Haversine cluster math (outlier-robust seeding), tiers per thresholds
- [x] Composite score 0–100 (40% walkability / 30% bar count / 30% hotel proximity)

## Supabase
- [x] v2 schema (v2_voters, v2_city_votes, v2_hotel_votes, v2_availability) + RLS policies — applied to project tszssadgsxjoymcttlwd as migration `bar_hoppers_v2_schema`
- [x] Tables added to supabase_realtime publication
- [x] Realtime subscriptions (single channel, debounced refetch) + refetch on focus
- [x] Silent localStorage fallback for every read and write (six bh2-* keys, no error UI)

## Identity
- [x] UUID per device (bh2-voter-id) generated on first visit
- [x] Name prompt on first vote/availability action (first name, max 20 chars)
- [x] Upsert to v2_voters on name save; name changeable from Vote view

## Views
- [x] Dashboard: vote leader w/ momentum (+N ahead, pulse), hotel leader, best-weekend card, roster, quick-action CTAs (hide once done), top-3 score cards, live standings
- [x] Cities: card grid (1-col / 2-col), sort Distance/Score/A–Z/Most Votes, filter by vibe tag + walkability tier, per-card vote count + best weekend
- [x] City Detail: hero (name/state/miles/drive/tier/vibes/score), in-app themed Google Map (circle pins, filter chips, fitBounds, zoom≥15 OverlayView labels, pin→sheet), vote section, hotel cards w/ drill-in walking distances (ft<1000/mi), bars list, food list (list tap pans map + opens sheet)
- [x] Vote: cast/change flow (city picker → hotel picker, atomic commit), ranked results w/ meters, expandable hotel race per city, voter chips with "You" highlight, rename affordance
- [x] Dates: My Dates tri-state calendar (past disabled, today ringed), Group View heat map w/ tap-for-breakdown sheet, shared month nav between tabs, chronological All Responses list, upsert/delete writes

## Guardrails honored
- [x] Root index.html untouched; all work inside /app
- [x] No UI component libraries; no external nav links except hotel websites
- [x] No hardcoded city counts; everything derives from data
- [x] React JSX escaping for all user strings

## Backlog
- [ ] Vercel deploy (root dir app/) + env vars + Maps key domain restriction
- [ ] Address research for the 99 venues still flagged unverified
- [ ] Per-city availability (current model is one shared group calendar — matches v1)
- [ ] True transactional vote commit via Postgres function (nice-to-have)
