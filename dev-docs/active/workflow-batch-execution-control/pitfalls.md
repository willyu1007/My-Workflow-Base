# Pitfalls

| Recurring mistake or hazardous action | Evidence | Prevention | Remove when |
|---|---|---|---|
| Treating a lease or fence as authentication | Threat-model review found the concepts easy to conflate. | Require authenticated transport/receipt resolution independently of concurrency authority. | A successor contract makes the distinction unrepresentable. |
| Letting recovery policy stand in for a claim | Recovery would otherwise mutate without an owner assertion. | Require a new `reconciliation_only` claim and strictly higher fence. | Recovery is replaced by a stronger owner protocol. |
| Dispatching effect before durable record | A worker effect cannot prove the owner's dispatch decision. | Define dispatch as ledger/outbox commit before effect. | The owner storage model enforces the ordering structurally. |
| Moving private or secret material through refs or events | Boundary fixtures demonstrate the leakage risk. | Keep payloads refs-only and resolve opaque receipts under authentication. | Public schemas mechanically prevent the fields. |
