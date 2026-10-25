# 维护补充说明

日常入口为 [AGENTS.md](AGENTS.md)，运行方式与完整验证命令见 [README](README.md)。本文只保留额外维护约束，不重复任务、进度和测试数字。

## 数据维护

- 正文唯一编辑入口是 `content/rewrite/out/batch-XX.json`。校验后冻结并合并，再构建；不能只修改合并结果。
- `content/rewrite/source/` 是 validate_rewrite 的校验输入；`frozen/` 是 merge_rewrite 的冻结输入，checksums.json 记录 SHA-256。两者仍有依赖，不删除。
- `dist/index.html`、app.js、style.css、teaching.js、diagrams.js 是手写源；data.js、teaching-data.js、JSON 与 handbook.html 是构建产物。
- `validate_glossary.py` 检查当前词库，无需恢复旧文件。`merge_glossary.py` 按 ID 更新新增项，重复运行结果一致。

## UI 与内容约束

- 层次颜色只挂在 `.level-badge.level-*` 上，不能再用通用 `.level-*` 给正文加背景。
- 不用 `html/body overflow-x:hidden` 遮住溢出；拓扑在 `.teach-visual` 内滚动，切步保留 scrollLeft。
- 三端时序的箭头位置按 actors/from/to 计算，并显示端点文字；不要退回整条跨栏箭头。
- 移动导航由 setNavigation 管理，遮罩、inert、焦点和 aria-expanded 同步；尺寸回到桌面时关闭抽屉。
- preparePrint/finishPrint 保存并恢复折叠状态，打印时初始化实验。不要只靠 display:block 试图展开 details。
- 8 个长单元只精简 sections[].text，案例/检查/步骤/边界保留，已重新冻结并合并。
- 70 条术语启发式提示继续保留；不要降阈值或仅为消警堆关键词。
- 不重做 36 批改写；按具体学习需求补图，不为凑覆盖增加图示。
- 所有配置仍未在赛事指定设备验证。本轮补充11份实验材料与离线示例，实机回显仍须目标环境执行；不能沿用旧阶段的排除说明宣称已验证。


## 验收记录

最新扩展结果：[expanded-2026-10-25](docs/reviews/expanded-2026-10-25.md)。阅读/打印修复细节：[polish-2026-10-25](docs/reviews/polish-2026-10-25.md)。旧报告仅用于追查具体问题，不作为当前任务或发布授权。

最新图示、分支、实验与验收：[visual-completion-2026-10-25](docs/reviews/visual-completion-2026-10-25.md)。
