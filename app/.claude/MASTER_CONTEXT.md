# BAR HOPPERS — MASTER CONTEXT

*Read this first in any strategy session. Two pages, no fluff.*

## What it is

Bar Hoppers is a private webapp for a crew of friends (~6–10 people) in Ralston, Nebraska who take overnight bar-hop trips. It answers exactly three questions: **where are we going, where are we sleeping, and when can everyone make it** — and it does it without accounts, passwords, or anyone installing anything.

## The perfect trip (the standard everything is judged by)

Drive to a city. Check into a hotel that is steps from the bar district. Walk to dinner. Bar hop on foot all night. Walk back to the hotel. **Never touch the car.** Every one of the 27 candidate cities is scored against that ideal: how tight its bar cluster is, how many bars are inside it, and how close the best hotel sits to the middle of it.

## Who uses it and how

The crew, on their phones, usually mid-group-chat. Someone drops the link, everyone votes for a city and the hotel they'd book there, everyone paints the calendar with the nights they're free. The dashboard shows the live answer: leading city, leading hotel, best weekend, who's voted. Decisions that used to take 200 group-chat messages now take a screenshot of the dashboard.

## How it works (60-second version)

- **27 cities** across NE/IA/SD/MO/KS, each with researched hotels, bars, and food — addresses verified where possible, honestly flagged "unverified" where not.
- **Composite score (0–100)** per city: 40% walkability (bar-cluster tightness + hotel reach), 30% bar count, 30% hotel proximity. Tiers: *Walk Everything / Walk Most / Need a Ride*.
- **Voting** is one atomic action: city + hotel together. One vote per person; changing your mind moves it. First vote asks your first name — that's the entire identity system (a device UUID + a name in localStorage).
- **Dates** is a tri-state personal calendar (free / busy / no answer) and a group heat map that surfaces "Best weekend: Sat, Jun 28 — 5 of 7 available."
- **Live**: Supabase realtime pushes every vote and calendar change to everyone instantly. If Supabase is down, the app silently falls back to localStorage and keeps working.
- **In-app map** per city: hotel/bar/food pins, walking distances from any hotel to every venue. Deliberately NO "open in Google Maps" — the app is the itinerary.

## Where it lives

- GitHub `tacctile/drunk`, everything under `/app` (repo root `index.html` is v1 — untouchable).
- Supabase project `tszssadgsxjoymcttlwd`, tables `v2_*` only.
- Deploys to Vercel with project root `app/`.

## Product taste rules

Mobile first (375px canvas). Dark mode default, light mode equally finished. Amber/gold accent, deep warm surfaces, Manrope, Material Symbols. 44px touch targets, 4px grid. It should feel like something a small crew of friends actually wants to open on a Friday — not a corporate dashboard, not a generic travel app.

## Workflow

Strategy happens in Claude Chat with this brief. Implementation happens in Claude Code sessions inside `/app` (see `.claude/BUILD_INDEX.md` for what to read per task). Every Code session ends with a completion report (format in `.claude/CHAT_CONTEXT.md`); Chat reviews it, then the branch merges.
