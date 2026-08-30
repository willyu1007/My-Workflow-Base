# Ecosystem development model

Status: adopted

Authority: My-Workflow-Base

Adopted: 2026-07-28

Source decision: `My-Chat/T-030`

Amended: 2026-08-30 — surface ownership and information flow, from the
owner-approved My-Chat × The-Nurture positioning review after `The-Nurture/T-017`

Consuming repositories reference this page; copies are forbidden because they
create a second, drifting source of truth.

## Roles

The ecosystem's product anchor is the child's growth process. Growth scenarios
adapt different parts of growth; My-Chat unifies them through one chat entry, a
federated growth record, boards, cross-scenario linkage, and platform-native
lifestyle surfaces. My-Chat is the ecosystem's input and display end:
family-facing information enters on My-Chat surfaces and returns to them for
display, while scenarios own the processing between those two ends. My-Chat is
not a general-purpose AI chat tool.

| Repository | Role | Owns |
|---|---|---|
| My-Chat | Host platform | Shared identity (`User`, `Actor`, `Organization`, `Workspace`, `child_id`, `family_id`), Scenario registry, shared Run/Step/Handoff/evidence/outbox ledgers, unified chat entry, federated growth-record shell, mobile tabs/boards for every role, forum-based lifestyle surfaces, mobile UIUX paradigms |
| Scenario repositories (The-Education, The-Nurture, future) | Canonical domain owners | Their dossiers, roles/grants, domain workflows, scenario modules, presenters, and their operational web workbench |
| My-Workflow-Base | Contract/template source | Contract types, manifest shape, validator rules, scenario/module templates, UI kits, and cross-repository conventions. Never a runtime |

## Information flow

The host/scenario boundary is a closed loop; both ends of the loop live on
My-Chat surfaces:

1. Input. Family-authored input (free text, leave notices, pickup changes,
   media) originates on My-Chat surfaces and becomes a My-Chat-owned platform
   fact with provenance, version, purpose, and retention semantics
   (e.g. `my-chat.family-authored-material`).
2. Consume. My-Chat invokes the scenario's exact versioned consume contract;
   the scenario routes, qualifies, and derives its own canonical facts.
   Free text never becomes authority on either side.
3. Return. Scenario facts come back only as versioned presenters and
   explicitly released/admitted growth material; scenario usage receipts
   return to My-Chat as evidence.
4. Display. My-Chat composes boards, the growth record, and notification
   surfaces from those returns.

Neither side reaches around the loop: no polling into the other owner's
database, no raw-ID authority, no copied prompts or schemas, no shell forks.

## Development rhythm

1. Scenario-first. Product truth is discovered inside scenario repositories.
   The platform must not pre-build scenario facts on a scenario's behalf.
2. Extract, then update. Proven common shapes move to the correct owner, then
   consumers update through a sanctioned distribution lane.
3. Contract-first at the boundary. Anything crossing a repository boundary
   pins its contract before implementation on either side.

## Extraction routing

| Common resource | Destination | Reason |
|---|---|---|
| Contract types, manifest and validator semantics, paradigms, UI kits, schema, port, and environment conventions | My-Workflow-Base | Templates and conventions; no runtime and no canonical data |
| Shared facts, runtime behavior, ledgers, identity, and canonical registries | My-Chat | Runtime and persisted shared state belong to the host |

"Common" does not route to Base by default. If the resource executes or
persists at runtime, it is host material.

## Rule of two

Extraction into Base requires both:

- at least two scenarios need the shape; a variant of one scenario does not
  count as a second scenario;
- the shape has stabilized inside at least one scenario.

Migration-era compatibility surfaces are not extraction sources.

## Scenario taxonomy

A scenario is an independent repository with differentiated implementations of
the standard contract surfaces: `web_run_workbench`,
`chat_workflow_control`, `dashboard_card`, `chat_dashboard_summary`,
`mobile_summary`, and `artifact_preview`. Scenarios do not invent new shared
surface mechanisms.

- A new scenario requires a new canonical-dossier domain, repository, and
  `scenario_key`.
- A domain variant stays in its owning scenario as stage, capability, or policy
  expansion. It does not create a new `scenario_key`.
- Institution personalization is data, policy, and configuration. It is never
  a scenario-module fork.
- A platform-native lifestyle surface with no canonical dossier lives in
  My-Chat and has no scenario binding.

## Surface ownership

User-facing surfaces split by surface form, not by audience. Instantiated by
`The-Nurture/T-017` (scenario workbench) and `My-Chat/T-039` (mobile boards).

- My-Chat owns the mobile and family-facing experience for every role —
  chat entry, parent/teacher/director mobile tabs and boards, the federated
  growth record, and forum surfaces — and the mobile UIUX paradigms behind
  them.
- A scenario owns its operational web workbench: the professional day-to-day
  operating surface lives in the scenario repository as its differentiated
  `web_run_workbench` implementation, under the scenario's surface contract.
  A scenario workbench never becomes the root product shell.
- Scenario facts reach My-Chat surfaces only through versioned
  presenter/action contracts; My-Chat UI state never becomes scenario
  authority.

## Host commitment

My-Chat's platform focus includes the shared consumer surfaces scenarios
depend on. When a scenario is blocked on a host gap, the host fills the gap;
the scenario does not fork shared identity, contracts, or runtime.

## Arbitration

Competing extraction or template needs are resolved through Base's decision
record convention. My-Chat is the tiebreaker when a conflict touches shared
runtime or identity. Scenario-specific vocabulary must not become Base
semantics.

Distribution rules are normative in `contract-distribution.md`.
