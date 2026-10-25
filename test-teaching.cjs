const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['teaching-data.js','teaching.js'])vm.runInContext(fs.readFileSync(__dirname+'/dist/'+file,'utf8'),ctx);
const t=ctx.window.ICTTeaching,scenes=t.scenarios();let checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++};
const scene=id=>scenes.find(s=>s.id===id),plain=x=>JSON.parse(JSON.stringify(x));
const units=JSON.parse(fs.readFileSync(__dirname+'/dist/units.json'));
ok(new Set(scenes.map(s=>s.id)).size===scenes.length,'unique scenario IDs');
for(const s of scenes){
 ok(units.some(u=>u.id===s.unit),'scenario attaches to a real syllabus section');
 ok(s.steps.length>1&&s.boundary.length>30,'steps and model boundary are required');
 for(const [i,step] of s.steps.entries()){
  ok(step.rows.every(r=>r.length===s.columns.length),'table snapshot shape '+s.id);
  if(step.active)ok(step.active.every(([a,b])=>s.links.some(([x,y])=>x===a&&y===b||x===b&&y===a)),'active flow follows a real link');
  if(step.message)ok(step.message[0]!==step.message[1]&&step.message.slice(0,2).every(n=>s.actors[n]),'sequence endpoint exists');
  const html=t.stateTable(s.columns,step.rows,s.steps[i-1]?.rows||[]);
  ok(!html.includes('undefined'),'all table snapshots render');
 }
}
const tcp=scene('tcp');
assert.deepEqual(plain(tcp.steps[3].rows),[['客户端','ESTABLISHED'],['服务器','SYN-RECEIVED']]);checks++;
assert.deepEqual(plain(tcp.steps[4].rows),[['客户端','ESTABLISHED'],['服务器','ESTABLISHED']]);checks++;
ok(tcp.events[0].label.includes('Seq=100')&&tcp.events[1].label.includes('Ack=101')&&tcp.events[2].label.includes('Ack=501'),'SYN consumes one sequence number');
ok(scene('arp-local').steps[4].rows[0][0]==='192.168.10.20','local destination resolved');
ok(scene('arp-gateway').steps[4].rows[0][0]==='192.168.10.1','remote destination resolves gateway');
ok(scene('arp-gateway').steps.every(s=>s.rows.every(r=>r[0]!=='192.0.2.20')),'never cache remote IP as a local neighbor');
let r=t.forwarding({},'A','B');
assert.deepEqual(plain(r.out),['B','C']);checks++;
ok(Object.keys(r.table).join()==='A','learn source only');
r=t.forwarding(r.table,'B','A');assert.deepEqual(plain(r.out),['A']);checks++;
r=t.forwarding(r.table,'A','B');assert.deepEqual(plain(r.out),['B']);checks++;
ok(t.forwarding({B:'A'},'A','B').out.length===0,'filter same ingress port');
ok(t.forwarding({},'A','A').out.length===0,'lookup after source learning');
ok(t.forwarding({},'A','B').table.B===undefined,'destination cannot create a MAC entry');
ok(scene('switch-learning').steps[2].rows.length===1&&scene('switch-learning').steps[5].rows.length===2,'switch learning snapshots');
ok(scene('vrp').steps[3].rows[1][1]==='新描述 / 旧配置','return does not save');
ok(scene('vrp').steps[4].rows[1][1]==='新描述 / 新描述','successful save updates startup configuration');
ok(scene('encapsulation').steps[3].packet.header[0][0].startsWith('目的 MAC'),'Ethernet field order starts with destination');
// ICT-002 opts in without changing other chapter scenarios.
for(const s of scenes.filter(s=>!s.unit.startsWith('ICT-002.')))ok(!s.richSequence&&!s.steps.some(step=>step.prediction||step.packet),'new interactions restricted to ICT-002');
for(const s of scenes.filter(s=>s.richSequence)){
 const ids=new Set(s.events.map(event=>event.id));
 for(const event of s.events)ok(event.to.length>0&&event.to.every(to=>to!==event.from&&s.actors[to]),'message recipients exist');
 for(const step of s.steps){
  for(const event of [step.event,...(step.also||[])].filter(Boolean))ok(ids.has(event.id)&&['sent','received','lost'].includes(event.phase),'valid message phase');
  if(step.actorStates)ok(step.actorStates.length===s.actors.length,'each ARP actor has a state');
  if(step.actions)for(const action of step.actions)ok(t.nextIndex(s,s.steps.indexOf(step),action.target)===action.target,'branch transition exists');
  if(step.prediction){
   const from=s.steps.indexOf(step);
   for(const [target,answer] of Object.entries(step.prediction.answers)){
    ok(t.nextIndex(s,from,Number(target))===Number(target),'prediction checks a reachable operation');
    ok(step.prediction.choices[answer.correct]&&answer.reason.length>20,'prediction has a valid answer and explanation');
    for(let choice=0;choice<step.prediction.choices.length;choice++)ok(t.predictionResult(s,from,choice,Number(target)).correct===(choice===answer.correct),'correct and incorrect choices evaluated separately');
    ok(t.predictionResult(s,from,undefined,Number(target))===null,'prediction can be skipped');
   }
  }
 }
}
assert.deepEqual(plain(tcp.steps[1].rows),[['客户端','SYN-SENT'],['服务器','LISTEN']]);checks++;
ok(tcp.steps[5].rows[1][1]==='SYN-RECEIVED'&&tcp.steps[5].rows[0][1]==='ESTABLISHED','lost final ACK does not establish server');
ok(t.nextIndex(tcp,4)===null&&t.nextIndex(tcp,5)===null,'both observation branches stop explicitly');
ok(t.nextIndex(tcp,3)===null&&t.nextIndex(tcp,3,99)===null,'ACK branch requires a valid operation');
const lostPath=[0,1,2,3,5],receivedPath=[0,1,2,3,4];
ok(t.protocolState(tcp,lostPath).find(e=>e.id==='ack').phase==='lost','lost history never includes successful receipt');
ok(t.protocolState(tcp,receivedPath).find(e=>e.id==='ack').phase==='received','delivery history records receipt');
ok(t.protocolState(tcp,[0,1]).length===1&&t.protocolState(tcp,[0,1])[0].phase==='sent','SYN in flight does not reveal future replies');
ok(t.protocolState(tcp,[0,1,2]).find(e=>e.id==='synack').phase==='sent','server reply shown in flight after SYN receipt');
ok(t.predictionResult(tcp,3,0,4).correct&&!t.predictionResult(tcp,3,0,5).correct,'same prediction is evaluated against the chosen ACK outcome');
for(const id of ['arp-local','arp-gateway']){
 const a=scene(id);
 ok(a.events[0].broadcast&&a.events[0].to.join()==='1,2','ARP broadcast reaches target and bystander');
 ok(a.events[1].to.join()==='0','ARP reply unicasts to requester');
 ok(a.steps[0].actorStates[1]===a.steps[1].actorStates[1]&&a.steps[0].actorStates[2]===a.steps[1].actorStates[2],'sending request does not alter recipients');
 ok(a.steps[2].actorStates[0]===a.steps[3].actorStates[0],'sending response does not change requester state');
 ok(a.steps[4].actorStates[1]===a.steps[5].actorStates[1],'sending data does not alter next hop before receipt');
 ok(a.steps[5].actorStates[0]===a.steps[6].actorStates[0],'remote receipt does not imply sender confirmation');
 ok(a.steps.slice(0,4).every(s=>s.rows.length===0)&&a.steps[4].rows.length===1,'A cache changes on reply receipt, not reply send');
 ok(t.protocolState(a,[0,1,2,3]).find(e=>e.id==='reply').phase==='sent','ARP response can be observed in flight');
 ok(t.protocolState(a,[0,1,2,3,4]).find(e=>e.id==='reply').phase==='received','ARP cache update coincides with response receipt');
}
const packets=scene('encapsulation').steps.map(s=>s.packet);
const layers=node=>[node.kind,...(node.payload?layers(node.payload):[])];
assert.deepEqual(plain(layers(packets[3])),['ethernet','ip','tcp','app']);checks++;
for(let i=1;i<packets.length;i++)ok(JSON.stringify(packets[i].payload)===JSON.stringify(packets[i-1]),'previous packet remains fully nested and intact');
ok(packets[3].trailer[0][0]==='FCS · 4B','FCS belongs to outer Ethernet frame');
const glossary=ctx.window.ICT_TEACHING_DATA.glossary;
ok(new Set(glossary.map(g=>g.id)).size===glossary.length,'unique glossary IDs');
ok(new Set(glossary.flatMap(g=>g.terms)).size===glossary.flatMap(g=>g.terms).length,'unambiguous aliases');
for(const g of glossary){ok(g.plain&&g.detail&&g.terms.length,'legacy term explanation retained');ok(g.beginner&&g.definition,'two-level term content exists');const html=t.termExplanation(g,true);ok(html.includes('通俗解释')&&html.includes('<details class="term-definition">')&&!html.includes('<details open'),'formal definition is collapsed by default')}
ok(!t.termExplanation(glossary[0],false).includes('term-definition'),'other chapters retain existing glossary presentation');
const crypto=require('node:crypto'),index=fs.readFileSync(__dirname+'/dist/index.html','utf8');
for(const f of ['teaching.js','teaching-data.js'])ok(index.includes(f+'?v='+crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/dist/'+f)).digest('hex').slice(0,12)),'cache version '+f);
// V01: every scenario must cite at least one https source (mount-time invariant, render_check cannot see it)
ok(scenes.every(s=>s.sources.length>0&&s.sources.every(([t,u])=>/^https:\/\//.test(u))),'every scenario cites an https source');
// V01 draft assertions (one line per teaching point)
ok(scene('ap-find-ac').steps[0].rows[0][1].includes('无管理地址'),'出厂 AP 既无地址也无配置')
ok(scene('ap-find-ac').steps[2].rows[1][1]==='尚不知道这台 AP','加入请求发出未到达，控制器状态不变')
ok(scene('ap-find-ac').steps[3].rows[1][1].includes('已接纳'),'通过合法性检查才被允许加入')
ok(scene('bgp-path-select').steps[0].rows[3][2].startsWith('未进入 BGP 表'),'被入方向策略拒绝的路径不参与选路')
ok(scene('bgp-path-select').steps[3].rows[0][2]==='选为 best，尚未确认可用','属性比完先出 best，还不等于可用')
ok(scene('bgp-path-select').steps[4].rows[0][2]==='best 保留，但不作为可用路由','下一跳不可达时 best 也不装进 IP 路由表')
ok(scene('dhcp-dora').steps[1].rows[2][1]==='暂无交互记录','请求在途，服务器租约状态不因发送而变')
ok(scene('dhcp-dora').steps[4].rows[0][1]==='已收到Offer · 选定192.168.10.100','ACK在途，客户端尚未安装地址')
ok(scene('dhcp-dora').steps[5].rows[0][1].startsWith('生效') && scene('dhcp-dora').steps[5].rows[2][1].startsWith('租约已记'),'ACK送达后客户端生效、服务器记租约')
ok(scene('dot1x-port-access').steps[0].rows[1][0]==='地址：未分配','认证先于地址分配，终端没有 IP 也能开始')
ok(scene('dot1x-port-access').steps[3].rows[0][0]==='认证：进行中','结论还在路上时端口不能提前放开')
ok(scene('dot1x-port-access').steps[4].rows[0][0]==='认证：通过','交换机收到结论这一步端口状态才改变')
ok(scene('evpn-type2').steps[1].rows[1][1]==='没有 A 的表项','位置路由在途时，接收方表项还没变')
ok(scene('evpn-type2').steps[2].rows[1][1]==='A 的 MAC/IP，位置 VTEP-A','路由到达并导入后，位置才写进本地表项')
ok(scene('evpn-type2').steps[3].rows[1][1]===scene('evpn-type2').steps[2].rows[1][1],'按表项单播转发不改动已学到的位置')
ok(scene('ipsec-ike-phases').steps[1].rows[1][1]==='加封装计数不动，未触发协商','未命中选择器的流量不加封装，隧道状态不描述业务路径')
ok(scene('ipsec-ike-phases').steps[5].rows[2][1]==='IKE SA 已建立','发起第二阶段时接收端仍只有 IKE SA，IPsec SA 要到到达步才出现')
ok(scene('mlag-failover').steps[1].rows[0][1].includes('Leaf2'),'单条上联故障业务不中断')
ok(scene('mlag-failover').steps[3].rows[0][1].includes('双主检测'),'peer-link 故障先由双主检测区分')
ok(scene('mlag-failover').steps[4].rows[1][1].includes('退出'),'失去协同时靠保护策略防重复转发')
ok(scene('mpls-label-hop').steps[2].fields[2][1].startsWith('Swap'),'中间跳只换标签，不看 IP 最长匹配')
ok(scene('mpls-label-hop').steps[1].fields[1][1].startsWith('10.3.0.10'),'压入标签时内层目的 IP 不变')
ok(scene('mpls-label-hop').steps[3].rows[2][1].startsWith('Pop'),'出口弹出标签后才按 IP 交付')
ok(scene('napt-rewrite').steps[1].rows[0][2]==='203.0.113.1','源 NAT 出向改写的是源地址')
ok(scene('napt-rewrite').steps[4].rows[0][1]==='203.0.113.10','服务发布改写的是目的地址，方向与源 NAT 相反')
ok(scene('ospf-neighbor').steps[1].rows[1][1].startsWith('Init'),'邻居状态在 Hello 到达 B 时才变')
ok(scene('ospf-neighbor').steps[2].rows[0][1]===scene('ospf-neighbor').steps[1].rows[0][1],'B 发出 Hello 不改变 A 侧状态')
ok(scene('ospf-neighbor').steps[7].rows.every(r=>r[1].startsWith('Full')),'LSDB 同步完成后双方才 Full')
ok(scene('stp-roles').steps[1].rows[0][1]==='根桥','根桥由 BID 最小决定，不是位置最居中')
ok(scene('stp-roles').steps[3].rows[4][1]==='阻塞端口','冗余链路两端只留一个转发口')
ok(scene('stp-roles').steps[2].rows.length===3,'每台非根桥只有一个朝根方向的口')
ok(scene('vlan-frame-path').steps[1].rows[0][2].startsWith('VLAN 10'),'无标签帧在access口按PVID归入VLAN 10')
ok(scene('vlan-frame-path').steps[3].rows[0][1]==='802.1Q标签 · VLAN 10','帧只在Trunk链路这一段带标签')
ok(scene('vlan-frame-path').steps[5].rows[0][1]==='无标签（已剥离）','出access口前剥离标签，PC收到普通帧')
ok(scene('vpc-egress-path').steps[0].rows[1][0]==='安全组','安全组挂在网卡上，是出流量前第一个要看的对象')
ok(scene('vpc-egress-path').steps[2].rows[3][0]==='子网关联的路由表','离开子网前先确认这个子网关联的是哪张表')
ok(scene('vpc-egress-path').steps[5].rows[6][0]==='许可','对象与路由对上之后才轮到许可检查')
ok(scene('vxlan-encap').steps[1].rows[1][0]==='VXLAN 头','VNI 随 VXLAN 头加在原始帧之外')
ok(scene('vxlan-encap').steps[3].rows[3][0]==='外层 IP','外层 IP 记的是两端 VTEP，不是租户地址')
ok(scene('vxlan-encap').steps[6].rows[1][0]==='外层','出口解封装剥掉外层后租户帧原样交付')
ok(scene('wlan-roam-hold').steps[2].rows[0][1]==='在 AP2 重建','换 AP 时关联必然重建')
ok(scene('wlan-roam-hold').steps[2].rows[2][1].includes('保持'),'同网段漫游业务 IP 不变')
ok(scene('wlan-roam-hold').steps[4].rows[4][1]==='改为经 AP2','转发路径随接入位置更新')
console.log(`PASS ${checks} teaching assertions: snapshots, TCP timing, ARP next hop, switching and glossary.`);
