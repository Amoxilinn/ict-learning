# V01 扩展契约 · 关键机制可视化（只读调研结论）

> 调研日期 2026-10-25。面向无上下文的编写 Agent：照本文步骤可直接新增场景。
> 所有结论均给 `文件:行号` 证据。行号以当前工作树为准。

## 0. TL;DR（先读这 8 行）

1. **绑定在场景侧**：`visualizations.json` 每个场景写 `"unit": "ICT-xxx.yy"`，渲染器按 unit 挂到知识点页；unit 数据里**没有**引用场景 id 的字段（`dist/teaching.js:65` `forUnit`）。
2. `teaching-units.json` 的 `visualCue` 只是组件上方的一句"看什么"提示文案，由 `dist/app.js:67` 读取；它不引用场景 id，但**必须加在场景 `unit` 同一知识点**上，否则不显示（app.js:67 仅在 teach 非空时渲染）。
3. 加**同类型**新场景（复用 拓扑/时序/状态表/扁平报文）→ **完全不用改 teaching.js**，只改数据。
4. 两颗测试地雷必须先知道：`test-teaching.cjs:40` 禁止非 ICT-002 场景用 `richSequence/prediction/packet`；`test-models.cjs:44` 断言 ICT-004 页面**不得**出现 data-teach。V01 新场景一律用"普通型"组件即可绕开前者；后者在加第一个 ICT-004 场景时必须改断言。
5. visualCue 要写进 `content/rewrite/out/batch-XX.json`，经 `validate_rewrite.py → freeze_batch.py → merge_rewrite.py` 回到 `teaching-units.json`（merge 全量重写该文件，直接改 teaching-units.json 会被覆盖）。
6. 数据改完必须 `python3 build.py`：它把 visualizations.json 打包成 `dist/teaching-data.js`（无文件名哈希，index.html 里以 `?v=sha256[:12]` 查询串刷新，build.py:226-229）。**不要手改 dist/ 下任何生成文件**。
7. 每个场景必须有：≥2 步、每步有 `text` 和 `rows`（行宽=columns 宽）、`boundary`>30 字、`sources`≥1 条 `["标题","https://…"]`（渲染器无条件 map sources，缺了浏览器直接抛错，teaching.js:73）。
8. 现网"9/322"= 6 数据场景 + 1 生成场景（switch-learning）+ 4 实验，覆盖知识点 ICT-001.01/.02、002.01/.02/.04/.05、003.02、004.01、009.01（HANDOFF.md:158）。

## 1. 场景→知识点绑定机制（两条通道）

**通道 A · 步骤场景（data-teach）**
- 数据源 `content/visualizations.json` → build.py:112-123 生成 `dist/teaching-data.js`（`window.ICT_TEACHING_DATA={scenarios,glossary}`）。
- 第 7 个场景 `switch-learning` 不在 JSON 里，由 `dist/teaching.js:55-63` 纯函数生成，:64 `scenarios()` 合并两路数据（新场景**不必**模仿这种生成方式）。
- 挂接：`forUnit(unitId)`（teaching.js:65）按 `s.unit===unitId` 过滤，同 `variant` 只保留第一个；输出 `<div class="teach-host" data-teach="场景id">`。
- 渲染位置：`unitSection`（app.js:57-69）把场景插在"第一个带 steps 的分节"之后，没有则第 2 节之后（app.js:62-63）；先渲染 `<p class="visual-cue">{{visualCue}}</p>` 再放组件（app.js:67）。
- 挂载与事件：`render()` 调 `ICTTeaching.mount($('#main'))`（app.js:91）。

**通道 B · 可操作实验（inline-diagram，diagrams.js）**
- 挂接表硬编码在 `dist/app.js:55` `unitDiagrams`（现仅 ICT-002.05/004.01/003.02/009.01 四个），与 visualizations.json 无关。V01 优先清单第 1 项的"实验加状态快照"走这条通道（见 §4）。

**visualCue 流水线**（谁读、谁校验、谁生成）：
- 写：`content/rewrite/out/batch-XX.json` → `scripts/validate_rewrite.py:115` 查长度 10–180（批次 schema `content/rewrite/schema.json` 写 10–160，**按 ≤160 写两头都过**）→ `scripts/freeze_batch.py`（校验+拷贝到 frozen/+记 sha256）→ `scripts/merge_rewrite.py` 全量重写 `content/teaching-units.json`。
- build.py:69-75 把它并入 `dist/units.json`；app.js:67 渲染。
- 反查方向：`validate_rewrite.py:117-118` 用 **source 批次** 的 `src_unit.visuals`（make_batches 时从 visualizations.json 快照进 source，scripts/make_batches.py:12,57）做两条**警告**（非 error）："有 visuals 无 visualCue"、"有 visualCue 无 source visual"。现网就有一条存量警告：`ICT-003.01: visualCue without a source visual`——cue 挂在了 ICT-003.01，而场景 unit 是 ICT-003.02，所以 cue 实际从不渲染（app.js:67）。**教训：visualCue 与场景 unit 必须同知识点。**
- `scripts/audit_content.py` 全文不检查 visualCue/visuals（:9-101），不参与本链路。

**结论：新场景挂到知识点 = ① visualizations.json 写 unit 字段（渲染即生效，不必动批次）；② visualCue 文案要动 out/batch-XX.json + validate + freeze + merge。** 只加场景不加 visualCue，功能完整，只是 validate 多一条警告（:117 方向）。

## 2. 场景数据 schema（含最小示例）

场景对象公共必填：`id`（全局唯一 kebab-case，test-teaching.cjs:8；现存风格 `journey/vrp/encapsulation/tcp/arp-local/arp-gateway`）、`unit`（存在于 322 知识点，build.py:116、test:10）、`title`、`summary`、`columns`（状态表列名，2–3 列；即使 hideTable 也必须给，test:13 直接取 `s.columns.length`）、`steps[]`、`boundary`（>30 字）、`sources`（≥1 条 `[标题, https URL]`）。
可选：`variant`+`label`（同 variant 渲染下拉切换，teaching.js:69/73）、`hideTable`、`prevLabel`、`nodes`+`links`、`actors`、`richSequence`+`events`、`stateKind:'tcp'`。
每步公共必填：`title`、`text`（build.py:119 断言非空）、`rows`（每行长度=columns，build.py:119/test:13；无表项也要写 `[]`）。
每步可选：`active:[[节点id,节点id]]`（高亮连线，必须命中已声明 links，test:14）、`message:[fromIdx,toIdx,"标签"]`（普通时序）、`next:N`（跳转索引，teaching.js:30）、`terminal:true`+`endLabel`、`nextLabel`。
拓扑约束：viewBox 固定 640×160（teaching.js:7），节点框 102×46 以 (x,y) 为中心；x 建议 80–560、y 35–135、水平间距 ≥110，标签短（≤7 汉字）。

### 类型 A · 拓扑+状态表（journey 型；switch-learning 也是这型）
```jsonc
{ "id":"stp-roles", "unit":"ICT-007.01",
  "title":"…", "summary":"…",                       // 必填
  "nodes":[["a","SW-A",80,40],["sw","SW-C",320,110]], // 必填，[id,label,x,y]
  "links":[["a","sw"]],                               // 必填
  "columns":["设备/端口","角色"],                     // 必填
  "steps":[
    { "title":"…","text":"…","rows":[["SW-A","指定桥"]],          // rows 必填,宽=columns
      "active":[["a","sw"]] },                                    // active 可选
    { "title":"…","text":"…","rows":[],"terminal":true,"endLabel":"观察结束" } ], // 末步
  "boundary":"…(>30字)", "sources":[["RFC …","https://…"]] }       // 均必填
```
（裁剪自 visualizations.json:3-135）

### 类型 B · 纯步骤状态表（vrp 型，无拓扑无时序）
去掉 A 的 `nodes/links/active` 即是 vrp：`visualizations.json:136-228`。适合"查表/比较/视图"类（如 BGP 选路表）。

### 类型 C · 普通时序（actors + step.message；现有 JSON 场景无一使用，契约在 teaching.js:50、docs/教学可视化组件体系.md:29、test:15）
```jsonc
{ "id":"dhcp-dora", "unit":"ICT-002.09", "title":"…","summary":"…",
  "actors":["客户端","DHCP中继","DHCP服务器"],         // 必填，索引即 message 的 from/to
  "columns":["端点","租约状态"],
  "steps":[
    { "title":"…","text":"…","rows":[["客户端","无租约"]],
      "message":[0,2,"DHCP Discover（广播）"] },        // [from,to,label]，按步骤顺序累计显示
    { "title":"…","text":"…","rows":[],"terminal":true,"endLabel":"观察结束" } ],
  "boundary":"…","sources":[["RFC 2131","https://…"]] }
```
注意：普通时序按**步骤数组顺序**累计消息（teaching.js:50 `steps.slice(0,index+1)`），不要配 `actions` 分支；消息方向用 from>to 表示反向（CSS .reverse）。`message[0]!==message[1]` 且索引须在 actors 内（test:15）。

### 类型 D · 富时序 richSequence（tcp/arp 型；**仅限 ICT-002**，test-teaching.cjs:40）
在 C 基础上加：场景级 `richSequence:true`、`events:[{id,from,to:[…],short,label,broadcast?}]`；每步加 `event:{id,phase:"sent"|"received"|"lost"}`、`actorStates:[每 actor 一状态]`（长度=actors，test:46）、可选 `also:[{id,phase}]`、`prediction:{prompt,choices:[{label}],answers:{"目标步索引":{correct:索引,reason:≥20字}}}`（answers 键必须是该步可达目标，test:51）、`actions:[{label,target,kind:"deliver"|"drop"}]`（分支，test:47）。tcp 另有 `stateKind:'tcp'`（用 rows[1] 当状态并套 tcpStateLabels，teaching.js:20/40——**其它协议不要用它**）。
V01 新协议时序**建议用 C 不用 D**；确需 D 时必须同步改写 test-teaching.cjs:40 并补 §5 的富时序断言。

### 类型 E · 扁平报文结构（`step.fields`，teaching.js:73 `step.fields?packet(step.fields)`）
步骤里加 `"fields":[["目的 MAC · 6B","…"],["源 MAC · 6B","…"]]`，每字段渲染成可展开 details（teaching.js:18）。可与类型 A/C 组合（拓扑/时序与报文同屏）。MPLS 标签 Push/Swap/Pop、NAT 字段改写用这个。

### 类型 F · 嵌套报文树（`step.packet`；**仅限 ICT-002**，test:40）
`packet:{kind,label,header:[[字段,说明]],payload:{上一层完整树},trailer:[[字段,说明]]}`，见 encapsulation（visualizations.json:248-402）。要求内层树逐层原样嵌套（test:84）。非 ICT-002 需要"封装感"时用 E 近似。

## 3. 新增一个场景的最短路径（照做清单）

0. 查 §7 映射表定 `unit` 与所属 `batch-XX`。
1. `content/visualizations.json` 追加场景（§2 对应骨架）。自检：id 唯一；unit 存在；每步有 text+rows；rows 宽=columns；≥2 步；boundary>30；sources≥1。
2. （可选）variant 组：同 variant、不同 id、各带 label。
3. `content/rewrite/out/batch-XX.json`：给**同 unit** 条目加 `"visualCue":"看下面的…：先看…，再看…"`（10–160 字，写"看什么/为什么变"，不复述图形）。
4. （消除警告）`content/rewrite/source/batch-XX.json` 对应 unit 的 `visuals` 数组追加 `{"id","title","summary","boundary"}`（source 无校验和，可安全补写；validate_rewrite.py:117）。
5. `python3 scripts/validate_rewrite.py batch-XX` → 必须 PASS 且无 visual 警告。
6. `python3 scripts/freeze_batch.py batch-XX` → `python3 scripts/merge_rewrite.py --frozen`（裸跑会重验 out，等价；merge 全量重写 content/teaching-units|chapters.json，merge_rewrite.py:46-48）。
7. `python3 build.py`（重生成 teaching-data.js/units.json/handbook 并刷新 index.html 哈希）。
8. `test-teaching.cjs` 增断言（§5 清单）；若场景落在 ICT-004，改 `test-models.cjs:44` 的 rollout 边界断言（可把 :43 正向清单扩成预期集合）。
9. 全量验证：`node test-teaching.cjs && node test-models.cjs && node scripts/render_check.cjs && python3 scripts/audit_content.py && python3 scripts/validate_rewrite.py`。
10. 浏览器抽查（`python3 serve.py`）：1280px 与 500px 内组件内滚动、键盘走一遍（原生 button/select/radio，focus 环 style.css:1；aria-live teaching.js:73）、术语标注不进组件（teaching.js:95 skip `.teach-host`/`.unit-visual`）、"减少动态效果"下动画停用（style.css:28）。

**是否要改 teaching.js？** 同类型新主题：不用。需要全新视觉（如环形图/树状图）时的最小扩展：仿 `topology`/`packet` 写一个无状态函数（teaching.js:7-19 风格，自带 esc()），在 draw 的 teach-visual 槽位加一个条件分支（teaching.js:73），补 style.css `.teach-*` 规则并沿用 :113-116 的 min-width/overflow 约定；场景数据加新字段名触发。状态表+时序、状态表+报文**不需要**新类型——C/E 与 rows/columns 天然同屏（hideTable 不加即可）。

## 4. diagrams.js 实验模型

- 导出：`window.ICTModels={ipNum,numIP,calcSubnet,vlanSim,selectRoute}`（diagrams.js:25），DOM 绑定与模型分离，test-models 直接在 vm 里调纯函数。
- `calcSubnet(ip:string,p:number)` → `{ip,p,mask,net,last,size,usable,first,end}`（数值），非法输入 throw Error（:4）。
- `vlanSim(a,p1,l1,p2,l2,b)` → `{log:string[4],ok:boolean,msg:string}`，完全无状态；log 固定①②③④步（:12）。
- `selectRoute(dst:string,rows[])` → `{match,best,ambiguous?}`，最长前缀→优先级→cost（:16）。
- `forwarding(table,src,dst)` 在 teaching.js:54 → `{table,out,kind}`（被 test-teaching:27-34 测）。switch 实验 `frame()` 是可变全局 `sw`（diagrams.js:6-10），test-models:15 用假 DOM 驱动。
- 测试入口：test-models.cjs:7-15 断言模型行为，:11 六个 vlanSim 用例只取 `.ok`。
- **V01 项 1"VLAN 实验加状态快照"改动面评估：小。** ① `vlanSim` 返回值**新增** `states:[[位置,端口,是否带标签,VLAN],…]`（4 条，对应①②③④；被丢弃时只给到丢弃点）——只加字段不改 log/ok/msg，:11 的既有用例不破。② `vlanHTML`（:11）在 log 下加 `<div class="table-wrap">` 快照表容器；③ `doVLAN`（:13）渲染 states（复用 `.teach-table` 样式即可）；④ test-models.cjs 增断言：tagged 用例 `states[1][2]===true`、PVID 相等用例 `states[1][2]===false`、SW1 阻断用例 `states.length===2` 等。不动 app.js/teaching.js。

## 5. 测试契约

现有自动断言（对新场景**免费生效**，来自 test-teaching.cjs:9-18 全场景循环）：unit 存在于 dist/units.json；`steps.length>1` 且 `boundary.length>30`；每步 rows 宽=columns 且 `stateTable` 渲染无 "undefined"；`step.active` 命中 links；`step.message` 索引合法。富时序循环（:41-58）自动查 recipients/phases/actorStates 长度/branch 可达/prediction 答案可达性与可跳过。

**新增场景需手写的断言（对齐 tcp/arp/vrp 标准）：**
1. 教学时点快照：`ok(scene('id').steps[k].rows…,'teaching point')` 1–3 条（仿 :21-26,36-37）。
2. 若用 C 型时序：发送步不改变接收方 rows（仿 :73-76"发送不改对端、到达才改"）。
3. 建议给全场景循环补一条 sources 规则（现缺）：`ok(s.sources.length>0&&s.sources.every(([t,u])=>/^https:\/\//.test(u)),'every scenario cites a source')`。
4. 生成快照形状类（如 VLAN states）写进 test-models.cjs。

**必须同步修改的既有断言：** `test-models.cjs:44`（ICT-004 不得出现 data-teach——加第一个 ICT-004 场景即破）；如越出 ICT-002 用富交互：`test-teaching.cjs:40`。asset 哈希断言（test-teaching:91-92、test-models:69-72）在跑过 build.py 后自动满足。render_check 只要求 `lessonPage` 输出无 `undefined`/`[object Object]`（render_check.cjs:14）——新场景字段缺失（如漏 sources）在 mount 才抛错，render_check **测不到**，以浏览器控制台为准。

## 6. 构建与校验联动

- build.py：visualizations.json→`dist/teaching-data.js`（:112-123，**不加文件名哈希**；index.html 以 `?v=` 查询串打 sha256[:12]，:226-229，asset 清单含 teaching-data.js/teaching.js）；顺带断言 `scene.unit` 存在、steps/boundary 非空、rows 宽=columns（:115-119）。teaching-units.json→`dist/units.json`（含 visualCue，:126-127）+ handbook.html（手册不渲染场景与 visualCue）。
- audit_content.py：**与 visual 无关**，只查 94/322 覆盖、禁词、重复句、案例重复等（全文 :9-101）——visualCue 文案若与别处句子重复 ≥18 字会被"repeated sentence"抓（:37-39）。
- validate_rewrite.py：visualCue 长度（:115）、visuals↔visualCue 双向警告（:117-118，从 **source** 侧 visuals 检查 out 侧 cue）。
- freeze_batch.py：复用 validate 后拷贝+sha256 记录；merge_rewrite.py：按 manifest 全量重建 content/teaching-*.json，unit 重复即退出。

## 7. 陷阱清单（写新场景前必读）

1. **字段全英文**，无中文字段；值里中文随意（esc 已处理 `&<>"'`，teaching.js:4）。
2. `rows` 是**完整快照**不是增量；退步/重置依赖快照（docs/教学可视化组件体系.md:36）。每步都要有 `rows`（哪怕 `[]`），行宽恒等于 columns。
3. 无表也要给 `columns` 和两列示例；`hideTable:true` 只是不渲染，test:13 仍要求列宽。
4. `active`/`links`/`events.from,to`/`message` 的节点 id 与 actor 索引极易写错——test:14/15/43/46 全覆盖，跑一遍即抓。
5. `actions` 分支只允许出现在 richSequence 场景（且仅 ICT-002）；普通场景写了 `next` 之外没有分支能力，`actions` 里 `target` 必须是合法索引（teaching.js:29）。
6. 时序"在途不改进程"是本库的核心教学不变量：发送步与到达步分开写，rows/actorStates 在到达步才变（test:73-79 精神），C 型场景也要遵守。
7. boundary 写"假设/未模拟什么"（仿 journey :128、arp :861）；sources 惯例 `["RFC 9293 §3.5 · 连接建立","https://…"]` 或 `["华为 · 保存配置文件","hedex 链接"]`，只放 https。
8. **窄屏**：拓扑固定 viewBox 640×160、`.teach-visual{overflow-x:auto}`、≤520px 时 `min-width:500px`（style.css:22,114,116）——不要指望拓扑自适应重排；表格外层 `.table-wrap` 已内滚（style.css:1,20）。节点标签、rows 单元格文字过长会破相。
9. 键盘/无障碍是现成的：原生控件 + focus 环（style.css:1）+ `aria-live`（teaching.js:73）+ reduced-motion 关闭流动动画（style.css:28）；**不要**在数据里塞 HTML/`<button>` 等，会被 esc() 转义成字面量。
10. 术语提示已自动跳过组件与 visualCue（teaching.js:95）；正文写"看什么/为什么变化"的任务在 visualCue 和各步 `text`，boundary 不在正文重复（docs/教学可视化组件体系.md:73,76）。
11. 不要手改 `dist/teaching-data.js`、`dist/units.json`、index.html 哈希；不要生成图片、不加运行时依赖（TASKS.md:264）。
12. variant 场景共用 `variant` 值 + 唯一 `id` + 各自 `label`；同 unit 多个非 variant 场景会全部渲染（合法，但慎用）。
13. 改批次后必须 freeze+merge 再 build，否则 teaching-units.json 与 out/ 漂移；merge 是**全量重写**，别在 teaching-units.json 直接编辑。

## 8. V01 主题 → 场景类型 → unit → 批次 映射（建议 15 个）

| # | 主题 | 类型/组件 | unit | batch | 方向 |
|---|---|---|---|---|---|
| 1 | VLAN/Trunk/PVID 帧路径+标签状态表 | A 拓扑+状态表（另做 §4 实验快照） | ICT-004.01 | batch-02 | 数通 |
| 2 | STP 三角拓扑+根桥/端口角色 | A 拓扑+状态表 | ICT-007.01 | batch-02 | 数通 |
| 3 | OSPF 邻居状态+LSDB/SPF | C 时序+状态表 | ICT-010.01 | batch-03 | 数通 |
| 4 | BGP 路径属性比较+选路 | B 纯状态表 | ICT-013.01 | batch-04 | 数通 |
| 5 | MPLS Push/Swap/Pop | A 拓扑 + E 扁平报文 | ICT-026.01 | batch-09 | 数通/DCN |
| 6 | IPsec/IKE 两阶段+SA 选择器 | C 时序+状态表 | ICT-062.01 | batch-15 | 安全 |
| 7 | NAT 地址/端口改写字段表 | A/C + E 扁平报文 | ICT-058.02 | batch-14 | 安全 |
| 8 | DHCP DORA+租约 | C 时序+状态表 | ICT-002.09 | batch-01 | 数通 |
| 9 | 802.1X 接入认证（RADIUS） | C 时序+状态表 | ICT-036.01 | batch-07 | 安全/WLAN |
| 10 | CAPWAP 隧道建立/注册 | C 时序+状态表 | ICT-074.01 | batch-18 | WLAN |
| 11 | WLAN AC 旁/旁挂漫游 | A 拓扑 + C 时序 | ICT-081.01 | batch-20 | WLAN |
| 12 | VXLAN 封装（外 UDP 4789） | E 扁平报文（可叠 A） | ICT-030.01 | batch-10 | DCN |
| 13 | EVPN Type-2/5 控制面 | C 时序+状态表 | ICT-031.01 | batch-11 | DCN |
| 14 | M-LAG 双归+故障切换 | A 拓扑+状态表 | ICT-045.01 | batch-28 | DCN |
| 15 | 云上 VPC 实例→出口路径 | A 拓扑（journey 风格） | ICT-073.01 | batch-35 | 安全/云 |

覆盖 数通/安全/WLAN/DCN 四方向；unit 均已核实在 322 清单内，批次归属核自 content/rewrite/manifest.json。全部用普通型组件即可，唯一必改的既有测试是 test-models.cjs:44。

## 9. 证据索引（速查）

场景样例：visualizations.json journey :3 / vrp :136 / encapsulation :229 / tcp :418 / arp-local :667 / arp-gateway :901。
渲染器：teaching.js topology :7、packet :12、sequence :37（富 :38-48，普通 :50）、stateTable :52、生成场景 :55-63、scenarios :64、forUnit :65、mount/draw :66-84（sources 渲染 :73）、annotate skip 清单 :95。
挂接：app.js unitDiagrams :55、unitSection 视觉槽 :62-67、loadDiagram :90、mount/annotate 调用 :91。
构建：build.py :112-123、:126-127、:215（手册 refs）、:226-230。
测试：test-teaching.cjs :8-18/:40/:41-58/:87-92；test-models.cjs :7-15/:43-44/:69-72；render_check.cjs :12-19。
批次链：validate_rewrite.py :71/:107-118、schema.json、freeze_batch.py 全文、merge_rewrite.py :24-48、make_batches.py :12/:57。
规范：TASKS.md :228-266；docs/教学可视化组件体系.md :25-36/:73-78；HANDOFF.md :158。
样式：style.css :1（focus/table-wrap）、:22/:114/:116（内滚与 500px）、:28（reduced-motion）、:75-77（unit-visual/visual-cue）。
