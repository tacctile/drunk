# Bar Hoppers — Chat Context

> Guide for Claude Chat when generating prompts for Claude Code, and for operating directly in conversation.
>
> Last Updated: 2026-06-16

---

## What This File Is

Nick uses Claude Chat for two purposes:

1. **Generating prompts for Claude Code** — new features, bug fixes, data changes. The prompt is pasted into Claude Code with the `/app` repo mounted.
2. **Operating directly in conversation** — strategy, planning, quick audits, content decisions that don't need a code session.

---

## Path 1: Claude Code Prompt Generation

### The Workflow

1. Nick describes what needs to happen.
2. Claude Chat reads this file + `MASTER_CONTEXT.md`, identifies the task type, and **presents what the prompt will include before generating it.**
3. Nick confirms or corrects.
4. Claude Chat generates the self-contained prompt.
5. Nick pastes it into Claude Code with the repo mounted.
6. Claude Code executes and outputs a completion report.
7. Nick reviews the report in Chat. If clean, the branch merges.

**Claude Chat never generates a prompt without walking Nick through the plan first.**

---

### Prompt Template

Every prompt pasted into Claude Code follows this exact structure:

```
## Session: [feature-build | audit-fix | non-code] — [one-line description]

### Read First (in this order)
1. `.claude/CONTEXT.md`
2. `.claude/BUILD_INDEX.md` — find the task section, read ONLY those files

### What You Are Doing
[1–2 sentences. No ambiguity.]

### Instructions
[Numbered. Specific. One outcome per step.]

### Acceptance Criteria
[Testable binary checks. Not "it should work" — specific assertions.]

### Do NOT
[Explicit scope boundaries. Files not to touch. Patterns not to introduce.]

### On Completion
1. Update `.claude/STATE.yml` — always, every session
2. Update `.claude/PROGRESS.md` — only if features or behavior changed
3. Update `.claude/CONTEXT.md` — only if schema or architecture changed
4. Output completion report using the template in `.claude/COMPLETION_TEMPLATES.md`
```

---

### Prompt Writing Rules

1. **Self-contained.** Claude Code starts fresh every session. The prompt must reference every file it needs — no assumed carryover.
2. **Read-first, always.** First instruction is always `CONTEXT.md` → `BUILD_INDEX.md` → task-specific files from BUILD_INDEX.
3. **One task per prompt.** Never bundle two unrelated fixes into one session.
4. **Full paths from repo root.** `src/hooks/useVotes.ts` not `useVotes`.
5. **No ambiguity.** If there are two approaches, pick one and state it.
6. **"Do NOT" section is required.** Prevents scope creep. At minimum: `Do NOT touch anything outside /app. Do NOT add UI libraries.`
7. **Acceptance criteria are testable.** Every criterion must be a binary pass/fail check.

---

### Invariant That Applies to Every Session Touching Group Data

> From `BUILD_INDEX.md` — applies always, no exceptions:
>
> Voters with `v2_voters.is_active = false` are excluded from **every** group-facing view — vote counts, voter tags, hotel tallies, availability heat map, hot dates, roster denominator, the location map, and every people list. Personal values (own vote, own calendar, own profile) are **never** filtered. Any new group-facing query must apply the same filter.

If the session touches any group-facing query or component, include this as an explicit instruction and acceptance criterion.

---

### Acceptance Criteria Rules

Every prompt must include an Acceptance Criteria section with specific, testable checks. Examples of acceptable vs. unacceptable:

| ❌ Unacceptable | ✅ Acceptable |
|---|---|
| "The feature works correctly" | "`npx tsc --noEmit` passes 0 errors" |
| "Voting is fixed" | "Vote count on The Board excludes `is_active = false` voters" |
| "It looks right" | "Touch targets are ≥44px; 4px grid maintained" |
| "No regressions" | "Build passes (`next build`); 0 console errors on load" |

---

## Path 2: Direct Conversation

Use this path for:
- Strategy and planning discussions
- Architecture decisions before writing a prompt
- Reviewing completion reports
- Quick questions about current state (read STATE.yml first if it's in context)

Claude Chat reads `MASTER_CONTEXT.md` + `STATE.yml` for current state and answers directly. No prompt is generated.

---

## Commit Message Format

```
fix([area]): [what was broken and what fixed it]
feat([area]): [what was added]
data([area]): [city data, venue data, schema changes]
audit([area]): [findings and fixes from an audit session]
chore: [STATE.yml update, CONTEXT.md sync, etc.]
```

Examples:
- `fix(votes): exclude is_active false voters from board tallies`
- `feat(locate): single-device broadcast via session_id guard`
- `data(cities): backfill lat/lng for Omaha venues`
- `audit(calendar): fix heat map denominator counting disabled users`
