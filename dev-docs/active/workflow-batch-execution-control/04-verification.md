# Verification

## Entry Baseline

- Entry baseline was created from a clean commit on branch `codex/q4b5-batch-controller-contract`; the
  current diff contains this BC0 task package.
- Starting revision: `acba4e792c85131c19e63e08a5f671133c481c57`.
- Existing source lock verifies revision `c7f904cdb9b647c80f28134ab6967cd76f730962` and hash
  `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- Entry review found no batch controller types, ports, validation, fixtures, or docs.

## Required Checks

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm verify:workflow-contracts
corepack pnpm check:workflow-contract-source
```

Additionally verify:

- legacy contract hash and X0 fixtures remain unchanged;
- scenario-neutral and secret-boundary scans pass;
- positive and negative batch-execution-control fixtures typecheck as intended;
- strict runtime decoder tests reject unknown/null discriminators, extra fields, malformed pages/receipts,
  and bounded-input violations;
- canonicalization golden vectors and the BC0 release-manifest vector hash verify;
- source-lock generation is deterministic under physical-root, LF/CRLF, BOM, and allowed alias changes;
- changed paths contain no runtime service, persistence, queue/outbox, endpoint, or activation;
- Markdown links/fences, JSON/YAML parsing, and `git diff --check` pass;
- a clean-copy frozen install passes the same conformance matrix.

## Results

- 2026-07-23: `corepack pnpm install --frozen-lockfile` reused the locked 48 packages and completed.
- 2026-07-23: `corepack pnpm verify:workflow-contracts` passed the four package typechecks, runtime tests
  19/19, scenario journey 1/1, claim-token/source-hash portability checks, and the existing source lock at
  `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- 2026-07-23: Markdown fence/file checks and `git diff --check` passed for the BC0 task package.
- 2026-07-23: Final independent contract-lock review returned `APPROVE BC0-B` with no residual P0/P1.
