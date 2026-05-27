# @host/workflow-contracts

Scenario-neutral workflow contracts for host product.

This package contains types and pure constants only. Runtime services, database
repositories, queues, provider SDKs, and downstream systems must not be imported
here.

## Owns

- Scenario manifest shape
- Standard workflow identity refs
- Workflow API and adapter DTOs
- Handoff request/receipt contracts
- Standard workflow event payload contracts
- Scenario module registry contracts
- Module validation report types

## Does not own

- Postgres repository implementations
- Prisma imports
- NestJS controllers
- BullMQ workers
- Convex/Search/Vector/RAG/Notification/Forum/PPR side effects
- Scenario business logic
