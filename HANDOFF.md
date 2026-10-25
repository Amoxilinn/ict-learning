# ICT 教程 · 接续说明

更新：2026-10-25（Asia/Shanghai）。现行状态见本文件、TASKS.md 和 docs/PROGRESS.md。旧交接已归档到 [历史交接](docs/history/HANDOFF-before-polish-2026-10-25.md)，不再执行其中恢复旧词库等过时操作。

## 项目与最新授权范围

静态中文网络教程，面向零基础学生，保留数通 44 章、DCN 11 章、安全 18 章、WLAN 21 章，共 94 章/322 个知识点。九阶段目录串联阅读，配置和检查可折叠，学习标记只存本机。

最新一轮用户要求：修复整体审查的问题 1、2、4、5、6，打磨项目完整度；明确排除问题 3（赛事版本、设备与逐项来源审定）。用户允许直接用 Computer Use 检查 Chrome，只有无法解决的问题再询问。

本轮修复与本地验收完成；2026-10-25 用户已授权 Git 提交及推送。此前基线为 ba17506（V01）及文档提交 d2b0dd1；本次 main 推送触发 Pages，最终上线状态以对应 Actions 为准。

## 当前验证事实

| 项目 | 结果 |
| --- | --- |
| 教学覆盖 | 94/94 章、322/322 知识点，全量改写，无 LEGACY |
| 词库 | 135 条、236 别名、105 条允许自动标注 |
| 图示 | 21 数据场景 + 1 生成场景 + 4 操作实验；23/322 知识点、18/94 章、四方向 |
| JS 测试 | test-models 4746，test-teaching 1011，render_check 全通过 |
| Python | 内容审计 0 错误/73 术语提示；词库校验 0 错误/0 提示；7 项回归测试通过 |
| 浏览器 | 94 章 × 5 宽度无整页横向溢出；22 可选场景 × 2 宽度、266 步及重置通过 |
| 视觉/实际 Chrome | 15 个新增场景两种宽度逐张查看；Chrome 100/125/150% 与 VLAN 打印预览通过 |
| 测试范围限制 | Safari 启动检查超时；未测试真实手机、Windows 和读屏软件 |

报告与截图：docs/reviews/polish-2026-10-25.md。布局问题原因与修复：docs/reviews/layout-issues.md。

## 源文件与生成物

| 文件 | 编辑规则 |
| --- | --- |
| dist/index.html | 手写入口；build 只更新资源哈希 |
| dist/app.js、style.css、teaching.js、diagrams.js | 手写 UI/组件/实验源，允许直接修改 |
| dist/assets/ | 静态资源；不要随构建清理整个 dist |
| content/rewrite/out/batch-XX.json | 教学正文的唯一编辑入口 |
| content/rewrite/frozen/ | 校验通过后的快照；checksums.json 记录 SHA-256 |
| content/teaching-chapters.json、teaching-units.json | 批次合并产物，不手改 |
| content/units-*.json | 技术元数据、原配置、来源、排障；不在本轮重写 |
| content/glossary.json | 合并后的统一库；保留 35 条基础词库，新增词条编辑 rewrite/out/glossary.json |
| content/visualizations.json | 数据场景源；条件和 sources 保留，不凭 UI 修复新增技术结论 |
| content/knowledge.json、subskills.json、curriculum.json | 94/322 考纲范围与九阶段顺序；不要随意改动 |
| dist/data.js、teaching-data.js、*.json、handbook.html | build.py 生成，不手改 |

数据流：批次 out → validate_rewrite → freeze_batch → merge_rewrite --frozen → teaching-*.json → build.py → dist 数据/手册。手写 UI 文件仍留在 dist，是当前仓库约定。

## 常用操作

启动：`python3 serve.py`，默认 http://127.0.0.1:8765。完整检查见 README。

```sh
python3 scripts/validate_rewrite.py batch-XX
python3 scripts/freeze_batch.py batch-XX
python3 scripts/merge_rewrite.py --frozen
python3 build.py
python3 scripts/audit_content.py
python3 scripts/validate_glossary.py
python3 scripts/test_validators.py
node test-models.cjs
node test-teaching.cjs
node scripts/render_check.cjs
```

词库：`validate_glossary.py` 直接检查当前 135 条库，不需要 git checkout 或恢复旧文件。可选 `--baseline /path/to/legacy.json` 只用于额外保护独立旧基线。`merge_glossary.py` 按 ID 更新新增项，重复运行不改变结果。

## 本轮修复与维护约束

- 层次颜色只挂在 `.level-badge.level-*` 上，不能再用通用 `.level-*` 给正文加背景。
- 不用 `html/body overflow-x:hidden` 遮住溢出；拓扑在 `.teach-visual` 内滚动，切步保留 scrollLeft。
- 三端时序的箭头位置按 actors/from/to 计算，并显示端点文字；不要退回整条跨栏箭头。
- 移动导航由 setNavigation 管理，遮罩、inert、焦点和 aria-expanded 同步；尺寸回到桌面时关闭抽屉。
- preparePrint/finishPrint 保存并恢复折叠状态，打印时初始化实验。不要只靠 display:block 试图展开 details。
- 8 个长单元只精简 sections[].text，案例/检查/步骤/边界保留，已重新冻结并合并。
- 73 条术语启发式提示继续保留；不要降阈值或仅为消警堆关键词。
- 不重做 36 批改写、不增加题库/考试系统、不为凑覆盖给所有知识点配图。
- 所有配置仍未在赛事指定设备验证；用户本轮排除了这一事项。

## 发布

GitHub：https://github.com/Amoxilinn/ict-learning；线上：https://amoxilinn.github.io/ict-learning/。main 推送后 Pages 自动执行构建、审计、词库/Python 回归、JS 语法与现有测试后部署。本轮用户已授权提交并推送；发布状态应分别确认源码、Actions 和线上资源版本。
