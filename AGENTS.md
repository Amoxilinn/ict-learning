# Agent 维护入口

## 最小阅读范围

- 静态中文 ICT 教程：四方向、94 章、322 知识点、九阶段阅读顺序。
- 默认只读本文件，然后定位任务涉及的源文件。启动/完整检查查 `README.md`；待办查 `TASKS.md`；内容质量查 `docs/教学标准.md`；特殊 UI 约束查 `HANDOFF.md`。无需每次通读这些文档。
- 当前图示、分支与实验结果见 `docs/reviews/visual-completion-2026-10-25.md`。其他报告是阶段记录，旧数量不代表现状；历史发布授权不代表当前任务要求发布。
- 不主动恢复题库、考试、错题、笔记或复习系统；保留现有阅读顺序、理解检查与本机学习标记。赛事设备版本、实机配置与逐项来源审定仍未完成，按用户任务范围处理。

## 按任务定位

| 任务 | 源文件 |
| --- | --- |
| 页面、导航、样式 | `dist/index.html`、`app.js`、`style.css`、`teaching.js` |
| 图示与原理实验 | `dist/diagrams.js`、`content/visualizations.json` |
| 配套实验与真实工具界面图 | `content/labs.json`、`dist/labs/automation_fixture.py`、`dist/assets/wlan-planner/`；界面图挂接在 visualizations.json 的 referenceFigures |
| 教学正文 | `content/rewrite/out/batch-XX.json`；用 `content/rewrite/manifest.json` 定位批次 |
| 技术元数据、配置和来源 | `content/units-*.json`、`sources.json`、`lessons.json` |
| 范围与顺序 | `content/knowledge.json`、`subskills.json`、`curriculum.json` |
| 术语 | `content/glossary.json`；新增项编辑 `content/rewrite/out/glossary.json` |
| 构建、校验 | `build.py`、`scripts/README.md`、`.github/workflows/pages.yml` |

表内省略目录的文件与同格首个路径同目录。`dist/` 混有手写源，绝不能整体清理。
正文流程：修改 out → `validate_rewrite.py batch-XX` → `freeze_batch.py batch-XX` → `merge_rewrite.py --frozen` → `build.py`（脚本位于 scripts/）。
`content/teaching-*.json`、`dist/data.js`、`teaching-data.js`、JSON、`handbook.html` 是合并/构建产物，不手改。旧 lessons/pedagogy/units 数据仍被构建使用，不能因文字重复删除。

## 控制检索与输出

- `.rgignore` 让默认 rg 检索跳过生成物、冻结副本、批次源材料和图片；只影响搜索，不影响 Git、构建或直接读文件，也不能阻止其他工具自动载入。
- 先 `rg --files` 选文件，再 `rg -n --max-count 8 --max-columns 240 --max-columns-preview '关键词' 指定文件`。仅需文件名时用 `rg -l`。
- 查排除项时用 `rg --no-ignore ... 明确路径`。不要对根目录使用无范围的 `--no-ignore`。
- 大 JSON 用 Python 按知识点 ID/字段提取；不要 cat 全部正文、批次、生成 JS 或离线手册。截图只在视觉任务中按需查看。
- `content/rewrite/source/` 是校验所需输入，`frozen/` 是合并与校验和快照，均保留。`scripts/README.md` 列出的一次性迁移脚本不作为日常构建运行。
- 按变更运行相关检查，完整命令见 README/CI。文档或搜索规则变更只核对路径、规则和差异；不需要重做全站内容/浏览器验收。
