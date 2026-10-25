# 网络探索站 · 从零开始的 ICT 教程

以阅读和自主学习为中心的本地静态网站。保留四个方向、94 条考纲条目与 322 个子知识点；每个知识点按“为什么需要 → 直观理解 → 工作过程 → 技术原理 → 实践应用”的认知顺序重写，并标注基础必学、进阶理解与技术细节。

- 在线阅读：[GitHub Pages](https://amoxilinn.github.io/ict-learning/)
- 源代码：[Amoxilinn/ict-learning](https://github.com/Amoxilinn/ict-learning)

## 启动

双击 `启动网站.command`，或在本目录执行 `python3 serve.py`。默认地址为 `http://127.0.0.1:8765`；端口占用时以终端输出为准。

## 学习结构

- 首页给出九个阶段的推荐顺序，左侧常驻目录串起全部 94 章，并显示每阶段完成数。
- 每章有场景导入、为什么现在学、2–4 条学习目标、能力目标、知识点目录与本章小结；章末交代下一章要解决的新问题。
- 每个知识点有本节目标、自然分节讲解、已解案例、一句话结论和折叠的理解检查。基础必学全部配检查；进阶与技术细节按需深入。
- 配置命令、命令说明、常见误区和技术边界收进折叠区，不打断基础原理阅读。
- 术语首次出现时给出简短提示，可点开查看通俗解释与折叠的专业定义；统一术语库共 135 条。
- 子网、交换、VLAN 与路由四个原理实验，加上 ACL、前缀列表、路由策略三个可输入工具；58 个数据场景与 1 个生成场景覆盖 63/322 个知识点、47/94 章。包括 VLANIF/MUX/代理 ARP、聚合与生成树、IPv6/SRv6、VPN 双标签、组播、VRRP/BFD、QoS，DCN 11 章均有演示；WLAN 分开呈现 AP 上线与手机完整上线，补充转发架构、热备、信道与容量规划。
- 每章可手动标记“已学完”，只保存在本机浏览器，不统计时长、不记录答题，也不上传。

## 内容与构建

| 文件 | 作用 |
| --- | --- |
| `content/teaching-chapters.json` | 94 章的导语、目标、小结与章间衔接 |
| `content/teaching-units.json` | 322 个知识点的教学叙事、层次、检查与案例 |
| `content/units-*.json` | 技术元数据：术语、深度、来源、配置、命令说明、故障边界 |
| `content/glossary.json` | 双层术语库（通俗解释 + 专业定义） |
| `content/visualizations.json` | 步进式交互场景 |
| `content/curriculum.json` | 九阶段推荐顺序 |
| `docs/教学标准.md` | 全站统一教学质量标准与合格线 |
| `content/rewrite/` | 分批改写源材料、批次输出与合并记录 |

`build.py` 合并教学数据与技术元数据，输出六组阅读数据、离线手册，并为静态资源附加内容哈希。`dist/app.js`、`style.css`、`teaching.js`、`diagrams.js` 和 `index.html` 是手写源，可以直接修改；构建只更新入口的资源哈希。`dist/data.js`、`teaching-data.js`、JSON 与 `handbook.html` 是生成物，不要手改，也不要删除整个 `dist/`。

```sh
python3 build.py
node --check dist/app.js
node --check dist/teaching.js
node test-models.cjs
node test-teaching.cjs
node scripts/test-expanded.cjs
node scripts/render_check.cjs
python3 scripts/audit_content.py
python3 scripts/validate_glossary.py
python3 scripts/test_validators.py
```

批量重写时：

```sh
python3 scripts/make_batches_final.py       # 生成 36 个批次源材料
python3 scripts/validate_rewrite.py batch-02
python3 scripts/freeze_batch.py batch-02    # 验证后冻结并更新校验和
python3 scripts/merge_rewrite.py --frozen   # 合并冻结副本
python3 scripts/audit_content.py            # 全局去重、层次与结构审查
```

## 教学与技术边界

- 内容覆盖 94 章、322 个考纲细则，构建强制校验章节、细则、知识点的一一对应。
- 技术结论尽量保留原始来源与适用条件；配置为学习示例，尚未在赛事指定设备上逐条执行。具体命令、版本和型号兼容性仍需按目标环境核对。
- 交互模型只模拟正常流程或明确列出的对照分支，边界写在每个演示的“模型条件与技术边界”中。63/322 个知识点带可视化，覆盖数通/安全/WLAN/DCN 四方向（扩展轮，2026-10-25）；配图针对高价值机制，不追求逐条覆盖。阅读布局已修复正文标签样式串用、全页裁切和移动目录交互；94 章通过 5 视口检查，并完成 Chrome 缩放与打印验收。Safari/真实手机等未测试环境见 [验收报告](docs/reviews/polish-2026-10-25.md)。
- 离线手册保留教学正文、案例、配置和检查，不包含交互演示。

## 维护与交接

- 统一教学质量标准与合格线：[教学标准](docs/教学标准.md)
- 剩余/后续任务拆分：[TASKS](TASKS.md)
- 无原始对话上下文的接续说明、文件矩阵与已知问题：[HANDOFF](HANDOFF.md)
- 批次源材料与冻结副本：`content/rewrite/source/`、`content/rewrite/frozen/`
- 全量验收：`python3 build.py`（322/322、94/94）、`python3 scripts/audit_content.py`（0 error）、`node test-models.cjs`（4746）、`node test-teaching.cjs`（1011）、`node scripts/render_check.cjs`。

配置与命令仍未在赛事指定设备上实测；交互模型只覆盖各场景 `boundary` 写明的条件。

## 当前打磨结果

2026-10-25：整理 8 个长知识点，保留案例、检查与技术边界；修正三端时序箭头，补图示滚动和打印展开/恢复。词库校验不再要求恢复旧文件，词库合并可重复执行。最新构建与测试结果、截图和测试环境见 [验收报告](docs/reviews/polish-2026-10-25.md)。2026-10-25 用户已授权将本轮修复提交并推送 GitHub，main 推送后由 Pages 自动验证和部署；发布结果以对应 Actions 为准。

## 发布

GitHub Pages 使用 `.github/workflows/pages.yml` 自动构建和部署 `dist/`。推送到 `main` 后会运行构建、JavaScript 语法检查和现有测试，通过后更新网站。

原创代码和原创教程文字采用 [MIT 许可证](LICENSE)。第三方考纲图片、赛事截图、商标和引用资料不在此授权范围内，详见 [第三方资料说明](THIRD_PARTY_NOTICES.md)。这是独立学习项目，不代表华为官方。

2026-10-25 扩展轮：修正 ICT-045 的三节正文归属及 ICT-079 控制/转发平面错位，新增 37 个步进场景和 3 个输入工具。最新范围与自检见 [扩展验收](docs/reviews/expanded-2026-10-25.md)。
