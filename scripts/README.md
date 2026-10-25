# 维护脚本

## 日常验证

- `validate_rewrite.py batch-XX`：验证修改后的教学批次；不传参数验证所有 out 批次。
- `freeze_batch.py batch-XX`：校验后冻结，更新 SHA-256。
- `merge_rewrite.py --frozen`：合并已冻结教学数据；校验和不符时拒绝。
- `audit_content.py`：全站覆盖、重复、结构与可读性审计，术语提示属于启发式。
- `validate_glossary.py`：直接验证现有完整词库与新增词条的一致性，不需要回退到旧 35 条。可选 `--baseline PATH` 用于检查独立旧基线。
- `merge_glossary.py`：按 ID 更新新增词条；重复执行结果一致，冲突时拒绝。
- `test_validators.py`：词条冲突、重复 ID、缺失/改动词条、旧基线保护与异常长度分支回归。
- `render_check.cjs`：全章渲染字符串和目录目标检查；不是实际浏览器布局测试。
- `validate_v01_drafts.cjs`：新增图示草稿契约校验；传入待验证的 JSON 文件，契约见 `docs/reviews/v01-contract.md`。

UI 源在 dist/app.js、style.css、teaching.js、diagrams.js、index.html；修改后运行根目录 build.py 更新数据与资源哈希。不要删除整个 dist。

## 批次材料

`make_batches_final.py` 是现有 36 批源材料的生成工具，会覆盖 source/manifest；日常维护无需重跑。旧题库生成器、已完成的入门迁移脚本、旧版批次生成器、已合并 V01 草稿与整合脚本已删除。当前正文编辑 out 批次，source/frozen 仍用于校验和合并。

## 图示与实验补充验收

- `test-visual-completion.cjs`：全场景分支可达、数据挂接、SVG输出、规划输入/公式边界与时序分支互斥。
- `test_automation_fixture.py`：离线驱动成功、幂等、超时、漂移补偿和补偿失败的状态断言。
- `check-visual-browser.cjs`：启动服务器后，用Playwright/Chrome检查94章三视口、全部场景与分支的SVG边界、布局及规划输入；ICT_TEST_URL可覆盖地址，ICT_SCENES可只补测逗号分隔的指定场景。
- `check-visual-tools.cjs`：规则工具样例/错误输入、打印恢复、下载，以及堆叠两条链路与节点穿越检查。
- `check-expanded-browser.cjs`：历史线性场景与规则工具冒烟；故障分支完整覆盖用上面的新脚本。

实验数据编辑 `content/labs.json`，构建合入网页教学数据与离线手册；可执行离线示例保留在 `dist/labs/automation_fixture.py`。不得把教学预期输出改称实机回显。

- `check-reference-labs-browser.cjs`：官方界面图加载与原图入口、两宽度布局、规划输入空值与坐标、DHCP/IPSG脚本和离线手册图片。
