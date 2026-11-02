# Verification

## Evidence
| Claim / reference | Check / procedure | Latest result | Baseline / source | Evidence / limitation |
|---|---|---|---|---|
| 方向和授权 | G已定稿及用户实施请求，现有Base原语/消费边界只读核对 | confirmed；本地源码/类型/组件行为可推进 | G定稿主稿及The-Nurture T-122；Base0.25.3 | 不是包构建/远端发布或实际consumer通过 |
| KIT-SELECTION / KIT-WEEK / KIT-CHECK | 测试先行及独立源码复核；10项组件测试、noEmit、tokens、consumer boundary、旧contract source lock | passed for source | Base 4cd5e8c，源码候选0.26.0-g.1；包内pnpm test/typecheck/tokens:check，根check:consumer-boundaries和check:workflow-contract-source | 7文件10项，新增BA-41–43为键盘/动态焦点恢复/跨年原生周表；未build/publish或直接采用Base源 |
| 真实源码布局 | 仅供核对的临时Vite浏览器夹具，直接渲染本轮组件与原Menu/当前CSS | passed for source fixture | Chrome本地源码夹具；Root测量，独审未独立重放浏览器 | 顶栏46/行38.5、表头54/首列116和105/窄列54、regular基础行61、compact内滚288/页脚32；长行127时整格编辑器覆盖内框且两角命中；滚动后thead/tfoot位置稳定、菜单外溢可命中。不是Nurture实际业务消费或用户视觉验收 |
| 独立代码复核 | 相对6436247全批源码，根审查＋只读子代理；补缺陷后复核 | no unresolved source findings | 焦点动态禁用/移除/空态恢复、日期action同源和full-cell槽均修正；durationMs与现有消费补丁一致 | 浏览器报告由Root验证；仍未覆盖包产物、真实消费或后端事实 |

## Outstanding verification
- **KIT-PACKAGE** — 正常包产物/exports/CSS及公开API一致，原durationMs不回归，交付G采用；不以源码别名或旧dist作新产物。条件：Phase2包产物具备/必要构建发布授权；Owner本任务仅持包供给，G-COMP独占真实Nurture采用/退出旧覆盖，不作为本项前置。

## Deployment changes
已准备0.26.0-g.1源码候选；当前无build/包产物或远端包发布、产品部署、schema/配置或环境变化。具体版本和消费者采用在实际完成后记录。
