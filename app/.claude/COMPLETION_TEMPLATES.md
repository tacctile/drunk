# Bar Hoppers — Completion Templates

> Every Claude Code session ends with a completion report in this format.
> Declare session type at the START of every session.
>
> Last Updated: 2026-06-16

---

## PROMPT SCORE Rubric

Every completion report includes a PROMPT SCORE (1–10):

- **10** — Zero ambiguity. Every file, requirement, and constraint specified. No guessing needed.
- **9** — One minor ambiguity that did not affect execution.
- **8** — Clear intent but 1–2 details required inference from context.
- **7** — Functional but multiple areas required judgment calls.
- **6** — Achievable but significant gaps required assumptions.
- **5 or below** — Prompt needs a rewrite before next use.

Always pair the score with `SUGGESTED PROMPT IMPROVEMENTS` — the specific changes that would raise it.

---

## Session Types

| Type | When to Use |
|---|---|
| `feature-build` | New functionality, new components, new screens |
| `audit-fix` | Reading the codebase, finding issues, fixing without new features |
| `non-code` | Context file updates, STATE.yml sync, CONTEXT.md updates |

---

## Template 1 — feature-build

```
SESSION TYPE: feature-build
PROMPT SCORE: [1–10]
SUGGESTED PROMPT IMPROVEMENTS: [specific changes, or NONE]

TASK COMPLETED: [one sentence]

FILES CREATED:
* [path] — [what it does]

FILES MODIFIED:
* [path] — [what changed]

FILES DELETED:
* [path] — [why]

PACKAGES ADDED OR REMOVED: [list with version and reason, or NONE]

ARCHITECTURE CHANGES: [structural changes, or NONE]
SCHEMA CHANGES: [Supabase table/column changes, or NONE]

BUILD STATUS: [PASSED / FAILED — next build output]
TYPE CHECK: [PASSED / FAILED — tsc --noEmit error count]
CONSOLE ERRORS ON LOAD: [0 / N]

IS_ACTIVE INVARIANT APPLIED: [YES / NOT APPLICABLE — if any group-facing query was touched]

KNOWN ISSUES INTRODUCED:
* [issue] — [why left, what fixes it]

STATE.yml: UPDATED
PROGRESS.md: [UPDATED / NOT UPDATED]
CONTEXT.md: [UPDATED / NOT UPDATED]

NEXT LOGICAL TASK: [one sentence]
```

---

## Template 2 — audit-fix

```
SESSION TYPE: audit-fix
PROMPT SCORE: [1–10]
SUGGESTED PROMPT IMPROVEMENTS: [specific changes, or NONE]

AUDIT SCOPE: [what was examined]

FINDINGS:
* CRITICAL: [list or NONE]
* HIGH: [list or NONE]
* MEDIUM: [list or NONE]
* LOW: [list or NONE]

FIXES APPLIED:
* [what was fixed] — [file path]

FILES MODIFIED:
* [path] — [what changed]

BUILD STATUS: [PASSED / FAILED — details]
TYPE CHECK: [PASSED / FAILED — error count]

ISSUES DEFERRED:
* [issue] — [why deferred, what resolves it]

STATE.yml: UPDATED
PROGRESS.md: [UPDATED / NOT UPDATED]
CONTEXT.md: [UPDATED / NOT UPDATED]

NEXT LOGICAL TASK: [one sentence]
```

---

## Template 3 — non-code

```
SESSION TYPE: non-code
PROMPT SCORE: [1–10]
SUGGESTED PROMPT IMPROVEMENTS: [specific changes, or NONE]

TASK COMPLETED: [one sentence]

FILES CREATED OR MODIFIED:
* [path] — [what changed]

NOTES: [anything worth flagging, or NONE]

STATE.yml: UPDATED
```

---

## After ANY Session — Required Updates

| What changed | What to update |
|---|---|
| Any session | `STATE.yml` — always, no exceptions |
| Feature added or behavior changed | `PROGRESS.md` — add entry at top |
| Schema changed (new table/column) | `CONTEXT.md` — migration log + schema section |
| Architecture changed (new file, new pattern) | `CONTEXT.md` — file map section |
| New package added | `CONTEXT.md` — stack section |

**STATE.yml is overwritten completely every session.** No stale fields.

---

## PROGRESS.md Entry Format

Newest entries at top.

```markdown
### YYYY-MM-DD — [Session Type]: [One-line summary]

**What:** 2–4 sentences. What was done and why.

**Key Decisions:** Non-obvious choices, overrides, anything that affects future sessions. Omit if nothing notable.
- Decision + one-sentence rationale

**Status:** One sentence. Complete / partial + what remains.
```

---

## STATE.yml Format

```yaml
last_updated: "YYYY-MM-DD"
last_session: "[one-line description]"
current_phase: "[slug]"
build_complete: [true / false]
supabase_schema_deployed: [true / false]
vercel_deployed: [true / false]
known_issues:
  - "[issue description]"
next_up:
  - "[next task]"
```
