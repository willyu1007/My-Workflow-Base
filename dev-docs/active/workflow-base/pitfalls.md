# Pitfalls

| Recurring mistake or hazardous action | Evidence | Prevention | Remove when |
|---|---|---|---|
| Encoding a concrete scenario in shared contracts | Earlier convergence repeatedly found education/product vocabulary at shared boundaries. | Use scenario-neutral types and boundary scans; keep examples under templates/examples only. | Contract generation makes scenario vocabulary structurally impossible. |
| Treating projections, manifests, or events as authority | Shared consumers could bypass canonical permission/state reread. | Keep payloads refs-only and require owner canonical reread before decisions or effects. | Every consumer path enforces reread mechanically. |
| Giving chat hidden operations powers | Chat control can drift into step intervention or conflict repair. | Limit chat to start/control, summaries, citations, and links; Web/Admin owns repair. | Product contracts make these surfaces non-overlapping. |
| Writing source-lock evidence before an exact commit exists | A lock cannot truthfully self-pin uncommitted bytes. | Land source first, then update revision/hash evidence in a later commit. | Source tooling performs the two-step release automatically. |
| Claiming database qualification from compile/unit evidence | The Starter's owner-local transaction path needs a real database. | Record database evidence only from the opt-in journey against disposable PostgreSQL. | The journey runs in mandatory isolated CI. |
