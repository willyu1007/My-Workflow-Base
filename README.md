# My-Workflow-Base

Reusable workflow contracts, conformance checks, and copyable host/scenario templates. The base is
not a runtime service; adopted products own their infrastructure and scenario implementations.

## Authorities

| Concern | Entry point |
|---|---|
| Ecosystem roles and extraction | [`docs/context/ecosystem/development-model.md`](docs/context/ecosystem/development-model.md) |
| Contract distribution | [`docs/context/ecosystem/contract-distribution.md`](docs/context/ecosystem/contract-distribution.md) |
| Workflow contract index | [`docs/context/workflow/README.md`](docs/context/workflow/README.md) |
| Host/scenario templates | [`templates/README.md`](templates/README.md) |
| Web workbench | [`templates/web-workbench/README.md`](templates/web-workbench/README.md) |
| Repository boundaries | [`AGENTS.md`](AGENTS.md) |
| Project status | [`.ai/project/dashboard.md`](.ai/project/dashboard.md) |

## Adoption boundary

- Copy `templates/host-runtime/packages/workflow-contracts` and `workflow-runtime` into the host
  repository and adapt package names and infrastructure ports.
- Copy `templates/scenario-module` into each scenario repository and implement its manifest,
  handlers, adapters, presenters, policies, and journey tests.
- Host products own canonical persistence, queues, provider SDKs, and shared product surfaces.
  Scenario modules own domain facts and behavior; neither rewrites the base capability/surface
  contracts.

## Verify

```bash
pnpm verify:workflow-contracts
pnpm check:contract-doc-alignment
pnpm check:consumer-boundaries
pnpm check:ui-tokens
node .ai/scripts/ctl-project-governance.mjs lint
```
