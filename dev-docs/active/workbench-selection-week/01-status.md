# Status

## Goal
为The-Nurture T-122已定稿G包供给场景无关的SelectionList和WeekTable，沿既有web-workbench包交付；Nurture保留领域adapter和业务事实。

## Progress
- State: in-progress
- Current phase: Phase 2 — g.1已发布；真实Nurture接入发现窄表头挤压，g.2最小修正已验证，待按用户新增授权发布。
- Next step: 发布并核对g.2正常包及标签/产物，供G精确采用；不改变latest或产品发布。
- Blocker: 无。

## Done when
- [x] KIT-SELECTION — 完整可扩展顶栏、framed/plain列表、受控选择/禁用/键盘和长文本可访问路径成立。
- [x] KIT-WEEK — 同源七天日期/标题、导航、regular/compact、显式span及原生编辑内容可用，外壳无领域写操作。
- [x] KIT-CHECK — 当前包类型/聚焦行为/token及源码边界检查通过，源实现无重复组件责任。
- [ ] KIT-PACKAGE — 正常包产物/明确版本/exports/CSS和既有durationMs能力验证成立，交付G接线；真实Nurture采用与退出旧覆盖由G-COMP独占，不以源码别名冒充包供给。
