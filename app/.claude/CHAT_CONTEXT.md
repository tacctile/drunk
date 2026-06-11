# CHAT CONTEXT — drop-in brief for Claude Chat sessions

Paste-ready context for strategy/planning chats about Bar Hoppers /app.

## Project overview

Bar Hoppers: a mobile-first webapp for ~6–10 friends in Ralston, NE to plan overnight
bar-hop trips. 27 candidate cities (NE/IA/SD/MO/KS), each scored 0–100 against the
perfect trip: hotel steps from the bar district, walk to dinner, hop on foot, walk
back — never touch the car. Group votes city + hotel (one atomic vote per person,
changeable), and a shared availability calendar finds the weekend the most people
are free. No auth: device UUID + first name. Live via Supabase realtime; silently
falls back to localStorage offline.

## Stack

Next.js 14 App Router (TypeScript, strict) · Tailwind v3 (CSS-var tokens, dark
default + full light mode) · @supabase/supabase-js v2 (client hooks only) ·
Google Maps JS API via @googlemaps/js-api-loader (in-app map, no external nav
links — hotel websites are the only external links) · Manrope + Material Symbols
Outlined · zero UI libraries · everything in /app (repo root index.html is v1,
untouchable).

## Current state (sync with STATE.yml — that file wins on conflict)

- Initial build complete and compiling (34 static pages).
- Supabase v2 schema deployed (migration `bar_hoppers_v2_schema`, realtime enabled).
- Vercel deploy pending: project root `app/`, optional NEXT_PUBLIC_ env vars
  (working public fallbacks are baked in).
- 99 venues flagged `verified: false` pending address research.

## How the prompt workflow works

1. **Chat** (with MASTER_CONTEXT.md + this file) decides what to build and writes a
   tight build prompt.
2. **Claude Code** runs it inside /app on a feature branch — reads
   `.claude/CONTEXT.md` first, then only the files `.claude/BUILD_INDEX.md` lists
   for the task type. Updates STATE.yml / PROGRESS.md before finishing.
3. Code ends the session with a **completion report** (format below).
4. **Chat confirms** the report against intent; human merges the branch.

## Completion report format (Claude Code outputs this at the end of every session)

```
TASK COMPLETED: [one sentence]
FILES CHANGED: [list]
FEATURES BUILT: [list]
SCHEMA CHANGES: [describe or NONE]
.claude/ FILES CREATED: [list or NONE]
KNOWN ISSUES: [list or NONE]
ENV VARS NEEDED: [list with descriptions]
NEXT STEPS: [what needs to happen before first use]
SAFE TO MERGE: YES / NO — [one sentence reason]
```

## Hard rules every session inherits

- Never touch anything outside /app.
- Never add UI component libraries or external map/navigation links.
- Never surface Supabase errors to users — silent localStorage fallback.
- Never hardcode city counts.
- Both themes ship finished; 44px interactive height; 4px grid.
- localStorage keys are fixed: bh2-voter-id, bh2-voter-name, bh2-city-vote-cache,
  bh2-hotel-vote-cache, bh2-avail-cache, bh2-theme.
