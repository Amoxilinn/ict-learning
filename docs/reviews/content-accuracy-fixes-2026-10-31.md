# 知识内容逐项修订与验证记录

日期：2026-10-31。对应[初次审查报告](content-accuracy-audit-2026-10-31.md)的全部 **76项确认问题和3项待核表述均已处理**。这里的“已修正”指已修改对应源稿、同步相关重复点并通过现有验证；不代表完成赛事设备实测或对全站零错误作保证。

本轮修改了30个教学批次、67个知识点和46章涉及的内容，另同步6个术语、5个演示场景，以及相关技术元数据、配置前提与故障提示。保留原有94章/322知识点范围和阅读结构。

## 修订流程

修改out源稿 → 全36批校验 → 冻结30个变更批次及校验和 → 合并全部冻结稿 → 构建网页与离线手册。词库由out/glossary修改后合并。没有直接改生成数据来掩盖源稿问题。

三个并行子智能体在额度限制中止前保存了部分正文修改，主审接手复核并补齐共享文件、剩余修订和全部验证。本轮交付为本地Git提交，未推送或发布。

## 验证

| 检查 | 结果 |
| --- | --- |
| 36批重写校验 | 全部通过，保留字数/图示提示等启发式告警 |
| 冻结哈希与源稿一致性 | 36/36一致 |
| 合并与构建 | 94/94章、322/322点 |
| 生成页面数据与源稿 | 逐项一致 |
| 词库校验 | 135项、236别名；0错误、0告警 |
| 内容结构审计 | 0错误、72条启发式告警（未将其当作技术准确性认证） |
| 网络模型 | 4746项断言通过 |
| 教学数据与协议快照 | 2054项断言通过 |
| 扩展场景 | 903项检查通过 |
| 全场景分支与图示 | 2293项断言通过 |
| 94章与目录渲染 | 通过 |
| 自动化fixture | 5项测试通过 |
| 校验器回归 | 7项测试通过 |
| app.js / teaching.js / diagrams.js语法 | 通过 |
| 构建可复现性 | 再次构建后，所有受版本控制的dist文件哈希不变 |
| Chrome实际页面复核 | 桌面1280px、手机390px各94章，共188次页面检查；0个JavaScript运行错误 |
| 5个修改演示逐步复核 | 两种宽度共60个步骤快照，状态、SVG文字边界与重置检查通过 |
| 离线手册 | HTTP 200，正文加载与内容检查通过 |

提交前重新运行上述检查，并抽查OSPF桌面、DHCP手机演示截图，未发现阻止提交的问题。

Node不在默认PATH，使用Codex捆绑Node运行检查。现有测试主要保证模型、数据、分支和渲染契约；技术修订仍结合原审查的RFC、官方资料及案例条件人工核对。

## 逐项处置

原编号保留，方便回查审查依据。以下链接定位当前源文件的对应知识点/场景；初次报告的行号属于修订前快照。

| 原编号 | 状态 | 当前源位置 | 修正内容 |
| --- | --- | --- | --- |
| R01 | 已修正 | [ICT-007.01](../../content/rewrite/out/batch-02.json#L317) | 改为指定端口与根端口均可转发，仅冗余非指定端口阻塞，并重写理解检查。 |
| R02 | 已修正 | [ICT-007.02](../../content/rewrite/out/batch-02.json#L361) | 重设案例主根/备根优先级，使4096接入设备抢根符合全部给定条件。 |
| R03 | 已修正 | [ICT-006.02](../../content/rewrite/out/batch-02.json#L531) | 补充CSS启动顺序与同时启动条件，按较大优先级胜出重写案例及验证步骤。 |
| R04 | 已修正 | [ICT-025.02](../../content/rewrite/out/batch-10.json#L98) | 说明异构SRGB可正常换标，案例改查实际通告/解析故障，不再把范围不同判错。 |
| R05 | 已修正 | [ICT-002.09](../../content/rewrite/out/batch-01.json#L161) | 明确T1续租、T2重绑定和到期停止使用地址。 |
| R06 | 已修正 | [dhcp-dora](../../content/visualizations.json#L1140) | 演示改为服务器提交绑定后发送ACK，客户端收到后再配置。 |
| R07 | 已修正 | [ICT-002.03](../../content/rewrite/out/batch-01.json#L261) | 补充UDP成功交付与接收缓冲条件，解释截断及尾部不能靠后续读取补齐。 |
| R08 | 已修正 | [ICT-018.01](../../content/rewrite/out/batch-03.json#L365) | 区分ND中的单播和组播消息，不再把无广播等同全部组播。 |
| R09 | 已修正 | [ICT-018.03](../../content/rewrite/out/batch-03.json#L456) | 明确IA_NA不发子网掩码，案例用RA的L位前缀与零路由器寿命分开验证on-link和默认路由。 |
| R10 | 已修正 | [ICT-011.01](../../content/rewrite/out/batch-04.json#L57) | 区分本地process ID与报文Instance ID，邻接不要求两端本地进程号相同。 |
| R11 | 已修正 | [ICT-011.01](../../content/rewrite/out/batch-04.json#L57) | 把互联网段标为既有Direct，另核对业务前缀；补明另一个案例的ping源地址。 |
| R12 | 已修正 | [ICT-010.01](../../content/rewrite/out/batch-03.json#L185) | 把正常2-Way的条件明确为两端都是DROther，排除BDR。 |
| R13 | 已修正 | [ospf-neighbor](../../content/visualizations.json#L1626) | 重写OSPF演示，以请求列表判Loading/Full，直接LSR应答不入重传列表，不再等待LSAck才Full。 |
| R14 | 已修正 | [ICT-012.01](../../content/rewrite/out/batch-04.json#L153) | 跨区域邻接要求两端均具L2能力并核对接口层级。 |
| R15 | 已修正 | [ICT-028.01](../../content/rewrite/out/batch-09.json#L268) | 分开ICMP MTU/DF/分片与TCP MSS；不再把调MSS当作大ping修复。 |
| R16 | 已修正 | [ICT-033.01](../../content/rewrite/out/batch-12.json#L232) | 正文、词库、元数据与故障提示区分源树朝S、共享树朝RP及MRIB。 |
| R18 | 已修正 | [ICT-013.01](../../content/units-network-core.json#L2151) | IPv4/IPv6的精确路由前提与network命令保持同一前缀。 |
| R19 | 已修正 | [ICT-015.02](../../content/units-network-core.json#L2554) | 精确192.168.1.0/24命令的注释改为精确匹配，不再沿用10/8范围说明。 |
| R20 | 已修正 | [ICT-023.03](../../content/rewrite/out/batch-12.json#L118) | 题目明确出口时钟快8微秒，答案说明快/慢两种符号方向。 |
| R21 | 已修正 | [mpls](../../content/rewrite/out/glossary.json#L42) | MPLS词库区分逐包标签查找与LDP沿IGP选路、显式TE约束。 |
| R22 | 已修正 | [ppp](../../content/rewrite/out/glossary.json#L289) | PPP词库区分NCP参数协商与PPP数据封装。 |
| R23 | 已修正 | [nat64](../../content/rewrite/out/glossary.json#L1136) | NAT64词库限定动态有状态发起条件，补充静态绑定等例外并把AAAA合成交给DNS64。 |
| R24 | 已修正 | [ICT-009.02](../../content/rewrite/out/batch-03.json#L102) | 案例互联网段统一为10.0.23.0/30。 |
| R25 | 已修正 | [ICT-008.02](../../content/rewrite/out/batch-02.json#L446) | 改为Common and Internal Spanning Tree，并说明CST/IST与CIST关系。 |
| D01 | 已修正 | [ICT-034.01](../../content/rewrite/out/batch-06.json#L31) | 使用两台不同NAS构造拒绝/超时对照，并要求结合报文和日志判断。 |
| D02 | 已修正 | [ICT-035.05](../../content/rewrite/out/batch-06.json#L388) | 区分MACsec端点和透传中间设备，案例把失败原因明确为协商报文被阻断。 |
| D03 | 已修正 | [ICT-036.01](../../content/rewrite/out/batch-07.json#L30) | 按打印机具体型号的supplicant能力解释，不再称打印机没有操作系统。 |
| D04 | 已修正 | [ICT-036.04](../../content/rewrite/out/batch-07.json#L163) | 重写移动案例，以控制点错误身份映射及新端口实际授权解释放行。 |
| D05 | 已修正 | [ICT-037.01](../../content/rewrite/out/batch-07.json#L205) | 保留虚拟IP/MAC映射，说明免费ARP更新二层位置；上游路由是否收敛依拓扑而定，并补地址拥有者例外。 |
| D06 | 已修正 | [ICT-040.01](../../content/rewrite/out/batch-08.json#L286) | 按重复操作预期效果定义幂等，区分先读后改与接口自身幂等语义。 |
| D07 | 已修正 | [ICT-040.02](../../content/rewrite/out/batch-08.json#L333) | 说明rpc-error可能伴随部分修改，按error-option、能力与回读结果决定恢复。 |
| D08 | 已修正 | [ICT-040.02](../../content/rewrite/out/batch-08.json#L333) | 分别检查candidate、validate和writable-running，不再推定无候选库就能直接写运行库。 |
| D09 | 已修正 | [ICT-045.03](../../content/rewrite/out/batch-28.json#L97) | 按逻辑VTEP分配地址，补充M-LAG两物理设备共享虚拟VTEP的设计。 |
| D10 | 已修正 | [ICT-045.06](../../content/rewrite/out/batch-28.json#L214) | 重写微分段案例：误归App后只开放允许的8443，5432仍拒绝，再验证纠正归组后的结果。 |
| D11 | 已修正 | [ICT-046.03](../../content/rewrite/out/batch-27.json#L109) | 区分对象管理/更新单位与范围读取，补充S3 Range官方来源。 |
| D12 | 已修正 | [ICT-046.03](../../content/rewrite/out/batch-27.json#L109) | 区分客户机虚拟块盘与后端NFS等文件存储，删除文件接口不能承载系统盘的绝对化说法。 |
| D14 | 已修正 | [ICT-048.01](../../content/rewrite/out/batch-29.json#L32) | 区分外层以太网/UDP和RDMA可靠传输，说明网卡重传，删除无条件丢包率/性能倍数。 |
| D15 | 已修正 | [ICT-050.04](../../content/rewrite/out/batch-30.json#L371) | 区分同Pod容器重启和Pod被替换，地址变化改为可能而非必然。 |
| D16 | 已修正 | [ICT-050.04](../../content/rewrite/out/batch-30.json#L371) | 标准NetworkPolicy按允许集合相加，评估顺序不影响结果；插件扩展另行限定。 |
| D17 | 已修正 | [ICT-050.02](../../content/rewrite/out/batch-30.json#L287) | 区分反向新连接与已许可连接响应，并注明无状态ACL的额外回程要求。 |
| D18 | 已修正 | [ICT-054.05](../../content/rewrite/out/batch-29.json#L425) | 按业务恢复时间目标、数据损失时间窗口解释RTO/RPO；不再用第三条线路替代站点级灾备。 |
| D19 | 已修正 | [ICT-054.02](../../content/rewrite/out/batch-29.json#L296) | 明确二层/三层VNI和作用域，同域二层VNI不复用给需隔离租户，重写检查并同步故障提示。 |
| D20 | 已修正 | [switch-security-04](../../content/visualizations.json#L9382) | MAC漂移动画统一为p1→p3，保留p2的上联角色。 |
| D21 | 已修正 | [ICT-055.02](../../content/rewrite/out/batch-31.json#L232) | 本机成功仅作对照，不据此排除针对远端的本地策略和上联映射。 |
| D22 | 已修正 | [ICT-035.07](../../content/rewrite/out/batch-06.json#L472) | DHCP可收集多个Offer按客户端策略选择，不再声称协议要求先到先得。 |
| SEC-01 | 已修正 | [ICT-044.02](../../content/rewrite/out/batch-33.json#L70) | 区分SRv6普通过境节点和当前SID端点，仅端点按行为消费SID。 |
| SEC-02 | 已修正 | [ICT-044.02](../../content/rewrite/out/batch-33.json#L70) | 把逐跳隧道状态的比较对象限定为RSVP-TE，不再泛指所有隧道。 |
| SEC-03 | 已修正 | [ICT-059.02](../../content/rewrite/out/batch-14.json#L337) | 限速上限可在物理链路空闲时生效，带宽保证/调度的竞争验证另列，并同步元数据。 |
| SEC-04 | 已修正 | [ICT-070.03](../../content/rewrite/out/batch-17.json#L107) | 区分功能授权和特征升级订阅，到期行为按产品核对，不再推断一律停检。 |
| SEC-05 | 已修正 | [ICT-070.01](../../content/rewrite/out/batch-17.json#L31) | 分开取证顺序与报文处理顺序，明确本例DNAT、路由/策略、SNAT的关系。 |
| SEC-06 | 已修正 | [ICT-070.04](../../content/rewrite/out/batch-17.json#L145) | 文件类型识别案例明确授权TLS解密位置；未解密时只按实际可见元数据判断。 |
| SEC-07 | 已修正 | [ICT-058.01](../../content/rewrite/out/batch-14.json#L32) | 说明策略变化/应用识别可能触发会话重匹配，新旧连接分别验证。 |
| SEC-08 | 已修正 | [ICT-061.02](../../content/rewrite/out/batch-13.json#L333) | 正常HTTPS安全指示基于域名身份验证，不担保经营者或页面可信，仍核对地址栏。 |
| SEC-10 | 已修正 | [ipsec-ike-phases](../../content/visualizations.json#L3266) | 演示限定IKEv1，并在边界说明IKEv2初始与CHILD_SA交换的不同。 |
| SEC-11 | 已修正 | [ICT-070.02](../../content/rewrite/out/batch-17.json#L69) | 区分路由型和策略型IPsec，不再一律要求虚拟隧道接口。 |
| SEC-12 | 已修正 | [ICT-073.04](../../content/rewrite/out/batch-35.json#L135) | 专线按链路、双向路由和授权验收；另叠加加密时才核对加密参数。 |
| SEC-13 | 已修正 | [ICT-057.03](../../content/rewrite/out/batch-13.json#L190) | 号码示例改为隐藏中间四位，末尾1234仍可见。 |
| SEC-14 | 已修正 | [ICT-065.02](../../content/rewrite/out/batch-16.json#L84) | 按源事件时间而非没有给出的入库时间解释时钟偏差案例。 |
| W01 | 已修正 | [ICT-074](../../content/rewrite/out/batch-18.json#L4) | 同SSID不直接排除动态VLAN等差异，补齐实际授权/租约/路径证据再判断relay。 |
| W02 | 已修正 | [ICT-075](../../content/rewrite/out/batch-18.json#L17) | 扩容结论取决于空口、中心与上联的实际瓶颈，保留上联有余量时新增独立射频可增吞吐。 |
| W03 | 已修正 | [ICT-075](../../content/rewrite/out/batch-18.json#L17) | Mesh airtime按射频、信道、干扰范围计算，独立信道与硬件支持下可并行。 |
| W04 | 已修正 | [ICT-078](../../content/rewrite/out/batch-19.json#L4) | 区分Portal接入口令与WPA/WPA2密钥建立、空口数据保护。 |
| W05 | 已修正 | [ICT-078](../../content/rewrite/out/batch-19.json#L4) | 逐条说明四次握手M1—M4，M2已有SNonce与MIC。 |
| W06 | 已修正 | [ICT-078](../../content/rewrite/out/batch-19.json#L4) | EAP-TLS补充受信服务器名称和适用版本的撤销检查。 |
| W07 | 已修正 | [ICT-079](../../content/rewrite/out/batch-20.json#L4) | BSSID标识BSS，一个射频可提供多个VAP/BSSID，相关规划/运维章节一并同步。 |
| W08 | 已修正 | [ICT-076](../../content/rewrite/out/batch-20.json#L17) | 允许VRRP地址拥有者配置，具体WAC模式另核对。 |
| W09 | 已修正 | [ICT-076](../../content/rewrite/out/batch-20.json#L17) | 相同优先级有协议平局规则，避免把同优先级直接归为抖动原因。 |
| W10 | 已修正 | [ICT-081](../../content/rewrite/out/batch-20.json#L30) | 二/三层漫游按接入业务网络和路径机制分类，两者都可保持IP，正文和演示同步。 |
| W11 | 已修正 | [ICT-082](../../content/rewrite/out/batch-21.json#L4) | 区分标准Wi-Fi邻网竞争与不遵守802.11规则的非Wi-Fi干扰源。 |
| W12 | 已修正 | [ICT-082](../../content/rewrite/out/batch-21.json#L4) | 普通新增用户达到自身门限即拒绝，不能填满漫游预留区间；说明总门限过高的真实代价。 |
| W13 | 已修正 | [ICT-085](../../content/rewrite/out/batch-23.json#L4) | 无AAAA时没有IPv6目的候选，另查DNS超时/失效AAAA，重写双栈验收案例。 |
| W14 | 已修正 | [ICT-094](../../content/rewrite/out/batch-26.json#L4) | BSSID未变不能排除漫游失败，变了也不一定换物理AP；补查切换过程证据。 |
| W15 | 已修正 | [ICT-082](../../content/rewrite/out/batch-21.json#L4) | 改为终端听到AP、AP不能可靠收到终端上行，纠正检查答案方向。 |
| W16 | 已修正 | [ICT-079](../../content/rewrite/out/batch-20.json#L4) | CAPWAP支持NAT穿越，检查映射/端口/回程和版本条件，不以源地址改写本身定错。 |
| G01 | 已修正 | [wpa3](../../content/rewrite/out/glossary.json#L740) | WPA3词库区分SAE、PMK、后续四次握手、PMF与Enhanced Open。 |
| G02 | 已修正 | [bss](../../content/rewrite/out/glossary.json#L638) | BSS词库不再承诺必然纯二层互访，补业务VLAN、子网和转发/隔离条件。 |
| Q01 | 已澄清 | [ICT-032.02](../../content/rewrite/out/batch-12.json#L194) | 澄清IGMP计时器有默认值与约束，也有可配置项；调整需验证相容性。 |
| Q02 | 已澄清 | [ICT-057.02](../../content/rewrite/out/batch-13.json#L153) | 明确使用NIST CSF2.0，列入治理Govern在内的六项功能。 |
| Q03 | 已澄清 | [ICT-047.01](../../content/rewrite/out/batch-27.json#L193) | 按OpenStack组件描述数据库、消息代理、HTTP API及内部RPC依赖，避免每服务必有一套的概括。 |

## 验证边界

本轮未连接赛事设备执行CLI，也未测真实硬件故障收敛、吞吐或无线覆盖。文中型号、许可、平台扩展和会话重匹配差异继续按版本限定；性能数字没有实测依据时删除或改为条件描述。自动检查仍有72条启发式内容告警，主要涉及术语覆盖、可读性或重复提示，不能因此宣称全站已获技术认证。
