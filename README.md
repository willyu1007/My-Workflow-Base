# My-Workflow-Base
Workflow modular base template。具体场景在本项目规范上进行模块化开发，再接入宿主业务项目。

## 核心契约

- [Workflow v0 convergence](docs/context/workflow/v0-convergence.md)：固化当前收敛口径，包括 scenario 一等对象、内部 API 边界、YAML manifest + TS handler registry、handoff-only 底座。
- [Workflow architecture matrix](docs/context/workflow/architecture-matrix.md)：定义 5 个底座模块与 chat workflow control、chat dashboard summary、web workbench、mobile dashboard、forum、RAG、notification、admin、worker 等消费面的统一关系。
- [Workflow surface contract](docs/context/workflow/surface-contract.md)：定义 workflow 如何被 chat、论坛、mobile 看板、web workbench、RAG、通知、Admin、worker 消费和编辑。
- [Workflow API contract](docs/context/workflow/api-contract.md)：定义底座对外 REST/Command API、请求头、幂等、错误、dashboard、action、handoff、admin 接口。
- [Workflow module contract](docs/context/workflow/module-contract.md)：定义场景模块如何注册能力、entrypoint、step handler、presenter、policy 和测试。
- [Scenario module template](templates/scenario-module/README.md)：新增场景模块时必须填写的接入清单。
- [Scenario manifest example](templates/scenario-module/scenario.manifest.yaml)：可复制的场景 manifest 骨架。

## 当前任务包

- [Workflow base task package](dev-docs/active/workflow-base/00-overview.md)：用于收敛双层架构表、manifest/API 对齐和后续实现骨架。
- [Workflow base roadmap](dev-docs/active/workflow-base/roadmap.md)：宏观里程碑与收敛顺序。

## 底座原则

- Postgres 是 canonical；实时、搜索、向量、通知等都是下游投影或派生系统。
- Scenario 是数据库一等对象。manifest 是声明输入，不替代 canonical scenario record。
- 所有 durable writes 通过 Command API / Postgres / outbox。
- 底座只定义 handoff contract。公开、论坛、RAG、知识库、通知等下游模块各自实现自己的 reread、gate、投递和回执。
- Web/Admin 可以拥有场景内部 API；chat、mobile、forum、RAG、notification 等产品消费面必须走统一 Workflow API。
- 场景模块只实现领域事实和命令，不重新定义 chat/forum/dashboard/admin 的消费边界。

## 即插即用目标

一个新场景接入底座时，只允许新增这些东西：

1. 场景 manifest：声明 capability、entrypoint、artifact、action、surface mapping。
2. TS handler registry：把 manifest 里的 handler key 绑定到受控实现。
3. 领域 facts 和 repository：存储场景自己的业务对象。
4. Step handlers：实现每个 workflow step 的业务执行。
5. Presenters：把 run/artifact/action 转成 mobile/web/chat/admin 可消费的视图。
6. Policies：声明 preview、action、handoff、admin 的 gates。
7. Tests：至少一个 deterministic journey harness。

场景模块不允许重写底座的 Command API、outbox、projection、chat/mobile/forum/RAG/notification 消费规则。内部 API 必须登记在 manifest，并限制为 Web/Admin 专用操作面。
