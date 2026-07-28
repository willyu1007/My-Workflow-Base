# Contract distribution

Status: adopted

Authority: My-Workflow-Base

Adopted: 2026-07-28

## Supported lanes

| Artifact | Distribution lane | Consumers |
|---|---|---|
| Host contract and validator source | Copy plus logical source-hash conformance at an explicit handoff | My-Chat only |
| UI kits such as web-workbench | Published npm package, semver, one version per consumer repository | Any repository |
| My-Chat contracts used by a scenario | Pinned sibling checkout, exact revision and logical source hash in a pin file, CI verification against that checkout | Scenario repositories |

Unsupported mechanisms:

- per-consumer forks of host or Base contract/runtime packages;
- runtime dependency on My-Workflow-Base source;
- direct imports from a sibling repository's source tree;
- `file:` or `link:` dependencies without exact revision/hash pin evidence and
  a CI verifier;
- multiple versions of the same UI kit inside one consumer repository.

A local `file:` dependency on a pinned My-Chat checkout may support development,
but it is not release evidence by itself. CI must materialize the exact pinned
revision before verification.

## Re-pin ritual

Each consumer keeps a short, repeatable procedure:

1. Trigger on an upstream contract-affecting revision or source-hash change.
2. Check out the exact upstream revision.
3. Recompute and compare the logical source hash.
4. Update the consumer pin file and dependency resolution together.
5. Run consumer typecheck, contract tests, and cross-repository conformance.
6. Record the upstream revision, source hash, consumer revision, and command
   results.

A pin more than one contract-affecting baseline behind the host is a defect.

## Advisory checker

Base ships `conformance/scripts/check-consumer-boundaries.mjs`.

```sh
node conformance/scripts/check-consumer-boundaries.mjs \
  --repo /path/to/scenario \
  --consumer-role scenario
```

The default mode reports findings without failing so repositories can adopt the
gate incrementally. Add `--strict` in consumer CI after its existing findings
are resolved. The checker detects scenario-owned workflow contract/runtime
forks, unsupported Base source dependencies, unpinned My-Chat local
dependencies, and direct sibling-source imports.
