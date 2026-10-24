# HANDOFF · ICT 教程全站重构

更新：2026-10-24（Asia/Shanghai）。本文件面向没有原始对话上下文的接续 Agent。先读本文件，再读 `TASKS.md` 与 `docs/教学标准.md`。

## 1. 项目是什么

`ict-learning` 是一个本地静态学习网站，覆盖华为 ICT 网络赛道考纲的 4 个方向、94 个章节、322 个知识点：

- 数通 44 章、DCN 11 章、安全 18 章、WLAN 21 章。
- 目标读者：完全没有网络工程基础的学生。
- 本轮工作：把原先偏技术文档的“知识手册”改写为按认知顺序展开的教程，并保留考纲范围、技术事实、交互与视觉风格。
- 站点入口：`dist/index.html`；本地服务：`python3 serve.py`（默认 8765）或任意静态服务器。
- 生成物：`dist/` 全部由 `build.py` 生成，**不要手改**。

## 2. 当前状态（务必先复核）

| 项目 | 状态 |
| --- | --- |
| 考纲章节/知识点 | 94 / 322 |
| 已合并教学数据 | 94 章 / 322 知识点 |
| 已通过校验但未合并 | 无；全部批次已冻结并合并 |
| 正在生成/待生成 | 无；36 批全部完成、冻结并合并 |
| 术语库 | 135 条（旧 35 + 新 100），236 个别名，105 条可正文标注（旧 35 + 新 70） |
| 交互 | 6 个步骤场景（journey/vrp/encapsulation/tcp/arp-local/arp-gateway）+ 1 个生成场景（switch-learning）+ 4 个可操作实验（subnet/switch/vlan/route） |
| 图文讲解 | **未完成**：只有 9/322 个知识点（5/94 章）带可视化；全部是原有资源，未新增 SVG/拓扑/时序/状态表 |
| 浏览器布局 | **未完成**：用户实际浏览器反馈布局有问题；自动化 1280/1024/768/500 截图未复现，具体页面/浏览器/视口待补 |
| 章节完成 | 浏览器 `localStorage['ict-progress-v1']` 保存已学完章节 ID；侧栏/首页显示阶段进度 |
| 构建 | 通过；322/322、94/94，无 LEGACY |
| 全量测试 | `node test-models.cjs`（4734）、`node test-teaching.cjs`（674）、`node scripts/render_check.cjs` 通过 |
| 全量审计 | 0 error / 81 warning；warning 为长单元与术语启发式 |
| 部署 | 2026-10-25 用户明确授权 Git 提交及更新网站；通过 main 推送触发 GitHub Pages，结果以 Actions 为准 |

复核命令见 `TASKS.md` 第 0 节。当前已全量合并；状态以文件与校验结果为准。

## 3. 数据流与目录

```
content/knowledge.json                 94 条考纲元数据（不要改）
content/pedagogy.json                 旧版章节导语（新数据在 teaching-chapters）
content/units-*.json                  322 条技术元数据：term/depth/sources/config/fault
content/curriculum.json               9 阶段推荐顺序
content/subskills.json                322 条考纲细则 ID
content/glossary.json                 135 条双层术语
content/visualizations.json           6 个步骤场景
content/teaching-chapters.json        新章节教学数据（合并生成）
content/teaching-units.json           新知识点教学数据（合并生成）
content/rewrite/source/batch-XX.json  每批源材料（旧稿+可视化+相邻章节）
content/rewrite/out/batch-XX.json     每批重写输出（唯一写入点）
content/rewrite/frozen/               已验收批次的冻结副本（建议使用）
content/rewrite/manifest.json         36 批清单
docs/教学标准.md                       统一教学质量标准
content/rewrite/schema.json           批次输出 schema
scripts/validate_rewrite.py           单批校验
scripts/merge_rewrite.py              批次合并（支持 --partial/--skip）
scripts/merge_glossary.py             术语库合并
scripts/audit_content.py              全局教学审计
scripts/make_batches_final.py         生成 36 批源材料（已执行）
dist/                                 构建产物
```

构建流程：

1. `build.py` 读取 `knowledge/pedagogy/units-*/curriculum/subskills`。
2. 用 `teaching-chapters.json` 覆盖章节教学字段；用 `teaching-units.json` 覆盖知识点教学字段。
3. 对已重写单元，丢弃旧 `explain/process/walkthrough`，保留 `term/depth/sources/config/commandNotes/fault`。
4. 输出 `dist/data.js`、`dist/*.json`、`dist/handbook.html`、`dist/teaching-data.js`，并给 `index.html` 的资源 URL 加内容哈希。
5. 前端 `dist/app.js` 渲染；`dist/teaching.js` 挂载交互与术语；`dist/diagrams.js` 提供四个实验模型。

## 4. 新内容 schema

章节（`teaching-chapters.json` 的 value）：

```json
{"intro":"场景/问题","why":"为什么现在学","objectives":["...","..."],
 "outcome":"能力目标","recap":"本章小结","bridge":"下一章要解决的新问题"}
```

知识点（`teaching-units.json` 的 value）：

```json
{"level":"core|advanced|detail","order":1,"goal":"本节要解决的一句话",
 "lead":"场景/矛盾","sections":[{"title":"具体问题","text":"1-3段","steps":["可选"]}],
 "check":{"question":"","answer":"","why":""},
 "example":{"title":"","setup":"","steps":["3-6步"],"conclusion":""},
 "takeaway":"一句话","boundary":"可选","visualCue":"可选"}
```

约束：`sections` 2—5 个；单节 300—700 字；一个知识点合计 600—1500 字；core 必须有 check；example 3—6 步；不要整句重复；`bridge` 指向课程顺序的下一章。

## 5. 统一规范（摘要）

完整标准在 `docs/教学标准.md`。不可妥协的几条：

### 语言

- 先场景/问题，后定义；首次出现的缩写必须解释。
- 一句话一个核心意思；一段围绕一个问题。
- 少用“具有/进行/实现/相关/上述”，不写“本节将/综上所述/值得注意的是/众所周知/赋能/使能”。
- 不机械使用“首先、其次、最后”和固定小标题。
- 通俗但不幼稚；技术边界集中写，不在每段重复“以设备为准”。

### 层次

- `core` 基础必学：零基础主线，完整解释，不依赖后文。
- `advanced` 进阶理解：条件、对比、设计取舍。
- `detail` 技术细节：报文位段、定时器、异常分支、型号差异；允许第二遍读。
- 配置命令、命令说明、故障、边界放入折叠区，不打断原理。

### 技术

- 保留旧稿技术结论、方向、条件、命令、数字；不新增未核实的命令/版本/性能数字。
- 先常见情况，再例外；不把厂商实现写成协议标准。
- 配置是学习示例，未在赛事设备实测；不得宣称实机验证。
- 交互模型只模拟明确列出的条件，边界写在场景 `boundary`。

### 视觉与交互

- 沿用现有绿色阅读风格；不引入依赖、不生图。
- 空间关系用拓扑，封装用报文结构，消息交换用时序，查表用状态表；不是每个知识点都配图。
- 图形承担关系，文字承担因果；不要文字复述图形。
- 术语首现提示只在叙事正文，跳过标题、章节导语、答案、配置、案例和组件内部。
- 进度只记录“本章已学完”，不记录时长/答题/分数。

## 6. 测试与验收

```sh
cd "/Users/qiqi2988/Desktop/HUAWEI ICT/ict-learning"
python3 build.py
python3 scripts/audit_content.py
python3 scripts/validate_glossary.py   # 注意：需用 HEAD 的 35 条基线或先恢复，详见已知问题
export PATH="/Users/qiqi2988/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin:$PATH"
node --check dist/app.js
node --check dist/teaching.js
node scripts/render_check.cjs
node test-models.cjs
node test-teaching.cjs
```

当前 `test-models.cjs` 支持 `REQUIRE_COMPLETE=0` 的临时模式：跳过“必须已重写”的断言，仅用于未全量合并时。**最终验收不得使用该变量。**

浏览器检查建议：

```sh
python3 -m http.server 8766 --bind 127.0.0.1
# 打开 http://127.0.0.1:8766/dist/index.html
```

Chrome headless 在 macOS 的窗口最小宽度约为 500px；`--window-size=390` 会按 500 布局后裁图，不能据此判断 390 溢出。用 500px 或 DevTools 设备模拟检查窄屏。

## 7. 已知问题与风险

1. **批次文件会被后写覆盖。** 生成 Agent 有时先写部分单元、后续再覆盖；batch-14 曾从 11 单元被覆盖成 4 单元，已从较早的 `teaching-units.json` 恢复。规则：校验通过后立即冻结到 `content/rewrite/frozen/`，合并只读冻结副本。
2. **Agent 结束后仍可能运行。** 已完成的子 Agent 可能继续占用并发槽或重写文件。合并前确认对应 Agent 已停止；必要时 `interrupt_agent`。
3. **`validate_glossary.py` 的基线问题。** 它把 `content/glossary.json` 当作旧 35 条基线，但该文件已被合并成 135 条；直接跑会报“alias collides with existing glossary”。复验前先 `git checkout HEAD -- content/glossary.json`（恢复 35 条），或改脚本接受 `--baseline` 参数。不要为此重写术语。
4. **部分批次偏长。** batch-13（23k 字）、batch-18（31k 字）等有 total text >2400 的 warning；不是 schema error。全量后统一判断是否需要压缩，不要为警告删技术条件。
5. **章节 bridge 已核对。** ICT-004 原写“下一章建 VLANIF”，实际下一章是链路聚合，已修正；94 条 bridge 已逐条核对。后续若改章节顺序或增删章，需要重新核对。
6. **术语覆盖警告是启发式。** `audit_content.py` 会报 “term not found” 等 warning，很多是中文同义改写或英文缩写拆分，不等于内容缺失。逐条判断。
7. **图文讲解未完成，不是设计取舍。** 只有 9/322 个知识点（5/94 章）带可视化：ICT-001.01/.02、002.01/.02/.04/.05、003.02、004.01、009.01。现有 6 个数据场景 + 1 个生成场景 + 4 个实验全部是上一轮已有资源；本轮只做了接入、定位和 visualCue，没有新增 VLAN/STP/OSPF/BGP/MPLS/IPsec/DHCP/WLAN/DCN 等关键机制的图。原要求“图文结合、可视化承担原理讲解”未达成，不能因为“不是每个知识点都要配图”就把它写成已完成。
8. **未实机验证。** 所有配置、命令、设备行为均未在赛事指定版本执行；这是内容边界，不是本轮可以补上的事实。
9. **`dist/` 是生成物。** 不要手改 `dist/app.js` 之外的构建产物后不回写源；`app.js/style.css/teaching.js/diagrams.js` 是手写源，`data.js/units.json/handbook.html` 是生成物。
10. **浏览器实际布局未验收。** 用户在实际浏览器中发现布局问题，具体页面/浏览器/视口待补；headless 截图通过不等于真实浏览器通过。不要用 `overflow:hidden` 掩盖裁切。详见 `docs/reviews/layout-issues.md` 与 TASKS U01。
11. **发布授权已更新。** 2026-10-25 用户明确要求 Git 提交并更新网站；本次通过 main 推送触发 Pages。后续发布仍以用户授权为准。

## 8. 接续顺序（推荐）

1. 只读复核：`python3 build.py`、`audit_content.py`、三项测试；确认 94/322、0 error、无 LEGACY。
2. 按 TASKS U01 复现并修复浏览器实际布局问题；先拿到用户截图/视口/浏览器信息，不要盲改 CSS。
3. 按 TASKS V01 补 12—20 个关键机制可视化（当前 9/322，是最大内容缺口）；每完成一个场景就补测试、边界和 visualCue。
4. 补完后重跑 build/audit/test-models/test-teaching/render_check，并做 1280/1024/768/500 与 125%/150% 真实浏览器检查。
5. 如用户要求赛事级验收，再做真机/模拟器命令验证、322 项来源映射、真实手机/读屏/打印检查。
6. 更新 README/PROGRESS/TASKS/HANDOFF 的覆盖率与验证数字。
7. 不部署、不 push，除非用户明确授权。

## 9. 不要重复的工作

- 不要重新生成 batch-00—batch-35 的内容（除非审计给出具体 unit 问题）。
- 不要重做术语库 135 条（除非发现明确错误）。
- 不要重做 UI 基础布局、进度机制、术语弹窗、四个实验；它们已可运行。
- 不要把“已有 9 个可视化”当成“图文讲解已完成”；V01 是独立未完成任务，不要跳过。
- 不要重新生成 36 批源材料；`content/rewrite/source/` 已稳定。
- 不要改 `knowledge.json`、`subskills.json`、`curriculum.json` 的 94/322 范围；本轮保留考纲体系。

## 10. 关键决策记录

- 教学顺序：先基础路径 → 交换 → 路由 → 园区安全/自动化 → 广域/VPN → 安全 → WLAN → DCN → 方案。章节顺序沿用 `curriculum.json`，只允许在章内调 unit `order`。
- 分层：用 `level` 标注，不隐藏 advanced/detail；配置/边界折叠，基础主线连续。
- 术语：135 条双层库；`annotate:false` 只进库不插入正文；首现提示跳过导语/标题/答案，减少打断。
- 进度：只做章节级手动完成标记，不做答题/时长/账户。
- 审计：先自动检查结构/重复/覆盖，再做领域人工抽读；不追求“每节都有图/交互”。
- 技术边界：不虚报实机验证；配置按旧稿保留，页面统一注明“尚未在赛事设备验证”。

## 11. 文件写入矩阵（防止冲突）

| 角色 | 可写 | 只读 |
| --- | --- | --- |
| 批次生成 Agent | `content/rewrite/out/batch-XX.json` | 其他全部 |
| 冻结/合并 | `content/rewrite/frozen/`、`content/teaching-*.json`、`dist/`（build） | 批次 out、源数据 |
| 内容修复 | 指定 `out/batch-XX.json` 或 `teaching-*.json` | 其他批次 |
| UI | `dist/app.js`、`dist/style.css`、`dist/teaching.js` | 内容 JSON、`diagrams.js` 模型逻辑 |
| 测试/CI | `test-*.cjs`、`scripts/*.py`、`.github/workflows/pages.yml` | 内容、UI |
| 文档 | `README.md`、`docs/PROGRESS.md`、`TASKS.md`、`HANDOFF.md` | 其他全部 |

## 12. 交付前检查清单

- [ ] `teaching-chapters.json` 94 条，`teaching-units.json` 322 条。
- [ ] `build.py` 输出 322/322、94/94，无 LEGACY。
- [ ] `audit_content.py` 0 error；warning 已记录并判断。
- [ ] `node test-models.cjs`、`node test-teaching.cjs`、`node scripts/render_check.cjs` 全 PASS（不带 `REQUIRE_COMPLETE=0`）。
- [ ] 首页/章节/目录/参考资料/术语/进度/四个实验/步骤场景可用。
- [ ] U01 真实浏览器布局修复：1280/1024/768/500 与 125%/150% 缩放下无重叠、裁切、错位。
- [ ] V01 关键机制可视化完成；可视化覆盖不再停留在 9/322。
- [ ] 94 条 bridge 与下一章匹配。
- [ ] README/PROGRESS/HANDOFF 数字一致。
- [ ] 未部署、未推送；配置未实机验证的声明仍在。
