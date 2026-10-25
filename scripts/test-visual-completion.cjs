const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ctx={window:{}};vm.createContext(ctx);for(const p of ['dist/teaching-data.js','dist/teaching.js'])vm.runInContext(fs.readFileSync(p,'utf8'),ctx);
const t=ctx.window.ICTTeaching,data=ctx.window.ICT_TEACHING_DATA;let checks=0;const ok=(x,msg)=>{assert.ok(x,msg);checks++};
for(const s of t.scenarios()){
 const reachable=new Set();
 const visit=(i,path=[])=>{ok(!path.includes(i),s.id+' no cycle');reachable.add(i);const st=s.steps[i];ok(st,s.id+' valid step');if(st.terminal)return;if(st.actions){ok(t.nextIndex(s,i)===null,s.id+' cannot skip a choice');for(const a of st.actions){ok(t.nextIndex(s,i,a.target)===a.target,s.id+' valid branch');visit(a.target,[...path,i])}}else{const next=t.nextIndex(s,i);if(next!==null)visit(next,[...path,i])}};
 visit(0);ok(reachable.size===s.steps.length,s.id+' no orphan steps');
 for(const st of s.steps){
  if(st.diagram){const h=t.conceptDiagram(st.diagram);ok(h.includes('<title>')&&!h.includes('undefined')&&!h.includes('NaN'),s.id+' accessible concept SVG')}
  const nodes=st.nodes||s.nodes,links=st.links||s.links;
  if(nodes){ok(new Set(nodes.map(n=>n[0])).size===nodes.length,s.id+' unique node IDs');for(const [a,b] of links)ok(nodes.some(n=>n[0]===a)&&nodes.some(n=>n[0]===b)&&a!==b,s.id+' link endpoints');const h=t.topology(nodes,links,st.active);ok(!h.includes('NaN')&&!h.includes('Infinity'),s.id+' finite geometry')}
 }
}
const one=t.floorModel({aps:[[10,10]],wall:18}),two=t.floorModel({aps:[[10,10],[30,10]],wall:18}),noWall=t.floorModel({aps:[[10,10]],wall:0});
ok(two.coverage>one.coverage,'second AP across wall improves example coverage');ok(noWall.coverage>=one.coverage,'wall cannot improve coverage');
ok(t.floorModel({power:20}).coverage>=t.floorModel({power:10}).coverage,'power monotonic in simplified model');
ok(t.floorModel({scale:12}).area===1152,'calibration changes area by square ratio');ok(one.cells.length===200,'coverage denominator');
for(const config of [{aps:[]},{scale:0},{scale:NaN},{wall:-1},{power:26},{aps:[[41,10]]},{aps:[[10,-1]]}]){assert.throws(()=>t.floorModel(config));checks++}
const aaa=t.scenarios().find(s=>s.id==='aaa-01');const success=t.sequence(aaa.actors,aaa.steps,4,{path:[0,1,4]});ok(!success.includes('拒绝身份')&&success.includes('Accounting Start'),'success sequence never shows failed branch');
const failure=t.sequence(aaa.actors,aaa.steps,2,{path:[0,1,2]});ok(failure.includes('拒绝身份')&&!failure.includes('Accounting Start'),'failed sequence contains only path messages');
for(let n=1;n<=8;n++)ok(t.scenarios().some(s=>s.unit==='ICT-035.'+String(n).padStart(2,'0')),'all switching security topics illustrated');
for(const l of data.labs){ok(l.steps.length>=3&&l.fault&&l.recovery&&l.expected&&l.platform&&l.addresses.length,'lab reproducibility fields');ok(t.forUnit(l.unit).includes('配套实验'),'lab mounted on real unit')}
ok(data.floorTools.length===4,'planning, design and optimization share the editable model');
const bgp=t.scenarios().find(s=>s.id==='bgp-path-select');ok(bgp.columns.length===5&&bgp.steps[0].rows[0][4].includes('排除'),'BGP ineligible path excluded before attributes');
for(const f of data.referenceFigures||[]){ok(fs.existsSync('dist/'+f.image),'official screenshot asset exists');ok(t.forUnit(f.unit).includes(f.image)&&f.alt&&f.caption,'screenshot mounted with accessible caption');ok(f.source.includes('EDOC1100156118'),'traceable official figure source')}
console.log(`PASS ${checks} visual completion assertions`);
