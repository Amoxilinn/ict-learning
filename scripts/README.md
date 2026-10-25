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
- `validate_v01_drafts.cjs`：图示草稿契约校验，已合并草稿再检查需 `--allow-existing`。

UI 源在 dist/app.js、style.css、teaching.js、diagrams.js、index.html；修改后运行根目录 build.py 更新数据与资源哈希。不要删除整个 dist。

## 一次性迁移工具

`enrich_beginner.py`、`finalize_beginner.py`、`make_batches*.py`、`merge_v01.py` 等用于既有内容迁移，会覆盖源材料或教学字段；不要当作日常构建重复运行。existing_walkthroughs.txt 是早期案例编写稿。全量 36 批已经完成，无需重新生成。
