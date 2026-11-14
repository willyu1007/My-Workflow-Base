# T-082 — SelectionList 与 WeekTable 包供给

已完成面向 The-Nurture T-122 的场景无关组件供给。源码沿既有 `templates/web-workbench` 交付；领域 adapter、权限、日期生成和保存事实由消费者持有。

## 交付结果与约束

- `SelectionList` 从 `/list` 导出，提供受控选择、禁用项、键盘与动态焦点恢复、可扩展顶栏及 framed/plain 外观；移动焦点不自动选择，组件不持有查询或业务状态。
- `WeekTable` 从 `/primitives` 导出，标题和表头使用消费者提供的同一组连续七天日期，支持 regular/compact、显式跨度和原生编辑内容；不读取当前时钟或执行领域写操作。
- `Menu compact` 为窄列表头提供 24px 触发器，保持默认 Menu 行为；保留已有 `ToastProvider.durationMs` 消费扩展。
- 后继版本已继续演进这些组件。当前 API、样式和边界以 `templates/web-workbench/README.md` 及对应源码为准，本摘要不冻结旧包为现行版本。

## 决定性证据

源码 `4cd5e8cf42af4c312c8f996c6d8f96618a73bfa7`、窄表头修正 `d9e70ec0498abd906b937644f5f70d7129574490`，完成记录 `b2b89bcd2131dd3b0de07343d70ec98e01cbe139`。组件测试 7 文件 10 项、类型、tokens、consumer boundaries、契约 source lock 及修复后独立代码复核通过。源码浏览器夹具和实际 Nurture adapter 的有限核对分别保留其样例/替身 action 边界，不代签完整产品验收。

获批候选 `0.26.0-g.1` 与修正版 `0.26.0-g.2` 已完成正常构建、打包、隔离安装类型/SSR/CSS 核对、GitHub Packages 发布及 registry 重装逐文件比对。g.2 tarball SHA256 为 `3bbb521f5e9ee85a7e99b13cd06c5f39c85a5f783d105349d2a754bfbdecbd94`，当时读回 `g-preview=0.26.0-g.2`、`latest=0.25.3`；不将当时标签状态表述为当前 registry 状态。

发布版本不可覆盖。消费者采用正常包并精确钉版本，不直接导入 Base 源码；回退由消费者重新钉已有版本，不移动发布标签或替换同版本内容。

## Deployment changes not yet confirmed

无。本任务只完成获批组件包供给，不包含产品部署、数据库、环境或 D-019 变更，也不将候选标签提升为 latest。

## Checks taken over

The-Nurture T-122（`dev-docs/active/workbench-daily-tools-upgrade/verification.md` 的 `G-COMP`）明确持有实际 consumer 的筛选、搜索、新增、菜单/焦点、周表内容和定稿对照验收。本供给任务不替代该结果或签署消费者的全部 UI/业务闭环。
