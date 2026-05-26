# Dev Docs

Persistent task documentation for context preservation across sessions.

## When to create a task bundle

Create a task bundle under `dev-docs/active/<task-slug>/` when work is
cross-cutting, multi-session, or defines contracts that later implementation
must recover from context.

Skip task bundles for trivial single-file edits.

## Naming

- Use short kebab-case slugs.
- Prefer functional names such as `workflow-base` or `scenario-registry`.
- Do not include dates, status, or roadmap numbers in the directory name.

## Standard files

| File | Purpose |
|---|---|
| `roadmap.md` | Macro milestones, sequencing, scope, risks, rollback |
| `00-overview.md` | Goal, status, scope, non-goals, decisions |
| `01-plan.md` | Concrete phases, steps, acceptance criteria |
| `02-architecture.md` | Boundaries, interfaces, ownership, key risks |
| `03-implementation-notes.md` | What changed and why |
| `04-verification.md` | Checks run and outcomes |
| `05-pitfalls.md` | Do-not-repeat lessons |

Additional numbered files are allowed when they keep durable context clearer.

## Context reset

When resuming an active task:

1. Read `00-overview.md`.
2. Read `roadmap.md`.
3. Read `01-plan.md`.
4. Scan `05-pitfalls.md`.

## Update rules

- Update `00-overview.md` when status changes.
- Append implementation decisions to `03-implementation-notes.md`.
- Record all validation commands in `04-verification.md`.
- Keep task docs scenario-neutral unless the task is explicitly about a concrete
  scenario module.
