# Pitfalls

- Do not treat identity, membership, stewardship, binding, or actor association
  as scenario authorization.
- Do not import another owner's Prisma client or migration.
- Do not put domain bodies, PII, or permission snapshots in commands, events,
  outboxes, queues, logs, or telemetry.
- Do not bypass the Host Model Gateway.
- Do not accept an idempotency key under a different actor, workspace, purpose,
  release, expected version, Run, or Step.
- Do not infer identity links from names, dates, contacts, or organization
  identifiers.
- Do not preserve an independently authoritative legacy runtime for
  compatibility.
- Do not interpret technical qualification as activation approval.
