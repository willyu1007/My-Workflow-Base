# My-Workflow-Base
Workflow modular base template。这个仓库不提供运行时服务；具体 workflow
基于这里的契约/模板实现自己的 API、adapter、handler、presenter、policy，
再接入宿主业务项目。

## 核心契约

- [Workflow v0 convergence](docs/context/workflow/v0-convergence.md)：固化当前收敛口径，包括 scenario 一等对象、内部 API 边界、YAML manifest 或等价 TS contract + TS handler registry、handoff-only 底座。
- [Workflow architecture matrix](docs/context/workflow/architecture-matrix.md)：定义 5 个底座模块与 chat workflow control、chat dashboard summary、web workbench、mobile dashboard、forum、RAG、notification、admin、worker 等消费面的统一关系。
- [Workflow surface contract](docs/context/workflow/surface-contract.md)：定义 workflow 如何被 chat、论坛、mobile 看板、web workbench、RAG、通知、Admin、worker 消费和编辑。
- [Workflow API contract](docs/context/workflow/api-contract.md)：定义具体 workflow 必须实现的 REST/Command API 或 adapter shape、请求头、幂等、错误、dashboard、action、handoff、admin 接口。
- [Workflow module contract](docs/context/workflow/module-contract.md)：定义场景模块如何注册能力、entrypoint、step handler、action、adapter、presenter、policy、validation 和测试。
- [Workflow implementation skeleton](docs/context/workflow/implementation-skeleton.md)：定义宿主项目可采用的 package layout、validator、registry loader、route、handoff、worker 和 journey harness 骨架。
- [Workflow scenario readiness proof](docs/context/workflow/scenario-readiness-proof.md)：用教育种子场景和非教育场景草图验证底座没有场景语义耦合。
- [Workflow v0 readiness checklist](docs/context/workflow/v0-readiness-checklist.md)：记录语义漂移检查和 v0 contract readiness。
- [Scenario module template](templates/scenario-module/README.md)：新增场景模块时必须填写的接入清单。
- [Scenario manifest example](templates/scenario-module/scenario.manifest.yaml)：可复制的场景 manifest 骨架。
- [Workflow templates](templates/README.md)：可复制的 host runtime package 脚手架与 scenario module 代码脚手架。

## 当前任务包

- [Workflow base task package](dev-docs/active/workflow-base/00-overview.md)：用于收敛双层架构表、manifest/API 对齐和后续实现骨架。
- [Workflow base roadmap](dev-docs/active/workflow-base/roadmap.md)：宏观里程碑与收敛顺序。

## 底座原则

- Postgres 是 canonical；实时、搜索、向量、通知等都是下游投影或派生系统。
- Scenario 是数据库一等对象。manifest 是声明输入，不替代 canonical scenario record。
- Canonical domain registry 由宿主平台实现；workflow 底座只定义
  Domain Context ref / resolver / snapshot / binding contract。
- 所有 durable writes 通过具体 workflow 实现的 Command API / Postgres / outbox。
- MVP 只要求最小 evidence log：记录 P0/P1 权威写入和高风险动作，不把底座扩展成审计产品、审计后台或人工巡检系统。
- Outbox 只承载下游信号和 refs，不承载业务正文；projection、论坛、RAG/知识库、通知、search/vector、PPR、replay 都必须回读 canonical owner。
- Event registry 分三层：platform events、标准 `workflow.*` events、scenario internal events；共享产品消费面只能依赖前两层。
- 底座只定义 handoff contract。具体 workflow 创建 handoff request；公开、论坛、RAG、知识库、通知等下游模块各自实现自己的 reread、gate、投递和回执。
- Web/Admin 可以拥有场景内部 API；chat、mobile、forum、RAG、notification 等产品消费面必须走具体 workflow 暴露的标准 surface adapter / Workflow API。
- 场景模块声明领域上下文需求和命令，不重新定义 chat/forum/dashboard/admin 的消费边界，也不把 workflow 变成 canonical domain object store。

## 即插即用目标

一个新场景接入底座时，只允许新增这些东西：

- 复制 `templates/host-runtime/packages/workflow-contracts` 和
  `templates/host-runtime/packages/workflow-runtime` 到宿主项目，并按宿主项目
  package 命名改 import alias。
- 复制 `templates/scenario-module` 到宿主项目的场景目录，填写 manifest 或等价
  TS contract，并实现 handlers/actions/adapters/presenters/policies。

1. 场景 manifest：声明 capability、entrypoint、artifact、action、surface mapping。
2. TS handler registry：把 manifest 里的 handler key 绑定到受控实现。
3. Domain context refs：声明 workflow 需要的领域上下文类型、resolver key、snapshot 要求。
4. Step handlers：实现每个 workflow step 的业务执行。
5. Adapters：绑定 chat/web/mobile/admin/worker 的标准 API 或 port 形状。
6. Presenters：把 run/artifact/action 转成 mobile/web/chat/admin 可消费的视图。
7. Policies：声明 preview、action、handoff、admin 的 gates。
8. Tests：至少一个 deterministic journey harness。

场景模块可以替换实现，但不允许改写底座定义的 Command API / adapter
shape、outbox、projection、chat/mobile/forum/RAG/notification 消费规则。
内部 API 必须登记在 manifest 或等价 TS contract，并限制为 Web/Admin
专用操作面。
