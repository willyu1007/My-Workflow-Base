# Testing

```bash
pnpm test        # once
pnpm test:watch  # while working
```

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

| Mutation | Result |
|---|---|
| drop the `required` check | 6 failed |
| stop clearing a field's error on edit | 1 failed |
| drop the blank option on a required select | 1 failed |
| stop focusing the first offending field | 1 failed |

Each failure landed on the test written for that behaviour, which is the part
worth checking — a suite where every mutation trips the same generic assertion
tells you far less.

**Test the logic, not the framework.** Pure logic (`checkConstraints`) is tested
directly; only behaviour that needs a DOM goes through `render`.

## Coverage today

`FormFrame` only — 19 tests. That is honest rather than complete: the harness
exists so the next component to change gets tests, and so a regression in the
one component with real branching logic is caught. The other 30 components
remain untested; adding a suite to one is now a file, not a project.
