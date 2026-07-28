# Contract status labels

Status: adopted

Authority: My-Workflow-Base

Adopted: 2026-07-28

Every normative cross-repository page or substantial section uses one of these
labels:

| Label | Meaning | Required evidence |
|---|---|---|
| `implemented` | Executable source exists and matches the statement | Source path plus a passing typecheck, test, or conformance command |
| `adopted` | A governance convention is authoritative now | Authority, adoption date, and decision/task reference |
| `target` | Approved destination state that is not fully implemented | Owning repository and implementation task or next gate |
| `proposal` | Not approved and not safe to depend on | Decision owner and open question |
| `deprecated` | Still present only for compatibility | Replacement, removal condition, and rollback horizon |

Do not use "current", "supported", "ready", or "complete" without one of the
labels above and its evidence. A mixed page labels each implemented and target
section separately. Documentation never upgrades a target to implemented
because a type exists, a mock passes, or another repository plans to adopt it.

For repository-qualified work, use `<repository>/<task-id>` or a stable task
slug. Task identifiers are local to their repository.
