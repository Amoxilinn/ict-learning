// Semantic regression checks for the expanded teaching coverage.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
for(const p of ['dist/teaching-data.js','dist/teaching.js'])vm.runInContext(fs.readFileSync(p,'utf8'),context);
const t=context.window.ICTTeaching,scenes=t.scenarios(),units=JSON.parse(fs.readFileSync('content/teaching-units.json'));
let checks=0;function ok(v,m){assert.ok(v,m);checks++}const scene=id=>scenes.find(s=>s.id===id);
// Corrected ownership must survive frozen merge and build.
for(const [unit,word] of [['ICT-045.03','分布式'],['ICT-045.04','跨域'],['ICT-045.05','EVPN'],['ICT-079.03','控制'],['ICT-079.04','转发']])ok(JSON.stringify(units[unit]).includes(word),unit+' topic ownership');
ok(units['ICT-045.03'].goal.includes('分布式网关'),'distributed gateway goal');ok(units['ICT-045.04'].goal.includes('跨域'),'inter-DC goal');ok(units['ICT-045.05'].goal.includes('EVPN'),'EVPN goal');
ok(units['ICT-079.03'].sections[0].title.includes('控制平面'),'control plane body');ok(units['ICT-079.04'].sections[0].title.includes('认证'),'forwarding body');
for(let i=45;i<=55;i++)ok(scenes.some(s=>s.unit.startsWith('ICT-'+String(i).padStart(3,'0')+'.')),'DCN chapter '+i+' has a scene');
const final=(kind,input)=>t.evaluateRules(kind,input).at(-1).rows.at(-1)[1];
ok(final('acl','tcp 10.1.1.10 22')==='拒绝','SSH deny first');ok(final('acl','tcp 10.1.1.10 443')==='允许','HTTPS allow');ok(final('acl','udp 10.1.1.10 443')==='拒绝','protocol condition enforced');ok(final('acl','tcp 11.0.0.1 443')==='拒绝','source condition enforced');
ok(t.evaluateRules('acl','tcp 10.1.1.10 22').length===2,'stop after first match');
for(let len=8;len<=32;len++){
 const permitted=len>=16&&len<=24;
 ok((final('prefix',`10.0.0.0/${len||1}`)==='匹配，允许并停止')===(permitted),'prefix length '+len);
 ok(final('policy',`10.0.0.0/${len||1}`).includes('LocalPref=200')===permitted,'policy length '+len);
}
ok(final('prefix','0.0.0.0/0').startsWith('匹配'),'exact default permitted');
ok(final('prefix','192.0.2.0/24')==='拒绝','outside address range rejected');ok(final('policy','192.0.2.0/24')==='拒绝路由','if-match false continues to deny');
for(const [kind,input] of [['acl','tcp 999.1.1.1 443'],['acl','tcp 10.1.1.1 -1'],['acl','tcp 10.1.1.1 65536'],['acl','icmp 10.1.1.1 443'],['acl','tcp <script> 443'],['prefix','10.1.1.1/24'],['prefix','10.0.0.0/33'],['policy',''],['prefix','0.0.0.0/-1']]){assert.throws(()=>t.evaluateRules(kind,input));checks++}
for(const [unit,kind] of [['ICT-014.01','acl'],['ICT-015.01','prefix'],['ICT-016.01','policy']])ok(t.forUnit(unit).includes(`data-rule-tool="${kind}"`),'input tool mounted');
const sr=scene('srv6-segment-hop');ok(sr.steps.slice(0,3).map(s=>s.rows[0][1]).join()==='A,B,C','SRH DA sequence');ok(sr.steps.slice(0,3).map(s=>s.rows[1][1]).join()==='2,1,0','SRH SL sequence');
ok(scene('vpn-two-labels').steps[2].rows[1][1].includes('200'),'PHP retains VPN label');
ok(scene('sta-wpa2-online').unit==='ICT-074.02'&&scene('ap-find-ac').unit==='ICT-074.01','STA and AP are distinct flows');
ok(scene('qos-queue-congestion').steps[2].rows[1][1]==='3 包','queue overflow arithmetic');
for(const s of scenes){
 ok(s.sources.every(x=>/^https:\/\//.test(x[1])),'source URLs');
 if(s.nodes){const html=t.topology(s.nodes,s.links,[s.links[0]]);ok(!html.includes('NaN'),'valid topology geometry');ok(!html.includes('${marker}'),'marker IDs interpolated');const id=html.match(/marker id="([^"]+)/)[1];ok(html.includes('marker-end="url(#'+id+')"'),'forward marker resolves');const reverse=t.topology(s.nodes,s.links,[[s.links[0][1],s.links[0][0]]]);ok(/marker-start="url\(#teach-arrow-\d+\)"/.test(reverse),'reverse marker resolves');}
 for(const st of s.steps){ok(st.title&&st.text&&st.rows.every(r=>r.every(x=>typeof x==='string'&&x.length)),'complete snapshot');if(st.fields)ok(!t.packet(st.fields).includes('undefined'),'packet renders')}
}
console.log(`PASS ${checks} expanded checks: topic ownership, coverage, rule boundaries and protocol snapshots`);
