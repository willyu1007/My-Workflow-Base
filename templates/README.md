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
   host repository conventions.
5. Implement repository adapters in the host product. Do not implement concrete
   DB writes inside the copied scenario folder.

## Boundary

The templates intentionally avoid database clients, queue clients, provider
SDKs, and downstream SDKs. Host products wire those through repository and port
implementations.
