# Implementation

## Realization map

| Concern | Realized behavior | Key paths / entry points | Non-obvious implementation fact |
|---|---|---|---|
| Public contract | Exports controller command/read/resolver ports and batch DTOs. | `templates/host-runtime/packages/workflow-contracts/src/types/batch-execution-control.ts` | The capability is additive and absence means disabled. |
| Validation | Enforces state, CAS, claim/fence, pagination, receipt, and recovery rules. | `templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts` | Recovery preserves the exact claim and still passes the command allowlist. |
| Conformance | Covers positive flows, canonicalization, scenario boundaries, secret boundaries, and release data. | `conformance/tests/`, `conformance/scripts/check-batch-execution-control-*.mjs` | Negative evidence is part of the compatibility claim. |
| Release evidence | Pins logical content separately from the contract-bearing revision. | `conformance/workflow-batch-execution-control-release.json`, `conformance/workflow-contract-source-lock.json` | The source-lock revision cannot self-reference its evidence commit. |
