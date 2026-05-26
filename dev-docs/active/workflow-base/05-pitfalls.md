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

## Historical Notes
- None yet.
