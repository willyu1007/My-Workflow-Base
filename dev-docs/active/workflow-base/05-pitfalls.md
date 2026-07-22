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
- Do not assume hashing a scenario manifest and public package locks the Owner
  runtime. When authorization, execution, Prisma adapters, or migrations live
  in another package, include those executable paths in
  `scenario_artifact.logical_paths`.
- Do not load a descriptor's `manifest_module` before building its package;
  semantic lint intentionally imports the declared public module path.

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

### 2026-07-21 — Runtime tests loaded stale contract output

- Symptom: source-level validation rejected unsafe reason-code prose, but the
  runtime test imported an older `dist` file and did not throw.
- Root cause: the contract `typecheck` did not build its public export before a
  dependent workspace test resolved the package.
- What we tried: updating source and the aggregate hash alone could not change
  the already-built module consumed by Vitest.
- Fix: contract typecheck now builds `dist`; verification then runs dependent
  tests. The full source-lock file manifest, not only its aggregate hash, is
  refreshed after contract source changes.
- Prevention: every public workspace dependency must be freshly built before
  import-based tests, pack checks and semantic descriptor loading.

### 2026-07-21 — Split-package Owner adapters escaped scenario locks

- Symptom: Education and Nurture concrete Owner persistence adapters could
  change while their prior scenario artifact hashes remained valid.
- Root cause: each lock covered its scenario package, Prisma schema and
  migration, but not the executable adapter implemented in a separate DB
  package.
- Fix: add both adapters to their scenario artifact logical paths, refresh the
  release hashes, and document the same requirement in the Starter.
- Prevention: review the deployed call graph, not only package boundaries,
  whenever constructing or qualifying an integration lock.

### 2026-07-21 — Clean semantic lint required built manifest modules

- Symptom: the clean cross-repository lint could not import the Base Starter's
  declared `dist/registry.js` even though source-level verification passed.
- Root cause: descriptor lint loads the real public manifest module, while the
  preceding typecheck/test gate does not retain a build artifact for it.
- Fix: build each descriptor's manifest package before running semantic lint.
- Prevention: qualification order is frozen install, package build, then
  import-based semantic lint; source typecheck alone is insufficient.

### 2026-07-22 — Generated SQL kept the example event namespace

- Symptom: a generated third scenario still contained the `example.` event
  namespace inside the migration constraint.
- Root cause: the generator replacement pattern treated the escaped dot as a
  string escape and did not match the literal SQL token.
- What we tried: TypeScript replacement and unit tests passed because the stale
  value existed only in SQL.
- Fix: replace the exact beginning-of-token `example.` form in generated SQL
  and inspect the migrated package, not only source files.
- Prevention: generator qualification must scan every packaged artifact and
  run the real migration from an empty database.

### 2026-07-22 — Package-bin CLIs silently skipped their main function

- Symptom: the generated scenario's semantic-lint command exited successfully
  without printing a report when invoked through the installed npm bin link.
- Root cause: the CLI compared `import.meta.url` with the symlink path, so the
  main-module guard evaluated false.
- What we tried: direct `node scripts/semantic-lint.mjs` execution passed and
  therefore did not exercise installed-package behavior.
- Fix: resolve both entrypoint and module through `realpathSync`, guard missing
  or non-file `argv[1]`, and add symlink plus stdin/eval regression tests for
  all three CLIs.
- Prevention: conformance must invoke public binaries through a package-bin
  symlink and assert their output, not only their exit code.
