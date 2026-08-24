# My-Workflow-Base repository rules

## Ownership

- This repository owns reusable workflow contracts, conformance checks, and copyable host/scenario
  templates. It is not a runtime service, canonical domain store, or shared package dependency for
  deployed products.
- `docs/context/ecosystem/development-model.md` owns ecosystem roles and extraction boundaries.
  `docs/context/workflow/README.md` routes workflow contracts; do not duplicate either in project
  instructions.
- Host products own canonical records, persistence, queues, provider SDKs, credentials, and shared
  product surfaces. Scenario repositories own domain facts, handlers, policies, presenters, and
  scenario LLM workflows.
- Base defines capability and handoff contracts only. Do not add My-Chat, Education, Nurture, or
  other product semantics to the reusable templates.
- Base owns no feature LLM runtime configuration. Do not add `.ai/llm` or Prompt/model routing here.

## Templates

- `templates/host-runtime/` is copied into a host product and adapted to its package names and
  infrastructure ports.
- `templates/scenario-module/` is copied once per scenario and receives the scenario manifest,
  handlers, adapters, presenters, policies, and deterministic journey tests.
- `templates/web-workbench/` is the shared UI package source. Its token/component contracts and
  verification live inside that template.
- Follow `docs/context/ecosystem/contract-distribution.md` for copy+hash, package, and pinned-source
  adoption. Do not invent a fourth distribution path.

## Routing

| Concern | Authority |
|---|---|
| Ecosystem roles | `docs/context/ecosystem/development-model.md` |
| Workflow contracts | `docs/context/workflow/README.md` |
| Template adoption | `templates/README.md` |
| Task records | `dev-docs/AGENTS.md` |
| Project graph | `.ai/project/AGENTS.md` |

Use the root `package.json` scripts for conformance, contract-source, consumer-boundary, and token
checks; do not encode a second command matrix here.
