# TASKS · ICT 教程全站重构

更新：2026-10-24（Asia/Shanghai）。本文件把剩余工作拆成可独立执行的小任务。**任何 Agent 开始前先读 `HANDOFF.md` 与 `docs/教学标准.md`，再读本文件。**

## 0. 当前快照（执行前先复核）

截至本文件生成时：

- 考纲章节：94；知识点：322。
- 已合并教学数据：94 章 / 322 个知识点。
- 已冻结并合并：全部 batch-00—batch-35（其中 15 个批次因 V01 visualCue 于 2026-10-25 重新冻结）。
- 术语库：135 条；交互：**21 个数据场景 + 1 个生成场景 + 4 个可操作实验**；带可视化知识点 **23/322（18/94 章）**，覆盖数通/安全/WLAN/DCN 四方向。V01 已完成（2026-10-25），见 `docs/reviews/audit-content.md`。
- **浏览器实际布局：未完成。** 用户在实际浏览器反馈布局有问题，具体页面/浏览器/视口待补；自动化截图未复现。U01 未开始。详见 `docs/reviews/layout-issues.md`。
- 构建通过：322/322、94/94，无 LEGACY；`node test-models.cjs`（**4746**）、`node test-teaching.cjs`（**1002**）、`node scripts/render_check.cjs` 通过；`audit_content.py` 0 error / 81 warning。

复核命令（只读）：

```sh
cd "/Users/qiqi2988/Desktop/HUAWEI ICT/ict-learning"
python3 - <<'PY'
import json, pathlib
m=json.load(open('content/rewrite/manifest.json'))
out={p.stem for p in pathlib.Path('content/rewrite/out').glob('batch-*.json')}
u=json.load(open('content/teaching-units.json')); c=json.load(open('content/teaching-chapters.json'))
print('merged',len(c),'ch',len(u),'u')
for x in m:
    p=pathlib.Path('content/rewrite/out')/f"{x['batch']}.json"
    print(x['batch'], 'OUT' if p.exists() else 'MISSING', x['chapters'])
PY
```

> 状态会变化。不要凭本文的“正在生成”判断；以文件是否存在、是否通过校验为准。不要重复已合并的批次。

## 1. 硬性协调规则

1. **一个文件同一时间只能有一个写入者。** 生成批次只写 `content/rewrite/out/batch-XX.json`；合并任务只写 `content/teaching-*.json`；UI 任务只写 `dist/app.js`、`dist/style.css`、`dist/teaching.js`；测试任务只写 `test-*.cjs` / `scripts/*.py` / CI；文档任务只写 README/PROGRESS/TASKS/HANDOFF。
2. **生成批次不得运行 `build.py`，不得改 `dist/`**，避免并行构建互相覆盖。
3. **合并前先冻结**：已通过校验的批次复制到 `content/rewrite/frozen/`，并记录 SHA-256。合并只从冻结副本读取；这样即使原 Agent 后续覆盖 `out/`，内容也不会丢。
4. **每次只推进一个依赖层**：内容批次 → 冻结 → 合并 → 全局审计 → 修复 → 测试 → 浏览器验收。不要在 322 项未齐时反复改 UI。
5. **不要重写已完成的 64 章内容来“统一文风”**，除非审计或技术复核给出具体问题。大范围重写会制造新的不一致。
6. 所有配置仍是学习示例，未在赛事设备实测；不要在文档或页面中声称“已实机验证”。

## 2. 任务总表

| ID | 任务 | 写入文件 | 依赖 | 可并行 |
| --- | --- | --- | --- | --- |
| C01 | 复核并冻结 batch-18 | 已完成 | — | — |
| C02 | 复核并冻结 batch-20 | 已完成 | — | — |
| C03 | 复核并冻结 batch-26 | 已完成 | — | — |
| C04 | 生成 batch-25（已完成并冻结） | 已完成 | — | — |
| C05 | 生成 batch-27（已完成并冻结） | 已完成 | — | — |
| C06 | 生成 batch-28（已完成并冻结） | 已完成 | — | — |
| C07 | 生成 batch-29（已完成并冻结） | 已完成 | — | — |
| C08 | 生成 batch-30（已完成并冻结） | 已完成 | — | — |
| C09 | 生成 batch-31（已完成并冻结） | 已完成 | — | — |
| C10 | 生成 batch-32（已完成并冻结） | 已完成 | — | — |
| C11 | 生成 batch-33（已完成并冻结） | 已完成 | — | — |
| C12 | 生成 batch-34（已完成并冻结） | 已完成 | — | — |
| C13 | 生成 batch-35（已完成并冻结） | 已完成 | — | — |
| M01 | 合并已冻结批次 | `content/teaching-*.json`、`dist/` | C01—C03 | 否 |
| M02 | 全量合并（已完成） | 同上 | C04—C13、M01 | — |
| Q01 | 全局内容审计与去重清单（已完成） | `docs/reviews/audit-content.md` | M02 | — |
| Q02 | 技术/教学复核（已完成，抽读范围） | `docs/reviews/domain-review.md` | M02 | — |
| Q03 | 按审计清单修复内容（已完成 8 项） | 对应 `out/batch-XX.json` 或 `teaching-*.json` | Q01/Q02 | 否（单写者） |
| Q04 | 基础 UI/交互验收（已完成，抽查范围；图文覆盖见 V01，布局问题见 U01） | `dist/app.js`、`style.css`、`teaching.js` | M02 | — |
| Q05 | 测试与 CI 收口（已完成） | `test-*.cjs`、`scripts/*.py`、CI | M02 | — |
| Q06 | 文档与最终交付（已完成） | README、PROGRESS、TASKS、HANDOFF | Q01—Q05 | — |
| V01 | 补关键机制可视化（**已完成 2026-10-25**：+15 场景，9/322→23/322，四方向） | `content/visualizations.json`、`dist/diagrams.js`、`out/source/batch-*.json`（cue/visuals）、`content/teaching-*.json`、`test-*.cjs`、`scripts/validate_v01_drafts.cjs`、`scripts/merge_v01.py` | M02 | — |
| U01 | 修复浏览器实际布局问题（未开始） | `dist/style.css`、`dist/app.js`、`dist/index.html` | M02 | 否（单写者） |

## 3. 内容批次任务模板（C04—C13 通用）

### 目标

把指定批次从技术文档式旧稿改写为零基础教程，严格按 `docs/教学标准.md` 和 `content/rewrite/schema.json`，输出到 `content/rewrite/out/<batch>.json`。

### 输入

- `content/rewrite/source/<batch>.json`：章节与知识点旧稿、命令、来源、可视化。
- `docs/教学标准.md`、`content/rewrite/schema.json`、`content/rewrite/examples/example.json`。
- 不要读别人的 out 文件来“参考文风”；黄金样本已经足够。

### 必做步骤

1. 读源文件，列出每个知识点的主问题与前置概念。
2. 按依赖为每章设置 `order`；core/advanced/detail 分层；core 尽量 ≥50%。
3. 写章节六字段：`intro/why/objectives/outcome/recap/bridge`。`bridge` 必须指向课程顺序的**下一章**（源文件有 `next_chapter`/`next_title`），不要把本章后面的知识点当下一章。
4. 写每个知识点：`level/order/goal/lead/sections/check/example/takeaway`，可选 `boundary/visualCue`。
5. 保留旧稿全部技术结论、方向、条件、命令和数字；不新增未核实的命令、版本、性能数字。
6. 运行校验并修到 PASS：

```sh
cd "/Users/qiqi2988/Desktop/HUAWEI ICT/ict-learning"
python3 scripts/validate_rewrite.py <batch>
```

### 验收标准

- 校验输出 `PASS`，0 error；warning 需逐条判断，不能有缺章/缺知识点。
- 覆盖源文件中的全部 chapter ID 和 unit ID，数量一致。
- 每个 core 有 `check`；每个 unit 有 3 步以上 `example`。
- 任意两个 unit 没有整句重复；`example` 没有复述正文整句。
- 有 `visuals` 的 unit 写了 `visualCue`。
- 技术事实与源稿一致；不确定处用“通常/取决于实现”，并保留原 `sources`。

### 禁止

- 运行 `build.py`、改 `dist/`、改 `content/teaching-*.json`、改术语库、改其他批次。
- 用同一个模板标题套所有节；用“本节将/综上所述/值得注意的是”。
- 为了让校验通过而删掉技术条件或案例。

### 批次清单

| 批次 | 章节 | 单元数 | 主题 |
| --- | --- | --- | --- |
| batch-25 | ICT-090—093 | 11 | 大型 WLAN、云管理、传统运维、智能运维 |
| batch-27 | ICT-046—047 | 8 | 虚拟化、存储、OpenStack、容器 |
| batch-28 | ICT-045 | 7 | M-LAG、VXLAN、EVPN、微分段、业务链 |
| batch-29 | ICT-048、054 | 12 | 智能无损、高性能计算、DC 规划 |
| batch-30 | ICT-049—050 | 9 | 机架出租、计算联动、云网一体化、容器网络 |
| batch-31 | ICT-051—053、055 | 10 | 多云多 DC、超简网络、存储网络、DC 运维 |
| batch-32 | ICT-042—043 | 11 | CloudCampus、SD-WAN 方案 |
| batch-33 | ICT-044、066 | 7 | CloudWAN、云 DC 安全 |
| batch-34 | ICT-067、071—072 | 9 | 华为云安全、园区/DC 安全方案 |
| batch-35 | ICT-073 | 4 | 云网络安全方案 |

## 4. 冻结与合并任务

### C01—C03 · 冻结已完成批次

**目标**：防止生成 Agent 后续覆盖已通过校验的 `out/batch-18/20/26.json`。

**步骤**：

1. 运行 `python3 scripts/validate_rewrite.py batch-18 batch-20 batch-26`，必须全部 PASS。
2. 创建 `content/rewrite/frozen/`，复制三份文件；生成 `content/rewrite/frozen/checksums.json`：
   ```json
   {"batch-18":"<sha256>","batch-20":"<sha256>","batch-26":"<sha256>"}
   ```
3. 只读核对：每份 frozen 文件的 chapter/unit 数与源文件一致。

**写入**：`content/rewrite/frozen/*`。**不得**改 `out/`、`teaching-*.json`、`dist/`。

### M01 · 合并已冻结批次

**目标**：把 18/20/26 并入现有 64 章/204 单元，得到 71 章/234 单元。

**依赖**：C01—C03。

**步骤**：

1. 修改/使用 `scripts/merge_rewrite.py` 的 `--frozen` 模式，优先读 `frozen/`，没有则读 `out/`。
2. `python3 scripts/merge_rewrite.py --partial --frozen`；确认输出 `Merged 71/94 chapters, 234/322 units` 左右。
3. `python3 build.py`；确认无 `LEGACY` 行（针对已合并部分之外会提示剩余，不必为零）。
4. `python3 scripts/audit_content.py`：只允许报“缺少未完成批次”的两条 error；不得有重复句、缺 check 等新 error。

**写入**：`content/teaching-chapters.json`、`content/teaching-units.json`、`dist/`（由 build 生成）。**此任务期间不要跑其他 build。**

### M02 · 全量合并

**依赖**：所有 C 任务完成；C 任务全部 PASS 并冻结。

**步骤**：

1. `python3 scripts/merge_rewrite.py`（无 `--partial`）。必须输出 94/94、322/322。
2. `python3 build.py`。输出不得含 `LEGACY` 行。
3. `python3 scripts/audit_content.py`。目标 0 error；warning 记录到 `docs/reviews/audit-content.md`。
4. 运行 `node scripts/render_check.cjs`，必须 PASS。

**验收**：94 章、322 单元、无重复句、无缺 check、无缺案例、章节目标齐全。

## 5. 审计与修复任务

### Q01 · 全局内容审计

**写入**：`docs/reviews/audit-content.md`（只读内容，不改正文）。

**步骤**：

1. 运行 `python3 scripts/audit_content.py`，保存完整输出。
2. 分类列出：
   - 重复句/近重复段（unit 对 unit、chapter 对 unit）。
   - 缺 check 的 core、缺 example、缺 takeaway、章节缺 objectives/why/recap/bridge。
   - 过长句（>110 字）、过长段（>300 字）、模板标题。
   - 章节 bridge 与下一章不匹配（人工核对 94 行）。
3. 按“必须先修/可后修/可接受”分级，给出 unit ID 和最小修法。

**验收**：每个问题都有 ID、位置、原因、建议；不直接改内容。

### Q02 · 技术/教学复核（拆 4 份）

**写入**：`docs/reviews/domain-<name>.md`。只读，不改正文。

- Q02a：数通基础/交换/路由（001—023）。
- Q02b：园区安全/自动化/广域/VPN（024—041、056—073）。
- Q02c：WLAN（074—094）。
- Q02d：DCN/方案（042—055、042/043/066/067/071/072/073）。

每份抽取 6—8 个 unit，逐项核对：方向、层次、条件、顺序、数字、命令前提、章节衔接、术语首现。只报“确认错误/高风险疑点”，不要泛泛评价文风。

### Q03 · 修复

**依赖**：Q01/Q02。**单写者**：一次只改一个批次或一个 unit 组。

**规则**：

- 优先修技术错误和前置关系；再修重复；最后润色。
- 改 `out/batch-XX.json` 后必须重新 `validate_rewrite.py` 并重新冻结，再重新合并。
- 不要在 `content/teaching-*.json` 上手改后不落回批次源；否则下次合并会丢。
- 修完更新 `docs/reviews/audit-content.md` 的状态列。

## 6. UI、测试与交付

### Q04 · UI/交互/移动端验收

**写入**：`dist/app.js`、`dist/style.css`、`dist/teaching.js`。不碰内容 JSON。

**验收**：

- 首页、章节、目录、参考资料、术语弹窗、进度按钮、四个实验、六个步骤场景均可用。
- 1280px 与 500px 视口无整页横向溢出；教学拓扑/报文/表格在组件内部滚动。
- 术语首现提示不进入标题、配置、答案、章节导语（避免打断）。
- “标记本章已学完”写入 `localStorage['ict-progress-v1']`，可取消；阶段进度同步。
- 无控制台错误；打印样式包含正文与实验，不包含控制按钮。
- 改动后 `python3 build.py` 更新资源哈希。

### V01 · 补关键机制可视化（已完成 2026-10-25）

**完成记录**：新增 15 个场景（dhcp-dora、vlan-frame-path、stp-roles、ospf-neighbor、bgp-path-select、mpls-label-hop、vxlan-encap、evpn-type2、dot1x-port-access、mlag-failover、napt-rewrite、ipsec-ike-phases、vpc-egress-path、ap-find-ac、wlan-roam-hold），覆盖从 9/322 提升到 **23/322（18/94 章、四方向）**；VLAN 实验加状态快照表；15 个批次补 `visualCue` 后重新冻结合并。编写以"out 正文 + source 旧稿为唯一事实来源"，经两批独立技术复核修复 1 处必修（mlag peer-link 代传）与 4 处次级问题。测试 test-teaching 674→1002、test-models 4734→4746，render_check/audit/build 全过。方法契约见 `docs/reviews/v01-contract.md`，明细见 `docs/reviews/audit-content.md`。草稿留档 `content/rewrite/v01-drafts/`（已全部合并，可删）。视觉呈现未经人眼确认（本轮纯文本验收），人工浏览时留意 SVG 布局与窄屏内部滚动。

**背景**：当前只有 9/322 个知识点（5/94 章）有可视化，且全部是原有资源。文本、案例、检查已基本完成；本任务只补“可视化承担原理讲解”的缺口，不重写正文。

**目标**：新增 12—20 个高价值机制的可视化，覆盖数通、安全、WLAN、DCN 至少四类场景。不要求 322 个知识点全部配图，但不能再停留在 9 个基础点。

**优先清单**（按依赖排序，可分批）：

1. VLAN/Trunk/PVID：帧路径 + 标签状态表；在现有 VLAN 实验上加状态快照。
2. STP：三角形拓扑 + 根桥/端口角色状态表。
3. OSPF：邻居状态 + LSDB/SPF 时序。
4. BGP：路径属性比较表 + 选路结果。
5. MPLS：标签 Push/Swap/Pop 报文结构。
6. IPsec/IKE：协商时序 + 选择器匹配。
7. NAT：地址/端口改写字段表。
8. DHCP：DORA 时序 + 租约状态。
9. 802.1X / CAPWAP / WLAN 漫游：接入与切换时序。
10. VXLAN/EVPN：封装 + 控制面/数据面分工。
11. M-LAG：双归拓扑 + 故障切换状态。
12. 云上 VPC：实例到出口的路径与安全对象。

**写入文件**：

- `content/visualizations.json`：新增场景数据（节点、步骤、状态表、boundary、sources）。
- `dist/teaching.js`：仅在需要新组件/新交互时改；优先复用现有拓扑/报文/时序/状态表组件。
- `dist/diagrams.js`：新增实验模型时改；每个模型保持纯函数，便于测试。
- `content/rewrite/out/batch-XX.json`：为对应知识点补 `visualCue`；改后重新 `validate_rewrite.py` + `freeze_batch.py` + 合并。
- `test-teaching.cjs` / `test-models.cjs`：新增断言。

**验收**：

- 每个新增场景有 `boundary` 和至少 1 个来源；步骤状态快照形状正确。
- 正文写“看什么/为什么变化”，不复述图形；术语提示不进入组件内部。
- 1280px 与 500px 下组件内部滚动，不撑宽整页；键盘可操作，减少动态效果偏好可用。
- `node test-teaching.cjs`、`node test-models.cjs`、`render_check.cjs`、`audit_content.py` 全通过。
- 可视化覆盖从 9/322 提升到至少 21/322，并覆盖 4 个方向；报告新增清单，不虚报 322/322。
- 不调用生图模型，不新增运行时依赖。

**依赖**：M02 已完成；与内容修复串行，避免同时改同一 `out/batch-XX.json`。

### Q05 · 测试与 CI 收口

**写入**：`test-models.cjs`、`test-teaching.cjs`、`scripts/*.py`、`.github/workflows/pages.yml`。

**必须**：

- 去掉 `REQUIRE_COMPLETE=0` 的临时模式依赖；全量测试默认要求 322/322 已重写。
- `node test-models.cjs`、`node test-teaching.cjs`、`node scripts/render_check.cjs` 全 PASS。
- CI 增加 `python3 scripts/audit_content.py`、`python3 scripts/validate_glossary.py`（如基线处理正确）、`node scripts/render_check.cjs`。
- 测试不得依赖未提交的临时文件。

### Q06 · 文档与最终交付

**写入**：`README.md`、`docs/PROGRESS.md`、`TASKS.md`、`HANDOFF.md`。

**内容**：

- 最终 94/322、135 术语、6 场景、4 实验、测试数字。
- 明确“配置未在赛事设备实测”“交互模型有边界”。
- 记录未修复的 warning 和原因。
- 更新启动/构建/维护命令。
- 不部署、不推送，除非用户另行授权。

### U01 · 修复浏览器实际布局问题（未完成）

**背景**：用户在实际浏览器打开网站后反馈布局有问题；具体页面、浏览器、视口和截图尚未提供。详见 `docs/reviews/layout-issues.md`。自动化 headless 截图通过，不代表真实浏览器验收通过。

**目标**：复现并修复用户看到的重叠、裁切、错位、非预期横向滚动、侧栏遮挡或字号异常，不靠 `overflow:hidden` 掩盖问题。

**写入**：`dist/style.css`、`dist/app.js`、`dist/index.html`（仅布局相关）。不碰内容 JSON、不重写正文。

**步骤**：

1. 收集复现信息：URL、浏览器/版本、OS、视口宽高、缩放比例、截图/录屏、控制台错误。
2. 在真实浏览器（至少 Chrome + Safari）按 1280/1024/768/500 和 125%/150% 缩放复现。
3. 用 DevTools 找到具体溢出/重叠元素，记录“页面/视口/浏览器/缩放/现象/原因”。
4. 修改布局结构或断点，不用 `overflow:hidden` 隐藏内容；组件内部滚动保留可见提示。
5. 回归首页、章节、目录、参考资料、术语弹窗、进度按钮、四个实验、步骤场景。
6. 更新 `docs/reviews/layout-issues.md` 的“已修复”清单与截图。

**验收**：

- 无内容重叠、裁切、按钮错位、非预期整页横向滚动。
- 侧栏在矮屏/缩放下能滚动到全部章节；TOC 在 1150px 以下的显隐符合预期。
- 768/500 下标题换行、行宽、字号正常；教学组件在内部滚动，文字不被截断。
- 真实浏览器与自动化截图一致；不一致时以真实浏览器为准。
- `node scripts/render_check.cjs`、`node test-models.cjs`、`node test-teaching.cjs` 仍通过。

## 7. 完成定义（DoD）

1. `content/teaching-chapters.json` 94 条、`content/teaching-units.json` 322 条。
2. `build.py` 输出 `Rewritten units 322/322, chapters 94/94`，无 `LEGACY`。
3. `audit_content.py` 0 error。
4. `node test-models.cjs`、`node test-teaching.cjs`、`node scripts/render_check.cjs` 全 PASS。
5. 1280px 与 500px 截图检查通过；关键交互操作通过。
6. V01 关键机制可视化完成，覆盖从 9/322 提升到至少 21/322，且覆盖 4 个方向。（**已达成：23/322、18/94 章、四方向**）
7. U01 浏览器实际布局问题修复，真实 Chrome/Safari 在 1280/1024/768/500 与 125%/150% 缩放下无重叠/裁切/错位。
8. README/PROGRESS/HANDOFF 与实际状态一致。
9. 未完成项和已知限制写清楚，不虚报“全部实机验证”。

## 8. 独立 Agent 启动提示（复制即用）

```text
你是 ICT 教程项目的独立执行 Agent。先读：
- /Users/qiqi2988/Desktop/HUAWEI ICT/ict-learning/HANDOFF.md
- /Users/qiqi2988/Desktop/HUAWEI ICT/ict-learning/docs/教学标准.md
- /Users/qiqi2988/Desktop/HUAWEI ICT/ict-learning/content/rewrite/schema.json
- /Users/qiqi2988/Desktop/HUAWEI ICT/ict-learning/content/rewrite/examples/example.json
然后只执行 TASKS.md 中的 <任务ID>。严格遵守写入范围，不修改其他文件。完成后运行该任务指定的验收命令，并报告：改了哪些文件、验收结果、仍不确定的技术点。
```
