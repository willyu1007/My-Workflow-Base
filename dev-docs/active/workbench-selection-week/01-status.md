# Status

## Goal
为The-Nurture T-122已定稿G包供给场景无关的SelectionList和WeekTable，沿既有web-workbench包交付；Nurture保留领域adapter和业务事实。

## Progress
- State: done
- Current phase: Phase 2完成 — g.1及修正版g.2均已验证发布；当前g-preview=0.26.0-g.2，latest=0.25.3。
- Next step: 供The-Nurture T-122沿正常包精确采用g.2；本任务不代签G的consumer/领域/产品部署验收。
- Blocker: 无。

## Done when
- [x] KIT-SELECTION — 完整可扩展顶栏、framed/plain列表、受控选择/禁用/键盘和长文本可访问路径成立。
- [x] KIT-WEEK — 同源七天日期/标题、导航、regular/compact、显式span及原生编辑内容可用，外壳无领域写操作。
- [x] KIT-CHECK — 当前包类型/聚焦行为/token及源码边界检查通过，源实现无重复组件责任。
- [x] KIT-PACKAGE — 正常包产物/明确版本/exports/CSS和既有durationMs能力验证成立，交付G接线；真实Nurture采用与退出旧覆盖由G-COMP独占，不以源码别名冒充包供给。
