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
- 2026-07-13: Draft PR #1 GitHub Actions run `29235371875` passed for commit
  `9f2c36c`: frozen install and the full `verify:workflow-contracts` job
  completed successfully.

## X0-C Required Checks

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm verify:x0-c`
- validator matrix for no-handoff, legacy warning, valid vNext, missing key,
  missing source, absent/empty host capability, and duplicate declared key
- negative TypeScript fixtures for trusted claim evidence and forbidden
  persisted/output claim fields
- claim-token type-placement and runtime logging/metrics boundary check
- frozen legacy contract hash and existing `WF-MAN-040`–`042` finding-path
  regression assertions
- clean-checkout frozen-install simulation without root `node_modules`
- YAML, Markdown fence/link, `git diff --check`, and changed-path boundary scans
- independent web-workbench typecheck/build regression
- Draft PR remote CI

## X0-C Results

- 2026-07-13: Targeted runtime validator tests passed 17/17 after adding the
  compatibility matrix and legacy-path regression; scenario journey remained
  1/1.
- 2026-07-13: Negative TypeScript conformance fixtures compiled with all
  expected errors consumed. The claim-token boundary script confirmed required
  trusted-input placement, forbidden snapshot/draft/output placement, and no
  runtime logging/metrics use.
- 2026-07-13: Frozen install and integrated `corepack pnpm verify:x0-c` passed:
  four typechecks, runtime validator/worker tests, scenario journey, and
  conformance boundary check.
- 2026-07-13: Architecture review caught an observable legacy finding-path
  change in `WF-MAN-040`–`042`; the paths were restored and a regression test
  was added before continuing.
- 2026-07-13: A temporary-directory clean-checkout simulation excluded all
  existing `node_modules`, completed frozen install for five workspace
  projects, and passed the same X0-C matrix: four typechecks, runtime 17/17,
  scenario 1/1, and claim-boundary conformance.
- 2026-07-13: Scenario manifest/GitHub workflow YAML parsing, Markdown fence
  scan across 19 files, Markdown link scan across eight changed docs, `git diff
  --check`, and changed-path boundary scans passed. No contract type,
  worker/repository/service, scenario implementation, persistence, queue,
  Outbox, or provider path changed.
- 2026-07-13: Independent `templates/web-workbench` typecheck and build passed;
  the X0-C validator/conformance changes do not absorb or regress that package.
- 2026-07-13: Draft PR #1 GitHub Actions run `29236469992` passed for commit
  `e20c073`: frozen install and the full generic workflow contract conformance
  job completed successfully in 21 seconds.

## X0-D Required Checks

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm verify:x0-d`
- `corepack pnpm check:workflow-contract-source`
- contract source diff against pinned revision `e20c073`
- source-hash portability under changed physical roots and
  `@host`/`@my-chat` import aliases
- My-Chat pre-adoption hash observation without modifying My-Chat
- clean-checkout frozen-install simulation without root `node_modules`
- repeated hash calculation and lock comparison
- legacy/vNext validator matrix, negative type fixtures, and claim boundary
- YAML/JSON, Markdown fence/link, `git diff --check`, and stale local-path scans
- no contract/validator behavior, runtime persistence, Prisma, queue, Outbox,
  provider, scenario logic, or capability enablement changes
- independent web-workbench typecheck/build regression
- final architecture/readiness review and Draft PR remote CI

## X0-D Results

- 2026-07-13: Contract source revision pinned to
  `e20c0735f450fd4fbc65ca195d7bc9a494c20cda`; scoped Git diff confirms the
  current contract/validator source is byte-identical before hash
  normalization.
- 2026-07-13: Source lock schema v1 contains nine logical source files and
  aggregate SHA-256
  `1a393c21192e711a7e87733724fc74d9c0c5bbb36a2ad2824d34157e2be83416`.
  Direct lock verification passed.
- 2026-07-13: Hash portability conformance copied sources to different physical
  roots and changed the expected validator import from `@host` to `@my-chat`;
  the logical file manifest and aggregate hash remained identical.
- 2026-07-13: Read-only My-Chat pre-adoption check at clean revision
  `e53aa6100578bab62cad110c6020e87e19b17c80` produced hash
  `7e083fd26164ee7034989535a115b3b5066ac7d9c2aa93c94448f225749294e8`.
  The mismatch is expected X1 work and confirms X0-D has not modified My-Chat.
- 2026-07-13: Final architecture review tightened alias normalization from an
  arbitrary package scope to only `@host/workflow-contracts` and
  `@my-chat/workflow-contracts` in supported module-import positions. A
  negative portability case proves an unexpected third-party scope changes the
  hash.
- 2026-07-13: Post-review `corepack pnpm verify:x0-d` passed four typechecks,
  runtime tests 17/17, scenario journey 1/1, claim-token boundary conformance,
  source-hash portability, and source-lock verification.
- 2026-07-13: A temporary clean copy excluded existing `node_modules`,
  completed a frozen install for all five workspace projects, and passed the
  same complete X0-D matrix.
- 2026-07-13: Repeated hash calculation remained stable. Scenario manifest and
  actual GitHub `ci.yml` YAML parsing, package/lock JSON parsing, Markdown
  fence/link checks across nine changed docs, durable local-path scan, and
  `git diff --check` passed.
- 2026-07-13: Changed-path review against `e20c073` found no contract,
  validator, worker, repository, service, scenario, Prisma, database, queue,
  Outbox, provider, or capability-enablement change. Independent
  `templates/web-workbench` typecheck and build also passed.
- 2026-07-13: X0-D evidence commit `2894bad` was pushed to Draft PR #1.
  GitHub Actions run `29238833875` passed the frozen install and complete
  workflow contract conformance job in 22 seconds.

## X0 Post-Review Repair Required Checks

- runtime validator rejects unknown and null materialization modes
- TypeScript rejects a v1-discriminated completion result without
  `materialized_handoffs`
- host-owned v1 runtime port composes with claimed driver and handler drafts
  without a type assertion
- generic portability test covers physical roots, allowed import aliases,
  UTF-8 BOM, CRLF, and unexpected package scopes
- source lock matches repaired contract revision
  `c7f904cdb9b647c80f28134ab6967cd76f730962`
- full local and clean-copy `corepack pnpm verify:x0-d`
- independent web-workbench typecheck/build
- contract/docs/boundary review, My-Chat pre-adoption hash, and Draft PR CI

## X0 Post-Review Repair Results

- 2026-07-13: The pre-fix runtime diagnostic proved
  `workflow_step_complete_v2` produced only `WF-MAN-043` and
  `report.passed=true`. Post-fix targeted runtime tests pass 19/19, including
  unknown-string and explicit-null `WF-MAN-048` cases.
- 2026-07-13: A semantic TypeScript diagnostic reproduced that the old generic
  result union accepted a v1 discriminator without materialization output.
  Post-fix negative conformance consumes the expected error, while the
  host-injected v1 worker fixture typechecks without a cast.
- 2026-07-13: The repaired contract source revision is `c7f904c`; regenerated
  source-lock SHA-256 is
  `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- 2026-07-13: Integrated `corepack pnpm verify:x0-d` passed four typechecks,
  runtime tests 19/19, scenario journey 1/1, claim-token conformance,
  BOM/CRLF/physical-root/allowed-alias portability, unexpected-scope negative
  coverage, and the refreshed source lock.
- 2026-07-13: A temporary clean copy excluded all existing `node_modules`,
  completed frozen install for five workspace projects, and passed the same
  complete repaired X0 matrix.
- 2026-07-13: Direct post-fix diagnostics confirmed an unsupported mode now
  returns `WF-MAN-048`, `severity=fatal`, and `passed=false`; the previously
  accepted incomplete v1 result now fails specifically because
  `materialized_handoffs` is required.
- 2026-07-13: Contract/validator source diff against `c7f904c` is empty.
  Scenario/GitHub workflow YAML, package/lock JSON, Markdown fence/link checks
  across 12 changed docs, durable local-path scan, and `git diff --check`
  passed. Independent web-workbench typecheck/build also passed.
- 2026-07-13: Read-only My-Chat `main` remains clean at `e53aa610` with expected
  pre-adoption source hash
  `7e083fd26164ee7034989535a115b3b5066ac7d9c2aa93c94448f225749294e8`;
  no X1 code or capability was enabled during the repair.
- 2026-07-13: Repair contract commit `c7f904c` and evidence commit `ee84c29`
  were pushed to Draft PR #1. GitHub Actions run `29240814017` passed frozen
  install and the complete repaired workflow conformance job in 22 seconds.

## N1 ecosystem alignment results

- PASS: `pnpm check:contract-doc-alignment`
- PASS: `pnpm check:consumer-boundaries` in Base
- PASS: `pnpm verify:workflow-contracts`
  - four workspace typechecks passed;
  - runtime validator tests: 19 passed;
  - scenario journey tests: 1 passed;
  - claim-token, source-hash portability, documentation alignment, and consumer
    self-test conformance passed;
  - source lock remained
    `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- PASS: `git diff --check`

Advisory real-repository scan:

| Repository | Role | Findings |
|---|---|---|
| My-Workflow-Base | base | none |
| My-Chat | host | none |
| The-Education | scenario | `ECO-CONSUMER-001` for `@the-educator/workflow-contracts` and `@the-educator/workflow-runtime` |
| The-Nurture | scenario | `ECO-CONSUMER-002` for local linked web-workbench; `ECO-CONSUMER-004` for a sibling-source acceptance-test import |

The consumer findings are expected failures owned by the next scenario phases;
Base's own verification is green.

## X-5 federation convergence results

Verified from the clean Base convergence worktree on 2026-07-28:

- `pnpm install --frozen-lockfile` — pass
- `pnpm verify:workflow-contracts` — pass
  - four package typechecks passed
  - canonical-reference lint passed with zero findings
  - runtime tests passed: 2 files / 28 tests
  - scenario tests passed: 2 files / 10 tests
  - claim-token boundary, source-hash portability, contract-doc alignment, and
    consumer-scanner self-test passed
  - all nine federation schemas and the semantic release contract passed
  - integration-lock tests passed: 2 / 2
  - exact source lock passed for
    `caebe85d492724a727b0ccb7a99fe9da15e0536393c4a0ab42069f8264ea7b2e`
- `git diff --check` — pass
- final worktree status before documentation handoff — clean

The source lock points to
`eb19433c6e68ad1abaaddc356e6afe5ea52dcf97`, the last commit that changed the
contract/validator source. Evidence-only commits intentionally do not replace
that source revision.

## Public web-workbench distribution alignment — 2026-07-28

- GitHub package settings: PASS; owner confirmed
  `@willyu1007/web-workbench` is public.
- Source publishing SSOT: PASS; `publishConfig.access=public`.
- Publishing documentation: PASS; public visibility, irreversibility,
  authenticated download, and repository-scoped `GITHUB_TOKEN` rules are
  explicit.
- GitHub Actions runtime inventory: PASS; checkout/setup-node use v6 and no
  workflow `uses:` entry remains on v4.
- `pnpm verify:workflow-contracts`: PASS on Node 24; four package typechecks,
  canonical-ref lint, runtime `28/28`, scenario `10/10`, federation schemas,
  semantic release, integration-lock `2/2`, and exact logical source lock all
  pass.
- Independent web-workbench: initial typecheck correctly failed because this
  intentionally standalone package had no local `node_modules`; frozen
  `pnpm --dir templates/web-workbench install --ignore-workspace` followed by
  typecheck passes without lockfile changes.
- Workflow YAML parse, package JSON/access assertion, v4 action scan, and
  `git diff --check`: PASS.
- Cloud run `30348263661`: FAIL AFTER ALL FUNCTIONAL CHECKS PASSED. The final
  source-lock step could not resolve ancestor `eb19433` from checkout@v6's
  default shallow clone; no source/hash mismatch occurred.
- Repair run `30348474446`: PASS at exact config revision `2af7c45`; full
  history source lock, all conformance checks, and Node 24 action runtime pass.
  The check run has `annotations_count=0`.
- Consumer re-pin and renewed four-repository qualification completed
  2026-07-31 (recorded 2026-08-01 by My-Chat/T-030 R6): lock v4
  `r3-derived-read-2026-07-31-v4` at Base `06303e9` / My-Chat `a019566` /
  Education `e12605b` / Nurture `7a0090b`, Education-caller cloud run
  `30641376220` success.

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

## 2026-08-11 Trusted invocation registry verification

- `pnpm typecheck`: passed for workflow contracts, workflow runtime, scenario
  module template and conformance package.
- `pnpm test:runtime`: passed, 2 files / 40 tests.
- `pnpm test:scenario`: passed, 2 files / 10 tests.
- The unlocked conformance chain passed: claim-token boundary, contract-doc
  alignment, consumer-boundary self-test, 66 federation schemas, scenario
  release contract, semantic lint, canonical-ref lint and 441 Node tests.
- `git diff --check`: passed.
- Focused trusted registry/dispatcher regression suite passed, 38/38. It proves
  missing dedicated bindings fail through `WF-MAN-124`, undeclared bindings
  fail through `WF-MAN-125`, ordinary internal registry aliases fail, exact
  verified dispatch succeeds, extra trust-policy metadata is stripped and
  route drift fails closed.
- Frozen legacy manifest contract hash remains
  `9f568ff772d3dafc02dd96f284f7cedb85aff18839b8f26f4691a8b2dc0d0ca6`.
- Candidate aggregate adoption source hash:
  `dd888b89f89d4137fb717bba60a400f9f68bb127b4485121270f1c8eb9ea51e7`.
- Candidate named profiles:
  - `platform_child_family_identity_source_v1`:
    `9655e83ff6a973055fb1b3f170cdbcd3c3eea6cb117f59209844a2a355b6a861`
  - `scenario_interface_source_v1`:
    `be67d3264a9442ce30a8303d6acf86a05ea86c8a3ed1d933f41c5aa922b1ff95`
  - `scenario_domain_action_source_v1`:
    `b962acf3fc35d02d7b903854a3eed3f6177e3dc4d00b32124122a120b458f5f0`
  - `scenario_protected_interaction_source_v1`:
    `a34f3864b76d1dc16eadb901f506fcc473a0cb298da7d1e273de9238eb880cf5`
- `pnpm test:conformance` reaches the source-hash portability step and fails
  against the intentionally unchanged committed lock. This is the sole landing
  gate: after an exact source-bearing commit exists, refresh the lock revision,
  aggregate/per-file/profile hashes together and rerun the full verifier. No
  false revision was written for the uncommitted candidate.
