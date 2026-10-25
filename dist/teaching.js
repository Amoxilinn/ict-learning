'use strict';
/* Stateless visual primitives + explicit scenario snapshots; no animation timers. */
window.ICTTeaching=(()=>{
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=window.ICT_TEACHING_DATA||{scenarios:[],glossary:[]};
let topologySerial=0;
function topology(nodes,links,active=[]){
 const xs=[...new Set(nodes.map(n=>n[2]))].sort((a,b)=>a-b),ys=[...new Set(nodes.map(n=>n[3]))].sort((a,b)=>a-b);
 const positions=Object.fromEntries(nodes.map(n=>[n[0],[n[0],n[1],85+xs.indexOf(n[2])*170,55+ys.indexOf(n[3])*105]]));
 const width=Math.max(640,170*xs.length),height=Math.max(160,110*ys.length),marker='teach-arrow-'+(++topologySerial);
 return `<svg class="teach-topology" viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-label="网络拓扑，带箭头实线表示当前流向；虚线仅表示已有连接"><defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#08715e"/></marker></defs>${links.map(([a,b])=>{const A=positions[a],B=positions[b];if(!A||!B||a===b)return '';const forward=active.some(x=>x[0]===a&&x[1]===b),reverse=active.some(x=>x[0]===b&&x[1]===a),dx=B[2]-A[2],dy=B[3]-A[3],ratio=Math.min(68/Math.abs(dx),30/Math.abs(dy));return `<line x1="${A[2]+dx*ratio}" y1="${A[3]+dy*ratio}" x2="${B[2]-dx*ratio}" y2="${B[3]-dy*ratio}" class="${forward||reverse?'active':''}" ${forward?`marker-end="url(#${marker})"`:''} ${reverse?`marker-start="url(#${marker})"`:''}/>`}).join('')}${Object.values(positions).map(([id,label,x,y])=>{const lines=String(label).match(/.{1,9}/gu)||[''];return `<g data-topology-node="${e(id)}"><rect x="${x-65}" y="${y-27}" width="130" height="54" rx="7"/><text x="${x}" y="${y-(lines.length-1)*8+5}" text-anchor="middle">${lines.map((line,i)=>`<tspan x="${x}" dy="${i?16:0}">${e(line)}</tspan>`).join('')}</text></g>`}).join('')}</svg>`;
}
function packet(fields=[],tree){
 if(tree){
  const fieldList=(items,part)=>`<details class="packet-${part}"><summary>${part==='header'?'头部':'尾部'} · ${items.map(([label])=>e(label)).join(' / ')}</summary><dl>${items.map(([label,detail])=>`<dt>${e(label)}</dt><dd>${e(detail)}</dd>`).join('')}</dl></details>`;
  const layer=node=>`<section class="packet-layer packet-${e(node.kind)}" data-layer="${e(node.kind)}" aria-label="${e(node.label)}"><strong class="packet-layer-title">${e(node.label)}</strong>${node.header?fieldList(node.header,'header'):''}${node.payload?`<div class="packet-payload"><span class="packet-payload-label">装入的完整内容（载荷）</span>${layer(node.payload)}</div>`:`<div class="packet-content">${e(node.content)}</div>`}${node.trailer?fieldList(node.trailer,'trailer'):''}</section>`;
  return `<div class="teach-packet teach-nested" aria-label="逐层嵌套的报文结构">${layer(tree)}</div><p class="packet-scale-note">外框表示包含关系，大小不按字节比例；头部可展开查看。</p>`;
 }
 return `<div class="teach-packet" aria-label="报文结构">${fields.map(([label,detail])=>`<details><summary>${e(label)}</summary><p>${e(detail)}</p></details>`).join('')}</div>`;
}
const tcpStateLabels={CLOSED:'尚未发起连接',LISTEN:'正在监听', 'SYN-SENT':'已发起，等待回复','SYN-RECEIVED':'已回复，等待确认',ESTABLISHED:'连接已建立'};
function protocolState(scene,path){
 const phases=new Map();
 for(const index of path){let step=scene.steps[index];for(const event of [step.event,...(step.also||[])].filter(Boolean))phases.set(event.id,event.phase)}
 return scene.events.filter(event=>phases.has(event.id)).map(event=>({...event,phase:phases.get(event.id)}));
}
function nextIndex(scene,index,target){
 const step=scene.steps[index];
 if(step.terminal)return null;
 if(step.actions)return step.actions.some(a=>a.target===target)?target:null;
 const next=step.next??index+1;return next<scene.steps.length?next:null;
}
function predictionResult(scene,from,choice,to){
 const prediction=scene.steps[from].prediction,answer=prediction?.answers[to];
 if(!answer||!Number.isInteger(choice)||!prediction.choices[choice])return null;
 return {correct:choice===answer.correct,selected:prediction.choices[choice].label,expected:prediction.choices[answer.correct].label,reason:answer.reason};
}
function sequence(actors,steps,index,options={}){
 if(options.scene?.richSequence){
  const {scene,path,animate}=options,step=steps[index],previous=steps[path[path.length-2]],events=protocolState(scene,path);
  const states=scene.stateKind==='tcp'?step.rows.map(r=>r[1]):step.actorStates;
  const oldStates=scene.stateKind==='tcp'?previous?.rows.map(r=>r[1]):previous?.actorStates;
  return `<div class="teach-sequence teach-sequence-rich" aria-label="报文发送接收与端点状态"><div class="teach-endpoints" style="--actors:${actors.length}">${actors.map((actor,i)=>`<div class="teach-endpoint ${oldStates&&states[i]!==oldStates[i]?'endpoint-changed':''}"><strong>${e(actor)}</strong><span>${e(tcpStateLabels[states[i]]||states[i])}</span>${scene.stateKind==='tcp'?`<code>${e(states[i])}</code>`:''}${oldStates&&states[i]!==oldStates[i]?'<small class="endpoint-delta">本步改变</small>':''}</div>`).join('')}</div><div class="teach-timeline">${events.length?events.map((event,eventIndex)=>{
   let status=event.phase==='sent'?'已发出 · 尚未收到':event.phase==='lost'?'途中丢失 · 接收端未收到':'已收到',current=eventIndex===events.length-1;
   return `<div class="teach-event event-${e(event.phase)} ${current?'event-current':''}"><div class="teach-event-label"><strong>${e(event.short)}${event.broadcast?' · 广播':''}</strong><span>${e(status)}</span></div><p class="teach-event-fields">${e(event.label)}</p>${event.to.map(to=>{
    const fromPos=(event.from+.5)*100/actors.length,toPos=(to+.5)*100/actors.length,end=event.phase==='received'?toPos:(fromPos+toPos)/2,left=Math.min(fromPos,end),length=Math.abs(end-fromPos);
    return `<div class="teach-flow-track ${to<event.from?'flow-reverse':''} ${animate&&current?'flow-animate':''}" style="--line-left:${left}%;--line-width:${length}%;--sender:${fromPos}%;--receiver:${toPos}%;--packet:${end}%;--origin:${fromPos}%" aria-label="${e(actors[event.from])} 到 ${e(actors[to])}：${e(status)}"><span class="flow-line"></span><span class="flow-sender" aria-hidden="true"></span><span class="flow-receiver" aria-hidden="true"></span><span class="flow-token" aria-hidden="true">${event.phase==='lost'?'×':to<event.from?'◀':'▶'}</span></div>`;
   }).join('')}<div class="teach-event-route">${e(actors[event.from])} → ${event.to.map(i=>e(actors[i])).join('、')}</div></div>`;
  }).join(''):'<p class="teach-wait">尚未发送报文</p>'}</div><p class="teach-sequence-key">虚线与空心接收点：尚未收到；实线与实心接收点：已收到。动画仅示意先后。</p></div>`;
 }
 return `<div class="teach-sequence teach-sequence-basic" aria-label="协议时序" style="--actors:${actors.length}"><div class="teach-actors">${actors.map(a=>`<strong>${e(a)}</strong>`).join('')}</div>${(options.path?options.path.map(i=>steps[i]):steps.slice(0,index+1)).filter(s=>s.message).map(s=>{let [from,to,label]=s.message;const start=(Math.min(from,to)+.5)*100/actors.length,width=Math.abs(to-from)*100/actors.length;return `<div class="teach-message ${from>to?'reverse':''}"><span>${e(label)}</span><b style="margin-left:${start}%;width:${width}%" aria-label="${e(actors[from])} 到 ${e(actors[to])}">${from>to?'←':'→'}</b><small class="teach-message-route">${e(actors[from])} → ${e(actors[to])}</small></div>`}).join('')||'<p class="teach-wait">尚未发送报文</p>'}</div>`;
}
function stateTable(columns,rows,previous=[]){return `<div class="table-wrap" tabindex="0" role="region" aria-label="当前状态表，可横向滚动"><table class="teach-table"><caption>当前状态（“已变化”标记与上一步不同的行）</caption><thead><tr>${columns.map(c=>`<th scope="col">${e(c)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>{let changed=previous.length>0&&!previous.some(r=>JSON.stringify(r)===JSON.stringify(row));return `<tr class="${changed?'changed':''}">${row.map((v,i)=>`<td>${e(v)}${i===0&&changed?'<small> · 已变化</small>':''}</td>`).join('')}</tr>`}).join(''):`<tr><td colspan="${columns.length}">暂无表项</td></tr>`}</tbody></table></div>`}
const mac=h=>'02:00:00:00:00:0'+({A:'A',B:'B',C:'C'}[h]);
function forwarding(table,src,dst){let next={...table,[src]:src},out=next[dst]?[next[dst]].filter(p=>p!==src):['A','B','C'].filter(p=>p!==src);return {table:next,out,kind:next[dst]===src?'同入口过滤':next[dst]?'已知单播':'未知单播泛洪'}}
function switching(){let table={},steps=[{title:'空表开始',text:'三个端口均属于 VLAN 10 且可转发。依次发送 A→B、B→A、A→B。',rows:[]}];for(let [src,dst] of [['A','B'],['B','A'],['A','B']]){
 let rows=t=>Object.entries(t).map(([h,p])=>['10',mac(h),'端口 '+p]);
 steps.push({title:`${src} → ${dst}：帧到达`,text:`目的 MAC=${mac(dst)}，源 MAC=${mac(src)}。源帧从端口 ${src} 进入。`,active:[[src,'sw']],rows:rows(table),fields:[['目的 MAC',mac(dst)],['源 MAC',mac(src)],['类型 / 数据','不影响本例 MAC 查表结论。']]});
 let r=forwarding(table,src,dst);table=r.table;
 steps.push({title:'先学习源 MAC',text:`只更新源 ${src} 对应的 VLAN 10、入口 ${src}；不会因为目的字段写着 ${dst} 就学到 ${dst}。`,rows:rows(table)});
 steps.push({title:r.kind,text:`按 VLAN 10 与目的 ${dst} 查表：${r.kind}，出口为 ${r.out.join('、')||'无'}。目的 MAC 始终是 ${mac(dst)}。`,rows:rows(table),active:r.out.map(p=>['sw',p])});
 }
 return {id:'switch-learning',unit:'ICT-003.02',title:'收帧 → 学源地址 → 查目的地址',summary:'连续观察三帧：未知单播泛洪如何变成已知单播。',nodes:[['A','A · 端口 A',80,40],['sw','交换机',320,80],['B','B · 端口 B',560,40],['C','C · 端口 C',560,130]],links:[['A','sw'],['sw','B'],['sw','C']],columns:['VLAN','MAC','出口端口'],steps,boundary:'三个接口同属 VLAN 10、无环路、均可转发。只模拟合法单播源学习与目的查表，不模拟老化、STP、安全策略及真实线速。C 收到泛洪的副本不等于应用接收了该数据。重置会清空整个演示的表。',sources:[['华为 · MAC 地址学习机制','https://info.support.huawei.com/hedex/api/pages/EDOC1000053358/YEF0907R/25/resources/en-us_concept_0133020482.html']]};
}
// Pure teaching models: ordered rules, first match, explicit caller semantics.
function ipv4Number(value){
 const parts=String(value).split('.');
 if(parts.length!==4||parts.some(p=>!/^\d{1,3}$/.test(p)||Number(p)>255))throw new Error('请输入四段 0–255 的 IPv4 地址。');
 return parts.reduce((n,p)=>n*256+Number(p),0);
}
function routePrefix(value){
 const match=String(value).trim().match(/^([^/]+)\/(\d{1,2})$/);
 if(!match||Number(match[2])>32)throw new Error('请输入合法前缀，例如 10.1.0.0/16。');
 const address=ipv4Number(match[1]),length=Number(match[2]),block=2**(32-length);
 if(address%block!==0)throw new Error('请输入网络前缀，主机位必须为 0。');
 return {address,length};
}
function inPrefix(address,network,length){const block=2**(32-length);return Math.floor(address/block)===Math.floor(ipv4Number(network)/block)}
function evaluateRules(kind,input){
 const steps=[];
 const step=(title,text,rule,result)=>steps.push({title,text,rows:[['输入',input],['当前规则',rule],['结果',result]]});
 if(kind==='acl'){
  const parts=String(input).trim().split(/\s+/);
  if(parts.length!==3||!['tcp','udp','icmp'].includes(parts[0].toLowerCase()))throw new Error('格式：tcp 10.1.1.10 443；ICMP 端口填 0。');
  const protocol=parts[0].toLowerCase(),address=ipv4Number(parts[1]);
  if(!/^\d+$/.test(parts[2])||Number(parts[2])>65535)throw new Error('端口必须是 0–65535 的整数。');
  const port=Number(parts[2]);if(protocol==='icmp'&&port!==0)throw new Error('ICMP 不使用端口，本模型请填 0。');
  step('固定调用场景','ACL 按配置顺序用于接口入方向包过滤；未匹配时按本模型显式丢弃。目的地址固定为业务服务器。','规则顺序 5 → 10 → 20','开始');
  const rules=[['5 deny tcp source 10.1.1.0/24 dport 22',protocol==='tcp'&&inPrefix(address,'10.1.1.0',24)&&port===22,'拒绝'],['10 permit tcp source 10.0.0.0/8 dport 443',protocol==='tcp'&&inPrefix(address,'10.0.0.0',8)&&port===443,'允许'],['20 deny ip any',true,'拒绝']];
  for(const [rule,match,result] of rules){step(match?'命中，停止':'不匹配，继续',match?'满足本规则的全部条件，后续规则不再执行。':'至少一个条件不满足，检查下一条。',rule,match?result:'未匹配');if(match)break;}
 }else{
  const {address,length}=routePrefix(input);
  const match=inPrefix(address,'10.0.0.0',8)&&length>=16&&length<=24;
  if(kind==='prefix'){
   step('检查条目 10','同时检查网络范围与前缀长度，不是只比较前几段地址。','10 permit 10.0.0.0/8 ge 16 le 24',match?'匹配，允许并停止':'未匹配，继续');
   if(!match)step('检查条目 20','只匹配默认路由 0.0.0.0/0；该条没有 ge/le。','20 permit 0.0.0.0/0',length===0?'匹配，允许并停止':'未匹配，继续');
   if(!match&&length!==0)step('列表末尾','前面所有条目均未匹配，前缀列表返回拒绝。','隐含拒绝','拒绝');
  }else if(kind==='policy'){
   step('节点 10 / if-match','节点 10 为 permit，引用前缀列表 P：10.0.0.0/8 ge 16 le 24。','permit node 10 / if-match P',match?'条件成立':'条件不成立，继续节点 20');
   if(match)step('执行 apply 并结束','本模型为 BGP 导入策略，给路由设置 Local Preference=200；没有 goto-next-node。','apply local-preference 200','接收路由，LocalPref=200');
   else step('节点 20 / 无条件 deny','前一节点条件不成立才到这里；无 if-match 的节点匹配所有剩余路由。','deny node 20','拒绝路由');
  }else throw new Error('未知规则模型。');
 }
 return steps;
}
const ruleTools={
 acl:{unit:'ICT-014.01',title:'输入报文：逐条执行 ACL',value:'tcp 10.1.1.10 443',label:'协议 源IPv4 目的端口',examples:['tcp 10.1.1.10 22','tcp 10.1.1.10 443','udp 192.0.2.1 53'],rules:'5 deny tcp source 10.1.1.0/24 dport 22\n10 permit tcp source 10.0.0.0/8 dport 443\n20 deny ip any'},
 prefix:{unit:'ICT-015.01',title:'输入路由：范围与长度共同匹配',value:'10.1.0.0/16',label:'IPv4 网络前缀',examples:['10.1.0.0/16','10.1.1.0/25','0.0.0.0/0'],rules:'10 permit 10.0.0.0/8 ge 16 le 24\n20 permit 0.0.0.0/0\n其余隐含拒绝'},
 policy:{unit:'ICT-016.01',title:'输入路由：if-match、apply 与节点结果',value:'10.1.0.0/16',label:'IPv4 网络前缀',examples:['10.1.0.0/16','10.1.1.0/25','192.0.2.0/24'],rules:'P: permit 10.0.0.0/8 ge 16 le 24\npermit node 10: if-match P; apply local-preference 200\ndeny node 20: 无 if-match'}
};
function ruleToolHtml(unit){return Object.entries(ruleTools).filter(([,v])=>v.unit===unit).map(([kind,v])=>`<section class="teach-card rule-tool" data-rule-tool="${kind}" aria-label="${e(v.title)}"><div class="eyebrow">交互原理 · 输入并逐条判断</div><h3>${e(v.title)}</h3><p>先输入报文或网络前缀，再逐步查看匹配过程。修改输入后点击“开始判断”。</p><pre>${e(v.rules)}</pre><form><label>${e(v.label)}<input name="rule-input" value="${e(v.value)}" required autocomplete="off" spellcheck="false"></label><button class="primary" type="submit">开始判断</button></form><div class="rule-examples">${v.examples.map(x=>`<button type="button" class="secondary" data-example="${e(x)}">${e(x)}</button>`).join('')}</div><div data-rule-result role="status" aria-live="polite"></div><div class="teach-controls"><button class="secondary" data-rule-prev>上一步</button><button class="primary" data-rule-next>下一条 →</button><button class="secondary" data-rule-reset>重置</button></div><details class="teach-boundary"><summary>模型条件与技术边界</summary><p>固定规则与调用场景，按配置顺序首匹配；仅支持 IPv4。ACL 规则语义还取决于引用它的模块，不能把本例丢弃结论直接推广到 QoS 分类或路由策略；前缀列表拒绝在本例策略中表示 if-match 不成立，会继续后续节点。无 goto-next-node，不模拟设备自动重排、IPv6 或完整命令解析。</p></details></section>`).join('')}
function mountRuleTools(root){root.querySelectorAll('[data-rule-tool]').forEach(host=>{
 const kind=host.dataset.ruleTool,config=ruleTools[kind],input=host.querySelector('input');let steps=[],index=0;
 const draw=()=>{const s=steps[index];host.querySelector('[data-rule-result]').innerHTML=s?`<strong>第 ${index+1} / ${steps.length} 步 · ${e(s.title)}</strong><p>${e(s.text)}</p>${stateTable(['观察对象','当前值'],s.rows,index?steps[index-1].rows:[])}`:'';host.querySelector('[data-rule-prev]').disabled=!s||index===0;host.querySelector('[data-rule-next]').disabled=!s||index===steps.length-1;};
 const run=()=>{try{steps=evaluateRules(kind,input.value);index=0;draw()}catch(error){steps=[];index=0;draw();host.querySelector('[data-rule-result]').textContent=error.message}};
 host.querySelector('form').onsubmit=event=>{event.preventDefault();run()};
 host.onclick=event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.example!==undefined){input.value=b.dataset.example;run()}else if(b.hasAttribute('data-rule-reset')){input.value=config.value;run()}else if(b.hasAttribute('data-rule-next')&&!b.disabled){index++;draw()}else if(b.hasAttribute('data-rule-prev')&&!b.disabled){index--;draw()}};
 input.oninput=()=>{steps=[];index=0;draw()};run();
})}

// Visuals carry spatial relationships; all labels remain text for accessibility.
function conceptDiagram(spec){
 if(!spec)return '';
 const title=spec.kind==='slots'?'FlexE 日历：从左向右为一个周期':spec.kind==='window'?'流程或统计窗口':spec.kind==='spectrum'?'2.4 GHz 频谱示意，横轴为信道中心频率':'定位观测与误差示意';
 let shapes='';
 if(spec.kind==='slots'||spec.kind==='window'){
  const items=spec.items,w=560/items.length;
  shapes=items.map((x,i)=>`<g><rect x="${35+i*w}" y="55" width="${w-8}" height="76" rx="5" fill="${spec.kind==='slots'?(x==='A'?'#d0e9fa':x==='B'?'#f8dfb0':'#eee'):(i===spec.current?'#b7e2d5':'#edf4f1')}" stroke="#56796a"/><text x="${35+i*w+(w-8)/2}" y="85" text-anchor="middle">${e(x)}</text><text x="${35+i*w+(w-8)/2}" y="112" text-anchor="middle">${spec.kind==='slots'?'时隙 '+(i+1):'观察点 '+(i+1)}</text></g>`).join('');
 }else if(spec.kind==='spectrum'){
  shapes='<line x1="35" y1="155" x2="605" y2="155" stroke="#526c61"/>';
  shapes+=Array.from({length:13},(_,i)=>`<text x="${110+i*34}" y="178" text-anchor="middle">${i+1}</text>`).join('');
  shapes+=spec.channels.map((ch,i)=>{let x=110+(ch-1)*34,y=35+i*22;return `<path d="M${x-68},150 Q${x},0 ${x+68},150Z" fill="${['#137b6b','#c17d28','#546ec1'][i]}" fill-opacity=".22" stroke="${['#137b6b','#c17d28','#546ec1'][i]}"/><text x="${x}" y="${y}" text-anchor="middle">AP${i+1} · ${ch}</text>`}).join('');
 }else if(spec.kind==='location'){
  shapes='<rect x="40" y="35" width="560" height="225" fill="#f5f8f6" stroke="#547b69"/>';
  for(const [x,y,r,name] of [[140,85,140,'AP1'],[480,85,160,'AP2'],[320,220,100,'AP3']])shapes+=`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#7c9e8d" stroke-dasharray="6 5"/><circle cx="${x}" cy="${y}" r="7" fill="#075e4c"/><text x="${x}" y="${y-12}" text-anchor="middle">${name}</text>`;
  if(spec.blocked)shapes+='<line x1="365" y1="40" x2="365" y2="210" stroke="#77523d" stroke-width="8"/>';
  shapes+=`<circle cx="310" cy="125" r="7" fill="#164d90"/><text x="${spec.blocked?240:210}" y="105">真实点</text><circle cx="${spec.blocked?405:325}" cy="${spec.blocked?160:140}" r="17" fill="#d7903e" fill-opacity=".45" stroke="#875317"/><text x="${spec.blocked?420:345}" y="${spec.blocked?180:155}">估计范围</text>`;
 }
 return `<svg class="teach-concept concept-${e(spec.kind)}" viewBox="0 0 640 ${spec.kind==='location'?290:200}" role="img" aria-label="${e(title)}"><title>${e(title)}</title>${shapes}</svg><p class="teach-pan-note">图示宽于屏幕时可左右滑动；带文字的标记与状态表可对照阅读。</p>`;
}
function floorModel({scale=10,wall=8,aps=[[10,10],[30,10]],power=15}={}){
 if(!Number.isFinite(scale)||scale<5||scale>15||!Number.isFinite(wall)||wall<0||wall>30||!Number.isFinite(power)||power<0||power>25||!aps.length||aps.some(p=>p.length!==2||p.some((n,i)=>!Number.isFinite(n)||n<0||n>(i?20:40))))throw Error('比例校准为5–15米，墙损0–30dB，功率0–25dBm；AP坐标须在40×20图纸范围内。');
 const cells=[];let covered=0;
 for(let y=1;y<20;y+=2)for(let x=1;x<40;x+=2){
  const signal=Math.max(...aps.map(([ax,ay])=>{
   const distance=Math.max(1,Math.hypot(x-ax,y-ay)*scale/10);
   const crosses=(x-20)*(ax-20)<0,wallY=crosses?ay+(y-ay)*(20-ax)/(x-ax):99;
   return power-40-30*Math.log10(distance)-(crosses&&wallY<=16?wall:0);
  }));
  if(signal>=-67)covered++;cells.push({x,y,signal});
 }
 return {cells,coverage:Math.round(covered/cells.length*100),area:40*20*(scale/10)**2};
}
function floorSvg(config,result){
 const color=s=>s>=-57?'#71b99e':s>=-67?'#bad8ac':s>=-77?'#f4d48c':'#dfaaaa';
 return `<svg class="teach-floor" viewBox="0 0 680 390" role="img" aria-label="办公区平面图，墙体与AP点位、预测RSSI色块"><title>教学办公区平面图，北向朝上；色块为预测信号</title><rect x="40" y="40" width="600" height="300" fill="#f3f7f4" stroke="#4b6c60"/>${config.stage>=3?result.cells.map(c=>`<rect x="${40+(c.x-1)*15}" y="${40+(c.y-1)*15}" width="30" height="30" fill="${color(c.signal)}"><title>图纸坐标 ${c.x},${c.y}：${c.signal.toFixed(1)} dBm</title></rect>`).join(''):''}${config.stage>=1?'<path d="M340 40V280" stroke="#75543e" stroke-width="8"/><text x="350" y="68">墙体（下方留门）</text>':''}<text x="55" y="62">办公区 A</text><text x="490" y="322">办公区 B</text>${config.stage>=2?config.aps.map(([x,y],i)=>`<g><circle cx="${40+x*15}" cy="${40+y*15}" r="10" fill="#fff" stroke="#164b83" stroke-width="3"/><text x="${40+x*15}" y="${40+y*15-16}" text-anchor="middle">AP${i+1}</text></g>`).join(''):''}<path d="M40 360H190M40 354V366M190 354V366" stroke="#243e34" stroke-width="2"/><text x="205" y="365">已知线段 ${config.scale} 米；整层 ${4*config.scale} × ${2*config.scale} 米</text><text x="600" y="25">北 ↑</text></svg>`;
}
function floorToolHtml(unit){return (data.floorTools||[]).filter(t=>t.unit===unit).map(t=>`<section class="teach-card" data-floor-tool aria-label="${e(t.title)}"><div class="eyebrow">可操作规划模型</div><h3>${e(t.title)}</h3><p>这是本站教学工作台，界面按校准→墙体→布点→仿真组织；不是 WLAN Planner 产品截图。先校准底部线段，再选择墙体与点位，最后比较覆盖结果。</p><div class="lab-controls"><label>图上标尺实际长度（米）<input data-floor="scale" type="number" min="5" max="15" value="10" step="1"></label><label>墙体模型<select data-floor="wall"><option value="3">轻隔断 · 3dB</option><option value="8" selected>普通墙 · 8dB</option><option value="18">高损墙 · 18dB</option></select></label><label>AP 发射功率（dBm）<input data-floor="power" type="number" min="0" max="25" value="15"></label><label>AP 布点<select data-floor="layout"><option value="one">仅左侧一台</option><option value="two" selected>墙两侧各一台</option><option value="three">三台分散布点</option><option value="custom">单AP自定义坐标</option></select></label><label>AP1 图纸 X / Y（米）<input aria-label="AP1 X坐标" data-floor="x" type="number" min="0" max="40" value="10"><input aria-label="AP1 Y坐标" data-floor="y" type="number" min="0" max="20" value="10"></label></div><div class="teach-controls"><button class="secondary" data-floor-stage="0">1 校准底图</button><button class="secondary" data-floor-stage="1">2 标注墙体</button><button class="secondary" data-floor-stage="2">3 布放 AP</button><button class="primary" data-floor-stage="3">4 运行预测</button><button class="secondary" data-floor-save>记为调整前</button><button class="secondary" data-floor-reset>重置</button></div><div class="teach-visual" tabindex="0" role="region" aria-label="规划平面图，可横向滚动" data-floor-map></div><p class="teach-pan-note">窄屏可左右滑动平面图，查看墙体、门与右侧 AP；聚焦图框后也可用方向键滚动。</p><div data-floor-result aria-live="polite"></div><p class="floor-key">图例：深绿 ≥−57；浅绿 −67至−57；黄 −77至−67；红 &lt;−77 dBm。以 −67 dBm 为本例阈值；颜色之外可悬停色块查看数值。</p><details class="teach-boundary"><summary>模型公式与现场验证</summary><p>40×20图纸坐标；底部标尺占宽度1/4。简化模型 RSSI=功率−40−30log10(距离米)−穿墙损耗，距离下限1米；仅计算一条墙的穿越，未建模天线、多径、频率、上行、同频竞争。墙损与阈值均为教学假设，不对应真实材质或验收承诺。覆盖比例按200个网格中心统计，不代表容量。工勘复核尺寸和材质，安装核对点位与朝向，忙时以终端RSSI/SNR、吞吐和时延复测。</p></details></section>`).join('')}
function mountFloorTools(root){root.querySelectorAll('[data-floor-tool]').forEach(host=>{
 let stage=0,saved=null;
 const read=()=>{const val=n=>{const raw=host.querySelector(`[data-floor="${n}"]`).value.trim();if(raw==='')throw Error('请填写完整的规划参数，再运行预测。');return Number(raw)},layout=host.querySelector('[data-floor="layout"]').value;return {stage,scale:val('scale'),wall:stage>=1?val('wall'):0,power:val('power'),aps:layout==='one'?[[10,10]]:layout==='two'?[[10,10],[30,10]]:layout==='three'?[[8,5],[12,15],[30,10]]:[[val('x'),val('y')]]}};
 const draw=()=>{try{const config=read(),r=floorModel(config);host.querySelector('[data-floor-map]').innerHTML=floorSvg(config,r);host.querySelector('[data-floor-result]').textContent=stage<3?`当前第 ${stage+1} 步：${['以已知线段校准米数','设置墙体位置与损耗','核对 AP 点位与功率'][stage]}，完成后运行预测。`:`预测覆盖 ${r.coverage}%；面积 ${r.area.toFixed(0)}m²；AP ${config.aps.length} 台。${saved?`调整前 ${saved.coverage}% / ${saved.aps} 台 / ${saved.area.toFixed(0)}m²；覆盖变化 ${r.coverage-saved.coverage} 个百分点。${saved.area!==r.area?'面积已变，两次结果条件不同，应先复核比例尺。':''}`:'可先记为调整前，再改变墙体或点位比较。'}`;host.querySelector('[data-floor-save]').disabled=stage<3;host.querySelectorAll('[data-floor-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.floorStage)===stage)));}catch(error){host.querySelector('[data-floor-result]').textContent=error.message;host.querySelector('[data-floor-map]').innerHTML='';host.querySelector('[data-floor-save]').disabled=true}};
 host.onchange=event=>{if(event.target.matches('[data-floor="x"],[data-floor="y"]'))host.querySelector('[data-floor="layout"]').value='custom';draw()};host.onclick=event=>{const b=event.target.closest('button');if(!b)return;if(b.hasAttribute('data-floor-stage'))stage=Number(b.dataset.floorStage);else if(b.hasAttribute('data-floor-save')){try{const c=read(),r=floorModel(c);saved={...r,aps:c.aps.length}}catch{return}}else if(b.hasAttribute('data-floor-reset')){stage=0;saved=null;for(const [n,v] of Object.entries({scale:10,wall:8,power:15,layout:'two',x:10,y:10}))host.querySelector(`[data-floor="${n}"]`).value=v}draw()};draw();
})}
function referenceFiguresHtml(unit){const figures=(data.referenceFigures||[]).filter(f=>f.unit===unit);return figures.length?`<section class="teach-card reference-gallery" aria-label="WLAN Planner官方界面阅读"><h3>把操作对应到真实工具界面</h3><p>下面是华为公开《WLAN Planner Usage Guide》（EDOC1100156118）的原始界面插图；指南页面更新于2026-05-14，未单独标注截图对应的软件构建版本。点击图片可查看原尺寸，实际菜单以使用的版本为准。</p>${figures.map(f=>`<figure id="${e(f.id)}"><h4>${e(f.title)}</h4><a href="${e(f.image)}" target="_blank" rel="noopener" aria-label="查看原尺寸：${e(f.title)}"><img src="${e(f.image)}" width="${f.width}" height="${f.height}" alt="${e(f.alt)}" loading="lazy"></a><figcaption><p>${e(f.caption)}</p><a href="${e(f.image)}" target="_blank" rel="noopener">查看原尺寸界面图 ↗</a> · <a href="${e(f.source)}" target="_blank" rel="noopener">华为官方操作说明 ↗</a><small>图片版权归华为技术有限公司；仅用于本节工具操作讲解，不属于本站MIT许可。</small></figcaption></figure>`).join('')}</section>`:''}
function labHtml(unit){return (data.labs||[]).filter(l=>l.unit===unit).map(l=>`<details class="teach-card lab-guide"><summary>配套实验：${e(l.title)}</summary><p>${e(l.status)}</p><h4>拓扑与地址</h4><pre>${e(l.topology)}</pre>${stateTable(['对象','地址 / 参数'],l.addresses)}<p><strong>适用环境：</strong>${e(l.platform)}</p><h4>操作与预期证据</h4><ol>${l.steps.map(x=>`<li>${e(x)}</li>`).join('')}</ol>${l.code?`<h4>配置与验证脚本（版本限定）</h4><pre>${e(l.code)}</pre>`:''}<h4>故障与恢复</h4><p>${e(l.fault)}</p><p>${e(l.recovery)}</p>${l.sources?`<p>${l.sources.map(([title,url])=>`<a href="${e(url)}" target="_blank" rel="noopener">${e(title)} ↗</a>`).join(' · ')}</p>`:''}<h4>预期输出的判读</h4><pre>${e(l.expected)}</pre>${l.download?`<a href="${e(l.download)}" download>下载可运行的离线示例</a>`:''}<p class="lab-note">${e(l.limit)}</p></details>`).join('')}

function scenarios(){return [...data.scenarios,switching()]}
function forUnit(id){let list=scenarios().filter(s=>s.unit===id);return list.filter((s,i)=>!s.variant||list.findIndex(t=>t.variant===s.variant)===i).map(s=>`<div class="teach-host" data-teach="${e(s.id)}"></div>`).join('')+ruleToolHtml(id)+floorToolHtml(id)+referenceFiguresHtml(id)+labHtml(id)}
function mount(root){mountRuleTools(root);mountFloorTools(root);root.querySelectorAll('[data-teach]').forEach(host=>{
 let scene=scenarios().find(s=>s.id===host.dataset.teach),history=[0],answers=new Map(),feedback=null;
 const draw=(animate=false)=>{
  const index=history[history.length-1],step=scene.steps[index],previous=scene.steps[history[history.length-2]]?.rows||[],variants=scene.variant?scenarios().filter(s=>s.variant===scene.variant):[],selected=answers.get(index),boundaryOpen=host.querySelector('.teach-boundary')?.open,panLeft=host.querySelector('.teach-visual')?.scrollLeft||0;
  const prediction=step.prediction?`<fieldset class="teach-prediction"><legend>先预测，再操作 <small>（可跳过）</small></legend><p>${e(step.prediction.prompt)}</p><div class="prediction-choices">${step.prediction.choices.map((choice,i)=>`<label class="prediction-choice ${selected===i?'selected':''}"><input type="radio" name="${e(scene.id)}-prediction" data-prediction="${i}" ${selected===i?'checked':''}><span>${e(choice.label)}</span></label>`).join('')}</div>${selected!==undefined?'<p class="prediction-pending">已选好。执行下面的报文操作，查看实际结果。</p>':''}</fieldset>`:'';
  const result=feedback?`<div class="teach-feedback ${feedback.correct?'consistent':'different'}" role="status"><strong>${feedback.correct?'预测与结果一致':'结果与你的预测不同'}</strong><p>你的预测：${e(feedback.selected)}<br>实际结果：${e(feedback.expected)}</p><p>${e(feedback.reason)}</p><button class="secondary" data-action="retry">回到刚才再试</button></div>`:'';
  const actions=step.actions?step.actions.map(action=>`<button class="${action.kind==='drop'?'secondary':'primary'}" data-action="branch" data-target="${action.target}">${e(action.label)}</button>`).join(''):`<button class="primary" data-action="next" ${nextIndex(scene,index)===null?'disabled':''}>${e(step.terminal?step.endLabel||'本次观察结束':step.nextLabel||'下一步 →')}</button>`;
  host.innerHTML=`<section class="teach-card" aria-label="${e(scene.title)}"><div class="eyebrow">${scene.richSequence?'交互原理 · 预测与验证':'交互原理 · 按步骤观察'}</div><h3>${e(scene.title)}</h3><p>${e(scene.summary)}</p>${variants.length?`<label>通信场景 <select data-scene>${variants.map(s=>`<option value="${e(s.id)}" ${s.id===scene.id?'selected':''}>${e(s.label)}</option>`).join('')}</select></label>`:''}<div class="teach-visual" tabindex="0" role="region" aria-label="教学图示，可用方向键滚动">${conceptDiagram(step.diagram)}${scene.nodes?topology(step.nodes||scene.nodes,step.links||scene.links,step.active)+'<p class="teach-pan-note">带箭头的实线为当前流向；窄屏可左右滑动拓扑。</p>':''}${scene.actors?sequence(scene.actors,scene.steps,index,{scene,path:history,animate}):''}${step.packet?packet([],step.packet):step.fields?packet(step.fields):''}</div><div class="teach-status" aria-live="polite" aria-atomic="true"><strong>${scene.richSequence?'当前观察点':`第 ${index+1} / ${scene.steps.length} 步`} · ${e(step.title)}</strong><p>${e(step.text)}</p>${step.output?`<pre class="teach-output">${e(step.output)}</pre>`:''}${scene.hideTable?'':stateTable(scene.columns,step.rows,previous)}</div>${result}${prediction}<div class="teach-controls"><button class="secondary" data-action="prev" ${history.length===1?'disabled':''}>${e(scene.prevLabel||'上一步')}</button>${actions}<button class="secondary" data-action="reset">重置演示</button></div><details class="teach-boundary" ${boundaryOpen?'open':''}><summary>模型条件与技术边界</summary><p>${e(scene.boundary)}</p>${scene.sources.map(([title,url])=>`<a href="${e(url)}" target="_blank" rel="noopener">${e(title)} ↗</a>`).join(' · ')}</details></section>`;
  host.querySelector('.teach-visual').scrollLeft=panLeft;
 };
 host.onclick=event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action,index=history[history.length-1];
  if(action==='reset'){history=[0];answers.clear();feedback=null}
  else if(action==='prev'||action==='retry'){if(history.length===1)return;history.pop();answers.delete(history[history.length-1]);feedback=null}
  else {const next=nextIndex(scene,index,action==='branch'?Number(button.dataset.target):undefined);if(next===null)return;feedback=predictionResult(scene,index,answers.get(index),next);history.push(next)}
  draw(true);
  const focus=host.querySelector(`[data-action="${action}"]:not(:disabled)`)||host.querySelector('[data-action]:not(:disabled)'),showVisual=scene.richSequence||scene.steps.some(s=>s.packet);
  focus.focus({preventScroll:showVisual});if(showVisual)host.querySelector('.teach-visual').scrollIntoView({block:'start'});
 };
 host.onchange=event=>{
  if(event.target.matches('[data-scene]')){scene=scenarios().find(s=>s.id===event.target.value);history=[0];answers.clear();feedback=null;draw();host.querySelector('[data-scene]').focus()}
  if(event.target.matches('[data-prediction]')){let choice=Number(event.target.dataset.prediction);answers.set(history[history.length-1],choice);draw();host.querySelector(`[data-prediction="${choice}"]`).focus()}
 };
 draw();
});}
function annotate(root,options={}){
 if(!data.glossary.length)return;
 const seen=new Set(),glossary=data.glossary.filter(g=>g.annotate!==false&&(!g.chapters||g.chapters.includes(options.chapter))),entries=glossary.flatMap(g=>g.terms.map(t=>[t,g])).sort((a,b)=>b[0].length-a[0].length),pattern=new RegExp(entries.map(([t])=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),texts=[];while(walker.nextNode())texts.push(walker.currentNode);
 for(let node of texts){if(options.layered&&node.parentElement.closest('.syllabus-detail'))continue;if(node.parentElement.closest('a,button,pre,code,script,style,h1,h2,h3,h4,summary,details,.teach-host,.chapter-intro,.chapter-outline,.chapter-objectives,.chapter-advanced,.worked-example,.unit-check,.unit-goal,.unit-takeaway,.unit-advanced,.unit-visual,.inline-diagram,.progress-panel,.toc,.term-first'))continue;
 let text=node.textContent,fragment=document.createDocumentFragment(),last=0;pattern.lastIndex=0;let match;
 while((match=pattern.exec(text))){let term=match[0],g=entries.find(([t])=>t===term)[1];if(/[A-Za-z0-9]/.test(term[0])&&(/[A-Za-z0-9]/.test(text[match.index-1]||'')||/[A-Za-z0-9]/.test(text[match.index+term.length]||'')))continue;if(seen.has(g.id))continue;seen.add(g.id);fragment.append(text.slice(last,match.index));let wrapper=document.createElement('span');wrapper.className='term-first';let b=document.createElement('button');b.className='term-button';b.type='button';b.dataset.term=g.id;b.textContent=term;b.setAttribute('aria-label',term+'：查看术语解释');wrapper.append(b,document.createTextNode('（'+(options.layered?g.hint||g.beginner||g.plain:g.plain)+'）'));fragment.append(wrapper);last=match.index+term.length;}
 if(last){fragment.append(text.slice(last));node.replaceWith(fragment);}
 }
 let button=document.createElement('button');button.type='button';button.className='secondary term-library';button.textContent='术语表 · 点击查阅';button.onclick=()=>openGlossary(undefined,options);root.querySelector('.chapter-intro')?.append(button);
 root.addEventListener('click',event=>{let b=event.target.closest('[data-term]');if(b)openGlossary(b.dataset.term,options)});
}
function termExplanation(g,layered=false){
 return layered?`<section><h3>${e(g.terms[0])}</h3><p class="term-beginner"><strong>通俗解释</strong><br>${e(g.beginner||g.plain)}</p><details class="term-definition"><summary>查看专业定义</summary><p>${e(g.definition||g.detail)}</p></details></section>`:`<section><h3>${e(g.terms[0])}</h3><p>${e(g.plain)}</p><p>${e(g.detail)}</p></section>`;
}
function openGlossary(id,options={}){
 let dialog=document.getElementById('term-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='term-dialog';document.body.append(dialog)}
 let available=data.glossary.filter(g=>!g.chapters||g.chapters.includes(options.chapter));let list=id?available.filter(g=>g.id===id):available;
 dialog.innerHTML=`<form method="dialog"><div class="dialog-top"><h2 id="term-title">${id?'术语解释':'统一术语库'}</h2><button aria-label="关闭术语解释">关闭 ✕</button></div></form>${list.map(g=>termExplanation(g,options.layered)).join('')}`;
 dialog.setAttribute('aria-labelledby','term-title');dialog.showModal();
}
return {floorModel,floorSvg,conceptDiagram,evaluateRules,routePrefix,ipv4Number,forUnit,mount,annotate,forwarding,scenarios,topology,packet,sequence,stateTable,protocolState,nextIndex,predictionResult,termExplanation};
})();
