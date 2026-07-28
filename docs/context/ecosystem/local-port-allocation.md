# Local port allocation

Status: target with current-state evidence

Authority: My-Workflow-Base

Adopted: 2026-07-28

These ports let all three product repositories run concurrently. A row is
implemented only when the owning repository's environment contract, generated
example, application default, test assumptions, and documentation agree.

| Repository/service | Observed current value (2026-07-28) | Allocated target | Status |
|---|---:|---:|---|
| My-Chat web | 3000 | 3000 | implemented |
| My-Chat admin | 3001 | 3001 | implemented |
| My-Chat API | 8000 | 8000 | implemented |
| The-Education web | framework default 3000 | 3100 | target |
| The-Education API | 3001 | 3101 | target |
| The-Nurture frontend | framework default 3000 | 3200 | target |
| The-Nurture backend | environment contract 8000; code and frontend target 3001 | 3201 | target; internal drift exists |
| My-Workflow-Base | none | none | implemented; Base has no runtime |

Shared infrastructure such as Postgres or Redis may use one local daemon and
the conventional port when repositories use distinct database names and key
namespaces. Product HTTP services must use their allocated ports.

Changing a target row to implemented requires owner-repository verification.
This page allocates ports; it does not claim that a target repository has
already adopted them.
