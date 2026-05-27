# Host runtime scaffold

Use this scaffold when a host product adopts the workflow base. It gives the
host a local contract package and a local runtime package. It is not intended to
be imported from this repository.

## Packages

```txt
packages/workflow-contracts/
packages/workflow-runtime/
```

`workflow-contracts` contains shared types and pure constants only. Scenario
modules, product surfaces, workers, and runtime services can import it without
bringing in database, queue, provider, or downstream dependencies.

`workflow-runtime` contains the host-owned validator, registry loader, service
ports, route metadata, and worker runtime shell. Concrete repository
implementations live in the host product.

## Required host work after copy

- Rename package names and import aliases to the host repository convention.
- Add real repository implementations for workflow ledger, handoff ledger, and
  evidence records.
- Wire HTTP/RPC controllers to the route metadata and services.
- Wire queue consumers to `WorkflowWorker`.
- Add a deterministic journey harness for the first concrete scenario.
- Add CI gates for module validation before pilot or GA activation.

## Non-goals

- No Prisma imports in contracts or runtime packages.
- No direct projection, search, vector, RAG, notification, forum, or PPR writes.
- No scenario business logic inside the host runtime package.
- No dynamic user-authored module loading.
