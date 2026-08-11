# Pitfalls

## Do-Not-Repeat Summary
- Do not let a scenario define private workflow run, approval, artifact, or
  handoff identities.
- Do not let product surfaces consume scenario-private APIs except Web/Admin
  internal APIs that are contract-declared.
- Do not let projection, push payloads, or dashboard cards become canonical.
- Do not put private bodies into handoff payloads.
- Do not make the base implement forum publishing, RAG indexing, notification
  delivery, or external delivery.
- Do not let chat become an in-run operations surface. Chat may collect setup
  and start requirements, strongly confirm user-initiated approvals, and render
  dashboard summaries, but it must not perform step interventions or intervention
  reminders.
- Do not expose dashboard actions that imply direct indexing such as "add to
  knowledge"; indexing must be service-owned and policy-driven.
- Do not share data between workflows by reading another workflow's private run
  or step state. Use domain context refs, snapshots, bindings, and domain
  events.
- Do not let an example scenario become the base contract.
- Do not start implementation skeleton work before matrix, manifest, and API
  contracts agree.
- Do not rely on a host repository's `node_modules`, tsconfig, aliases, or test
  runner to validate Base templates; the source repository must be sufficient.
- Do not use a Vitest file-filter glob whose `**/` segment excludes tests placed
  directly under the selected directory; prefer stable directory entrypoints.
- Do not infer vNext materialization from legacy handoff declarations. Require an
  explicit discriminator and keep legacy semantics intact.
- Do not make claim tokens optional inside the vNext completion branch or place
  them in persisted/hash/loggable DTOs merely to preserve legacy compilation.
- Do not replace the legacy `WorkflowRuntimePort.complete_step` result with an
  uncorrelated legacy/v1 union. Keep the legacy port stable and use the additive
  v1 overload contract so input and output remain statically correlated.
- Do not implement X0-C warning/fatal rules opportunistically while adding X0-B
  types; positive type availability is not activation permission.
- Do not improve or reformat existing validator findings while adding new rule
  IDs; path/message changes are observable legacy behavior and need separate
  compatibility review.
- Do not emit the same missing host-capability fatal once per handoff. Treat it
  as one host-level gate while keeping handoff-specific key/source findings
  indexed.
- Do not rely on positive fixtures alone for claim-secret boundaries. Keep
  negative `@ts-expect-error` DTO cases and the source logging/metrics scan in
  the generic conformance command.
- Do not use physical repo paths or host package names directly in a cross-repo
  source hash; expected `@host`/`@my-chat` alias differences would create false
  drift. Normalize only `@host/workflow-contracts` and
  `@my-chat/workflow-contracts` in supported module-import positions and keep
  every other scope and byte source-sensitive.
- Do not conflate the X0-D adoption source hash with a runtime scenario
  `contract_hash`. The former proves copied source parity; the latter pins a
  manifest/registry instance.
- Do not pin the adoption revision to a later documentation-only commit. Record
  the last commit that actually changed contract/validator source and keep
  evidence revisions separate.
- Do not treat every non-v1 `materialization_mode` as legacy. Only absence is a
  migration bridge; explicit unknown or null values must fail closed.
- Do not form a v1 result union by adding a subtype to an unrestricted base
  result. The legacy branch must forbid v1 discriminator/materialization fields
  or TypeScript will accept incomplete v1-looking objects.
- Do not recover `WorkflowRuntimePortMaterializationV1` from the legacy-typed
  scenario adapter through a cast. Inject the host-owned v1 port into the worker
  and prove the call path through compile conformance.
- Do not document validator or loader rule ids that executable source does not
  emit. Keep the validator inventory under mechanical conformance and describe
  loader invariants without a phantom finding-id family.
- Do not maintain two scenario directory layouts. Use
  `packages/<scenario-key>-scenario/` with one `src/` tree.
- Do not treat a local Base UI-kit link, scenario-owned shared workflow fork, or
  sibling-source test import as release evidence. Use the sanctioned
  distribution lane and exact pin evidence.
- Do not mark allocated ports as implemented until the owning repository's
  environment contract and application defaults agree.
- Do not merge an old federation candidate branch wholesale onto a newer
  ecosystem baseline. Replay the required semantic source changes and preserve
  later conformance gates explicitly.
- Do not let federation cherry-picks replace the N1 documentation-alignment or
  consumer-boundary checks with an older package-script set.
- Do not run a fresh contract package build/typecheck concurrently with tests
  that import its generated `dist`; use the prescribed sequential verifier.
- Do not refresh only the aggregate adoption hash. The per-file source manifest,
  aggregate hash, and exact source revision must move together.
- Do not add validator findings without updating the mechanically checked rule
  inventory in the contract documentation.
- Do not let a public shared package retain `publishConfig.access=restricted`;
  the source publishing SSOT, irreversible GitHub visibility, and consumer
  distribution contract must agree.
- Do not assume public GitHub npm packages are anonymous downloads. Consumers
  still authenticate, but an unrelated repository's own read-scoped
  `GITHUB_TOKEN` is sufficient; do not introduce a shared PAT by default.
- Do not repair Node action-runtime deprecations in only one consumer. Inventory
  every federated repository's workflow `uses:` entries and re-run cloud
  annotations after the coordinated upgrade.
- Do not validate an ancestor-bound source lock from a default shallow
  checkout. Any verifier that resolves a historical source revision requires
  `fetch-depth: 0`.
- Do not dispatch a trusted scenario operation through
  `internal_api_handlers` or another ordinary registry. Transport verification
  must complete first, and the verified dispatcher must exact-match the
  manifest before selecting the dedicated registry.
- Do not refresh a source lock while the changed contract source has no exact
  commit revision. Candidate hashes paired with an older revision are invalid
  evidence, even when local typechecks and behavioral tests pass.

## Historical Notes
- 2026-07-13: X0-A initially used `tests/**/*.test.ts`; Vitest 4 did not select
  the root-level scenario journey test. Replaced it with `vitest run tests` and
  retained the failure as a conformance-runner lesson.
- 2026-07-13: X0-C initially changed existing `WF-MAN-040`–`042` finding paths
  to indexed paths while adding new rules. Architecture review reverted the
  observable legacy change and added a regression assertion.
- 2026-07-13: X0-D initially hashed raw validator source, which made the expected
  `@host` versus `@my-chat` package rename look like contract drift. The hash
  normalization and portability fixture now remove only that false difference;
  an unexpected package scope is verified to change the hash.
- 2026-07-13: Post-X0 review reproduced two contract gaps despite green CI:
  explicit unsupported materialization modes warned instead of failing, and the
  generic completion-result union accepted an incomplete v1-looking object.
  Both now have negative regression coverage, and the source lock was refreshed.
- 2026-07-28: The first documentation-alignment run caught a retired scenario
  path still repeated in explanatory prose after the directory tree changed.
  The wording was removed and the path check retained to prevent recurrence.
- 2026-07-28: X-5 initially exposed three evidence hazards: a concurrent
  build/test `dist` race, stale per-file source-lock entries, and 19 newly
  emitted validator ids absent from docs. Sequential verification, a complete
  lock refresh, and the mechanical inventory repair closed all three.
- 2026-07-28: Public package visibility fixed Nurture's clean-runner 403s, but
  Base still declared `publishConfig.access=restricted`. The owner-approved
  repair aligned the manifest and runbook without publishing another version;
  Nurture's exact Base source pin must move because the manifest is hashed.
- 2026-07-28: Base cloud run `30348263661` passed all contract behavior and
  failed only when the source-lock verifier could not resolve historical commit
  `eb19433` from checkout@v6's one-commit clone. Full history checkout is now a
  mechanical CI requirement.
