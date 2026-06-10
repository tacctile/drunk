# Bar Hoppers — Project Context
> Single source of truth for all Claude Code sessions.
> Read this + index.html at the start of every session. Nothing else required unless specified.

---

## What This Is
A single-page HTML app for planning overnight bar-hop trips from Ralston, NE.
A group of friends use it to browse destinations, compare cities, vote on where to go, and view trip details.
Personal project — built solid and well-structured, not overcomplicated.

---

## Repo & Deploy
- GitHub: https://github.com/tacctile/drunk
- Deploy: GitHub Pages
- Supabase: https://tszssadgsxjoymcttlwd.supabase.co

---

## Architecture — Non-Negotiable Rules
1. ONE FILE — index.html contains all HTML, CSS, and JS. Never split into separate files.
2. No frameworks, no npm, no build step. Plain HTML/CSS/JS only. External resources via CDN only.
3. City data lives in the `const cities = [...]` array in index.html. The number of cities is variable — never hardcode counts or assume a fixed number.
4. Supabase is used for shared real-time data only (voting, any future shared state). All other state is localStorage.
5. Never break existing features — every session ends with all prior functionality still working.
6. Mobile-first. Think at 375px before finalizing any layout decision.

---

## Design System
- Font: Inter (Google Fonts CDN, weights 400–900)
- Monospace: SF Mono / Fira Code / Consolas
- Primary accent dark: #e49a4a | Primary accent light: #c27a1a
- Background dark: #1b1b1f | Surface dark: #27272b | Surface2 dark: #323237
- Background light: #f7f7f5 | Surface light: #ffffff
- Border dark: #3e3e45 | Border light: #d8d7d4
- Text dark: #e6e4e1 | Text light: #1d1d1f
- Green: #4fbe7a | Red: #e25c5c | Yellow: #e0c846
- Dark mode default. Light mode toggle persisted via localStorage key bh-theme.
- 8px spacing grid. Border radius 4px standard, 6–8px for cards and modals.
- 150–200ms transitions on interactive elements.
- No pure black or pure white anywhere.

---

## Supabase Schema
> Updated here whenever a table is created or modified.

*No tables yet — will be added as schema is built.*

---

## Features — Current State

### Built
- [x] City data array — variable number of cities, each with full detail object
- [x] Comparison table — sortable by city name and distance
- [x] Expandable tray rows — full city detail inline in table
- [x] Compare lightbox — select 2 or 3 cities, scored across 8 categories with verdict
- [x] Vote system — name prompt, localStorage vote storage, results lightbox, FAB badge
- [x] Theme toggle — dark/light, persisted to localStorage
- [x] Sticky toast — Back to List button when tray is open
- [x] Mobile responsive — progressive disclosure on cards, controls collapse, table column hiding

### Backlog
- [ ] Supabase voting — replace localStorage votes with real shared votes across devices

---

## Current State
Last updated: 2026-06-10
Last change: Initial governance files created
Next up: Supabase voting migration
