# Testing

```bash
pnpm install --ignore-workspace   # first time, and after changing deps
pnpm test                          # once
pnpm test:watch                    # while working
```

**`--ignore-workspace` is not optional.** This package has its own lockfile and
is deliberately absent from the repo's `pnpm-workspace.yaml`, but it sits inside
the workspace root — so a plain `pnpm install` here resolves against the ROOT
lockfile, writes the kit's dependencies into it, and leaves this package's own
lockfile untouched. Everything then appears to work locally while CI, which
installs from the committed lockfile, gets a tree that never had the test
dependencies in it. That happened while this harness was being added; the
"CI-equivalent" check passed for the wrong reason, against node_modules the root
install had already linked.

The kit shipped 31 components with no test harness until 0.15.0. `pnpm build`
and `pnpm typecheck` proved a component *compiled*; nothing proved it *behaved*.
The first thing the harness caught was that it needed to exist: `<FormFrame>`'s
validation was verified by a throwaway script, and the only reason that was
possible is that its constraint pass happens to be pure.

## What runs

| | |
|---|---|
| Runner | vitest, jsdom environment |
| Library | `@testing-library/react` + `user-event` |
| Location | `tests/**/*.test.{ts,tsx}` |
| Target | **`src/`, not `dist/`** |

Tests import from `src/` on purpose. A suite that reads `dist/` cannot run
before a build, and — worse — silently tests the *previous* build when someone
forgets one. `dist` is covered separately by `build` and the token check.

jsdom rather than a browser runner: these are behaviour tests — validation,
focus, disabled state, aria wiring — and none of them need real layout. Anything
that genuinely needs layout belongs in a consumer-side Playwright test, not a
unit test pretending to measure pixels.

## Where it is enforced

- `prepublishOnly` runs `test` before `build`, so a failing component cannot be
  published.
- Base CI runs the suite (the kit has its own lockfile, so the step installs
  first).
- `tsconfig.json` includes `tests/`, so a type error in a test is a typecheck
  failure. `tsconfig.build.json` does not, so nothing test-related reaches
  `dist`. Both verified by probe.

## Writing tests here

**Assert what a consumer can observe.** Query by role and label, not by class
name or internal state. The exception is a documented class (`.mt-input--error`),
which is part of the kit's API.

**Prove the test can fail.** A green suite means nothing until you have seen it
go red for the right reason. The FormFrame suite was mutation-checked against
four deliberate breakages before being trusted:

| Component | Mutation | Result |
|---|---|---|
| FormFrame | drop the `required` check | 6 failed |
| FormFrame | stop clearing a field's error on edit | 1 failed |
| FormFrame | drop the blank option on a required select | 1 failed |
| FormFrame | stop focusing the first offending field | 1 failed |
| Queue | always open the first item's drawer | 2 failed |
| Queue | make the `close` callback a no-op | 3 failed |
| SettingsFrame | treat dirty as "was touched" instead of a value comparison | 1 failed |
| SettingsFrame | clear dirty before the save resolves | 2 failed |
| ListView | count filters against the current view instead of the full list | 1 failed |
| ListView | keep the load-more window when the filter changes | 1 failed |
| Toast | give errors the same 3.8s as everything else | 1 failed |
| Toast | let the busy toast auto-close | 1 failed |
| Toast | return a silent no-op API outside a provider | 1 failed |

Each failure landed on the test written for that behaviour, which is the part
worth checking — a suite where every mutation trips the same generic assertion
tells you far less.

**Test the logic, not the framework.** Pure logic (`checkConstraints`) is tested
directly; only behaviour that needs a DOM goes through `render`.

## Coverage today

57 tests across the five components that carry real state or branching logic:

| Component | Tests | What is held |
|---|---|---|
| `FormFrame` | 19 | validation gates submit, first-offender focus, error clears on edit, aria wiring, in-flight disable, rejected submit stays retryable |
| `SettingsFrame` | 12 | draft → dirty → save, dirty as a *value comparison* (typing and undoing is not dirty), edits surviving a section switch, failed save staying dirty |
| `Toast` | 10 | stacking, tone-dependent auto-close, busy toasts that do not expire mid-flight, `run()` resolving `undefined` on failure, throwing outside a provider |
| `ListView` | 9 | filter predicates, counts against the full list, load-more window and its reset on filter change, the presenter receiving only filtered+capped items |
| `Queue` | 7 | rows get a trailing action, the action opens a Drawer rather than navigating, the clicked row's drawer, close by callback and Escape, reopen with a new item |

The other 26 components remain untested. That is honest rather than complete —
these five were chosen because they hold state and branch; most of the rest map
props onto markup, where a typecheck already catches the likely mistakes. Adding
a suite to one is now a file, not a project.

### Fake timers and `userEvent`

`Toast` runs on fake timers, because its auto-close windows are 3.8s and 6s and a
suite that waits them out is a suite nobody runs. One trap comes with that:
`userEvent` schedules its own inter-event delays on the timer queue, so under
fake timers a click never lands and the test **times out rather than failing** —
a misleading signal. Use `fireEvent` for plain clicks in a fake-timer test;
`userEvent` is still right everywhere else.
