# Implementation notes

## Generated baseline

- Scenario key: `{{SCENARIO_KEY}}`
- Canonical manifest: `src/registry.ts`
- Owner API: `src/owner-api.ts`
- Persistence adapter: `src/prisma-repositories.ts`
- Prisma SSOT: `prisma/schema.prisma`
- Deterministic journeys: `tests/`

Record each boundary or contract decision below before changing executable
behavior. Do not turn migration adapters into a second authority.
