# 全站教学内容审计报告

日期：2026-10-24（Asia/Shanghai）；2026-10-25 更新 V01 与阅读打磨结果
范围：94 章 / 322 个知识点（全量合并后）

## 结论

- `python3 scripts/audit_content.py`：**0 error / 73 warning**。
- 无缺失章节、无缺失知识点、无重复句、无"案例复述正文"整句、无 core 缺检查。
- `python3 build.py`：322/322、94/94，无 LEGACY。
- 94 条章节 `bridge` 已逐条与课程顺序的下一章核对；ICT-004 曾把"建 VLANIF"误写成下一章，已改为"链路聚合"。
- **V01 已完成（2026-10-25）**：可视化覆盖从 9/322 提升到 **23/322（18/94 章）**，覆盖数通/安全/WLAN/DCN 四个方向；详见下节。图文讲解的"覆盖率缺口"自此达标（目标 ≥21/322）；本轮已补 Chrome 与多视口验收（见 `layout-issues.md`）。

## 当前 warning 分类

| 类别 | 数量 | 判断 |
| --- | --- | --- |
| 长单元 | 0 | 原 8 项已精简分节正文，保留案例/检查/步骤/边界；见本轮打磨报告 |
| 术语覆盖启发式 | 73 | 中文同义改写或缩写拆分仍保留提示；不通过降阈值消警 |

8 个长单元 ICT-062.01、074.01—03、075.03、078.01、085.01、085.03 现为 1471—1792 字符（全局审计口径），修改已回写批次并重新冻结合并。

## V01 · 关键机制可视化（2026-10-25 完成）

- `content/visualizations.json` 场景 6 → **21**（另有 1 个生成场景 + 4 个可操作实验不变）。
- 带可视化知识点 9 → **23/322**，章节 5 → **18/94**；方向分布（按知识点计）：数通 17、安全 3、WLAN 2、DCN 1。
- 新增 15 个场景（全部走"正文/旧稿为唯一事实来源"编写 + 独立技术复核）：

| 场景 | 知识点 | 机制 |
| --- | --- | --- |
| dhcp-dora | ICT-002.09 | DHCP DORA 与中继、租约到达时点 |
| vlan-frame-path | ICT-004.01 | Access/PVID/Trunk 帧路径与标签状态 |
| stp-roles | ICT-007.01 | 根桥/根端口/阻塞端口剪环 |
| ospf-neighbor | ICT-010.01 | Hello→2-Way→DD/LSR/LSU/LSAck→Full |
| bgp-path-select | ICT-013.01 | Established 后的选路检查链 |
| mpls-label-hop | ICT-026.01 | 标签 Push/Swap/Pop 与逐跳查表 |
| vxlan-encap | ICT-030.01 | 内外层封装与 VTEP 地址 |
| evpn-type2 | ICT-031.01 | MAC/IP 通告路由替代泛洪 |
| dot1x-port-access | ICT-036.01 | 受控端口、EAPOL/RADIUS 两通道 |
| mlag-failover | ICT-045.01 | 双归、peer-link、双主检测 |
| napt-rewrite | ICT-058.02 | 源 NAT/服务发布的字段改写 |
| ipsec-ike-phases | ICT-062.01 | 选择器、IKE SA、两份单向 IPsec SA |
| vpc-egress-path | ICT-073.01 | 实例→安全组→路由表→出口对象链 |
| ap-find-ac | ICT-074.01 | AP 发现/加入控制器/合法性检查 |
| wlan-roam-hold | ICT-081.01 | 漫游时重建与保持的状态边界 |

- VLAN 实验（ICT-004.01）新增**转发状态快照表**：`vlanSim` 返回 `states`（位置/端口/是否带标签/VLAN），丢弃分支停在丢弃点；场景与实验口径一致。
- 每个新场景均带 `boundary`（声明未模拟内容）与 `sources`（正文/旧稿真实条目或 rfc-editor RFC）；`visualCue` 已按 out→validate→freeze→merge 链写入对应批次（15 个批次重新冻结）。
- 两批独立技术复核（15 份草稿逐一对照正文/旧稿）：发现并修复 1 处必修（mlag 整机故障时 peer-link 不能"代传"）+ dhcp Request 越中继箭头 + napt"会话表项/转换记录"混用与未声明示例数字 + ospf 状态迁移文案矛盾等；其余通过。
- 存量修复：ICT-003.01 的错位 visualCue（从不渲染）移到场景实际挂载点 ICT-003.02，并补 source 侧 visuals 快照；`validate_rewrite.py batch-00` 警告清零。
- 测试：`test-teaching.cjs` 674 → **1002** 断言（新场景教学时点 + "每场景必须有 https 来源"全局规则）；`test-models.cjs` 4734 → **4746**（VLAN states 9 条 + 通道 B 边界 + 4 章 rollout 正断言）。

## 已修复的具体问题（文本层，2026-10-24）

1. **ICT-004 章节衔接**：原 `bridge` 指向 VLANIF，实际下一章是链路聚合；已改为"多链路聚合成逻辑链路，再往后用生成树处理环路"。
2. **batch-14 部分覆盖**：生成过程中 11 个单元被覆盖成 4 个；从较早合并数据恢复，重新校验并冻结。
3. **ICT-047.02 OpenStack**：补 Nova/Neutron/Keystone/Glance/Cinder 分工。
4. **ICT-075.01 FAT AP**：补"FAT AP（胖 AP）"全称。
5. **ICT-083.01 IoT**：补"IoT（物联网）"名称。
6. **ICT-087.01 WLAN Planner**：补工具名称与用途。
7. **ICT-002.01 TCP/IP**：补"TCP/IP 把通信拆成四层"。
8. **ICT-048.01 智能无损**：补"智能无损网络"名称。

## 术语覆盖抽查说明

以下 warning 经抽查为**可接受的同义表述**，不再改动：

- ICT-002.01 现已在正文出现 TCP/IP；其余 "IP路由""IS-IS IPv4""BGP IPv4""IP Prefix List""AAA""BGP/MPLS IP VPN" 等，正文分别用"路由表""IS-IS + IPv4""BGP + IPv4""前缀列表""认证、授权、计费""BGP/MPLS VPN"表述，概念已覆盖。
- ICT-078.03 WEP-shared-key、078.04 WPA/WPA2-PSK、078.05 WPA/WPA2-802.1X：正文用 WEP 共享密钥、PSK、WPA/WPA2 企业认证解释，属于同一机制。
- ICT-082.01/02/04/08/09、ICT-094.02/06：正文用"空口性能/射频调优/频段引导/无线 QoS/VIP 体验/可靠性故障/漫游故障"等中文表述，机制已覆盖。

## 未完成的审查

- 未在赛事指定设备/版本执行任何配置或抓包；所有命令仍是学习示例。
- 未逐条建立 322 项到官方文档页码的映射；来源为主题级。
- 未做读屏软件与全设备矩阵测试；本轮 Chrome 与 5 视口验收通过，但不代表真实手机、Windows 或独立 Safari 验收。
- 15 个新场景已补 390/1280 截图逐张检查和步进/重置验收；结果见 polish-2026-10-25.md。全设备与读屏表现仍未确认。
- VXLAN 场景按"正文未给端口号不写数"原则未标注 UDP 4789；如需展示请先在可联网环境核对 RFC 7348。

## 总体判断

结构与覆盖完整，图文覆盖达到 V01 阶段目标；本轮补齐阅读样式、长单元精简、Chrome/多视口/场景视觉交互与词库校验。赛事设备版本、逐项官方来源映射和实机配置验证仍不在本轮范围。后续按具体问题修订，不重新批量生成 36 批正文。
