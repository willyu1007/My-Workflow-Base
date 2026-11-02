# Status

## Goal
为The-Nurture T-122已定稿G包供给场景无关的SelectionList和WeekTable，沿既有web-workbench包交付；Nurture保留领域adapter和业务事实。

## Progress
- State: in-progress
- Current phase: Phase 2 — 共享源码单元已在4cd5e8c验证提交；下一步正常包构建/采用，尚未build/publish。
- Next step: 取得具体build/候选包发布边界后生成0.26.0-g.1产物，验证exports/CSS并供Nurture真实采用；未取得前不使用旧dist或源码直连替代。
- Blocker: 无产品决定；包构建/远端发布不在当前授权中，真实consumer采用须先有可验证包产物。

## Done when
- [x] KIT-SELECTION — 完整可扩展顶栏、framed/plain列表、受控选择/禁用/键盘和长文本可访问路径成立。
- [x] KIT-WEEK — 同源七天日期/标题、导航、regular/compact、显式span及原生编辑内容可用，外壳无领域写操作。
- [x] KIT-CHECK — 当前包类型/聚焦行为/token及源码边界检查通过，源实现无重复组件责任。
- [ ] KIT-PACKAGE — 正常包产物/明确版本/exports/CSS和既有durationMs能力验证成立，交付G接线；真实Nurture采用与退出旧覆盖由G-COMP独占，不以源码别名冒充包供给。
