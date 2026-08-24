# Pitfalls

## Do Not Repeat

- Do not reuse a transient step claim token as batch-controller authority or a durable receipt.
- Do not add Education template-family, question, assignment, reviewer, packet, lane, learner, corpus, or
  Q2/Q4 fields to the shared contract.
- Do not put the new port on required scenario adapters or widen an existing runtime port.
- Do not let callers allocate identities that the owner is expected to make globally unique.
- Do not collapse reservation and seal into one mutation or imply reservation starts execution.
- Do not allow a recovery policy reference to substitute for a current owner claim/fence.
- Do not delete lifetime uniqueness observations when active capacity is released.
- Do not report dispatch success before the durable dispatch record/outbox commit.
- Do not return unbounded histories or lifetime registries in one receipt/snapshot.
- Do not make opaque receipt refs bearer credentials or silently fall back between trust modes.
- Do not include endpoint/auth/private material, tokens, or secret-derived hashes in DTOs, canonical input,
  logs, traces, errors, receipts, fixtures, or source evidence.
- Do not let Base attest scenario business lifecycle or production credit.
- Do not implement runtime services, Prisma, queues, outbox, endpoints, or canary behavior in this template
  repository.
