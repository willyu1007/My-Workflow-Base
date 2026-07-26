# Scenario integration

## Goal

Integrate the `{{SCENARIO_KEY}}` scenario as an independently owned domain service using
the public workflow contract and Host SDK.

## Status

- State: generated
- Scenario key: `{{SCENARIO_KEY}}`
- Activation: `disabled`
- Owner database: independent PostgreSQL database
- Canonical manifest: `src/registry.ts`
- Integration lock: `integration-lock.{{SCENARIO_KEY}}.json`

## Boundaries

- This repository owns scenario authorization, domain facts, transactions,
  command execution receipts, and its private integration outbox/inbox.
- My-Chat owns shared identity, registry, Run/Step/Handoff ledgers, platform
  outbox, product surfaces, and the Model Gateway.
- My-Workflow-Base owns normative schemas, conformance tooling, and this
  Starter; it owns no production fact.
- Cross-owner payloads remain refs-only. No scenario fact is dual-written.

## Stop conditions

Stop qualification if an exact source pin cannot be reproduced, an
authorization-negative case passes, a queue/outbox/log contains a body or PII,
the owner transaction is non-atomic, or the migration requires cross-database
queries or fact dual-write.
