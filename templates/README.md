# Workflow templates

This directory contains copyable scaffolds for host runtime implementation and
scenario module implementation. The base repository remains a template and does
not become a runtime dependency.

## Available templates

- `host-runtime/`: package-level scaffold for a host product that implements
  workflow contracts, validator, registry loader, services, adapters, route
  metadata, and worker runtime ports.
- `scenario-module/`: scenario-level scaffold for a concrete workflow module
  that plugs into the host runtime through manifest or TS contract, registry,
  handlers, adapters, presenters, policies, and deterministic journey tests.

## Copy order

1. Copy `host-runtime/packages/workflow-contracts` into the host repository.
2. Copy `host-runtime/packages/workflow-runtime` into the host repository.
3. Copy `scenario-module` for each concrete scenario.
4. Rename package names, import aliases, scenario keys, and fixture ids to the
   target repository conventions.
5. Implement persistence adapters in the repository that owns the canonical facts:
   shared platform/workflow facts in the host, scenario domain facts in the scenario
   owner. Domain code depends on repository ports.

## Boundary

Host runtime scaffolds use repository and port interfaces for persistence, queues,
providers, and downstream services; the host supplies their implementations.

The Scenario Starter includes a Prisma repository adapter and migration as an
owner-side persistence example. Adopters keep scenario facts in the scenario owner
and must not write host or other owners' canonical facts through this adapter.
