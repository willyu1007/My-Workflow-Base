# Architecture

## Context
Base现有包0.25.3有EntityRow/ListView和通用图标，缺嵌入式选择容器与七天周表外壳。G主稿已定稿，源侧重建仅作差异对照。

## Settled design
- SelectionList从/list导出：items(id/title/summary/disabled)、selectedId、onSelect、toolbar(filter/accessory/expanded)、appearance及empty。Base持顶栏/行呈现/滚动、listbox语义和键盘；不存查询、不自动选首项、不做业务写入。
- 列表顶栏46px/间距10px，行38.5px/8px 16px，标题15/700、摘要12px；容器允许菜单外溢，行区单独裁底角。
- WeekTable从/primitives导出：七个连续local dates、导航回调、context/actions、heading/content单元格及显式span、footer、regular/compact。日期不读系统时区或当前时间，标题与表头同源；action为日期旁附加动作，不替换日期。运行时校验七日/连续性，days使用readonly数组以承接已解码Consumer数据。
- Base持原生table/colgroup/表头/行头语义，单元格不再套按钮。窄列只控制宽，不表示关闭或只读；内容换行自然撑高。cell.fill允许单根编辑器占满单元格，共享CSS持有regular/compact间距；默认内容仍是内边距包装。列表动态禁用/移除或空列表恢复只恢复其自身焦点，不提交选择或抢外部输入焦点。
- regular控件34、间距10/14、表头54/首列116/窄列54/基格61/页脚42；compact首列105/窄列49/基格50/页脚32/288px内滚与粘性表头页脚。
- 字体、配色、图标沿既有tokens；不引入新主题、组件状态机或第三方控件库。

## Interfaces and ownership
源码提交4cd5e8c，候选版本0.26.0-g.1，尚未构建/发布。接口细节以本源导出为最终技术定义；G最小接口草案作为输入，必要技术调整只为原生语义/类型约束，不改变产品方向。Nurture持搜索、过滤、班型、日期生成、选中对象、格子编辑和保存/恢复。

## Migration and operation
当前不改已发布包或consumer pin，旧dist不作为本轮产物。durationMs已按现有Nurture消费补丁移入owner源码，默认时间和run生命周期不变；Nurture消费补丁在真正升级时再退出。需正常包产物后再采用，既有durationMs消费补丁不得在升级时丢失；具体版本/构建结果有证据后记录。
