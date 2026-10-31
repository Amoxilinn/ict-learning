# 全章节知识内容准确性审查

> 修订状态说明：以下为修订前的审查快照。报告所列76项问题及3项待核表述现已处理，当前结果与逐项清单见[修订与验证记录](content-accuracy-fixes-2026-10-31.md)。原文引述和原始行号保留用于追溯。

审查日期：2026-10-31（北京时间）。仓库基线：`d611c27`。本轮仅审查，没有修正正文、配置、图示、实验或生成文件，也没有发布。新增文件只有本报告。

## 结果

**完整阅读检查覆盖 94 章、322 个知识点，合并后记录 76 项确认错误或明确误导，另有 3 项待核。** 76 是去重后的问题条目数，不是有问题的章节数；同一错误在正文、检查、词库和图示重复出现时尽量归在一项。其中 4 项为 P3 局部文字、前缀或案例标注问题，其余涉及机制、条件、案例推导或配置说明。

| 分组 | 章节 | 知识点 | 确认问题 |
| --- | ---: | ---: | ---: |
| 基础、交换、路由、IPv6、WAN、MPLS、组播 | 33 | 86 | 24 |
| 园区身份与管理、数据中心 | 19 | 76 | 21 |
| 安全与综合方案 | 21 | 77 | 13 |
| WLAN 与相关共享术语 | 21 | 83 | 18 |
| 合计 | 94 | 322 | 76 |

P1：优先处理的主干机制错误；P2：具体技术结论、案例或关键条件误导；P3：局部标注/文字错误。级别是修订优先级，不是已经发生的现网事故等级。本文把“事实写反”“条件不全导致结论过强”“案例无法推出结果”分别解释，不把所有项目都当作同一种硬错误。

## 建议优先复核的内容

| 条目 | 位置 | 主要问题 |
| --- | --- | --- |
| R01、R02 | ICT-007 STP | 将树上链路也说成一端必须阻塞；优先级0的根仍在，却让4096接入设备抢根。 |
| R04 | ICT-025 SR-MPLS | 把不同SRGB说成标签必然无法接续，标准允许异构SRGB。 |
| R13 | ICT-010 OSPF演示 | Loading、请求列表、重传列表和Full条件混淆。 |
| D10 | ICT-045 微分段案例 | 只许可Web→App:8443，却由误归组推出Web可访问5432，推导不成立。 |
| D16、D17 | ICT-050 容器网络/策略 | 将NetworkPolicy解释为顺序匹配；混淆反向新连接和已有连接响应。 |
| SEC-05、SEC-06 | ICT-070 安全排障 | NAT处理顺序前后矛盾；无解密前提却用HTTPS文件类型解释命中。 |
| W04、W05 | ICT-078 WLAN安全 | 否认密码安全模式的空口数据保护；四次握手MIC时点错误。 |
| W08—W10 | ICT-076、081 | VRRP地址拥有者与平局规则错误；用IP是否变化区分二/三层漫游。 |

## 审查方式与验证结果

- 按36批manifest分配给主审和3个并行子智能体，检查全部章导语/小结、知识点正文、案例和理解检查；再核对相关技术元数据、命令前提、故障说明、术语、演示和配套实验。
- 对可疑协议事实查询RFC、华为及其他厂商官方文档；文内数值和规则矛盾直接复算。各条列出原文、文件行号、正确条件、依据与置信度。可解释的教学简化和已经明确标注的模型边界，没有仅因“不像实机”就判错。
- 全部36批out与合并教学数据逐项一致：94章、322点无差异。`dist/content.json`、`dist/units.json`的教学字段与合并数据一致；当前`dist/teaching-data.js`中的演示、词库和实验也与源数据一致。因此以下问题涉及当前网站生成数据，而非仅历史草稿。
- 只读运行`python3 scripts/audit_content.py`：0 error、70 warning；`python3 scripts/validate_glossary.py`：0 error、0 warning。它们验证结构/覆盖/术语，不证明技术结论正确。70条结构告警未直接计入76项技术发现。
- 没有运行冻结、合并、构建或发布；没有连接赛事设备执行命令。未将缺少实机记录本身计作错误。

## 一、基础、交换、路由、WAN与组播：24项

### R01 · P1 · ICT-007.01：把所有链路都讲成一端必须阻塞

- 位置：[content/rewrite/out/batch-02.json:337](../../content/rewrite/out/batch-02.json#L337)
- 原文：“一条链路上两个端口不会都转发……一个是指定端口，另一个就被阻塞。”
- 问题：正常树上的指定端口—根端口链路，两端都处于转发状态，否则树上的业务也不通。只需阻塞造成冗余环路的非指定端口，不能把“每段一个指定端口”推成“每段另一端阻塞”。
- 依据：[华为 STP 原理](https://info.support.huawei.com/info-finder/encyclopedia/en/STP.html)，明确根端口和指定端口都转发。
- 置信度：高。

### R02 · P1 · ICT-007.02：根桥优先级 0 仍在，却让优先级 4096 的接入抢根

- 位置：[content/rewrite/out/batch-02.json:391](../../content/rewrite/out/batch-02.json#L391)、`:394`
- 原文：设定“C1 主根（优先级 0）”；随后“A 的优先级变成 4096……A 取代 C2 成为新的根桥”。
- 问题：案例没有 C1 故障/退出这一条件，C1 的优先级 0 仍优于 A 的 4096；C2 本来也是备根。因此修改 A 不能引出后续“根换到接入、核心直连阻塞”的结论。
- 依据：[华为 STP 选举](https://info.support.huawei.com/info-finder/encyclopedia/en/STP.html)。
- 置信度：高。

### R03 · P2 · ICT-006.02：CSS 案例将大小比较结果写反

- 位置：[content/rewrite/out/batch-02.json:564](../../content/rewrite/out/batch-02.json#L564)
- 原文：“A 是 200，B 是 100。CSS 的优先级数值越大越优先，所以 B 胜出。”
- 问题：按本句给出的优先级条件应是 A 更优。CSS 还会先比较启动先后，修改优先级也不代表运行中的主备立即抢占；案例既未交代启动时点，又直接用 200>100 推出 B，更改 A 为更大值的后续步骤也没有成立基础。
- 依据：[华为 CSS 主设备选举](https://info.support.huawei.com/info-finder/encyclopedia/en/CSS.html)，先启动者优先，同时启动才比较 CSS 优先级。
- 置信度：高。

### R04 · P1 · ICT-025.02：把不同 SRGB 当作标签无法接续的必然原因

- 位置：[content/rewrite/out/batch-10.json:120](../../content/rewrite/out/batch-10.json#L120)、`:129`、`:137`
- 原文：“同一个 SID 在不同 SRGB 下映射出的本地标签不同，标签栈就无法逐跳接续。”
- 问题：SR-MPLS 支持不同节点使用不同 SRGB；节点依据 SID 索引及下一跳通告的 SRGB 计算出标签，正常 swap 就会接续。统一 SRGB 可以简化运维，但不能据 R3=17000、其他=16000 就断言 R2 无映射而丢包。真实错误应是 SRGB 未正确通告/解析、索引越界或转发表编程出错等。
- 依据：[RFC 8660 §2.8、§2.10 和附录 A.1](https://www.rfc-editor.org/rfc/rfc8660.html#section-2.8)，以不同节点 SRGB 计算出标签的示例。
- 置信度：高。

### R05 · P2 · ICT-002.09：将续租起点放在租约到期

- 位置：[content/rewrite/out/batch-01.json:184](../../content/rewrite/out/batch-01.json#L184)
- 原文：“租期到了就要续。”
- 问题：正常客户端在租约到期前的 T1 开始向原服务器续租，T2 后广播重绑定；到期仍未成功必须停止使用地址。默认 T1 为租期 50%，T2 为 87.5%。现写法会让读者以为地址可一直使用到到期后再续。
- 依据：[RFC 2131 §4.4.5](https://www.rfc-editor.org/rfc/rfc2131.html#section-4.4.5)。
- 置信度：高。

### R06 · P2 · ICT-002.09：DHCP 动画把服务器提交租约推迟到客户端收到 ACK

- 位置：[content/visualizations.json:1248](../../content/visualizations.json#L1248)、`:1271`（dhcp-dora）
- 原文：“送达之前两边的租约状态都还没变”；“客户端装上地址……服务器正式记下租约。”
- 问题：服务器在接受 DHCPREQUEST 后提交绑定，再发送 DHCPACK；客户端收到 ACK 后才配置是另一个时点。DHCP 不存在 ACK 的交付确认让服务器得知客户端已收妥。动画的服务端状态先后顺序错误；ACK 丢失时服务器也可能已有租约。
- 依据：[RFC 2131 §3.1 第4、5步及 Figure 3](https://www.rfc-editor.org/rfc/rfc2131.html#section-3.1)。
- 置信度：高。

### R07 · P2 · ICT-002.03：把 UDP 保留消息边界写成一次读取必得完整消息

- 位置：[content/rewrite/out/batch-01.json:277](../../content/rewrite/out/batch-01.json#L277)
- 原文：“应用交一份，接收端就收到一份，读一次就是一份完整消息。”
- 问题：边界保留不保证交付，也不保证应用给的接收缓冲足够大。常见 socket API 在缓冲太小时截断数据报并丢弃尾部/报告长度错误；不能用这句话指导程序按任意缓冲大小读取。
- 正确条件：成功送达且应用缓冲足够时，按独立数据报读取，不能像 TCP 那样靠后续读取取得同一数据报的剩余部分。
- 依据：[Microsoft recvfrom 官方 API 文档](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-recvfrom)。
- 置信度：高。

### R08 · P2 · ICT-018.01：称邻居发现相关消息全部使用组播

- 位置：[content/rewrite/out/batch-03.json:377](../../content/rewrite/out/batch-03.json#L377)
- 原文：列出 RS/RA、NS/NA、DAD 后称“这些消息都走 IPv6 组播”。
- 问题：普通地址解析的 solicited NA 通常单播回 NS 源；邻居可达性探测也可发送单播 NS，回应 RS 的 RA 亦可以单播。DAD 源地址未指定等情况才使用相应组播回应。不能把“IPv6 无广播”推成“ND 全部组播”。
- 依据：[RFC 4861 §6.2.6、§7.2.4、§7.3](https://www.rfc-editor.org/rfc/rfc4861.html#section-7.2.4)。
- 置信度：高。

### R09 · P2 · ICT-018.03：DHCPv6 示例凭租约得到 /64，并在未收到 RA 时推导同前缀 DNS 直连

- 位置：[content/rewrite/out/batch-03.json:486](../../content/rewrite/out/batch-03.json#L486)（案例 setup 与其后 steps）
- 原文：“通过 DHCPv6 得到 2001:db8:10::100/64……能 ping 通 DNS”；后称主机从未收到 RA。
- 问题：IA_NA 地址分配不下发这种 IPv4 式子网掩码，也不能仅根据租来的地址推导一个 on-link /64。案例若 RA 全被阻断、又无静态 on-link 路由，不能保证主机直接解析 2001:db8:10::53。需要另行说明 on-link 前缀来自 PIO L=1 或静态配置，并区分“RA 不提供默认路由”和“完全没有 RA”。
- 依据：[RFC 5942 §3、§4](https://www.rfc-editor.org/rfc/rfc5942.html#section-4)，地址分配与 on-link 判断必须分离。
- 置信度：高。

### R10 · P2 · ICT-011.01：要求两端 OSPFv3 进程号相同

- 位置：[content/rewrite/out/batch-04.json:88](../../content/rewrite/out/batch-04.json#L88)
- 原文：“先查互联接口有没有加入同一个进程、同一个区域和同一个实例”。
- 问题：OSPFv3 process ID 是本机配置标识，两台设备可以不同；需要一致的是链路上的 Area ID、报文 Instance ID 等参数。将 process ID 与 Instance ID 并列要求一致会造成无谓改配置。
- 依据：[RFC 5340 §2.4、A.3.1](https://www.rfc-editor.org/rfc/rfc5340.html#section-2.4)；[Arista 官方 OSPFv3 文档明确邻居 process ID 可不同](https://www.arista.com/en/um-eos/eos-open-shortest-path-first-version-3?searchword=eos+27+3+configuring+ospfv2)。RFC 报文头只有 Instance ID，没有本地进程号。
- 置信度：高。

### R11 · P2 · ICT-011.01：把已存在的直连 /64 说成邻接恢复后才出现

- 位置：[content/rewrite/out/batch-04.json:97](../../content/rewrite/out/batch-04.json#L97)
- 原文：“邻居建立并同步，随后 R1 的路由表出现 2001:db8:12::/64。”
- 问题：setup 已给 R1 接口 2001:db8:12::1/64，且互 ping 正常，该 /64 在邻接失败时已是 Direct。邻接恢复不应以互联网段“新出现”来证明 OSPF 学路。该项目 labs.json 的对应实验反而已正确强调 /64 为 Direct，形成内部冲突。
- 依据：[华为 IP 路由：活动接口自动生成直连路由](https://info.support.huawei.com/info-finder/encyclopedia/en/detail?action=queryEntityDetail&keyword=IP+routing)。
- 置信度：高。

### R12 · P2 · ICT-010.01：理解检查把所有“非 DR”都当成 DROther

- 位置：[content/rewrite/out/batch-03.json:220](../../content/rewrite/out/batch-03.json#L220)
- 原文：“两台非 DR 的路由器……停在 2-Way……通常不需要”。
- 问题：BDR 也是“非 DR”，但 BDR 与 DROther 应建立 Full 邻接。长期 2-Way 正常的准确条件是两端都是 DROther；此题漏掉 BDR 会直接影响故障判断。
- 依据：[RFC 2328 §10.4](https://www.rfc-editor.org/rfc/rfc2328.html#section-10.4)。
- 置信度：高。

### R13 · P2 · ICT-010.01：OSPF 动画混淆 Loading、LSR 应答及重传列表

- 位置：[content/visualizations.json:1745](../../content/visualizations.json#L1745)、`:1754`、`:1764`（ospf-neighbor）
- 原文：应答 LSR 的 LSA “挂在重传列表上等确认”；A 为“Loading：已发 LSU，等确认”，收到 LSAck 后才两端 Full。
- 问题：Loading 表示本机仍请求尚未收到的较新 LSA，不能因“发完 LSU 等对方 ACK”进入 Loading。Full 条件是数据库描述交换完成且本机 Link State Request list 清空；重传列表等待确认不是此门槛。此外 RFC 2328 §10.7 明确，直接应答 LSR 的 LSAs 不应加入该邻居的重传列表。是协议状态逻辑错误，无法由“压缩观察点”解释。
- 依据：[RFC 2328 §10.3、§10.7、§10.9](https://www.rfc-editor.org/rfc/rfc2328.html#section-10.7)。
- 置信度：高。

### R14 · P2 · ICT-012.01：跨区域只把一端改成 L2 无法建立 L2 邻接

- 位置：[content/rewrite/out/batch-04.json:169](../../content/rewrite/out/batch-04.json#L169)
- 原文：“两端都设成 L1……想让不同区域的设备相连……把其中一端放到 L2”。
- 问题：另一端仍为 L1-only，不具备共同 L2 能力，跨区域邻接仍不能建立。应保证相连两端均有 L2 能力（L2-only 或 L1/L2）及接口层级相容；后面案例其实正确展示了两端都改的必要，正文与案例矛盾。
- 依据：[华为 IS-IS 层级与邻接规则](https://info.support.huawei.com/info-finder/encyclopedia/en/IS-IS.html)。
- 置信度：高。

### R15 · P2 · ICT-028.01：称改 TCP MSS 后同尺寸 ping 恢复

- 位置：[content/rewrite/out/batch-09.json:303](../../content/rewrite/out/batch-09.json#L303)
- 原文：“调整隧道 MTU 或 TCP MSS，再测 1400 字节，ping 恢复”。
- 问题：TCP MSS 只影响 TCP 报文段，不改变 ICMP Echo 大小或 GRE 对 ICMP 的封装开销。不能把 MTU 与 MSS 当作对 1400 字节 ping 等价的修复。降低隧道 MTU是否使同尺寸 ICMP成功还取决于 DF、分片与 PTB 处理，应分别验证。
- 依据：[华为 MTU 与 TCP MSS 区别](https://info.support.huawei.com/info-finder/encyclopedia/en/MTU.html)。
- 置信度：高。

### R16 · P2 · ICT-033.01 / RPF 词条：将 RPF 统一描述为朝源 S 查单播表

- 位置：[content/rewrite/out/batch-12.json:244](../../content/rewrite/out/batch-12.json#L244)；[content/glossary.json:1520](../../content/glossary.json#L1520)、`:1522`（也影响该词条 beginner/plain）。
- 原文：“拿源地址去查单播路由……不一致就丢弃”；词条“入接口是否指向组播源”。
- 问题：本节明确以 PIM-SM 为主并讲共享树，但共享树 RPT 的 RPF 参照是 RP，源树 SPT 才通常参照源 S；MRIB 还可能由专门组播路由信息构成，不能一概等于普通单播表。正文这段及词条会把合法从 RP 方向来的共享树流量判成错误。
- 依据：[RFC 7761 §4.2（PIM-SM，替代 RFC4601）](https://www.rfc-editor.org/rfc/rfc7761.html#section-4.2)；已直接核对同机制 [RFC 4601 §4.2](https://www.rfc-editor.org/rfc/rfc4601.html#section-4.2)，区分 RPF_interface(S) 与 RPF_interface(RP)。
- 置信度：高。

### R18 · P2 · ICT-013.01 / .02：BGP 配置前提的精确路由与 network 命令不匹配

- 位置：[content/units-network-core.json:2186](../../content/units-network-core.json#L2186)、`:2188`；`:2255`、`:2257`
- 原文：IPv4 network 为 `192.168.10.0/24`，notes 却只给 `192.168.1.0/24`；IPv6 network 为 `2001:db8:10::/64`，notes 给 `2001:db8:1::/64`。
- 问题：按写明前提准备实验，无法满足精确路由注入条件，邻居虽建立但前缀不发布。应使“本机已有精确路由”与实际 network 前缀一致。两处为同类拷贝错误，合并记录。
- 依据：[华为 BGP Network 方式按指定前缀/掩码注入](https://info.support.huawei.com/info-finder/encyclopedia/en/BGP.html)；正文 ICT-013.01 亦已正确讲精确匹配。
- 置信度：高。

### R19 · P2 · ICT-015.02：精确 /24 的命令被注释成另一条 10/8 范围规则

- 位置：[content/units-network-core.json:2577](../../content/units-network-core.json#L2577)、`:2579`
- 原文：命令 `ip ip-prefix LAB index 10 permit 192.168.1.0 24`，notes 称“匹配地址落在10/8且长度16—24的路由”。
- 问题：本命令只匹配 192.168.1.0/24；10/8 内 /16—/24 是上一知识点的另一条命令。读者按注释推演会得到相反的放行集合。
- 依据：[华为前缀列表与前缀/掩码范围](https://support.huaweicloud.com/intl/en-us/usermanual-er/rc_01_0015.html)；本项目 ICT-015.02 正文也明确无长度扩展时精确匹配。
- 置信度：高。

### R20 · P2 · ICT-023.03：时钟偏差只给大小却固定做减法

- 位置：[content/rewrite/out/batch-12.json:138](../../content/rewrite/out/batch-12.json#L138)、`:139`
- 原文：问题仅给“两端时钟相差 8 微秒，测得单向时延 20 微秒”，答案固定“约 12 微秒”。
- 问题：没有说明接收端时钟比发送端快还是慢。接收端快 8 才是 20−8=12；接收端慢 8 则真实为 20+8=28。现题条件不足，正确答案不能唯一为12。units 原例明确“出口钟快8”而重写理解检查丢了方向。
- 依据：[RFC 7679 §3.7.1（时钟误差对单向时延测量的影响）](https://www.rfc-editor.org/rfc/rfc7679.html#section-3.7.1)；数值正负关系可直接由时间戳差推导。
- 置信度：高。

### R21 · P2 · ICT-026 / MPLS 词条：笼统声称标签路径与 IP 路由相互独立

- 位置：[content/glossary.json:463](../../content/glossary.json#L463)、`:465`
- 原文：“形成的标签交换路径与 IP 路由选择相互独立。”
- 问题：显式 TE 路径可以偏离 IGP 最短路径，但常见 hop-by-hop LDP LSP 正是根据 IP/IGP 下一跳建立；不能把不逐包查目的 IP 等同于路径选择不依赖 IP 路由。与 ICT-026.02 正文“LDP 发标签，IGP 定下一跳”直接矛盾。
- 依据：[RFC 5036 摘要、§2.6、§2.7](https://www.rfc-editor.org/rfc/rfc5036.html)。
- 置信度：高。

### R22 · P2 · ICT-024 / PPP 词条：把 NCP 讲成网络层数据承载

- 位置：[content/glossary.json:710](../../content/glossary.json#L710)、`:712`
- 原文：“用 NCP 承载网络层协议”。
- 问题：NCP 是建立、配置相应网络层协议参数的控制协议集合（如 IPCP）；业务 IP 数据报由 PPP 封装承载，不是套在 NCP 报文里。词条混淆控制协商和数据封装，与本章正文相冲突。
- 依据：[RFC 1661 摘要、§1、§3.6](https://www.rfc-editor.org/rfc/rfc1661.html#section-3.6)。
- 置信度：高。

### R23 · P2 · ICT-019 / NAT64 词条：把一般动态映射限制写成只能 IPv6 发起

- 位置：[content/glossary.json:1556](../../content/glossary.json#L1556)、`:1558`
- 原文：“它维护有状态映射，只支持由 IPv6 侧发起的连接。”
- 问题：这是典型动态 stateful NAT64 的一般情形；RFC6146 已明确静态绑定或附加机制可支持 IPv4 侧发起。更不应将所有 NAT64 一概定义成仅有这种状态形态。应保留“常见动态有状态模式、未配置静态绑定时”的前提。A→AAAA 合成语句可理解为与 DNS64 配合后的描述，单独没有列为另一个错误。
- 依据：[RFC 6146 §1.2](https://www.rfc-editor.org/rfc/rfc6146.html#section-1.2)。
- 置信度：高。

### R24 · P3 · ICT-009.02：案例将 /30 直连链路写成 /24

- 位置：[content/rewrite/out/batch-03.json:135](../../content/rewrite/out/batch-03.json#L135)
- 原文：setup R2—R3 为 `10.0.23.0/30`，步骤却称 R3 直连 `10.0.23.0/24`。
- 问题：同一个地址规划前后不一致，影响读者核对路由输出和掩码。应保持 /30；不影响本案例“缺少 LAN 回程”的主结论。
- 依据：[RFC 4632 §3.1 前缀长度定义](https://www.rfc-editor.org/rfc/rfc4632.html#section-3.1)；主要证据是同一案例给定条件直接矛盾。
- 置信度：高。

### R25 · P3 · ICT-008.02：CIST 英文及中文展开错误

- 位置：[content/rewrite/out/batch-02.json:458](../../content/rewrite/out/batch-02.json#L458)
- 原文：“CIST（Common Internal Spanning Tree，公共内部生成树）”。
- 问题：CIST 是 Common **and** Internal Spanning Tree（公共和内部生成树），由区域间 CST 和各区域 IST 组成；当前写法也容易把 CIST 与区域内部 IST 混淆。
- 依据：[Juniper 官方 MSTP 文档](https://www.juniper.net/documentation/us/en/software/junos/stp-l2/topics/topic-map/spanning-tree-configuring-mstp.html)；[Cisco 官方 MSTP 文档](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960l/software/15-2_7_e/configuration_guide/b_1527e_consolidated_2960l_cg/m_1525e_mstp_cg.html)。
- 置信度：高。



## 二、园区管理与数据中心：21项

### D01 · P2 · ICT-034.01：同一未登记 NAS 却产生两种相互矛盾的认证结果

- 位置：[content/rewrite/out/batch-06.json:66](../../content/rewrite/out/batch-06.json#L66)。
- 原文：“SW1 的源地址 10.0.0.1 未在服务器上登记为合法 NAS”。
- 问题与正确条件：案例同时指定两人从同一 SW1 登录、SW1 未登记，却让 A 得到口令错误拒绝、B 超时。服务器先校验 RADIUS 客户端；无共享秘密的客户端请求必须丢弃，不会仅因用户名不同而让 A 正常进入凭据校验。须给两人不同的 NAS/服务器条件才能产生该对照。
- 依据：[官方资料](https://www.rfc-editor.org/rfc/rfc2865.html#section-2)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D02 · P2 · ICT-035.05：把不支持 MACsec 的中间设备等同于不能透传

- 位置：[content/rewrite/out/batch-06.json:408](../../content/rewrite/out/batch-06.json#L408)。
- 原文：“如果链路上串了一台不支持该功能的设备，这一段的保护就建立不起来”。
- 问题与正确条件：MACsec 端点之间可以存在不终结 MACsec、但支持所需二层协议和受保护帧透传的交换机。华为官方就给出这种部署。正文与案例把插入普通交换机必然协商失败写成定律，缺少“不支持所需透传”的关键条件。
- 依据：[官方资料](https://info.support.huawei.com/info-finder/encyclopedia/zh/MACsec.html)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D03 · P2 · ICT-036.01：把打印机无法认证归因于没有操作系统

- 位置：[content/rewrite/out/batch-07.json:70](../../content/rewrite/out/batch-07.json#L70)。
- 原文：“打印机没有操作系统，也装不了客户端软件”。
- 问题与正确条件：打印机通常有嵌入式系统，部分型号原生支持有线/无线 802.1X、EAP-TLS 或 PEAP。没有回复还可能是功能未启用或参数不匹配，不能从设备类别直接推断无法认证；本例应明确是假设该型号不支持 supplicant。boundary 对“哑终端”的括注也重复了此误解。
- 依据：[官方资料](https://support.hp.com/gb-en/document/ish_7813259-7813303-16)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D04 · P2 · ICT-036.04：旧端口残留权限不能解释新端口为何放行

- 位置：[content/rewrite/out/batch-07.json:197](../../content/rewrite/out/batch-07.json#L197)。
- 原文：“说明流量用的是旧位置残留的规则”。
- 问题与正确条件：案例将规则保留在三楼旧端口，却推断五楼未授权端口的流量因此放行。端口本地规则不会跨到另一个端口自动命中。新位置被放行还需给出全局身份映射残留、控制点仍按旧会话授权、默认放行或联动错误等条件；当前因果链断裂。
- 依据：[官方资料](https://info.support.huawei.com/info-finder/encyclopedia/zh/%E7%AD%96%E7%95%A5%E8%81%94%E5%8A%A8.html)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D05 · P2 · ICT-037.01：把 VRRP 接管说成必须改变终端 ARP 映射和上游路由

- 位置：[content/rewrite/out/batch-07.json:231](../../content/rewrite/out/batch-07.json#L231)。
- 原文：“终端的 ARP 表要更新，上游路由要重新收敛”。
- 问题与正确条件：常规 VRRP 接管保持虚拟 IP 与虚拟 MAC 映射；免费 ARP 主要让二层网络更新虚拟 MAC 的位置，也可刷新主机缓存，主机不必改成另一 MAC。上游路由是否收敛取决于独立拓扑与协议，并非 VRRP 接管的必需步骤。
- 依据：[官方资料](https://www.rfc-editor.org/rfc/rfc9568.html#section-8.2)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D06 · P2 · ICT-040.01：把先读取并比较当成幂等性的必要定义

- 位置：[content/rewrite/out/batch-08.json:316](../../content/rewrite/out/batch-08.json#L316)。
- 原文：“幂等来自“读现状、算差异、按需改”的设计”。
- 问题与正确条件：幂等性看相同操作重复后的预期效果是否与一次相同，不要求客户端一定先读后改。无条件设置固定值、HTTP PUT 或由服务端实现的幂等操作可以保持幂等。检查答案、正文和章小结把一种实现方法提升成必要条件，会误导读者判断脚本。
- 依据：[官方资料](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D07 · P2 · ICT-040.02：rpc-error 的解释遗漏可能部分生效的状态

- 位置：[content/rewrite/out/batch-08.json:353](../../content/rewrite/out/batch-08.json#L353)。
- 原文：“返回里出现 rpc-error，说明请求没有被接受”。
- 问题与正确条件：edit-config 的默认 stop-on-error 在首次错误停止；continue-on-error 还可继续处理，两者均不等于回滚此前成功的修改。原文“请求没有被接受”易让人理解为整次未生效，但不能作此保证。应按已协商的错误处理方式核对实际数据；rollback-on-error 是另外的可选能力。原文没有声称自动回滚，本条指出其解释缺少这一关键条件。
- 依据：[官方资料](https://www.rfc-editor.org/rfc/rfc6241.html#section-7.2)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D08 · P2 · ICT-040.02：把不支持 candidate 推成必然可以写 running

- 位置：[content/rewrite/out/batch-08.json:349](../../content/rewrite/out/batch-08.json#L349)。
- 原文：“不支持的设备只能直接改运行配置”。
- 问题与正确条件：candidate 与 writable-running 是不同的可选能力。没有 candidate 不代表支持 edit-config running；也不能由 candidate 存在推出 validate 可用。必须分别检查 hello 能力，正文当前二分法会引导发出不被支持的写请求。
- 依据：[官方资料](https://www.rfc-editor.org/rfc/rfc6241.html#section-8)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D09 · P2 · ICT-045.03：排除了 M-LAG 虚拟 VTEP 的合法设计

- 位置：[content/rewrite/out/batch-28.json:113](../../content/rewrite/out/batch-28.json#L113)。
- 原文：“每台设备的 VTEP 地址必须各自独立”。
- 问题与正确条件：独立 VTEP 常用独立地址，但华为 M-LAG 双归 VXLAN 可将两台物理设备虚拟成一个 VTEP，使用同一 VTEP IP 对外建隧道。前一节刚讲 M-LAG，本节的“必须、否则分不清”会把合法冗余方案当配置错误。
- 依据：[官方资料](https://info.support.huawei.com/info-finder/encyclopedia/zh/M-LAG.html)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D10 · P2 · ICT-045.06：微分段案例的访问结果不符合给定端口规则

- 位置：[content/rewrite/out/batch-28.json:243](../../content/rewrite/out/batch-28.json#L243)。
- 原文：“Web 竟然能连上它的 5432”。
- 问题与正确条件：给定规则只允许 Web→App:8443、App→DB:5432，其他默认隔离。即使 DB 被误分到 App，Web→该主机:5432 仍不满足 Web→App:8443，不能据此放行。必须同时存在宽泛许可等额外条件才会得到该结果。
- 依据：[官方资料](https://kubernetes.io/docs/concepts/services-networking/network-policies/)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D11 · P2 · ICT-046.03：对象存储读取不必下载整个对象

- 位置：[content/rewrite/out/batch-27.json:117](../../content/rewrite/out/batch-27.json#L117)。
- 原文：“取一个对象就是取整体”。
- 问题与正确条件：对象通常以对象为管理/更新单位，但可以支持范围读取，例如 S3 GetObject 的 Range 可返回指定字节区间。把更新粒度和读取粒度混为一谈，会误导大对象访问与带宽估算。
- 依据：[官方资料](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D12 · P2 · ICT-046.03 / ICT-046.04：混淆虚机看到的块盘与后端存储接口

- 位置：[content/rewrite/out/batch-27.json:117](../../content/rewrite/out/batch-27.json#L117)。
- 原文：“文件接口给的是目录，装不了系统”。
- 问题与正确条件：虚机可以看到虚拟块盘，而其磁盘镜像文件存放在 NFS 等文件数据存储上；文件存储可以承载可引导虚机系统盘。ICT-046.03 的“文件接口…装不了系统”也有同样问题。须区分客户机接口、虚拟磁盘格式、Hypervisor 后端访问协议。
- 依据：[官方资料](https://www.vmware.com/docs/vmw-best-practices-running-nfs-vmware-vsphere)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D14 · P2 · ICT-048.01：RoCE 丢包解释混淆外层封装与 RDMA 可靠传输

- 位置：[content/rewrite/out/batch-29.json:40](../../content/rewrite/out/batch-29.json#L40)。
- 原文：“问题在于这层封装自己不重传”。
- 问题与正确条件：以太网/UDP 外层本身不重传这一点成立，但可靠连接型 RDMA 传输可由网卡实现确认、超时与重传，现代实现还有选择性重传。原文随后虽说“上层等超时重发”，却没有交代该可靠传输层，把它用于解释整个 RoCE 的损失代价，容易让人误认为只能交给应用回退；“0.1% 丢包使训练一步拉长几倍”也未给测试条件或来源。应分清封装、RDMA transport 与应用，并限定性能数字。
- 依据：[官方资料](https://networking-docs.nvidia.com/doca/archive/3-5-0/enhanced-connection-establishment)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D15 · P2 · ICT-050.04：混淆容器重启与 Pod 重建

- 位置：[content/rewrite/out/batch-30.json:375](../../content/rewrite/out/batch-30.json#L375)。
- 原文：“一个容器重启，地址就换了一个”。
- 问题与正确条件：在同一 Pod 内按 restartPolicy 重启应用容器，并不意味着换一个 Pod 或分配新 Pod IP。Pod 被删除并替换、重新调度才是地址可能变化的常见场景；即使 Pod 重建也不能保证必然得到不同数值的地址。正文后段讲 Pod 重建更接近正确，但导语会留下错误心智模型。
- 依据：[官方资料](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D16 · P1 · ICT-050.04：把标准 Kubernetes NetworkPolicy 当成按顺序首条命中的 ACL

- 位置：[content/rewrite/out/batch-30.json:391](../../content/rewrite/out/batch-30.json#L391)。
- 原文：“命中顺序值得单独画一张图”。
- 问题与正确条件：标准 NetworkPolicy 的适用允许集合相加，求并集；评估顺序不影响结果。第三方插件的有序扩展策略应单独指明。本段接在 NetworkPolicy 后未给这种限定，与 ICT-053.02 配置说明中的叠加许可语义也不一致。
- 依据：[官方资料](https://kubernetes.io/docs/concepts/services-networking/network-policies/)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D17 · P2 · ICT-050.02：未区分反向新连接与已有连接响应

- 位置：[content/rewrite/out/batch-30.json:303](../../content/rewrite/out/batch-30.json#L303)。
- 原文：“很多连接失败是因为只配了单向许可，回程被默认拒绝”。
- 问题与正确条件：有状态防火墙、安全组和标准 NetworkPolicy 通常自动允许已许可连接的响应；允许 Web 发起到 App 的连接，不代表允许 App 发起新连接，但不要求为该连接响应另写对称新连接许可。原文漏掉无状态 ACL/策略这一前提，容易诱使读者扩大授权。
- 依据：[官方资料](https://kubernetes.io/docs/concepts/services-networking/network-policies/)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D18 · P2 · ICT-054.05：把 RTO/RPO 当作已测得的网络恢复量和数据量

- 位置：[content/rewrite/out/batch-29.json:445](../../content/rewrite/out/batch-29.json#L445)。
- 原文：“网络恢复时间（RTO）”。
- 问题与正确条件：RTO 是恢复时间目标，关注业务恢复可接受的时间上限；RPO 是恢复点目标，通常用时间表示可接受的数据损失窗口。原文把 RTO 展开为网络恢复时间、把 RPO 展开为数据恢复点，缺“目标”，又称前者偏网络，会削弱它们作为跨应用/存储/网络业务容灾目标的含义。
- 依据：[官方资料](https://aws.amazon.com/what-is/recovery-time-objective/)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D19 · P2 · ICT-054.02：同 VNI 的隔离解释未区分二层/三层 VNI 与作用域

- 位置：[content/rewrite/out/batch-29.json:316](../../content/rewrite/out/batch-29.json#L316)。
- 原文：“两个租户用相同的 VNI，不会自动互通”。
- 问题与正确条件：VNI 相同并不保证任意未配置隧道的网络立即可达，但在同一 VXLAN 域/端点上下文中，二层 VNI 标识同一逻辑二层网段，不能将同一 L2 VNI 复用给不同租户后靠不同 VRF/RT 当然保住二层隔离。导语、正文和检查答案都未区分独立域复用、L2/L3 VNI 与本地映射约束，存在串租户风险；词库 vni 的定义反而明确同 VNI 同二层域。
- 依据：[官方资料](https://www.rfc-editor.org/rfc/rfc7348.html#section-4)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D20 · P2 · ICT-035.04：MAC 漂移动画前后给出的端口不同

- 位置：[content/visualizations.json:9399](../../content/visualizations.json#L9399)。
- 原文：“同一 VLAN 的同一源 MAC 先从 p1 学到，随后从 p2 出现”。
- 问题与正确条件：动画开头为 p1→p2，末步移动轨迹却为 p1→p3；p2 还被标为可信上联、p3 为陌生终端，端口身份影响排障判断。需要把同一演示的证据保持一致。
- 依据：项目内同一场景 steps 与 rows 可直接复核。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D21 · P2 · ICT-055.02：本地通信成功不能排除所有接入映射和策略问题

- 位置：[content/rewrite/out/batch-31.json:264](../../content/rewrite/out/batch-31.json#L264)。
- 原文：“因为同宿主机通信已经成功，问题不在接入侧”。
- 问题与正确条件：同宿主机流量可能留在 vSwitch，不经过物理上联；它不能证明上联 VLAN/BD/VNI、安全规则、目的网段所需映射正确。正文明确据此宣布本地策略正常并排除接入侧，会漏查仅影响跨宿主机/远端目的的规则和映射；仍须逐层验证。
- 依据：项目内 ICT-046.01、ICT-050.03 和 content/visualizations.json 的 virtual-host-path 已说明本地流量可绕过物理上联。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

### D22 · P2 · ICT-035.07：把 DHCP Offer 的先到先得写成协议规定

- 位置：[content/rewrite/out/batch-06.json:480](../../content/rewrite/out/batch-06.json#L480)。
- 原文：“谁先回，它就信谁”。
- 问题与正确条件：客户端可收集多个 Offer，再按实现策略选择一个并发送 DHCPREQUEST；没有规定必须接受最先返回的 Offer。非法服务器有机会被选中这一安全风险成立，但“谁先回就信谁”的必然性不成立；同站动画 switch-security-07 的边界反而已正确说明不能假定攻击者总赢。
- 依据：[官方资料](https://www.rfc-editor.org/rfc/rfc2131.html#section-3.1)。置信度：高（若为边界问题，指缺少所述条件的判断，而非已验证特定设备会发生故障）。

## 三、安全与综合方案：13项

### SEC-01 [P2] SRv6 被写成每经过一跳就推进一个 SID
- 知识点：ICT-044.02。
- 位置：[content/rewrite/out/batch-33.json:82](../../content/rewrite/out/batch-33.json#L82)。
- 原文：“报文每到一个节点就按当前段执行动作，然后把指针移到下一段。”
- 错误：段端点与普通过境节点混淆。普通 IPv6 过境路由器仅按当前目的地址转发，不消费 SID，也不得检查其下的路由扩展首部；只有当前 DA 对应的段端点执行 SID 行为并按行为更新 SL/DA。一个 SID 可以跨越多跳。
- 正确条件：改为“到达当前 SID 对应的段端点时”，并区分 transit。
- 依据：[RFC 8754 §3.2、§4.2、§4.3](https://www.rfc-editor.org/rfc/rfc8754.html#section-4.2)。置信度：高。

### SEC-02 [P2] 将所有传统隧道描述为逐跳维护隧道状态
- 知识点：ICT-044.02。
- 位置：[content/rewrite/out/batch-33.json:82](../../content/rewrite/out/batch-33.json#L82)。
- 原文：“传统隧道要在沿途每台设备上维护一段隧道状态。”
- 错误：GRE/IP-in-IP/IPsec 隧道的中间 IP 路由器通常仅转发外层 IP，无需维护该隧道的状态。逐跳信令与状态可用于对比 RSVP-TE 一类机制，不能代表传统隧道总类。
- 正确条件：限定具体比较对象，例如 RSVP-TE LSP，而不是“传统隧道”。
- 依据：[RFC 2784 §3](https://www.rfc-editor.org/rfc/rfc2784.html#section-3)、[RFC 4301 §5.1.2](https://www.rfc-editor.org/rfc/rfc4301.html#section-5.1.2)。置信度：高。

### SEC-03 [P2] 限速被说成只在资源不足时才起作用
- 知识点：ICT-059.02。
- 位置：[content/rewrite/out/batch-14.json:353](../../content/rewrite/out/batch-14.json#L353)；对应旧技术元数据也有“无拥塞时差异不明显”的笼统表述。
- 原文：“限速和保证本来就只在资源不足时起作用。”
- 错误：保证/调度优先级通常在争用时体现，但 policer/shaper 可在物理链路完全空闲时按配置速率丢弃/延迟超额流量。100M 空闲出口上对单类限 2M，仍应限制到约 2M。该句会使读者放弃空闲时段限速验证。
- 正确条件：区分限速上限与拥塞下的保证/队列竞争。
- 依据：[RFC 2475 §2.3.3.3–4](https://www.rfc-editor.org/rfc/rfc2475.html#section-2.3.3.3)。置信度：高。

### SEC-04 [P2] IPS 许可到期被说成直接停止检测
- 知识点：ICT-070.03。
- 位置：[content/rewrite/out/batch-17.json:119](../../content/rewrite/out/batch-17.json#L119)。
- 原文：“许可到期后设备通常还在转发，只是不再检测”。
- 错误：把功能授权、升级订阅和特征库版本混为一谈。华为 IPS 升级服务许可到期后，现有 IPS 功能仍可使用，失去的是特征更新；不能据此推断没有检测或不会产生告警。
- 正确条件：分别核对功能是否授权、引擎工作状态、现有特征库和升级订阅。若某产品确实到期停检，须给出型号版本限定。
- 依据：[华为 License 查询：IPS Update Service 到期仍可使用 IPS](https://info.support.huawei.com/info-finder/vue/search-center/en/enterprise/security/-pid-22460523/license-control-items)、[IPS6585FD V600R025C10 许可说明](https://info.support.huawei.com/info-finder/vue/search-center/zh/enterprise/security/ips6585fd-pid-257418675/license-control-items)。置信度：高。

### SEC-05 [P2] 排障章把 NAT 全部安排到策略与路由之后
- 知识点：ICT-070.01。
- 位置：[content/rewrite/out/batch-17.json:43](../../content/rewrite/out/batch-17.json#L43)。
- 原文：“对应报文在设备里的处理顺序……先……路由查找，然后匹配安全策略，命中后……执行地址转换”。
- 错误：该知识点元数据明示引用 USG6000E；同项目 ICT-058.02 也已正确说明目的 NAT 在策略/路由之前。此处将 SNAT 与 DNAT 合成一个后置步骤，会让服务发布排障使用错误目的地址。
- 正确条件：可将列表作为取证顺序，但不能声称是所有报文处理顺序；至少分开 DNAT、路由、策略与 SNAT。
- 依据：[华为安全策略：目的 NAT 先于安全策略、源 NAT 后于安全策略](https://info.support.huawei.com/info-finder/encyclopedia/en/detail?action=queryEntityDetail&keyword=Security+Policy)。置信度：高。

### SEC-06 [P2] 不可解密的 HTTPS 案例却以文件类型命中作解释
- 知识点：ICT-070.04；相关 ICT-064.04 的 HTTPS 真实类型识别案例也缺少解密前提。
- 位置：[content/rewrite/out/batch-17.json:170](../../content/rewrite/out/batch-17.json#L170)。
- 原文：“记录写的是文件类型命中；该站点走 HTTPS，设备只能看到域名和证书，判定只可能来自域名或文件类型两类规则。”
- 错误：同一句同时设定“只能看域名/证书”和“可依据文件类型”。未解密时文件头/载荷不可见，不能从 HTTPS 密文识别 PDF/EXE 真正内容类型。正文已承认这个限制，案例结论却与之矛盾。
- 正确条件：明确授权 TLS 解密/终结/端点检测，或将结论改为“需要确认日志是否来自另一解密点/其他规则”，不能直接以文件类型解释。
- 依据：[RFC 8446 §1](https://www.rfc-editor.org/rfc/rfc8446.html#section-1)。置信度：高。

### SEC-07 [P2] 防火墙策略被写成仅首包执行、老会话不受新策略影响的通则
- 知识点：ICT-058.01；ICT-070.01 也重复较绝对说法。
- 位置：[content/rewrite/out/batch-14.json:48](../../content/rewrite/out/batch-14.json#L48)、53。
- 原文：“规则只对新连接的首包起作用，老连接仍按会话走”；理解检查答：“规则只在新建连接的首包匹配时起作用”。
- 错误：缓存首包结果是常见机制，但策略变更后的 session rematch/重验证行为依产品与配置，应用识别完成也可能触发重匹配。本节 boundary 只限定默认动作/条件内多值，没有限定不重匹配会话。将新连接测试作为推荐方法合理，解释为通用必然机制不成立。
- 正确条件：表述为“某些产品/配置中旧会话可能沿用旧结果”，明确检查 session rematch。
- 依据：[Palo Alto 官方：How Session Rematch Works，PAN-OS 5.0 起默认启用](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000ClWVCA0)。置信度：高（跨厂商通则错误；未确认目标 USG 软件版本的变更行为）。

### SEC-08 [P2] 锁图标被明确说成不证明访问域名身份
- 知识点：ICT-061.02。
- 位置：[content/rewrite/out/batch-13.json:337](../../content/rewrite/out/batch-13.json#L337)、345。
- 原文：“小锁只说明这条连接被加密了，不说明对面是谁。真正回答‘对面是不是 vpn.example.test’的，是证书……”；另称“链可信但名称不符……小锁图标只反映……”。
- 错误：这不是只提醒“不保证商业可信”。无证书告警/未绕过验证的正常 HTTPS 安全指示，本身已经基于证书链和域名身份验证。域名不符不能仍按正常安全连接来解释图标；应区分“验证到了地址栏域名”和“该域名代表的经营者可信”。
- 正确条件：安全连接指示证明与已验证域名建立安全通道，不担保页面内容/企业诚信，用户还要检查地址是否是自己要找的域名。
- 依据：[Chromium 官方 DevTools 安全面板：绿色锁涉及证书验证和站点身份](https://blog.chromium.org/2016/01/introducing-security-panel-in-devtools.html?hl=en_GB)、[Chromium 官方锁图标更新说明：不代表网站可信](https://blog.chromium.org/2023/05/an-update-on-lock-icon.html)。置信度：高。

### SEC-10 [P2] 将 IKEv1 两阶段流程当作不分版本的 IKE 通用流程
- 知识点：ICT-062.01 配套图 ipsec-ike-phases。
- 位置：[content/visualizations.json:3274](../../content/visualizations.json#L3274)、3442（相关步骤标题“第一阶段”“第二阶段”）。
- 原文：“IKE 第一阶段先建成 IKE SA，第二阶段……IPsec SA”；boundary：“不区分 IKE 版本差异……按一台实现的叫法合并”。
- 错误：此流程是 IKEv1 语义；IKEv2 的 IKE_SA_INIT 和 IKE_AUTH 在最初交换中建立 IKE SA 与首对 CHILD_SA，后续 CHILD_SA 用 CREATE_CHILD_SA。“不区分版本”不能将协议顺序不同当作同一流程。
- 正确条件：最简单的边界是明确本图只演示 IKEv1，不泛化至 IKEv2。
- 依据：[RFC 7296 §1.2–1.3](https://www.rfc-editor.org/rfc/rfc7296.html#section-1.2)。置信度：高。

### SEC-11 [P2] 将 IPsec 引流统一说成必须路由指向隧道接口
- 知识点：ICT-070.02。
- 位置：[content/rewrite/out/batch-17.json:81](../../content/rewrite/out/batch-17.json#L81)。
- 原文：“流量要真的被送进隧道，靠的是路由指向隧道接口”。
- 错误：route-based IPsec 可以这样工作；policy-based IPsec 常将 IPsec policy 应用于物理出接口，普通路由先选择出口，再由安全策略数据库/选择器决定保护，没有必须配置的虚拟隧道接口。本教程前面按“感兴趣流”讲的正可为策略型。
- 正确条件：分策略型与路由型，不能让读者误以为找不到隧道接口就是配置故障。
- 依据：[RFC 4301 §4.4.1、§5.1](https://www.rfc-editor.org/rfc/rfc4301.html#section-4.4.1)、[华为 IPsec 原理的感兴趣流/策略匹配说明](https://info.support.huawei.com/info-finder/encyclopedia/zh/IPsec.html)。置信度：高。

### SEC-12 [P2] 专线替代 VPN 后仍要求“两端加密参数”照旧
- 知识点：ICT-073.04。
- 位置：[content/rewrite/out/batch-35.json:143](../../content/rewrite/out/batch-35.json#L143)。
- 原文：“验收四项……加密参数……用专线替代 VPN 时，第一项换成专线的链路与路由状态，另外三项照旧。”
- 错误：专线连接本身不必有加密协商、算法或密钥，“另外三项照旧”把专线和加密隧道绑定。专线可另叠 IPsec，此时才存在加密参数核验；项目 ICT-061.03 也已正确教导 VPN 名称不保证加密。
- 正确条件：专线场景将加密列为“是否另叠加加密、若有再核对”，不要求不存在的协议参数。
- 依据：[RFC 4364 §13：BGP/MPLS VPN 不提供密码隐私，需额外加密](https://www.rfc-editor.org/rfc/rfc4364.html#section-13)。置信度：高。

### 较轻但明确的错误

### SEC-13 [P3] 手机掩码示例把遮住的位数位置写反
- 知识点 ICT-057.03；位置 [content/rewrite/out/batch-13.json:202](../../content/rewrite/out/batch-13.json#L202)。
- 原文：“138****1234 在页面上看不到后四位”。
- 实际后四位 1234 清楚可见，被隐藏的是中间四位。此为文内可直接验证的错误，无需外部来源。置信度：高。

### SEC-14 [P3] 时钟偏差案例把设备源时间当成平台入库时间
- 知识点 ICT-065.02；位置 [content/rewrite/out/batch-16.json:116](../../content/rewrite/out/batch-16.json#L116)（example.steps[0]）。
- 原文：“按平台入库时间看，访问在前、登录在后”。
- setup 只提供认证服务器事件时间 10:05、防火墙事件时间 09:58 和慢 10 分钟的事实，没有任何平台接收时间。设备时钟慢只影响源时间，不能据此推断入库先后；应说“未校正的源事件时间”。同项目 ICT-069.02 已正确区分源时间和接收时间。置信度：高。



## 四、WLAN与相关共享术语：18项

### W01 同SSID对照不能直接排除业务VLAN，并与缺中继结论冲突
- 级别：P2；章节/知识点：ICT-074 / ICT-074.02；置信度：高。
- 位置：[content/rewrite/out/batch-18.json:122](../../content/rewrite/out/batch-18.json#L122)。
- 原文：“换另一台手机连同一个 SSID 能拿到 192.168.20.11，排除 AP 与业务 VLAN；……发现该网段缺少中继指向。”
- 错误：如果两机确在同一业务VLAN、同一服务路径并重新走完整DORA，整网段缺少必需的relay不能只影响其中一机；如存在动态VLAN或旧租约，两者条件不同，又不能从同SSID直接排除VLAN。这是案例证据不足/结论互相冲突，并非协议教学简化。
- 正确条件：明确同BSSID、实际授权VLAN、是否新租约、同一服务器路径；否则保留VLAN/个别终端授权为候选。
- 官方依据：[Cisco AAA override说明，同SSID可按用户分配不同VLAN](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/c9800-best-practices.html)；[RFC2131 DHCP交互](https://www.rfc-editor.org/rfc/rfc2131.html)。

### W02 共享上联被误写成增加RU必然不能增加有效容量
- 级别：P2；ICT-075 / ICT-075.04；置信度：高。
- 位置：[content/rewrite/out/batch-18.json:314](../../content/rewrite/out/batch-18.json#L314)；相关过强表述同文件:309。
- 原文：“增加 RU 只会加剧竞争，除非同时扩容共享链路。”
- 错误：共享链路有上限，不等于它已经是瓶颈。当原瓶颈是单RU空口、上联和中心尚有余量，增加能复用独立射频资源的RU可以提升整组有效吞吐，无需同时扩容上联。309行“三十个房间却只有一个上联口，那不管设备多好……撑不住”也缺少业务量与链路速率条件。
- 正确条件：仅在中心/上联已经饱和、或新增RU不能带来有效射频复用的条件下作此结论。
- 官方依据：[华为：零漫游分布式与敏捷分布式的容量差异](https://info.support.huawei.com/info-finder/encyclopedia/zh/零漫游分布式AP.html)。此项也由项目自身ICT-086.03关于有效信道容量的解释交叉支持。

### W03 Mesh独立射频仍必须与接入共享同一airtime的说法错误
- 级别：P2；ICT-075 / ICT-075.06；置信度：高。
- 位置：[content/rewrite/out/batch-18.json:343](../../content/rewrite/out/batch-18.json#L343)。
- 原文：“即使回传用了另一个射频，时间仍然要和接入共享。”
- 错误：空口竞争域与频率、信道、干扰范围有关，不是设备级全局时间池。独立射频运行于隔离/非重叠信道或不同频段可使接入与回传并行；仍需核对硬件并发与端到端瓶颈，但不能宣称必然共享同一airtime。
- 正确条件：同射频/同信道半双工回传，或射频互扰/硬件约束导致不能并行时才适用。
- 官方依据：[Cisco Mesh专用射频与不同上下行信道](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-15/config-guide/b_wl_17_15_cg/m_mesh_ewlc.html)。

### W04 数据安全章节导语反向否定密码安全模式的空口加密作用
- 级别：P2；ICT-078（章节intro）；置信度：高。
- 位置：[content/rewrite/out/batch-19.json:5](../../content/rewrite/out/batch-19.json#L5)。
- 原文：“密码保护的是谁能接入，并不保护接入之后空口上跑的内容。”
- 错误：WPA/WPA2-PSK的口令参与密钥建立，随后PTK/GTK用于保护相应空口数据。监听模式能收到帧，不等于能读出受保护数据。章节没有限定为仅Portal登录口令，却对“有密码的SSID”作通用否定，与后文WPA2说明冲突。
- 正确条件：若想说明Portal口令，应明确Open+Portal；若是WPA2，应区分可捕获无线帧与可解密内容。
- 官方依据：[Cisco WLAN安全、PSK与加密](https://www.cisco.com/c/en/us/products/collateral/wireless/unified-wireless-network-sg.html)。

### W05 四次握手将持钥证明错误地放到仅后两条消息
- 级别：P2；ICT-078 / ICT-078.04；置信度：高。
- 位置：[content/rewrite/out/batch-19.json:98](../../content/rewrite/out/batch-19.json#L98)。
- 原文：“前两次交换随机数，后两次用校验值证明各自持有相同的材料。”
- 错误：M2已经携带SNonce+MIC，AP据此校验STA持有对应PMK；M3的MIC让STA校验AP。M4是带MIC的确认，不能把前两条仅讲成随机数交换。项目自己的sta-wpa2-online图示已正确写明M2的MIC，因此还形成图文不一致。
- 正确条件：M1 ANonce；M2 SNonce+MIC；M3 MIC+受保护组密钥/安装信息；M4确认。
- 官方依据：[Cisco 802.11w握手图及消息字段](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/config-guide/b_wl_16_10_cg/802-11w.pdf)。

### W06 EAP-TLS证书验证清单遗漏服务器名称与撤销状态
- 级别：P2；ICT-078 / ICT-078.05；置信度：高（关键安全前提遗漏）。
- 位置：[content/rewrite/out/batch-19.json:137](../../content/rewrite/out/batch-19.json#L137)。
- 原文：“证书能不能通过，取决于三件事：……根证书……有没有过期……设备时间是否准确。”
- 错误：信任某CA且证书未过期，不能证明其属于本企业预期的EAP服务器；名称匹配(SAN)是防冒充的重要检查。已撤销但未过期的证书也不能仅按这三项接受。EAP-TLS1.3要求检查证书链撤销状态。本节称为三项前提却遗漏直接关系到伪造网络的条件，有误导风险。
- 正确条件：说明这是部分排障项；增加受信服务器名称/身份及适用TLS版本的撤销检查，不把“未过期”当作“未撤销”。
- 官方依据：[RFC9190 §2.2、§5.3、§5.4](https://www.rfc-editor.org/rfc/rfc9190.html)。

### W07 BSSID与射频被错误地一一对应
- 级别：P2；ICT-079 / ICT-079.01；置信度：高。
- 位置：[content/rewrite/out/batch-20.json:53](../../content/rewrite/out/batch-20.json#L53)；重复于batch-24.json:199、batch-25.json:299、batch-26.json:225。
- 原文：“一台 AP 有几个射频就有几个 BSSID。”
- 错误：一个射频可提供多个VAP/BSS，每个VAP可有自己的BSSID；射频数不等于BSSID数。会误导AP登记、抓包和漫游定位。
- 正确条件：BSSID标识BSS；多SSID部署时应按VAP/BSS映射到AP和射频。
- 官方依据：[华为SSID词条的multi-SSID/VAP/BSSID关系](https://info.support.huawei.com/info-finder/encyclopedia/en/SSID.html)。

### W08 把VRRP虚拟IP与地址拥有者的接口IP相同误判为冲突
- 级别：P2；ICT-076 / ICT-076.01；置信度：高。
- 位置：[content/rewrite/out/batch-20.json:217](../../content/rewrite/out/batch-20.json#L217)。
- 原文：“虚拟地址不能和任何一台设备的实体接口地址相同。”
- 错误：VRRP协议允许virtual IP使用某成员的实际接口IP，该成员为IP地址拥有者，优先级255。若特定WAC无线热备模式另有地址约束，必须注明型号/模式；不能作为VRRP通用禁止规则。
- 正确条件：区分合法地址拥有者配置与其他设备无意复用造成的真实IP冲突。
- 官方依据：[华为VRRP实现示例明确使用路由器A实际IP作为virtual IP](https://info.support.huawei.com/info-finder/encyclopedia/en/VRRP.html)；[RFC9568](https://www.rfc-editor.org/rfc/rfc9568.html)。

### W09 VRRP相同优先级不等于选主不稳定
- 级别：P2；ICT-076 / ICT-076.01；置信度：高。
- 位置：[content/rewrite/out/batch-20.json:209](../../content/rewrite/out/batch-20.json#L209)。
- 原文：“两台设备设成相同优先级，选主结果可能不稳定，切换也就不可预测。”
- 错误：同优先级有明确协议平局规则：必要的主冲突消解比较主IPvX地址；已有主设备的保持/抢占还受状态与抢占规则约束。不同优先级便于表达运维偏好，但相同优先级本身不是抖动原因。
- 正确条件：应将实际不稳定归因到报文丢失、定时参数/状态不一致等证据，讲清平局规则。
- 官方依据：[RFC9568 §6.4.2、§6.4.3](https://www.rfc-editor.org/rfc/rfc9568.html)。

### W10 用IP是否改变判别二层/三层漫游错误
- 级别：P2；ICT-081 / ICT-081.01；置信度：高。
- 位置：[content/rewrite/out/batch-20.json:391](../../content/rewrite/out/batch-20.json#L391)（同节373段亦反复提出此判据）；相关图示[content/visualizations.json:3970](../../content/visualizations.json#L3970)、4027。
- 原文：“地址不变时是二层漫游，地址跟着变就是跨网段。”
- 错误：三层漫游的核心目标之一正是跨接入子网时通过锚点/隧道保留原IP；地址不变不能排除三层漫游。前后业务VLAN/子网与转发机制才是分类依据。IP改变通常说明没有完成所需的地址保持，不能直接当成成功三层漫游的定义。下一节ICT-081.02已正确解释锚点，构成相邻正文矛盾。
- 正确条件：对照接入业务网络/VLAN、家乡/外地角色与流量路径；IP只作为连续性验证项。
- 官方依据：[华为WiFi漫游：二层/三层均围绕保留IP与业务](https://info.support.huawei.com/info-finder/encyclopedia/zh/WiFi漫游.html)。

### W11 私接Wi-Fi路由器被归为不参与Wi-Fi争用规则
- 级别：P2；ICT-082 / ICT-082.07；置信度：高。
- 位置：[content/rewrite/out/batch-21.json:104](../../content/rewrite/out/batch-21.json#L104)。
- 原文：“微波炉、无线摄像头或私接的小路由器，它们不参与 Wi-Fi 的让路规则。”
- 错误：标准Wi-Fi路由器即使属于另一个SSID/未经授权，也遵循CSMA/CA；Wi-Fi摄像头也一样。只有具体非802.11源（如微波炉、某些模拟摄像系统）不按该规则争用。授权归属不改变MAC层机制。
- 正确条件：区分标准Wi-Fi邻网竞争、隐藏节点/信道重叠与非Wi-Fi干扰源。
- 官方依据：[Cisco RF设计：不同企业网络同频也互相等待](https://www.cisco.com/en/US/docs/solutions/Enterprise/Mobility/emob30dg/RFDesign.html)。

### W12 CAC预留空间与新增用户关系写反
- 级别：P2；ICT-082 / ICT-082.06；置信度：高（由本节定义及50/60案例直接推出）。
- 位置：[content/rewrite/out/batch-21.json:262](../../content/rewrite/out/batch-21.json#L262)。
- 原文：“差值太大，预留的空间又会被新增用户慢慢填满。”
- 错误：按本节规定，新接入门限50、漫游门限60，普通新增用户到50即被拒绝，不能继续填满保留给漫游的50—60区间；增大这一区间不会让普通新接入更容易占用它。可能代价是更多漫游用户进入后超过理想负载，或降低新用户接入机会。
- 正确条件：分别说明两个绝对门限及预留区间，避免把方向写反。
- 核验依据：本文件自身明确给定的50/60模型及新增用户到50即拒绝的规则，可直接演绎出上述结论；未获得可直接支撑这组教学门限的官方文档，此项不据此推断具体厂商实现。

### W13 无AAAA记录不会产生文中“先连IPv6超时后回落”的连接过程
- 级别：P2；ICT-085 / ICT-085.02；置信度：高。
- 位置：[content/rewrite/out/batch-23.json:100](../../content/rewrite/out/batch-23.json#L100)、101。
- 原文：“只有 A 记录，没有 AAAA 记录……系统先尝试 IPv6，超时后才回落到 IPv4。”
- 错误：正常DNS返回AAAA NODATA时，客户端没有IPv6目的候选地址，不能对不存在的IPv6地址发连接并等超时。慢DNS查询、错误/失效AAAA、缓存或应用自行构造地址可以造成不同问题，但例子未给出这些条件。RFC8305明确规定负AAAA答复后使用已有IPv4候选。
- 正确条件：若要演示IPv6连接黑洞，应给出存在却不可达的AAAA；若是无AAAA，则解释应用未提供IPv6服务、普通双栈可直接使用A。
- 官方依据：[RFC8305 §3、§7.2](https://www.rfc-editor.org/rfc/rfc8305.html)。

### W14 BSSID未变不能排除漫游失败，BSSID变也不必然换了物理AP
- 级别：P2；ICT-094 / ICT-094.06；置信度：高。
- 位置：[content/rewrite/out/batch-26.json:225](../../content/rewrite/out/batch-26.json#L225)。
- 原文：“BSSID 变了，才说明终端确实换了 AP；BSSID 没变而业务中断……不是切换机制。”
- 错误：同一物理AP两个射频/不同BSS间切换也会换BSSID；扫描/重关联/认证失败后退回原BSS，前后BSSID仍可能相同。因此“未变”不能排除漫游尝试失败，尤其本节正在教排障。
- 正确条件：查看切换期间探测、认证、Reassociation Request/Response与拒绝记录，区分未尝试、失败回退和成功切换。
- 官方依据：[华为BSSID/VAP关系](https://info.support.huawei.com/info-finder/encyclopedia/en/SSID.html)；[华为WiFi漫游流程](https://info.support.huawei.com/info-finder/encyclopedia/zh/WiFi漫游.html)。

### W15 上下行不对称的答案把接收方向写反
- 级别：P2；ICT-082 / ICT-082.02；置信度：高。
- 位置：[content/rewrite/out/batch-21.json:79](../../content/rewrite/out/batch-21.json#L79)（check.answer）。
- 原文：“接入点听得到终端、终端回不去的单向弱链路。”
- 错误：“AP听到终端”已表示终端→AP的上行成功，与“终端回不去”相矛盾。当前问题讨论AP增大发射功率而手机上行较弱，应该是终端听得到AP、AP不能可靠收到终端。该节正文方向正确，答案错误。
- 正确条件：分别注明AP→终端下行和终端→AP上行。
- 官方依据：[Cisco RF设计中的AP/终端功率匹配和覆盖讨论](https://www.cisco.com/en/US/docs/solutions/Enterprise/Mobility/emob30dg/RFDesign.html)；该项亦可由句子自身方向直接验证。

### W16 NAT改写源地址并不天然导致WAC无法回包
- 级别：P2；ICT-079 / ICT-079.03；置信度：高。
- 位置：[content/rewrite/out/batch-20.json:133](../../content/rewrite/out/batch-20.json#L133)。
- 原文：“AP 发出的控制报文如果被改写了源地址，WAC 回包时就找不到原来的 AP，或者回包能到但会话对不上。”
- 错误：这是正常NAT的工作情形，映射负责回包反向转换；CAPWAP专门支持AP在NAT之后，并通过Session Identifier等关联控制与数据通道。实际故障可以来自映射超时、端口/地址发布错误、受限NAT或版本限制，但不能仅由“源IP被改写”推出。
- 正确条件：指出特定NAT穿越/状态/端口异常，核对映射与双向抓包。
- 官方依据：[RFC5415 §3.1、§11 NAT Considerations](https://www.rfc-editor.org/rfc/rfc5415.html)；[华为AP上线排障明确支持检查NAT穿越](https://info.support.huawei.com/network/ptmngsys/Web/tsrev_wlan/cn/content/wlan/11_edesk_ap_online_fail/edesk_ap_online_fail_edesk001.html)。

### G01 WPA3词条混淆SAE、四次握手和开放网络保护
- 级别：P2；术语wpa3（共享词库）；置信度：高。
- 位置：[content/rewrite/out/glossary.json:746](../../content/rewrite/out/glossary.json#L746)、748；合并对应[content/glossary.json:1160](../../content/glossary.json#L1160)、1162。
- 原文：“个人版用 SAE 替代预共享密钥握手……并加强对开放网络的管理帧保护。”
- 错误：SAE替代传统PSK的身份/PMK建立方式，WPA3-Personal仍进行四次握手；若“预共享密钥握手”意指WPA2四次握手，会误导其被取消。WPA3要求PMF与开放网络的OWE/Enhanced Open也是不同概念；开放网络不会因WPA3存在就自动获得管理帧保护。
- 正确条件：明确SAE认证/PMK、后续四次握手、PMF以及Enhanced Open的职责范围。
- 官方依据：[Cisco WLAN Security分别列出WPA3与Enhanced Open](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_security.html)；[Cisco Unified Wireless Guide明确WPA2和WPA3均有四次握手](https://www.cisco.com/c/en/us/products/collateral/wireless/unified-wireless-network-sg.html)。

### G02 BSS定义把二层成员关系当成必然免路由
- 级别：P2；术语bss（共享词库）；置信度：高（缺关键前提）。
- 位置：[content/rewrite/out/glossary.json:645](../../content/rewrite/out/glossary.json#L645)、647；合并对应[content/glossary.json:1059](../../content/glossary.json#L1059)、1061。
- 原文：“终端在同一 BSS 内通信不经过三层转发。”
- 错误：BSS是802.11链路服务集，不强制所有用户具有相同IP子网；动态VLAN/身份授权可将同一无线业务的用户放入不同业务子网，访问也可能受隔离/集中转发策略影响。不能从同一BSS直接推导必然仅二层转发。普通同VLAN同子网本地互访是常见条件，应该明示。
- 官方依据：[Cisco AAA override：同一SSID按用户角色分不同VLAN/子网](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/c9800-best-practices.html)；项目ICT-077.02本身也讲了相同机制。



## 五、待核项：不计入76项

### Q01（原R17）：IGMP定时器的措辞

位置：[content/rewrite/out/batch-12.json:202](../../content/rewrite/out/batch-12.json#L202)。原文“查询间隔和超时由协议规定，不由管理员随手改”。[RFC2236 §8](https://www.rfc-editor.org/rfc/rfc2236.html#section-8)明确多项计时器可配置；但“不能随手改”也可以理解为不能无依据乱改。若作者意图是固定不可配则错误，若意图是遵守约束则合理。本轮保留为需要澄清的表述，不按硬错误计数。

### Q02（原SEC-09）：NIST框架版本没有说清

位置：[content/rewrite/out/batch-13.json:165](../../content/rewrite/out/batch-13.json#L165)。正文列“识别、保护、检测、响应、恢复几类”，元数据来源为CSF2.0；[NIST当前六功能](https://csrc.nist.gov/glossary/term/csf_function)还包含Govern（治理）。列举与所引版本不完全一致，但“几类”未必意在穷举，因此先核对作者采用的版本及列举意图，不直接把未列出治理等同事实错误。

### Q03（原D13）：OpenStack数据库、消息与API的概括过宽

位置：[content/rewrite/out/batch-27.json:201](../../content/rewrite/out/batch-27.json#L201)。原文“每个服务都有自己的数据库和消息队列，服务之间只通过API说话”。各服务和内部组件依赖不同；[Nova官方RPC架构](https://docs.openstack.org/nova/2024.2/reference/rpc.html)既涉及消息代理又涉及内部RPC。不过“自己的队列”不等于独占消息代理，RPC本身也是API，不能据这句话就推断作者否认RPC。需按实际部署和“服务”的粒度核对，未将其计作已确认错误。

## 六、覆盖清单

以下“已审阅”表示本轮已阅读该章知识内容并纳入分组核查；没有发现条目不等于保证零错误。全部知识点数量由manifest和批次正文汇总验证。

| 章节 | 标题 | 知识点数 | 分组 | 状态 |
| --- | --- | ---: | --- | --- |
| ICT-001 | 数通基础知识 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-002 | TCP/IP协议基础 | 9 | 基础/路由/WAN | 已审阅 |
| ICT-003 | 以太网交换基础 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-004 | VLAN | 4 | 基础/路由/WAN | 已审阅 |
| ICT-005 | 链路聚合 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-006 | 堆叠和集群 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-007 | STP | 2 | 基础/路由/WAN | 已审阅 |
| ICT-008 | RSTP、MSTP | 2 | 基础/路由/WAN | 已审阅 |
| ICT-009 | 静态路由 | 3 | 基础/路由/WAN | 已审阅 |
| ICT-010 | OSPF | 2 | 基础/路由/WAN | 已审阅 |
| ICT-011 | OSPFv3 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-012 | IS-IS（IPv4）（IPv6） | 2 | 基础/路由/WAN | 已审阅 |
| ICT-013 | BGP、BGP4+ | 3 | 基础/路由/WAN | 已审阅 |
| ICT-014 | ACL | 2 | 基础/路由/WAN | 已审阅 |
| ICT-015 | IP Prefix List | 2 | 基础/路由/WAN | 已审阅 |
| ICT-016 | 路由策略、策略路由 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-017 | IPv6基础知识 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-018 | IPv6地址配置 | 3 | 基础/路由/WAN | 已审阅 |
| ICT-019 | IPv6过渡技术 | 4 | 基础/路由/WAN | 已审阅 |
| ICT-020 | IPv6+ | 2 | 基础/路由/WAN | 已审阅 |
| ICT-021 | SRv6分段路由 | 4 | 基础/路由/WAN | 已审阅 |
| ICT-022 | FlexE网络切片 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-023 | IFIT随流检测技术 | 3 | 基础/路由/WAN | 已审阅 |
| ICT-024 | 广域网基础知识和技术 | 3 | 基础/路由/WAN | 已审阅 |
| ICT-025 | Segment Routing技术 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-026 | MPLS相关技术 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-027 | VPN基础知识 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-028 | 基本VPN技术 | 3 | 基础/路由/WAN | 已审阅 |
| ICT-029 | BGP/MPLS IP VPN | 2 | 基础/路由/WAN | 已审阅 |
| ICT-030 | VXLAN | 2 | 基础/路由/WAN | 已审阅 |
| ICT-031 | EVPN | 3 | 基础/路由/WAN | 已审阅 |
| ICT-032 | 组播基础知识 | 2 | 基础/路由/WAN | 已审阅 |
| ICT-033 | PIM | 2 | 基础/路由/WAN | 已审阅 |
| ICT-034 | AAA | 4 | 园区管理/DCN | 已审阅 |
| ICT-035 | 以太网交换安全 | 8 | 园区管理/DCN | 已审阅 |
| ICT-036 | 网络准入控制 | 4 | 园区管理/DCN | 已审阅 |
| ICT-037 | 网络可靠性技术 | 2 | 园区管理/DCN | 已审阅 |
| ICT-038 | 网络优化技术 | 2 | 园区管理/DCN | 已审阅 |
| ICT-039 | 网络管理与监控技术 | 3 | 园区管理/DCN | 已审阅 |
| ICT-040 | 网络编程自动化基础知识 | 3 | 园区管理/DCN | 已审阅 |
| ICT-041 | 网络编程自动化高阶技术 | 4 | 园区管理/DCN | 已审阅 |
| ICT-042 | 园区网络CloudCampus解决方案 | 7 | 安全/综合 | 已审阅 |
| ICT-043 | 分支互联SD-WAN解决方案 | 4 | 安全/综合 | 已审阅 |
| ICT-044 | 广域网络CloudWAN解决方案 | 4 | 安全/综合 | 已审阅 |
| ICT-045 | M-LAG、VXLAN、EVPN、微分段、业务链 | 7 | 园区管理/DCN | 已审阅 |
| ICT-046 | 虚拟化技术、存储技术 | 4 | 园区管理/DCN | 已审阅 |
| ICT-047 | OpenStack云平台技术、容器技术 | 4 | 园区管理/DCN | 已审阅 |
| ICT-048 | 智能无损技术、高性能与智能计算技术 | 5 | 园区管理/DCN | 已审阅 |
| ICT-049 | 机架出租、计算联动 | 5 | 园区管理/DCN | 已审阅 |
| ICT-050 | 云网一体化、容器网络 | 4 | 园区管理/DCN | 已审阅 |
| ICT-051 | 多云多DC解决方案 | 2 | 园区管理/DCN | 已审阅 |
| ICT-052 | 超简网络解决方案、存储网络解决方案 | 2 | 园区管理/DCN | 已审阅 |
| ICT-053 | 数据中心网络安全解决方案 | 3 | 园区管理/DCN | 已审阅 |
| ICT-054 | 数据中心网络规划与设计 | 7 | 园区管理/DCN | 已审阅 |
| ICT-055 | 数据中心网络运维解决方案 | 3 | 园区管理/DCN | 已审阅 |
| ICT-056 | 信息安全基础 | 2 | 安全/综合 | 已审阅 |
| ICT-057 | 信息安全管理技术 | 5 | 安全/综合 | 已审阅 |
| ICT-058 | 网络安全基础 | 7 | 安全/综合 | 已审阅 |
| ICT-059 | 防火墙高级特性 | 4 | 安全/综合 | 已审阅 |
| ICT-060 | 安全组网规划部署 | 3 | 安全/综合 | 已审阅 |
| ICT-061 | VPN基础（加解密） | 3 | 安全/综合 | 已审阅 |
| ICT-062 | VPN应用 | 2 | 安全/综合 | 已审阅 |
| ICT-063 | VPN高可用技术 | 1 | 安全/综合 | 已审阅 |
| ICT-064 | 基础威胁防御 | 5 | 安全/综合 | 已审阅 |
| ICT-065 | APT威胁防御 | 3 | 安全/综合 | 已审阅 |
| ICT-066 | 云数据中心网络安全技术 | 3 | 安全/综合 | 已审阅 |
| ICT-067 | 华为云安全架构设计 | 3 | 安全/综合 | 已审阅 |
| ICT-068 | 安全管理中心 | 2 | 安全/综合 | 已审阅 |
| ICT-069 | 安全运维与分析 | 5 | 安全/综合 | 已审阅 |
| ICT-070 | 安全故障排查 | 4 | 安全/综合 | 已审阅 |
| ICT-071 | 园区网络安全解决方案 | 3 | 安全/综合 | 已审阅 |
| ICT-072 | 数据中心网络安全解决方案 | 3 | 安全/综合 | 已审阅 |
| ICT-073 | 云网络安全解决方案 | 4 | 安全/综合 | 已审阅 |
| ICT-074 | WLAN工作原理 | 3 | WLAN | 已审阅 |
| ICT-075 | WLAN组网架构 | 6 | WLAN | 已审阅 |
| ICT-076 | WLAN可靠性 | 4 | WLAN | 已审阅 |
| ICT-077 | WLAN接入安全 | 4 | WLAN | 已审阅 |
| ICT-078 | WLAN数据安全 | 5 | WLAN | 已审阅 |
| ICT-079 | WLAN安全与防御 | 4 | WLAN | 已审阅 |
| ICT-080 | WLAN网络准入控制 | 4 | WLAN | 已审阅 |
| ICT-081 | WLAN漫游 | 4 | WLAN | 已审阅 |
| ICT-082 | WLAN射频资源管理 | 9 | WLAN | 已审阅 |
| ICT-083 | WLAN与IoT融合 | 3 | WLAN | 已审阅 |
| ICT-084 | WLAN无线定位 | 3 | WLAN | 已审阅 |
| ICT-085 | 构建IPv6 WLAN网络 | 5 | WLAN | 已审阅 |
| ICT-086 | WLAN网络规划基础 | 3 | WLAN | 已审阅 |
| ICT-087 | WLAN网络规划工具 | 2 | WLAN | 已审阅 |
| ICT-088 | WLAN网络规划流程 | 3 | WLAN | 已审阅 |
| ICT-089 | WLAN网络优化 | 4 | WLAN | 已审阅 |
| ICT-090 | 大型WLAN组网实践 | 3 | WLAN | 已审阅 |
| ICT-091 | 云管理 | 3 | WLAN | 已审阅 |
| ICT-092 | 传统运维 | 1 | WLAN | 已审阅 |
| ICT-093 | 智能运维 | 4 | WLAN | 已审阅 |
| ICT-094 | 故障排查 | 6 | WLAN | 已审阅 |

## 七、仍未完成的验证边界

- 这是一轮全章节技术阅读和针对性外部核验，不是对322点每个句子都建立独立权威认证，也不是不存在遗漏的保证。来源索引中的主题级链接不等于逐条命令已审定。
- 赛事指定型号、补丁、许可、CLI语法、主备同步与异常故障组合仍未实机验证。正文已经明确限定的平台示例，本轮不因未执行而直接定错。
- 图示作逻辑与图文一致性检查；没有把教学模型的延迟、吞吐、无线覆盖简化当成真实设备测量。WLAN工具已声明频率、天线、多径、上行和同频竞争等未模拟项。
- 部分官方设备详细页面不可访问时，未用搜索摘要替代具体端口语义的证据。尤其NAT端口匹配、各WAC热备/Navi/Leader行为、云平台离线生存、当前工具界面均不在本报告的设备认证结论内。
- 全部发现均只记录，没有修正。下一轮修改时仍应先校正源稿，再按项目规定验证、冻结、合并和构建，并复核同类词库/图示重复点。
