# Implementation

## Realization map

| Concern | Realized behavior | Key paths / entry points | Non-obvious implementation fact |
|---|---|---|---|
| Workflow contracts | Exports scenario identity, manifests, APIs, events, handoffs, presentation, protected interaction, trusted invocation, and batch control. | `templates/host-runtime/packages/workflow-contracts/` | Public additions remain compatible; source-lock evidence follows contract commits. |
| Host runtime scaffold | Provides validation, registry resolution, services, repositories, routes, adapters, and worker ports without becoming a production service. | `templates/host-runtime/packages/workflow-runtime/` | Host code owns executable registration and durable infrastructure. |
| Scenario module template | Provides declarative manifest plus TypeScript registries, owner APIs, repositories, policies, presenters, actions, and tests. | `templates/scenario-module/` | Owner-local Prisma/outbox/inbox are examples; shared cross-owner data remains refs-only. |
| Conformance | Validates schemas, source locks, consumer boundaries, semantic rules, release contracts, and Starter generation. | `conformance/` | Negative fixtures and source portability are part of the compatibility claim. |
| UI presenter kit | Publishes scenario-neutral view contracts and components through grouped entries. | `templates/web-workbench/` | UI adapters consume presenter-ready models; the kit owns no workflow/domain fact. |
| Contract documentation | Defines the normative architecture, API, surface, module, and readiness closure. | `docs/context/workflow/` | Documentation is checked against source and semantic rules, not merely explanatory prose. |
