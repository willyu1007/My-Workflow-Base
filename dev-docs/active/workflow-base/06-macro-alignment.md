# Macro Alignment

## Alignment Target
The workflow base template should converge around one contract spine:

```txt
Scenario
  -> Capability
  -> Entrypoint
  -> WorkflowVersion
  -> Run
  -> Step
  -> Artifact
  -> Approval
  -> ActionAvailability
  -> HandoffRequest
  -> HandoffReceipt
```

Everything else is either:
- platform-owned canonical domain addressed through `DomainContextRef`,
  `ContextSnapshot`, and `ContextBinding`
- surface-owned presentation
- downstream-owned side effects
- governance-owned policy

## Roadmap Alignment Map

| Roadmap milestone | Contract question | Output artifact |
|---|---|---|
| M0 contract stance lock | What does the template define and refuse to implement? | `v0-convergence.md`, `00-overview.md` |
| M1 matrix convergence | How does each surface consume concrete workflow contract modules? | `architecture-matrix.md` |
| M2 contract convergence | What must a scenario declare to be accepted? | `module-contract.md`, `scenario.manifest.yaml` |
| M3 API/adapter convergence | What standard adapters/APIs must surfaces call? | `api-contract.md` |
| M4 implementation skeleton | What code boundaries should host repos receive? | future package layout and TS contracts |
| M5 scenario-readiness proof | Can a second scenario plug in without new surface APIs? | `scenario-readiness-proof.md` |

## Base Module Alignment

| Module | Primary contract | Macro rule |
|---|---|---|
| Scenario registry | `Scenario` record + manifest hash | A scenario cannot self-activate from YAML only. |
| Workflow ledger | run/step/artifact/approval state | All durable workflow facts converge here. |
| Surface presenters | safe surface DTOs | Surfaces render DTOs, not domain object stores. |
| Handoff ledger | request/receipt records | Downstream systems accept/reject by receipt. |
| Governance gates | policy/evidence/version controls | Policy can deny any path by default. |

Canonical domain registry is an external platform/domain base. Workflow does not
own canonical domain object schema, lifecycle, relation, or mutation APIs.

## Surface Alignment

| Surface | Macro rule |
|---|---|
| Chat workflow control | Collect allowed context refs/start requirements and support user-initiated strong confirmations; never perform step interventions. |
| Chat dashboard summary | Summarize safe dashboard state only; do not create durable writes, approvals, rejections, or intervention reminders. |
| Chat citation | Cite only downstream accepted retrieval sources. |
| Mobile dashboard | Projection for display; canonical reread for writes. |
| Web domain workbench | Own domain setup, maintenance, and contract-declared internal APIs. |
| Web run workbench | Own in-run workflow operations such as manual correction, override, and step intervention. |
| Forum/publication | Public-ready draft owner publishes; workflow never does. |
| RAG/Knowledge | Indexing owner indexes; workflow only requests handoff. |
| Notification/push | Notification owner delivers; workflow sends refs. |
| Admin/operator | Governs contracts through evidence-backed APIs; no direct projection mutation. |
| Worker/runtime | Writes ledger/outbox; never writes downstream systems directly. |

## Immediate Convergence Decision
The next edit should transform `architecture-matrix.md` from a descriptive
matrix into a checklist-style contract. Each surface row should have:

- `reads`
- `actions`
- `handoffs`
- `forbidden`

This shape is intentionally repetitive because reviewers need to compare rows
without inferring rules from prose.

## Data Sharing Rule
When one scenario contains multiple workflows, they share domain data through
`DomainContextRef`, `ContextSnapshot`, `ContextBinding`, and domain events. A
workflow can reference the context it is allowed to use, but it must not read
another workflow's private run/step state as an integration path.
