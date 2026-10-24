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
assert.deepEqual(plain(tcp.steps[2].rows),[['客户端','ESTABLISHED'],['服务器','SYN-RECEIVED']]);checks++;
assert.deepEqual(plain(tcp.steps[3].rows),[['客户端','ESTABLISHED'],['服务器','ESTABLISHED']]);checks++;
ok(tcp.steps[1].message[2].includes('Seq=100')&&tcp.steps[2].message[2].includes('Ack=101')&&tcp.steps[3].message[2].includes('Ack=501'),'SYN consumes one sequence number');
ok(scene('arp-local').steps[2].rows[0][0]==='192.168.10.20','local destination resolved');
ok(scene('arp-gateway').steps[2].rows[0][0]==='192.168.10.1','remote destination resolves gateway');
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
ok(scene('encapsulation').steps[3].fields[0][0].startsWith('目的 MAC'),'Ethernet field order starts with destination');
const glossary=ctx.window.ICT_TEACHING_DATA.glossary;
ok(new Set(glossary.map(g=>g.id)).size===glossary.length,'unique glossary IDs');
ok(new Set(glossary.flatMap(g=>g.terms)).size===glossary.flatMap(g=>g.terms).length,'unambiguous aliases');
for(const g of glossary)ok(g.plain&&g.detail&&g.terms.length,'term has plain explanation and detail');
const crypto=require('node:crypto'),index=fs.readFileSync(__dirname+'/dist/index.html','utf8');
for(const f of ['teaching.js','teaching-data.js'])ok(index.includes(f+'?v='+crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/dist/'+f)).digest('hex').slice(0,12)),'cache version '+f);
console.log(`PASS ${checks} teaching assertions: snapshots, TCP timing, ARP next hop, switching and glossary.`);
