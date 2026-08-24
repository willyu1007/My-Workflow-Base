# My-Chat BC1 Adoption Handoff

## Release Identity

- Contract-bearing Base revision: `ee7e09b8226a8660f46ec277650c7a6e5ee461e0`.
- Aggregate contract source hash:
  `136bea7a395a18e7c6aa8c3f4d73b475b36f5e0ec5f439fe049df6d345a03ab8`.
- Canonicalization profile: `rfc8785_jcs_sha256_v1`.
- Canonical-vector release hash:
  `66203a78059467b507083a316c91939c88c9af59d9e09b259d1f7cc5779c2c27`.
- Release manifest: `conformance/workflow-batch-execution-control-release.json`.

The Base evidence revision is the commit that contains this handoff, the release manifest, and the refreshed
source lock. My-Chat records that evidence revision from Base history when it vendors the release. The
contract revision above remains the protocol `contract_revision`; an evidence revision, scenario manifest
hash, owner deployment digest, or ledger schema revision must never replace it.

## Exact Copy Map

| Base source | My-Chat target | Permitted transform |
| --- | --- | --- |
| `templates/host-runtime/packages/workflow-contracts/src/types/batch-execution-control.ts` | `packages/workflow-contracts/src/types/batch-execution-control.ts` | byte exact |
| additive export in `templates/host-runtime/packages/workflow-contracts/src/index.ts` | additive export in `packages/workflow-contracts/src/index.ts` | none |
| capability-union addition in `templates/host-runtime/packages/workflow-contracts/src/types/validation.ts` | same addition in `packages/workflow-contracts/src/types/validation.ts` | none |
| `templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts` | `packages/workflow-runtime/src/validation/validate-batch-execution-control.ts` | only `@host/workflow-contracts` to `@my-chat/workflow-contracts` in supported module specifiers |
| additive export in `templates/host-runtime/packages/workflow-runtime/src/index.ts` | additive export in `packages/workflow-runtime/src/index.ts` | none |
| runtime validator test | same relative My-Chat runtime test path | only the supported package-alias transform |
| positive/negative compile fixtures | `packages/workflow-contracts/conformance/fixtures/` | only the supported package-alias transform |
| canonical vector JSON | `packages/workflow-contracts/conformance/vectors/batch-execution-control-v1.json` | byte exact |
| scenario, secret, canonical-vector, and release checkers | `packages/workflow-contracts/conformance/scripts/` | release checker byte exact; other checkers permit only package-relative physical-root/package-loader adaptation |
| `compute-workflow-contract-source-hash.mjs` and `check-contract-source-hash-portability.mjs` | `packages/workflow-contracts/conformance/scripts/` | physical roots become My-Chat contract `src` and sibling runtime `src/validation`; retain logical roots, normalization, alias rules, and hash algorithm exactly |
| aggregate source lock and BC0 release manifest | `packages/workflow-contracts/conformance/` | byte exact |

My-Chat must run the portable aggregate source-hash algorithm over its full
`packages/workflow-contracts/src` and `packages/workflow-runtime/src/validation` roots. Host-only controller
services, DTOs, transports, persistence, and composition stay outside those locked roots.
The package-relative layout above is deliberate: the byte-exact release manifest continues to resolve its
`conformance/...` lock and vector paths from the `packages/workflow-contracts` artifact root, exactly as the
release checker does in Base. Do not move those files under an `upstream/` subdirectory.

## Default-Disabled Composition

- Adding the capability family to the allowed host-capability union does not enable an instance.
- Disabled is represented by absence of an enabled descriptor/port composition. Do not reuse the
  user-facing workspace `DomainCapability` registry, whose default and actor model are not server-pinned
  controller authority.
- BC1 may register the dormant static instance profile `template_family_batch_controller` with exact
  family/source/vector pins and platform scope, but must not install a command port, endpoint, worker, or
  enabled descriptor until its own persistence/service/outbox/canary gates pass.
- A later environment flag must be a distinct typed server setting, exact-string `true` to enable, and
  false in every checked-in environment. It must not share the handoff-capability flag.
- API command/readback and worker identities require separate service-principal policy; a user/workspace
  binding is routing input, never controller authority.

## Owner Implementation Hazards

- Postgres remains the canonical ledger; business services do not import Prisma and writes append refs-only
  outbox records in the same transaction.
- The generic worker currently acknowledges known-but-unhandled outbox events as reserved no-ops. Before a
  controller dispatch event exists, My-Chat must add an explicit owner/exclusion and a composed dead-letter
  hook so controller work can never be silently marked processed.
- The controller capability remains independent of shared shell, child/family binding, scenario lifecycle,
  and Education product authorization.

## BC1 Entry Gate

Before schema/service work, My-Chat must:

1. vendor the exact release above and record the Base evidence revision;
2. reproduce the aggregate source hash and vector release hash;
3. pass contract/runtime typecheck, runtime tests, batch conformance, source-lock verification, and
   `git diff --check`;
4. demonstrate that the capability is absent/disabled in API and worker composition.

Prisma/schema work begins only after this adoption gate and follows My-Chat's repo-Prisma DB SSOT workflow.

The My-Chat package scripts must expose:

```text
check:workflow-contract-source
  node conformance/scripts/compute-workflow-contract-source-hash.mjs
    --check conformance/workflow-contract-source-lock.json

check:workflow-batch-execution-control
  scenario boundary -> secret boundary -> canonical vectors -> release manifest
```

Root scripts delegate those two checks to `@my-chat/workflow-contracts`; its existing conformance TypeScript
configuration already includes `conformance/**/*.ts`. BC1 runs both checks explicitly and through the
standard repository gate so adoption cannot pass by compiling types alone.
