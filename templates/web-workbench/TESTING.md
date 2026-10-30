# Workbench core tests

Install with `pnpm install --ignore-workspace --frozen-lockfile`: this package has
its own lockfile and is not a root workspace member. Run `pnpm test` here, or run
`pnpm verify:workflow-contracts` at the repository root for the complete core and
production artifact verification. CI installs both dependency populations first.

The permanent component core contains these independent interactions:

- BA-30: an empty required form cannot submit and explains the missing values.
- BA-31: one valid form submits the consumer values.
- BA-32: a failed Settings save keeps its edited draft and dirty state.
- BA-33: opening a Drawer receives focus; closing restores the opening control.
- BA-34: Escape dismisses a nested Dialog without closing its parent Drawer.
- BA-35: the second Queue row opens that row's details.
- BA-36: arrow keys and Enter select the intended Select option.

These tests use jsdom and import current `src/`, so no previous build is tested.
Native dialog methods are stubbed because jsdom does not implement their focus
lifecycle. They do not establish real-browser layout, top-layer behavior or
physical-device accessibility. Consumer checks are still needed when those change.

Toast, list/filter/count, small layout/copy, exhaustive constraints, error timing
and additional overlay variants are no longer permanent regression coverage.
Their old matrices and helpers were removed, rather than moved to another runner.
The historical mutation campaign and old counts describe retired suites and are
not current coverage claims. Production type checks and token generation checks
remain separate. See [the repository policy](../../TESTING.md).
