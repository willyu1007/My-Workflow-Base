# @host/workflow-runtime

Host-owned workflow runtime scaffold for host product.

This package implements the local runtime shape described by the workflow base
template. It validates scenario modules, builds immutable registry descriptors,
exposes repository/service ports, lists standard route metadata, and resolves
worker handlers from canonical workflow identity plus contract hash.

## Owns

- Deterministic module validation
- Registry loading and binding resolution
- Repository interfaces for workflow ledger, handoff ledger, and evidence
- Service shells that orchestrate repository ports
- Standard workflow route metadata
- Worker payload and handler-resolution shell

## Does not own

- Prisma or database transactions
- Concrete outbox writes
- BullMQ registration
- NestJS controller wiring
- Scenario business logic
- Downstream projection, search, vector, RAG, notification, forum, or PPR writes

Concrete persistence and HTTP wiring should be added in host integration code,
with Prisma isolated to `packages/db`.
