# Roadmap

## Scope and constraints
- 为已授权的The-Nurture T-122 G包提供最小共用呈现；源位于templates/web-workbench，不新建组件库。
- 用户已确认当前G mock及实施顺序；本记录只管Base供给，不复制G的周保存/媒体/午睡/权限规划。
- 不改当前发布/D-019，不执行未单独授权的build/远端publish或部署；验证优先noEmit类型、组件交互和tokens。
- Feature建议归既有F-002 UI基座；暂留F-000，行政映射不改变实施范围。

## Decision alignment

| Decision question | Current direction | Status | Owner / required confirmation | Closure evidence |
|---|---|---|---|---|
| 共享责任 | SelectionList持列表呈现，WeekTable持周导航/原生table；领域规则由消费者负责 | decided | 用户 | G已定稿，用户明确按建议开始实施 |
| 供给路径 | 现有web-workbench包/分组导出；禁止生产直接导入Base源码 | decided | 用户及现有分发契约 | G定稿与Base AGENTS |
| 包发布 | 准备源码/验证，构建和远端publish单独处理 | decided | 用户当前边界 | 不动当前发布和D-019，未明确授权build/publish |

## Task relationships

| Task | Relationship from this task | Owned boundary / exchanged contract | Coordination condition |
|---|---|---|---|
| The-Nurture T-122 | related-to | 本记录供给通用呈现，G持实际餐点/日程adapter和G-COMP增量验收 | 接口按G定稿最小形状；采用真实包，不迁领域事实 |

## Implementation plan

### Phase 1 — 最小共享呈现
- Outcome: SelectionList和WeekTable源码/分组导出、单一CSS owner和聚焦交互成立。
- Approach: 以G主稿目标为视觉基线，复用EntityRow、图标和tokens；一次实现一个可观察行为。
- Planned changes:
  1. 列表受控选择、顶栏扩展/新增替换。
  2. 周标题与七天表格/导航及regular/compact。
- Affected boundaries / entry points: web-workbench/list、primitives和现有styles。
- Dependencies: 当前包0.25.3，G定稿SHA-256 5c7352b6ea5abf93246d40a8411e6eee850ac79cb9fdc85b54fb7ef0abc24b0f。
- Exit criteria: KIT-SELECTION、KIT-WEEK、KIT-CHECK通过。
- Verification: KIT-SELECTION、KIT-WEEK、KIT-CHECK。
- Recovery: 源码单元可独立回退，不发布未验证的包。

### Phase 2 — 包采用交付
- Outcome: 构建产物/版本及公开导出/CSS可验证，正常包供给交付G采用。
- Approach: 需要时申请具体build/publish授权；不使用直接源码导入规避。
- Planned changes:
  1. 正常包产物、导出/CSS和公开API验证；G持实际consumer采用及去除旧覆盖。
  2. 保留现有durationMs消费能力。
- Affected boundaries / entry points: 既有包源/分发和Nurture消费者。
- Dependencies: Phase1已通过；候选源码为0.26.0-g.1，仍需包产物与必要build/publish授权。
- Exit criteria: KIT-PACKAGE通过。
- Verification: KIT-PACKAGE；G-COMP为消费者独立验收，不作为本供给项前置。
- Recovery: 消费者保持原已发布版本，避免半切换。

## Kickoff gate
- Status: ready
- Authorized boundary: through phase 1
- [x] Decisions: 用户已批准G mock及Base共享呈现实施。
- [x] Design: 最小接口来自G architecture，EntityRow/原生table/图标足以复用；Base当前工作树无其他写者改动。
- [x] Route: 先共享源码/类型/交互，再正常包供给和真实消费。
- [x] Verification: noEmit/组件行为与实际包/浏览器证据分开。

Phase1 closeout：4cd5e8c完成源码/分组导出和durationMs既有补丁回收；10项组件测试、noEmit、tokens、consumer boundaries及原契约source lock通过。独立复核三处问题已修正；真实源码浏览器核对通过。包构建/发布/真实consumer仍属Phase2，不能外推。

## Risks and recovery
- 不把班级、菜品、保存、排程或权限控制加入共用组件。
- 构建/发布未授权时保留已验证源码，不能宣称消费者已采用。

## Phase closeout
- Review: 按定稿和最小职责检查源码与受影响调用面，修正后再验证。
- Record update: 只记录实际类型/交互/包结果，不把源码测试当consumer采用。
- Checkpoint: 每个可回退单元验证通过后提交，不push或远端发布。
