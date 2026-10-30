# Core verification

Run the complete local verification with:

```sh
pnpm install --frozen-lockfile
pnpm --dir templates/web-workbench install --ignore-workspace --frozen-lockfile
pnpm verify:workflow-contracts
```

The command runs production type checks, canonical reference and consumer
boundaries, the core tests, current source identity, schema compilation/reference
resolution, and UI token consistency. The Workbench has a separate lockfile.

The permanent behavioral core is intentionally bounded:

| IDs | Guarantee | Location |
| --- | --- | --- |
| BA-01–07 | Module registration/dispatch and one refs-only command rejection boundary | `templates/host-runtime/packages/workflow-runtime/src/validation/` |
| BA-08–16 | Selected envelope, binding, subject-context and presentation samples | `conformance/tests/` |
| BA-17–27 | Selected binding recovery and protected-interaction compositions | `conformance/tests/` |
| BA-28–29 | Starter handoff and idempotent Owner API | `templates/scenario-module/tests/` |
| BA-30–36 | Required form, failed save, focus, row selection and keyboard interaction | `templates/web-workbench/tests/` |
| BA-37–40 | Immutable distribution identity, fresh Starter startup and a scenario fork rejection | `conformance/tests/` and `conformance/scripts/check-consumer-boundaries.test.mjs` |

Each test uses one selected input or a bounded continuous interaction. Adding a
loop, fixture replay or parameter matrix changes the actual execution population
and must be justified as additional permanent coverage. New work may use temporary
verification without automatically retaining every check as a regression test.

Schema/codec tests prove shape and composition only. They do not prove detached
signature verification, current-time expiry in a deployed Owner, actual rendering
or absence of database writes. Actual Host/scenario persistence and authority
belong in those repositories' cores. The fresh Starter test removes this
worktree's old output, packs the production packages through prepack, extracts
their tarballs into an isolated consumer and starts the package through exports.

Exhaustive field/error/state matrices, compile-only positive/negative fixture
matrices, source-string checks for transient tokens and documentation alignment,
starter PG integration, and minor UI branches have been retired. This is an
explicit reduction in automatic coverage, including the dedicated token
snapshot/log source scan. The core does not claim all-schema-field parity, every
protocol branch, every component behavior, or production readiness. Published
JSON examples and production validators remain available.

Do not move retired matrices into another verify, nightly or manual command.
Report discovery, actual inputs, unexpected skips, environment preparation and
wall-clock cost separately from static artifact integrity.
