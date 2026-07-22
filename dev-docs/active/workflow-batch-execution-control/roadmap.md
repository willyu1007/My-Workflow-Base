# Roadmap

## Objective

Deliver the batch-execution control contract as a small additive Base capability and hand it to My-Chat
without making this template repository a runtime or leaking the first consuming scenario into shared API.

## Increments

### BC0-A · Contract And Threat-Model Lock

- Freeze naming, ownership, method split, state machine, trust mode, recovery authority, and forbidden data.
- Review compatibility with existing runtime/materialization ports and module shapes.
- Keep the source tree behavior unchanged.

Exit: independent architecture review finds no shared scenario semantics or authority ambiguity.

### BC0-B · Additive Types And Positive Conformance

- Add the independent capability descriptor, command/read/resolver ports, DTOs, and error taxonomy.
- Add positive fixtures for forward execution, pagination, recovery, tombstone/supersession, and opaque
  receipt resolution.
- Preserve all legacy exports and implementations.

Exit: contracts and all positive legacy/vNext/batch fixtures typecheck.

### BC0-C · Negative And Boundary Conformance

- Reject missing authority/source pins, stale batch/global CAS, invalid claim/fence combinations, changed
  exact retries, invalid recovery operations, and malformed pages/receipts.
- Add scenario-neutral and secret-boundary scans.
- Prove the existing step claim token cannot substitute for batch authority.

Exit: adversarial compile/source checks pass without runtime or persistence implementation.

### BC0-D · Source Lock And BC1 Handoff

- Create the contract-bearing commit.
- Regenerate the single aggregate source lock with that exact revision.
- Record deterministic hash, logical roots, exact My-Chat copy map, non-goals, and verification commands.

Exit: Base full conformance passes and My-Chat can adopt the exact bytes while capability remains disabled.

## Downstream Increments

- My-Chat BC1: canonical Postgres ledger, repositories/services, owner API, opaque resolver, dispatch
  outbox/no-op worker, environment policy, and integration/fault tests.
- The-Education Q4-B5: scenario profile mapping, anti-corruption adapter, disposable synthetic canary, and
  readiness evidence. It cannot reinterpret Base or self-authorize the owner.

## Rollback

Before host adoption, rollback removes only the additive batch-execution-control exports, fixtures,
reference validation, docs, and refreshed source lock. Existing step/handoff contracts remain unchanged.
