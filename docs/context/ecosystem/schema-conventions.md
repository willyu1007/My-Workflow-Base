# Schema and contract evolution

Status: adopted

Authority: My-Workflow-Base

Adopted: 2026-07-28

## Ownership

- The repository that owns canonical data owns its schema and migrations.
- My-Chat owns shared platform schemas. Scenario repositories own their
  canonical dossier schemas.
- My-Workflow-Base owns reusable contract and template shapes only. It owns no
  production database and publishes no runtime migration.
- A consumer must not mirror another repository's canonical tables as a local
  source of truth.

## Forward-only changes

Persisted and cross-repository contract changes are forward-only:

1. Add a versioned field, type, or endpoint without changing existing meaning.
2. Make readers tolerate the old and new forms while writers remain on the old
   form.
3. Deploy the owner writer and backfill only through an owner-controlled,
   replayable operation.
4. Move consumers to the new version and record revision/hash evidence.
5. Stop old writes.
6. Remove old reads only after the compatibility window and rollback horizon
   close.

Renames are add-and-migrate operations, not in-place meaning changes. Enum
values are never repurposed. A removed field name or identifier is not reused
for a different meaning.

## Identity and evidence

- Schema version, source hash, manifest contract hash, and deployment revision
  are separate identities and must use distinct field names.
- A logical source hash proves copied source parity; it does not replace a
  runtime manifest `contract_hash`.
- Cross-repository migrations record owner repository, exact revision, schema
  or contract version, verification command, and rollback boundary.

## Compatibility default

Additive changes are the default. Breaking changes require a new explicit
version, a consumer inventory, staged adoption, and a rollback plan. Base may
define reusable validation for the transition but never performs consumer
database writes.
