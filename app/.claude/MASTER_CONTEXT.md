# HOPPZ — MASTER CONTEXT

*Read this first in any strategy session. Two pages, no fluff.*

## What it is

Hoppz is a private webapp for a crew of friends (~6–10 people) in Ralston, Nebraska who take overnight bar-hop trips. It answers exactly three questions: **where are we going, where are we sleeping, and when can everyone make it** — and it does it without passwords or anyone installing anything.

## The perfect trip (the standard everything is judged by)

Drive to a city. Check into a hotel that is steps from the bar district. Walk to dinner. Bar hop on foot all night. Walk back to the hotel. **Never touch the car.** Every candidate city carries researched walkability data — walk scores, grades, districts, distances — reflecting how well it fits that ideal.

## Who uses it and how

The crew, on their phones, usually mid-group-chat. Someone drops the link, everyone votes for a city and picks the hotel they'd book there, everyone paints the calendar with the nights they're free. The Board shows the live answer: leading city, leading hotel, best weekend, who's voted. Decisions that used to take 200 group-chat messages now take a screenshot of The Board.

## How it works (60-second version)

- **27 cities** across NE/IA/SD/MO/KS, each with researched hotels, bars, and food — addresses verified where possible, honestly flagged "unverified" where not.
- **Walkability grades** per city: researched data (walk score, bar-cluster tightness, hotel proximity, district notes, distances) baked into the city data file. No runtime calculation.
- **Voting** is two linked choices: pick a city, pick a hotel within it. One city vote per person; changing your mind moves it. Hotel preference is per city.
- **Identity** is PIN-based: first visit prompts a name and color-coded PIN. Sign back in from any device with the same PIN. No email, no OAuth.
- **Availability** is a tri-state personal calendar (available / unavailable / no answer) and a group heat map that surfaces the best upcoming weekend.
- **Live**: Supabase realtime pushes every vote and calendar change to everyone instantly. If Supabase is down, the app silently falls back to localStorage and keeps working.
- **Social wing**: real-time chat (text + photos), camera capture, photo gallery, live location sharing on a map.
- **In-app map** per city: hotel/bar/food pins, walking distances from any hotel to every venue.

## Where it lives

- GitHub `tacctile/drunk`, everything under `/app` (repo root `index.html` is v1 — untouchable).
- Supabase project `tszssadgsxjoymcttlwd`, tables `v2_*` only.
- Deploys to Vercel with project root `app/`.

## Product taste rules

Mobile first (375px canvas). Dark only — no light mode. Amber/gold accent, deep warm surfaces, Manrope, Material Symbols. 44px touch targets, 4px grid. It should feel like something a small crew of friends actually wants to open on a Friday — not a corporate dashboard, not a generic travel app.

## Workflow

Strategy happens in Claude Chat with this brief. Implementation happens in Claude Code sessions inside `/app` (see `.claude/BUILD_INDEX.md` for what to read per task). Every Code session ends with a completion report (format in `.claude/COMPLETION_TEMPLATES.md`); Chat reviews it, then the branch merges.
