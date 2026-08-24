# Verification

## Legacy checkpoint

- `git status --short --branch`: clean before opening the task.
- `git log --all --format=%(trailers:key=Task,valueonly)`: `T-002` appears 37 times.
- Governance installer `--dry-run --refresh`: plans new fixed assets and a flat hub but does not
  remove `.ai/project/main/*`; the cutover must remove it explicitly.
- Old CLI lint on the Windows checkout is not a portable green gate: tracked generated views are
  checked out as CRLF under `core.autocrlf=true`, while the CLI compares them byte-for-byte with LF
  output. The worktree itself was clean.

## Final checks

Pending G1 through G3.

