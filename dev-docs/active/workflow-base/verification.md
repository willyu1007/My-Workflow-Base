# Verification

## Evidence

| Claim / reference | Check / procedure | Latest result | Evidence / limitation |
|---|---|---|---|
| Contract/runtime/scenario/conformance packages agree | `pnpm verify:workflow-contracts` | passed | 2026-08-24 integration: four typechecks, canonical refs, runtime 77/77, scenario 12/12, conformance 447/447. |
| Aggregate source is exact and portable | Source-lock verification | passed | 2026-08-24 aggregate hash `242ffad72f2a0e644753bc6ffa75f8d519b04e1e2d0f8ffe5fcabeeaa3576238`. |
| Trusted private invocation fails closed | Focused registry/dispatcher suite | passed | 38/38 on 2026-08-11; undeclared/drifted routes fail and extra trust metadata is stripped. |
| Generated Starter is package-complete | Generator/staging CLI and conformance tests | passed | Integrated at `40352d9` with locked migration, owner-local persistence, and symlink-safe entrypoints. |
| Cross-repository adoption lock | Review recorded consumer revisions and qualification lock | passed | Lock v4 `r3-derived-read-2026-07-31-v4` passed locally and in cloud run `30641376220`. |
| Owner-local database journey | Opt-in journey against disposable PostgreSQL | not-run | The 2026-08-24 integration deliberately provisioned no database or external environment. |
| Public release/adoption closure | Package and release-status review | pending | Contract package remains a candidate; final publication evidence is not recorded as complete. |

## Outstanding verification

- Run the opt-in generated-Starter database journey in a disposable PostgreSQL environment.
- Reconcile package publication and any remaining cross-repository adoption claims before task completion.
