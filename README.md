# 网络探索站 · 从零开始的考纲教程

以阅读和查阅为中心的本地静态网站。保留四个方向、94条考纲条目与322个子知识点目录；全部322项均有独立讲解、具体已解案例、配置或实施关系、易错点与参考资料。

- 在线阅读：[GitHub Pages](https://amoxilinn.github.io/ict-learning/)
- 源代码：[Amoxilinn/ict-learning](https://github.com/Amoxilinn/ict-learning)

## 启动

双击 `启动网站.command`，或在本目录执行 `python3 serve.py`。默认地址为 `http://127.0.0.1:8765`；端口占用时以终端输出为准。

## 当前结构

- 首页为从零开始的推荐学习顺序；左侧九阶段目录串起全部94章，并突出当前章节。
- 原考纲目录保留专业、比赛阶段、考纲要求筛选和正文/命令/案例检索。
- 章节由情境导语、阅读目标、细则讲解、已解过程与总结组成；先修链接与上一章/下一章遵循推荐顺序，保留字号和打印。
- 子网、ARP/交换、VLAN、路由选择四种演示折叠嵌入对应章节，按需展开。
- 参考资料页提供原始考纲、文档标准与离线阅读手册。
- 已移除题库、自测、错题、考试、学习记录、笔记、收藏、进度、复习计划及记录导入导出。网站不读写学习记录；历史浏览器数据未清除。

## 维护

ICT-001—ICT-003 已接入数据驱动的拓扑、报文结构、协议时序与状态表，以及首次术语解释。ICT-002 进一步支持嵌套封装、明确的发送/接收阶段、ACK 丢失对比、嵌入式预测反馈和按需展开的专业定义；这些新增交互仅在本课启用。组件接口、技术边界和分批推广顺序见 [教学可视化组件体系](docs/教学可视化组件体系.md)。场景与词库分别维护在 `content/visualizations.json`、`content/glossary.json`；无新增运行时依赖。

原始内容保留在 `content/`，其中旧版训练字段仅用于保留维护源资料，不向网站输出。`curriculum.json`维护九阶段顺序，`pedagogy.json`维护94章导语。`build.py`输出六组阅读数据及按推荐顺序编排的离线手册。页面代码在 `dist/index.html`、`dist/app.js`、`dist/diagrams.js`、`dist/style.css`。

```sh
python3 build.py
node --check dist/app.js
node --check dist/diagrams.js
node --check dist/teaching.js
node test-models.cjs
node test-teaching.cjs
```

原197项缺失细则已补齐，当前322/322项都有独立讲解与具体过程示例。文本覆盖不等于全部内容已通过实机或型号兼容性验证；命令仍需按赛事指定版本核对。维护进度见 `docs/PROGRESS.md`。

## 发布与开源

GitHub Pages 使用 `.github/workflows/pages.yml` 自动构建和部署 `dist/`。
推送到 `main` 后会运行构建、JavaScript 语法检查和现有模型/章节测试，通过后更新网站。
首次启用时，在仓库 Settings → Pages → Source 选择 GitHub Actions。
全部页面资源使用相对路径，章节使用哈希路由，支持项目子目录地址。

原创代码和原创教程文字采用 [MIT 许可证](LICENSE)。第三方考纲图片、赛事截图、
商标和引用资料不在此授权范围内，详见 [第三方资料说明](THIRD_PARTY_NOTICES.md)。
这是独立学习项目，不代表华为官方。
