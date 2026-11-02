# Verification

## Evidence
| Claim / reference | Check / procedure | Latest result | Baseline / source | Evidence / limitation |
|---|---|---|---|---|
| 方向和授权 | G已定稿及用户实施请求，现有Base原语/消费边界只读核对 | confirmed；本地源码/类型/组件行为可推进 | G定稿主稿及The-Nurture T-122；Base0.25.3 | 不是包构建/远端发布或实际consumer通过 |

## Outstanding verification
- **KIT-SELECTION** — 方向键/Home/End移焦不提交，Enter/Space才选择；禁用项不被激活；toolbar与listbox分开，名称和摘要可访问。条件：Phase1首个源码行为可用；Owner本任务。
- **KIT-WEEK** — 七个连续日期产生一致周标题/表头（含跨月跨年），导航遵循传入disabled，显式span覆盖七日且内容保留原生编辑语义；regular/compact布局由实际浏览器/consumer验证。条件：Phase1组件可用；Owner本任务。
- **KIT-CHECK** — 当前源码noEmit类型、聚焦交互、tokens及边界检查成立，无已知未解决问题或临时测试路径。条件：Phase1最终源码；Owner本任务。
- **KIT-PACKAGE** — 正常包产物/exports/CSS一致，Nurture从包真实消费并退出旧覆盖；原durationMs不回归。条件：Phase2包产物具备/必要构建发布授权，consumer验证依赖The-Nurture T-122 G-COMP；Owner本任务持包供给，G持consumer增量。

## Deployment changes
当前无远端包发布、产品部署、schema/配置或环境变化。具体版本和消费者采用在实际完成后记录。
