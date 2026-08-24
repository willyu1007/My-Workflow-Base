# Architecture

## Ownership

```text
My-Workflow-Base
  contract schemas + conformance + Starter

My-Chat
  identity + registry + Run/Step/Handoff + Model Gateway

{{SCENARIO_KEY}} owner
  authorization + domain facts + command execution + private outbox/inbox
```

## Command flow

1. Host authorizes platform identity, PBR, release, and activation.
2. Host creates Run/Step and its platform outbox atomically.
3. Host sends a versioned refs-only command with actor, represented
   organization, purpose, expected versions, and idempotency identity.
4. Owner rechecks current scenario authorization and commits its facts,
   execution receipt, and bodyless outbox atomically.
5. Host accepts refs-only results, rereads the owner for presentation, and
   materializes shared Handoffs.

There is no distributed transaction, cross-owner ORM import, cross-database
join, or failure-time rollback of another database.
