# Plan

## Implementation

- [ ] Replace example domain types and commands with scenario-owned concepts.
- [ ] Implement current role/grant/purpose/lifecycle authorization.
- [ ] Keep Prisma imports inside the persistence adapter.
- [ ] Commit domain fact, command execution, and bodyless owner outbox in one
      transaction.
- [ ] Implement owner reread presenters and deletion behavior.
- [ ] Route all generation and OCR through the Host Model Gateway.

## Qualification

- [ ] Apply the migration to a fresh dedicated local database.
- [ ] Pass typecheck, unit tests, database tests, build, and semantic lint.
- [ ] Pass replay, wrong-Step, response-loss, event dedupe, owner outage, and
      transaction rollback cases.
- [ ] Pass authorization-negative and refs-only privacy cases.
- [ ] Replace every integration-lock placeholder with an exact revision and
      logical hash.
- [ ] Pass ordinary and exact joint-candidate lock verification.
- [ ] Inspect `pnpm pack --dry-run`; do not publish from qualification.
- [ ] Register only a default-disabled release.

## Exit

The scenario can register, execute, reread, hand off, replay, and delete through
public contracts without a Host API addition or another owner's canonical fact.
