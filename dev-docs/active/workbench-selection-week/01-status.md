# Status

## Goal
为The-Nurture T-122已定稿G包供给场景无关的SelectionList和WeekTable，沿既有web-workbench包交付；Nurture保留领域adapter和业务事实。

## Progress
- State: in-progress
- Current phase: Phase 1 — 用户已批准G定稿及实施顺序，核对现有EntityRow/列表/日期/弹层原语后开始共享呈现源码和聚焦行为测试。
- Next step: 先验证列表键盘移焦与显式选择，再验证七天日期和原生表格内容；类型/组件测试通过后准备正常包采用。
- Blocker: 无产品决定；包构建/远端发布不在当前授权中，真实consumer采用须先有可验证包产物。

## Done when
- [ ] KIT-SELECTION — 完整可扩展顶栏、framed/plain列表、受控选择/禁用/键盘和长文本可访问路径成立。
- [ ] KIT-WEEK — 同源七天日期/标题、导航、regular/compact、显式span及原生编辑内容可用，外壳无领域写操作。
- [ ] KIT-CHECK — 当前包类型/聚焦行为/token及源码边界检查通过，源实现无重复组件责任。
- [ ] KIT-PACKAGE — 正常包产物和明确版本具备，Nurture真实采用并退出本次替代的本地呈现；不以源码别名或示例冒充采用。
