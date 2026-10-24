'use strict';
/* Stateless visual primitives + explicit scenario snapshots; no animation timers. */
window.ICTTeaching=(()=>{
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=window.ICT_TEACHING_DATA||{scenarios:[],glossary:[]};
let topologySerial=0;
function topology(nodes,links,active=[]){
 const positions=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const marker='teach-arrow-'+(++topologySerial);
 return `<svg class="teach-topology" viewBox="0 0 640 160" role="img" aria-label="网络拓扑，带箭头的实线表示本步数据流向"><defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>${links.map(([a,b])=>{let A=positions[a],B=positions[b],forward=active.some(x=>x[0]===a&&x[1]===b),reverse=active.some(x=>x[0]===b&&x[1]===a);let dx=B[2]-A[2],dy=B[3]-A[3],ratio=Math.min(55/Math.abs(dx),27/Math.abs(dy));return `<line x1="${A[2]+dx*ratio}" y1="${A[3]+dy*ratio}" x2="${B[2]-dx*ratio}" y2="${B[3]-dy*ratio}" class="${forward||reverse?'active':''}" ${forward?'marker-end="url(#${marker})"':''} ${reverse?'marker-start="url(#${marker})"':''}/>`}).join('')}${nodes.map(([id,label,x,y])=>`<g><rect x="${x-51}" y="${y-23}" width="102" height="46" rx="7"/><text x="${x}" y="${y+5}" text-anchor="middle">${e(label)}</text></g>`).join('')}</svg>`;
}
function packet(fields){return `<div class="teach-packet" aria-label="报文结构">${fields.map(([label,detail])=>`<details><summary>${e(label)}</summary><p>${e(detail)}</p></details>`).join('')}</div>`}
function sequence(actors,steps,index){return `<div class="teach-sequence" aria-label="协议时序"><div class="teach-actors">${actors.map(a=>`<strong>${e(a)}</strong>`).join('')}</div>${steps.slice(0,index+1).filter(s=>s.message).map(s=>{let [from,to,label]=s.message;return `<div class="teach-message ${from>to?'reverse':''}"><span>${e(label)}</span><b aria-label="${e(actors[from])} 到 ${e(actors[to])}">${from>to?'←':'→'}</b></div>`}).join('')||'<p class="teach-wait">尚未发送报文</p>'}</div>`}
function stateTable(columns,rows,previous=[]){return `<div class="table-wrap"><table class="teach-table"><caption>当前状态（“已变化”标记与上一步不同的行）</caption><thead><tr>${columns.map(c=>`<th scope="col">${e(c)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>{let changed=!previous.some(r=>JSON.stringify(r)===JSON.stringify(row));return `<tr class="${changed?'changed':''}">${row.map((v,i)=>`<td>${e(v)}${i===0&&changed?'<small> · 已变化</small>':''}</td>`).join('')}</tr>`}).join(''):`<tr><td colspan="${columns.length}">暂无表项</td></tr>`}</tbody></table></div>`}
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
function scenarios(){return [...data.scenarios,switching()]}
function forUnit(id){let list=scenarios().filter(s=>s.unit===id);return list.filter((s,i)=>!s.variant||list.findIndex(t=>t.variant===s.variant)===i).map(s=>`<div class="teach-host" data-teach="${e(s.id)}"></div>`).join('')}
function mount(root){root.querySelectorAll('[data-teach]').forEach(host=>{let scene=scenarios().find(s=>s.id===host.dataset.teach),index=0;
 const draw=()=>{let step=scene.steps[index],previous=scene.steps[index-1]?.rows||[],variants=scene.variant?scenarios().filter(s=>s.variant===scene.variant):[];
 host.innerHTML=`<section class="teach-card" aria-label="${e(scene.title)}"><div class="eyebrow">交互原理 · 按步骤观察</div><h3>${e(scene.title)}</h3><p>${e(scene.summary)}</p>${variants.length?`<label>通信场景 <select data-scene>${variants.map(s=>`<option value="${e(s.id)}" ${s.id===scene.id?'selected':''}>${e(s.label)}</option>`).join('')}</select></label>`:''}<div class="teach-visual">${scene.nodes?topology(scene.nodes,scene.links,step.active)+'<p class="teach-pan-note">带箭头的实线为当前流向；窄屏可左右滑动拓扑。</p>':''}${scene.actors?sequence(scene.actors,scene.steps,index):''}${step.fields?packet(step.fields):''}</div><div class="teach-status" aria-live="polite" aria-atomic="true"><strong>第 ${index+1} / ${scene.steps.length} 步 · ${e(step.title)}</strong><p>${e(step.text)}</p>${stateTable(scene.columns,step.rows,previous)}</div><div class="teach-controls"><button class="secondary" data-action="prev" ${index===0?'disabled':''}>上一步</button><button class="primary" data-action="next" ${index===scene.steps.length-1?'disabled':''}>下一步 →</button><button class="secondary" data-action="reset">重置演示</button></div><details class="teach-boundary"><summary>模型条件与技术边界</summary><p>${e(scene.boundary)}</p>${scene.sources.map(([title,url])=>`<a href="${e(url)}" target="_blank" rel="noopener">${e(title)} ↗</a>`).join(' · ')}</details></section>`;
 };
 host.onclick=event=>{let b=event.target.closest('[data-action]');if(!b)return;let action=b.dataset.action;index=action==='reset'?0:Math.max(0,Math.min(scene.steps.length-1,index+(action==='next'?1:-1)));draw();(host.querySelector(`[data-action="${action}"]:not(:disabled)`)||host.querySelector('[data-action]:not(:disabled)')).focus()};
 host.onchange=event=>{if(!event.target.matches('[data-scene]'))return;scene=scenarios().find(s=>s.id===event.target.value);index=0;draw();host.querySelector('[data-scene]').focus()};draw();
 });}
function annotate(root){
 if(!data.glossary.length)return;
 const seen=new Set(),entries=data.glossary.flatMap(g=>g.terms.map(t=>[t,g])).sort((a,b)=>b[0].length-a[0].length),pattern=new RegExp(entries.map(([t])=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),texts=[];while(walker.nextNode())texts.push(walker.currentNode);
 for(let node of texts){if(node.parentElement.closest('a,button,pre,code,script,style,h1,h2,h3,summary,.teach-host,.chapter-outline,.toc,.term-first'))continue;
 let text=node.textContent,fragment=document.createDocumentFragment(),last=0;pattern.lastIndex=0;let match;
 while((match=pattern.exec(text))){let term=match[0],g=entries.find(([t])=>t===term)[1];if(/[A-Za-z0-9]/.test(term[0])&&(/[A-Za-z0-9]/.test(text[match.index-1]||'')||/[A-Za-z0-9]/.test(text[match.index+term.length]||'')))continue;if(seen.has(g.id))continue;seen.add(g.id);fragment.append(text.slice(last,match.index));let wrapper=document.createElement('span');wrapper.className='term-first';let b=document.createElement('button');b.className='term-button';b.type='button';b.dataset.term=g.id;b.textContent=term;b.setAttribute('aria-label',term+'：查看术语解释');wrapper.append(b,document.createTextNode('（'+g.plain+'）'));fragment.append(wrapper);last=match.index+term.length;}
 if(last){fragment.append(text.slice(last));node.replaceWith(fragment);}
 }
 let button=document.createElement('button');button.type='button';button.className='secondary term-library';button.textContent='统一术语库 · 点击查阅';button.onclick=()=>openGlossary();root.querySelector('.chapter-intro')?.append(button);
 root.addEventListener('click',event=>{let b=event.target.closest('[data-term]');if(b)openGlossary(b.dataset.term)});
}
function openGlossary(id){let dialog=document.getElementById('term-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='term-dialog';document.body.append(dialog)}let list=id?data.glossary.filter(g=>g.id===id):data.glossary;dialog.innerHTML=`<form method="dialog"><div class="dialog-top"><h2 id="term-title">${id?'术语解释':'统一术语库'}</h2><button aria-label="关闭术语解释">关闭 ✕</button></div></form>${list.map(g=>`<section><h3>${e(g.terms[0])}</h3><p>${e(g.plain)}</p><p>${e(g.detail)}</p></section>`).join('')}`;dialog.setAttribute('aria-labelledby','term-title');dialog.showModal();}
return {forUnit,mount,annotate,forwarding,scenarios,topology,packet,sequence,stateTable};
})();
