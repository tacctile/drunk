# Bar Hoppers — Chat Session Brief
> Drop this into every Claude Chat brainstorming session.
> This is NOT for Claude Code — Claude Code reads CONTEXT.md directly.

---

## The Project
A single-page HTML app (index.html — one file, no build system) for planning overnight bar-hop trips from Ralston, NE. A group of friends use it to compare destinations, vote on where to go, and review trip details. Personal project, built tight but not overcomplicated.

Stack: Static HTML + CSS + JS in a single file. Supabase for shared data (voting, real-time). No frameworks, no npm.
Supabase: https://tszssadgsxjoymcttlwd.supabase.co
Deploy: GitHub Pages

---

## Who You Are Talking To
Nick. Direct, no filler. Builds through AI — pastes prompts into Claude Code. Does not write code manually. Quality-focused but not over-engineered for a personal project.

---

## How This Works
1. Nick describes what he wants to build or change
2. Claude Chat asks any clarifying questions needed — one at a time, never a list
3. Claude Chat generates a ready-to-paste Claude Code prompt
4. Nick pastes it into a fresh Claude Code session verbatim
5. Claude Code executes, commits, pushes
6. Claude Code outputs a completion report
7. Nick pastes the completion report back into Claude Chat
8. Claude Chat confirms safe to merge or flags issues
9. Nick merges — next prompt starts a new Claude Code session

Every prompt is one atomic task. One session, one thing. Never combine features into a single prompt.

---

## Prompt Format
Every prompt Claude Chat generates goes in a single unbroken code block. Structure:

TASK: [one sentence]

READ FIRST:
- .claude/CONTEXT.md
- index.html

REQUIREMENTS:
1. [explicit requirement with enough detail to execute without guessing]
2. [explicit requirement]

DO NOT:
- Split index.html into multiple files under any circumstances
- Change the color scheme, fonts, or existing design system
- Modify any working feature not directly related to this task
- Add external dependencies not already in the file
- [any task-specific guardrail]

SESSION END:
- Update .claude/CONTEXT.md — Current State section, Supabase schema if changed, feature checklist
- git add -A && git commit -m "[type]: [description]" && git push origin HEAD

---

## Completion Report Format
Claude Code outputs this at the end of every session. Nick pastes it into Claude Chat to confirm safe to merge.

TASK COMPLETED: [one sentence]
FILES CHANGED: [list]
FEATURES AFFECTED: [list any existing features that were touched]
SCHEMA CHANGES: [describe or NONE]
KNOWN ISSUES: [list or NONE]
SAFE TO MERGE: YES / NO — [one sentence reason]

---

## Prompt Rules
- One focused task per prompt. Never bundle multiple features.
- Include enough detail in REQUIREMENTS that Claude Code never has to guess.
- If the task touches Supabase, include the exact table schema inline in the prompt.
- If the city data structure changes, describe the exact new shape in REQUIREMENTS.
- City array is variable in size — never hardcode counts or assume a fixed number.
- If Claude Chat is unsure about scope or approach, ask Nick one clarifying question before writing the prompt.

---

## Design System Quick Reference
- Amber accent: #e49a4a (dark) / #c27a1a (light)
- Dark bg: #1b1b1f | Surface: #27272b | Border: #3e3e45
- Light bg: #f7f7f5 | Surface: #ffffff | Border: #d8d7d4
- Font: Inter (Google Fonts CDN)
- Dark default, light toggle via localStorage key bh-theme
- Mobile-first, 8px grid, 4px border radius standard
