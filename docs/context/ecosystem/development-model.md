# Ecosystem development model

Status: adopted

Authority: My-Workflow-Base

Adopted: 2026-07-28

Source decision: `My-Chat/T-030`

Consuming repositories reference this page; copies are forbidden because they
create a second, drifting source of truth.

## Roles

The ecosystem's product anchor is the child's growth process. Growth scenarios
adapt different parts of growth; My-Chat unifies them through one chat entry, a
federated growth record, boards, workbenches, cross-scenario linkage, and
platform-native lifestyle surfaces. My-Chat is not a general-purpose AI chat
tool.

| Repository | Role | Owns |
|---|---|---|
| My-Chat | Host platform | Shared identity (`User`, `Actor`, `Organization`, `Workspace`, `child_id`, `family_id`), Scenario registry, shared Run/Step/Handoff/evidence/outbox ledgers, unified chat entry, federated growth-record shell, boards/workbench shells, forum-based lifestyle surfaces, mobile UIUX paradigms |
| Scenario repositories (The-Education, The-Nurture, future) | Canonical domain owners | Their dossiers, roles/grants, domain workflows, scenario modules, and presenters |
| My-Workflow-Base | Contract/template source | Contract types, manifest shape, validator rules, scenario/module templates, UI kits, and cross-repository conventions. Never a runtime |

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
