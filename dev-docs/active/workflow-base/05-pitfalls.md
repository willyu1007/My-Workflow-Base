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
