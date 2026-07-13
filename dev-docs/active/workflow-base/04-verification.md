# Verification

## X0-A Required Checks

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm verify:x0-a`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `ruby -e 'require "yaml"; YAML.load_file("templates/scenario-module/scenario.manifest.yaml"); puts "yaml ok"'`
- `git diff --check`
- scan X0-A diff for contract-type, Prisma, database, queue, outbox, provider, or
  delivery implementation changes
- clean-install simulation without existing root `node_modules`

## X0-A Results

- 2026-07-13: Initial Base source-repo commands failed because the repository had
  no root workspace/dependencies and the host packages referenced a missing
  shared tsconfig. This is the pre-fix B6 evidence.
- 2026-07-13: First integrated run passed all three typechecks and runtime tests,
  then failed because Vitest's `tests/**/*.test.ts` filter did not include the
  root-level scenario journey test. Package scripts were changed to stable
  directory entrypoints before continuing.
- 2026-07-13: Post-fix `corepack pnpm verify:x0-a` passed: contracts, runtime,
  and scenario template typechecks; runtime 8/8 tests; scenario journey 1/1.
- 2026-07-13: Legacy module contract hash baseline recorded as
  `9f568ff772d3dafc02dd96f284f7cedb85aff18839b8f26f4691a8b2dc0d0ca6`.
- 2026-07-13: `corepack pnpm install --frozen-lockfile`, YAML parsing for the
  scenario manifest and GitHub workflow, `git diff --check`, and the contract
  type no-change boundary check passed.
- 2026-07-13: A temporary-directory clean checkout simulation excluded all
  existing `node_modules`, performed a frozen install, and passed the full
  `verify:x0-a` matrix: three typechecks, runtime 8/8, scenario journey 1/1.
- 2026-07-13: Existing independent web-workbench regression checks passed:
  `corepack pnpm --dir templates/web-workbench typecheck` and `build`. The new
  root workspace does not absorb or replace the web-workbench lockfile/package.
- 2026-07-13: Draft PR #1 opened from
  `chore/x0-a-contract-conformance`; GitHub Actions run `29233753559` passed the
  frozen-install and `verify:x0-a` conformance job in 20 seconds.

## X0-B Required Checks

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm verify:x0-b`
- dedicated legacy and vNext positive compile fixtures
- clean-checkout frozen-install simulation without root `node_modules`
- YAML parse for scenario manifest and GitHub workflow
- Markdown fence and link checks for changed docs
- `git diff --check`
- claim-token placement scan
- boundary scan for validator behavior, runtime persistence, Prisma, database,
  queue, Outbox, provider, or scenario-specific implementation
- independent web-workbench typecheck/build regression

## X0-B Results

- 2026-07-13: Integrated `corepack pnpm verify:x0-b` passed after contract and
  positive fixture implementation: four typechecks, runtime 8/8 tests, and
  scenario journey 1/1.
- 2026-07-13: Architecture review found that a broad completion input/output
  union would not correlate a v1 input with its materialization result and
  would change the legacy implementation obligation. The contract was repaired
  to retain `WorkflowRuntimePort` and add the overloaded
  `WorkflowRuntimePortMaterializationV1`; the full verification command passed
  again.
- 2026-07-13: Positive compile fixtures prove three paths independently: the
  unchanged legacy port accepts legacy completion and returns
  `WorkflowStepResult`; the v1 port retains that legacy overload; and the v1
  completion overload returns materialized Handoff refs.
- 2026-07-13: A temporary-directory clean-checkout simulation excluded all
  existing `node_modules`, completed frozen install for five workspace
  projects, and passed `verify:x0-b`: four typechecks, runtime 8/8, scenario
  journey 1/1.
- 2026-07-13: Scenario manifest and GitHub workflow YAML parsing, Markdown fence
  scan across 19 files, Markdown link scan across 11 changed docs, and `git
  diff --check` passed.
- 2026-07-13: Claim-token placement and changed-path boundary scans passed.
  Newly added claim fields exist only on the trusted driver and discriminated
  completion input; snapshots, drafts, lifecycle, and materialization outputs
  contain none. No validator implementation, runtime/scenario implementation,
  Prisma/database, queue, Outbox, provider, or delivery path changed.
- 2026-07-13: Independent `templates/web-workbench` typecheck and build passed;
  the X0-B workspace/conformance additions do not absorb or regress that
  package.

## Planned Checks
- `git diff --check`
- YAML parse for `templates/scenario-module/scenario.manifest.yaml`
- Markdown fence count check for workflow docs and task docs
- Search for stale local-path references before finalizing docs
- `pnpm --dir templates/web-workbench typecheck`
- `pnpm --dir templates/web-workbench build`
- Node ESM import smoke for every new `@willyu1007/web-workbench/*` grouped
  entry

## Results
- 2026-05-25: Task package created.
- 2026-05-25: Markdown fence count check passed for workflow docs, task docs,
  and scenario template docs.
- 2026-05-25: Local path/reference scan passed for repository docs.
- 2026-05-25: `ruby -e 'require "yaml"; YAML.load_file("templates/scenario-module/scenario.manifest.yaml"); puts "yaml ok"'` passed.
- 2026-05-25: `git diff --check` passed.
- 2026-05-26: Stale surface-name scan passed for active workflow docs and
  scenario templates. Removed earlier chat/web surface wording from the v0
  contract path.
- 2026-05-26: Knowledge-indexing action wording scan passed. Dashboard and chat
  docs now describe service-owned indexing instead of direct knowledge-base
  actions.
- 2026-05-26: Markdown fence count check passed for workflow docs, task docs,
  and scenario template docs.
- 2026-05-26: `ruby -e 'require "yaml"; YAML.load_file("templates/scenario-module/scenario.manifest.yaml"); puts "yaml ok"'` passed.
- 2026-05-26: `git diff --check` passed.
- 2026-05-26: Canonical domain registry / Domain Context sync passed stale-term
  scan. Active base docs now use `DomainContextRef`, resolver snapshots, and
  context bindings instead of workflow-owned domain storage.
- 2026-05-26: `ruby -e 'require "yaml"; YAML.load_file("templates/scenario-module/scenario.manifest.yaml"); puts "yaml ok"'` passed after manifest context-ref update.
- 2026-05-26: `git diff --check` passed after API ownership sync.
- 2026-05-26: `DomainContextRef` shape updated so `namespace` is canonical
  owner namespace and `consumer_scenario_key` is optional consuming context.
- 2026-05-26: Template/runtime semantic sync completed. Active docs now state
  that this repository is not a workflow runtime; concrete workflows implement
  the standard adapters/APIs, including `ChatWorkflowAdapter`.
- 2026-05-26: Semantic drift scan passed for misleading base-runtime and
  manifest-only wording after adapter/template alignment.
- 2026-05-26: Conflict exposure contract added. Chat conflict payload is limited
  to `ChatConflictSummary`; detailed resolution and evidence views are separate.
- 2026-05-26: Resolution action ownership contract added. Chat is excluded from
  resolution execution and receives only safe links.
- 2026-05-26: Audit scope synchronized to MVP evidence log. Docs distinguish
  evidence records from outbox events and keep audit UI/reporting/review queues
  out of MVP.
- 2026-05-26: Downstream information contract synchronized. Docs now state that
  outbox events are ref-only signals and downstream systems reread canonical
  state for projection, publication, RAG/knowledge, notification, search/vector,
  PPR, and replay.
- 2026-05-26: Event registry convergence synchronized. Docs now separate
  platform events, standard workflow events, and scenario internal events.
- 2026-05-26: Standard workflow event payload schema synchronized. Docs now
  require refs-only payloads, no canonical status fields, no presenter output,
  and deterministic idempotency keys.
- 2026-05-26: Event ownership registry synchronized. Docs now require producer
  ownership by canonical aggregate owner and forbid shared consumers from
  depending on scenario internal events.
- 2026-05-26: Manifest validation and activation gates synchronized. Docs now
  define validator inputs, validation report shape, fatal rule ids, activation
  phases, and migration bridge warning rules.
- 2026-05-26: Registry loader contract synchronized. Docs now define the
  host-owned loader boundary, registered descriptor, canonical runtime identity
  resolution, fail-fast loader rules, disabled-module behavior, and migration
  bridge warning.
- 2026-05-26: Standard API closure synchronized. Docs now define required
  discovery, start requirement, run lifecycle, action, artifact, handoff,
  dashboard, chat citation, admin, and worker runtime API/adapter groups.
- 2026-05-26: Implementation skeleton synchronized. Docs now define host package
  layout, contract exports, validator scaffold, registry loader scaffold, route
  scaffold, handoff service, worker runtime, and deterministic journey harness.
- 2026-05-26: Scenario readiness proof synchronized. Docs now compare an
  education-like seed walkthrough and a non-education support-case scenario
  sketch against the same base contracts and product-surface API closure.
- 2026-05-26: Semantic drift cleanup and v0 readiness pass synchronized. Docs
  now include `v0-readiness-checklist.md`; remaining education-specific wording
  is limited to seed/proof context, and direct diagnosis wording in shared
  surface contracts was neutralized.
- 2026-05-27: Review findings fixed. Scenario template event registry,
  producers, consumers, and governance outbox event declarations are consistent;
  `WorkflowSurfaceAdapters` now has local DTO/input type definitions for the
  referenced adapter methods.
- 2026-05-27: Deep cleanup pass completed before commit. YAML parse, Markdown
  fence scan, Markdown link scan, `git diff --check`, event registry consistency,
  and adapter DTO/import scan passed. No temp/test artifacts from this round
  were found; `WorkflowRuntimePort` is exported from the API contract and
  imported by the module contract scaffold instead of being redefined.
- 2026-05-27: Lightweight scaffold added under `templates/host-runtime` and
  `templates/scenario-module/src`. Pending final fence/link/diff checks in this
  implementation round.
- 2026-05-27: `ruby -e` Markdown fence scan passed for README, workflow docs,
  active task docs, and templates.
- 2026-05-27: `ruby -e` Markdown link scan passed for README, workflow docs,
  active task docs, and templates.
- 2026-05-27: `git diff --check` passed after lightweight scaffold additions.
- 2026-05-27: Scaffold adapter closure reviewed and expanded to include
  chat, web run workbench, mobile dashboard, admin operator, and worker runtime.
- 2026-05-27: Review-fix pass completed for lightweight scaffold. Markdown
  fence scan, Markdown link scan, template host/path scan, and `git diff
  --check` passed after worker lifecycle, contract hash, validator, binding
  identity, action command, and descriptor freeze fixes were synchronized from
  the reference host implementation.
- 2026-05-27: Final cleanup pass removed a copied local `node_modules`
  workspace link from the host-runtime template. The registry scaffold now
  exposes runtime read-only map proxies, and validator checks host-supported
  surfaces plus standard/platform event registration.
- 2026-06-26: Planned verification expanded for the web workbench grouped
  public entry split. Results pending implementation.
- 2026-06-26: `corepack pnpm --dir templates/web-workbench typecheck` passed
  for `@willyu1007/web-workbench@0.6.6`.
- 2026-06-26: `corepack pnpm --dir templates/web-workbench build` passed after
  changing the build/prepublish scripts to avoid nested bare `pnpm` calls in the
  local runtime.
- 2026-06-26: Node ESM import smoke passed for grouped entries:
  `primitives`, `shell`, `feedback`, `list`, `insight`, `settings`, `hub`,
  `queue`, `record`, and existing `contracts`.
- 2026-06-26: Published `@willyu1007/web-workbench@0.6.6` to GitHub Packages.
