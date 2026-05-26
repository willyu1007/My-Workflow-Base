# Verification

## Planned Checks
- `git diff --check`
- YAML parse for `templates/scenario-module/scenario.manifest.yaml`
- Markdown fence count check for workflow docs and task docs
- Search for stale local-path references before finalizing docs

## Results
- 2026-05-25: Task package created.
- 2026-05-25: Markdown fence count check passed for workflow docs, task docs,
  and scenario template docs.
- 2026-05-25: Local path/reference scan passed for repository docs.
- 2026-05-25: `ruby -e 'require "yaml"; YAML.load_file("templates/scenario-module/scenario.manifest.yaml"); puts "yaml ok"'` passed.
- 2026-05-25: `git diff --check` passed.
- 2026-05-26: Stale surface-name scan passed for active workflow docs and
  scenario templates. Removed legacy chat/web surface wording from the v0
  contract path.
- 2026-05-26: Knowledge-indexing action wording scan passed. Dashboard and chat
  docs now describe service-owned indexing instead of direct knowledge-base
  actions.
- 2026-05-26: Markdown fence count check passed for workflow docs, task docs,
  and scenario template docs.
- 2026-05-26: `ruby -e 'require "yaml"; YAML.load_file("templates/scenario-module/scenario.manifest.yaml"); puts "yaml ok"'` passed.
- 2026-05-26: `git diff --check` passed.
