"""入门内容审查修正与基础概念补释。"""
import json,re
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'content'
foundations={
'ICT-001.02':'先把四个对象分开：终端是发起或接收业务的电脑、手机；交换机连接局域网设备，常按MAC地址转发；路由器连接不同IP网段，按目的IP选下一跳；应用是浏览器、聊天或文件服务等实际程序。链路指设备间连接，协议指双方约定的消息格式与处理规则。',
'ICT-002.01':'“分层”是把复杂通信拆成职责，而不是要求先背一张表。浏览器关心请求内容，传输层关心把数据交给哪个进程，IP层关心目的在哪个网络，链路层关心这一段交给哪个接口。封装就是给上层数据加上本层需要的说明；接收端按相反顺序解释和交付。',
'ICT-002.02':'TCP是传输控制协议，服务对象是有序的字节流。“连接”指两端保存序号、确认与窗口等共同状态，并非在沿途铺一条专属物理线。一个汉字编码可能占多个字节；序号按实际字节计算。三次握手通常以SYN、SYN+ACK、ACK协商起始状态，后续确认、重传和流量控制才让连续数据可靠交付。',
'ICT-002.03':'UDP是用户数据报协议。数据报可以理解为应用一次交给它的一份消息：边界保留，收方能按消息接收，而TCP交付的是连续字节，需要应用自己识别消息边界。UDP头含源端口、目的端口、长度与校验和；端口帮助操作系统区分程序，不能把端口号当作设备的物理插口。',
'ICT-002.04':'MAC是链路层接口标识，以太网中通常写成六组十六进制数，如00:11:22:33:44:55。ARP即地址解析协议，在IPv4以太网场景中，根据本链路下一跳IP询问对应MAC。广播帧会送给该广播域中的成员；它通常不被路由器原样转到另一个网络，因此先选下一跳，再解析它的MAC。',
'ICT-002.05':'IPv4地址有32个二进制位，位只能是0或1；通常分成4组、每组8位，再写成0到255的十进制数。192.168.10.130/26的“/26”表示前26位划作网络部分，余下6位区分该块内的地址，对应掩码255.255.255.192。判断同网段是比较地址与掩码得到的网络部分，不能只凭前三段看起来相同。',
'ICT-002.06':'NAT是网络地址转换，源NAT改写发出报文的源地址，目的NAT改写目的地址；同时转换端口的方式常称NAPT。转换是改变地址表示，路由是决定从哪里走，安全规则是决定能否通过，三者职责不同。下面先用映射理解共享地址，配置里的ACL用于选择待转换的流量，完整路由和出口地址仍须预先准备。',
'ICT-002.09':'DHCP是动态主机配置协议，帮助终端租用地址并获取掩码、网关、DNS等适用参数。租约不是永久占有，客户端需要按协议续租。客户端与服务器不在同一广播域时，通常需要DHCP中继把请求交给服务器；服务器再按来源网络选择相应地址池，不能跨所有VLAN盲目分配同一网段。',
'ICT-003.01':'以太网帧把链路上的发送者与接收者写成源MAC和目的MAC。交换机的MAC表记录“某个VLAN中的某个MAC目前应从哪个端口到达”。单播指向一个接收接口，广播发给本广播域；未知单播只是交换机暂不知道出口，目的地址并没有变成广播地址。',
'ICT-004.01':'VLAN是虚拟局域网，把一套交换网络分成多个二层广播域。Access口通常连接一个所属VLAN的普通终端，Trunk口承载多个VLAN。802.1Q标签是帧上的VLAN标识，PVID是端口接收无标签帧时通常用来归类的默认VLAN编号；允许列表则决定哪些VLAN可以通过，二者不能互相替代。',
'ICT-009.01':'把路由表想成“目的网络—下一站—出口”的指路表。直连路由来自有效的三层接口，静态路由由管理员填写，动态路由由协议学习。默认路由0.0.0.0/0是没有更具体条目时的兜底。前缀越长，描述的范围越小；所以/24覆盖256个地址，比/16覆盖65536个地址更具体。',
'ICT-010.01':'OSPF是开放式最短路径优先协议。邻居是能交换协议信息的相邻路由器；邻接是进一步同步拓扑数据库的关系；LSA是链路状态通告，LSDB是这些信息组成的数据库。Area把协议划为区域，Cost表示链路开销；先认识这些对象，再看它们如何让路由器自行算出路径。',
'ICT-017.02':'十六进制用0到9和a到f表示十六种值，每位对应4个二进制位。IPv6的八组地址，每组最多4个十六进制位，合计128位。例如0001可写为1，连续全零组可以用一次::代替；展开时必须补足八组。/64仍表示前64位是网络前缀，和IPv4的斜杠写法采用同一原则。'
}
for f in p.glob('units-*.json'):
 items=json.loads(f.read_text())
 for u in items:
  if u['id'] in foundations and not u.get('beginnerExpanded'):
   u['explain']=foundations[u['id']]+'\n'+u['explain'];u['beginnerExpanded']=True
  if u['id']=='ICT-005.02':
   u['explain']=u['explain'].replace('两端聚合编号/归属不一致','各端成员没有归入各自预期的聚合组').replace('两端聚合编号','各端本地聚合编号')
   if '编号不要求相同' not in u['explain']:u['explain']+='\n两端的本地Eth-Trunk编号不要求相同：SW1的Eth-Trunk1可对接SW2的Eth-Trunk10，前提是各端成员正确归组、模式兼容且识别到正确的对端系统。'
  if u['id'] in ['ICT-007.01','ICT-007.02'] and u.get('config'):
   u['config']['notes']=u['config'].get('notes','').replace('其他设备用较低根优先级竞争权','其他设备设置更大的桥优先级数值，降低其成为根桥的优先程度')
  if u['id']=='ICT-001.01' and u.get('config'):u['config']['code']=u['config']['code'].replace('LAB-R1','LAB-SW1')
  if u['id']=='ICT-021.02':
   u['walkthrough']['steps'][1]='S1初始Segments Left=2；S1执行对应端点行为后减为1，并令活动目的为Segment List[1]即S2。S2处理后减为0，活动目的变为List[0]即S3。'
   u['walkthrough']['steps'][2]='到S3时Segments Left已经为0，按最终SID所定义的行为处理，不再按普通End行为继续取负索引。看数组时需同时看活动目的、剩余段与端点动作；压缩等变体另行分析。'
  if u['id']=='ICT-061.01':
   u['walkthrough']['steps'][2]='B按具体协议解密并验证签名及公钥信任；顺序取决于签名对象与封装，最后分别确认内容保密、完整性和发送者身份，不能把某一种顺序当作全部协议的通则。'
  if u['id']=='ICT-002.06':
   w=u['walkthrough'];w['setup']=w['setup'].replace('10.0.0.10','192.168.10.10').replace('10.0.0.11','192.168.10.11');w['steps']=[a.replace('10.0.0.10','192.168.10.10').replace('10.0.0.11','192.168.10.11') for a in w['steps']]
  if u['id']=='ICT-002.09':u['walkthrough']['setup']='A接入VLAN10，DHCP服务器为192.168.10.0/24准备地址池，排除已占用网关地址；本例假设选出192.168.10.100。'
  if u['id']=='ICT-009.02':u['config']['code']=u['config']['code'].replace('192.168.3.0','192.168.20.0').replace('192.168.3.10','192.168.20.20').replace('192.168.1.1','192.168.10.1').replace('192.168.3.1','192.168.20.1')
  if u['id']=='ICT-013.01':u['config']['code']=u['config']['code'].replace('network 192.168.1.0','network 192.168.10.0')
  if u['id']=='ICT-013.02':u['config']['code']=u['config']['code'].replace('network 2001:db8:1::','network 2001:db8:10::')
  if u['id']=='ICT-015.02':u['config']['code']='system-view\nip ip-prefix LAB index 10 permit 192.168.1.0 24\ndisplay ip ip-prefix LAB'
  if u['id']=='ICT-016.02':u['config']['code']=u['config']['code'].replace('source 192.168.10.0','source 10.10.10.0')
  if u['id']=='ICT-002.07':u['walkthrough']['conclusion']='Telnet排障要区分连接失败、认证失败与授权不足：出现登录提示已经说明到达服务入口，接下来按身份和权限继续定位。'
  if u['id']=='ICT-062.02':
   u['sources']=[{'title':'华为：什么是SSL VPN及资源授权','url':'https://info.support.huawei.com/info-finder/encyclopedia/zh/detail?action=queryEntityDetail&keyword=SSL+VPN','version':'SSL VPN原理；具体TLS版本、客户端与设备能力另核对','accessed':'2026-10-24'}]
  # 保留原段落，在自然句末断段，方便中文长文阅读。
  chunks=[]
  for para in u['explain'].split('\n'):
   part=''
   for sentence in re.findall(r'[^。]+。?|。',para):
    part+=sentence
    if len(part)>=115:chunks.append(part);part=''
   if part:chunks.append(part)
  u['explain']='\n'.join(chunks)
  if u.get('config'):
   code=u['config']['code']
   if code.startswith('# 配置对象'):
    u['commandNotes']=['这是配置对象与实施关系，编号行不是设备CLI。请先按所用产品版本把对象映射到相应配置，再验证规则与实际业务。']
   elif u['id'].startswith(('ICT-001','ICT-002','ICT-003','ICT-004','ICT-005','ICT-007','ICT-008','ICT-009','ICT-010','ICT-011','ICT-012','ICT-013','ICT-014','ICT-015','ICT-016','ICT-017','ICT-018','ICT-019','ICT-021')):
    notes=[]
    if 'system-view' in code:notes.append('system-view进入系统配置视图；interface进入某个接口视图；quit退回一级，return回用户视图。缩进用于看清层级，不是接口已经自动创建了整条通信路径。')
    if 'display ' in code:notes.append('display开头的行用于读取状态，不负责建立连通。请把所显示的接口、邻居、路由或命中项，与上面的预期过程逐项对应；配置存在与转发有效要分别检查。')
    if 'ip address ' in code:notes.append('ip address给当前三层接口配置地址和掩码；终端的默认网关应指向所在网段的真实网关接口。对端地址、返回路由和必要许可仍需单独准备。')
    if 'port default vlan' in code:notes.append('port default vlan指定Access端口归属；port trunk allow-pass vlan决定Trunk允许的VLAN。先创建VLAN，再设置成员口与互联放行，最后看MAC表和真实通信。')
    if 'eth-trunk ' in code:notes.append('interface Eth-Trunk配置逻辑聚合口，物理接口下的eth-trunk将该端口加入本机聚合组。两端本地编号可不同，但成员、模式与对端身份必须相容。')
    if 'ip route-static ' in code:notes.append('静态路由依次表达目的网络、掩码或长度、下一跳等条件；它告诉当前设备怎样走，不能代替远端的回程路由。')
    if 'traffic-filter ' in code:notes.append('先定义ACL，再用traffic-filter把它应用到指定接口方向。规则号决定相应排序模式下的先后；本例规则只表达指定流量范围，检查命中要使用条件一致的新流。')
    if 'nat outbound' in code:notes.append('nat outbound引用ACL选择待转换的源地址范围，绑定在示例出口。请按代码所列独立地址条件理解，公网接口地址、路由及回程不是这一行自动生成。')
    if 'commit' in code:notes.append('commit用于相应两阶段配置平台使候选配置生效；其他平台的提交与保存机制可能不同，提交也不能替代业务验证或持久化检查。')
    u['commandNotes']=notes
 ptext=json.dumps(items,ensure_ascii=False,indent=2)+'\n';f.write_text(ptext)
print('Added foundational explanations, readable paragraphs, configuration notes and reviewed corrections.')
