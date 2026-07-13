# My-Chat X1 Adoption Handoff

## Status

- Handoff state: ready for My-Chat X1 after X0-D verification
- Base contract source revision:
  `e20c0735f450fd4fbc65ca195d7bc9a494c20cda`
- Contract source hash:
  `1a393c21192e711a7e87733724fc74d9c0c5bbb36a2ad2824d34157e2be83416`
- Hash schema: `workflow-contract-source-lock.json` schema version 1
- Delivery branch: `chore/x0-a-contract-conformance`
- Delivery PR: My-Workflow-Base PR #1

Pre-adoption observation on 2026-07-13: clean My-Chat `main` revision
`e53aa6100578bab62cad110c6020e87e19b17c80` produced source hash
`7e083fd26164ee7034989535a115b3b5066ac7d9c2aa93c94448f225749294e8`.
The mismatch is expected and is the X1 adoption delta, not an X0-D failure.

The source revision is the last commit that changes the X0 contract/validator
source. Later X0-D commits add only hashing, verification, and handoff evidence.
My-Chat may adopt from the final PR head, but MUST record the source revision and
source hash above so later documentation-only commits cannot obscure what was
actually adopted.

## Hash Authority

The machine-readable authority is:

- `conformance/workflow-contract-source-lock.json`
- `conformance/scripts/compute-workflow-contract-source-hash.mjs`

The aggregate SHA-256 covers sorted logical paths and normalized UTF-8 source:

| Logical root | Base source | My-Chat X1 target |
| --- | --- | --- |
| `workflow-contracts` | `templates/host-runtime/packages/workflow-contracts/src/**/*.ts` excluding tests | `packages/workflow-contracts/src/**/*.ts` excluding tests |
| `workflow-validator` | `templates/host-runtime/packages/workflow-runtime/src/validation/**/*.ts` excluding tests | `packages/workflow-runtime/src/validation/**/*.ts` excluding tests |

Normalization removes a UTF-8 BOM, converts line endings to LF, and maps only
`@host/workflow-contracts` and `@my-chat/workflow-contracts` in supported module
import positions to one logical alias inside validator sources. Physical
directory names and that expected package rename therefore do not create false
drift; a different package scope and all other source changes alter the hash.
Logical path, normalized byte length, and normalized bytes are NUL-delimited
before aggregate hashing.

This adoption hash is not the runtime scenario `contract_hash` computed from a
manifest and registered module keys. The two hashes have different authority
and MUST NOT be substituted for one another.

## X1 Required Adoption

Before implementation, create the My-Chat task package:

```text
dev-docs/active/workflow-handoff-materialization/
```

X1 must then:

1. Adopt the Base workflow-contracts source types and public exports.
2. Adopt validator behavior including `WF-MAN-043` through `WF-MAN-047`.
3. Add or retain legacy/vNext positive and negative conformance coverage.
4. Pass the claimed Step driver context and handler `handoff_drafts` through the
   trusted worker call path without persisting/logging the claim token.
5. Add `workflow_handoff_materialization_v1` to the host snapshot type, while
   keeping the runtime value absent/empty and therefore disabled by default.
6. Record the Base source revision/hash and the resulting My-Chat commit/hash in
   the My-Chat task verification log.

## X1 Explicit Non-Goals

X1 must not:

- add Workflow Step Postgres persistence, lease/reclaim, or completion replay
- add Handoff Ledger tables/repositories or atomic materialization
- emit Handoff or Outbox records from non-empty drafts
- enable `workflow_handoff_materialization_v1` in any environment
- change legacy scenario behavior or reinterpret legacy Handoff lifecycle
- add Nurture-specific contract types or business rules

Those responsibilities remain X2/X3 or N1/X4-N2 as defined by the cross-repo
roadmap.

## Reproduction

Base lock verification:

```bash
corepack pnpm check:workflow-contract-source
corepack pnpm verify:x0-d
```

After My-Chat adoption, the Base script can calculate the My-Chat logical
source hash without depending on physical repo layout:

```bash
node conformance/scripts/compute-workflow-contract-source-hash.mjs \
  --contracts-root "$MY_CHAT_ROOT/packages/workflow-contracts/src" \
  --validator-root "$MY_CHAT_ROOT/packages/workflow-runtime/src/validation"
```

The resulting `source_hash` and per-file logical manifest MUST match
`conformance/workflow-contract-source-lock.json`.

## X1 Exit Evidence

My-Chat X1 is ready to hand off to X2/N1 only when:

- legacy manifests and completion calls remain behaviorally unchanged
- valid vNext manifests pass only with explicit host capability evidence in
  validator fixtures
- disabled/absent runtime capability prevents non-empty activation
- worker pass-through tests prove the current claimed Step remains the driver
- claim-token negative conformance passes
- My-Chat contract/validator source hash matches the Base lock
- My-Chat task docs record adopted Base revision/hash and the My-Chat commit
- no Step/Handoff persistence or capability enablement is hidden inside X1
