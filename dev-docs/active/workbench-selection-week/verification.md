# Verification

## Evidence
| Claim / reference | Check / procedure | Latest result | Baseline / source | Evidence / limitation |
|---|---|---|---|---|
| 方向和授权 | G已定稿及用户实施请求，现有Base原语/消费边界只读核对 | confirmed；用户另明确允许质量复核后构建及g-preview发布 | G定稿主稿及The-Nurture T-122；Base0.25.3 | 具体包结果见下；不授权产品部署 |
| KIT-SELECTION / KIT-WEEK / KIT-CHECK | 测试先行及独立源码复核；10项组件测试、noEmit、tokens、consumer boundary、旧contract source lock | passed for source | Base 4cd5e8c，源码候选0.26.0-g.1；包内pnpm test/typecheck/tokens:check，根check:consumer-boundaries和check:workflow-contract-source | 7文件10项，新增BA-41–43为键盘/动态焦点恢复/跨年原生周表；未build/publish或直接采用Base源 |
| 真实源码布局 | 仅供核对的临时Vite浏览器夹具，直接渲染本轮组件与原Menu/当前CSS | passed for source fixture | Chrome本地源码夹具；Root测量，独审未独立重放浏览器 | 顶栏46/行38.5、表头54/首列116和105/窄列54、regular基础行61、compact内滚288/页脚32；长行127时整格编辑器覆盖内框且两角命中；滚动后thead/tfoot位置稳定、菜单外溢可命中。不是Nurture实际业务消费或用户视觉验收 |
| 独立代码复核 | 相对6436247全批源码，根审查＋只读子代理；补缺陷后复核 | no unresolved source findings | 焦点动态禁用/移除/空态恢复、日期action同源和full-cell槽均修正；durationMs与现有消费补丁一致 | 浏览器报告由Root验证；仍未覆盖包产物、真实消费或后端事实 |
| KIT-PACKAGE | 正常build/pack，逐项核对19个exports/256文件、无过期JS，隔离pnpm安装tarball后tsc/SSR/CSS；发布后registry读回 | passed；g-preview=0.26.0-g.1、latest=0.25.3 | Base4cd5e8c源码，用户2026-11-03明确授权；7文件10测试/typecheck/tokens/consumer-boundaries重跑通过 | tarball SHA-256 80e2bc9b52e45e2d63bf61e806ec9a8e477644ffb527486f07d8f361569a009b；registry发布integrity为sha512-MHTpBR0ahsYx3bWqtmGsC1lDUkY0Hao+CDYfG9KoQcTVTfWYfZ/ZgxfE5PdfcAol9w4tTeM+Lu6VJDcRZmMgrA==；registry重装后dist/类型/CSS/公开文档逐文件匹配预验证包，差异仅发布规范化scripts元数据；类型/SSR/CSS再过。不是Nurture接入或部署通过 |
| 本轮质量/清理 | 独立全批源码复核；任务改动目录全文件、全仓精确重复/依赖名信号、样式实例键扫描 | 无新增有证据缺陷，无待清理候选 | 6436247..31c8822；组件tests/source及逐项tarball清单 | 双份LICENSE属包分发；类型包/tsc依赖为约定入口，保留。未深扫其他模板业务；任务记录、ignored内容与他人文件排除；未把未使用静态信号当作删除证据 |

## Outstanding verification
- **KIT-PACKAGE** — g.1已通过；g.2补充紧凑Menu和窄列日期修正后，须重新核对发布产物/registry安装/exports/CSS及标签。条件：本轮用户已明确批准g.2远端发布，即在Phase2执行；Owner本任务。真实消费者G-COMP仍属于The-Nurture T-122。

## Deployment changes
候选包0.26.0-g.1已发布GitHub Packages的g-preview并读回确认，latest保持0.25.3。无产品部署、schema/环境或D-019变化。发布版本不可覆盖；回退由消费者重新钉原版本及原补丁，候选标签不转为latest。
