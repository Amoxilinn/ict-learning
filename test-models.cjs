const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const requireComplete=process.env.REQUIRE_COMPLETE!=='0';
let elements={},store={};const element=()=>({textContent:'',innerHTML:'',value:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],scrollIntoView(){}});
const context={document:{querySelector:s=>elements[s]??=element(),querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem:k=>store[k]??null,setItem(k,v){store[k]=v}},fetch:()=>new Promise(()=>{}),setTimeout,clearTimeout,setInterval,clearInterval,URL,console,location:{hash:''}};
vm.createContext(context);for(const f of ['teaching-data.js','teaching.js'])vm.runInContext(fs.readFileSync(__dirname+'/dist/'+f,'utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/dist/diagrams.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/dist/app.js','utf8'),context);
const m=context.window.ICTModels;let checks=0;function ok(v,msg){assert.ok(v,msg);checks++}function fail(fn){assert.throws(fn);checks++}
let r=m.calcSubnet('192.168.10.130',26);ok(m.numIP(r.net)==='192.168.10.128','/26 net');ok(m.numIP(r.last)==='192.168.10.191','broadcast');ok(r.usable===62,'hosts');
for(let p=0;p<=32;p++){let x=m.calcSubnet('203.0.113.255',p);ok(x.net<=x.ip&&x.ip<=x.last,'prefix bound '+p);ok(x.size===2**(32-p),'prefix size '+p)}
ok(m.calcSubnet('10.0.0.0',31).usable===2,'/31');ok(m.calcSubnet('10.0.0.1',32).usable===1,'/32');ok(m.calcSubnet('255.255.255.255',0).size===4294967296,'/0 size');
for(const s of ['256.1.1.1','1.2.3','-1.0.0.1','1.2.3.4abc'])fail(()=>m.ipNum(s));fail(()=>m.calcSubnet('1.2.3.4',33));fail(()=>m.calcSubnet('1.2.3.4',1.1));
ok(m.vlanSim(10,1,[10],1,[10],10).ok,'tagged');ok(!m.vlanSim(10,1,[20],1,[10],10).ok,'out permit');ok(!m.vlanSim(10,1,[10],1,[20],10).ok,'in permit');ok(!m.vlanSim(10,10,[10],20,[10],10).ok,'PVID mismatch');ok(m.vlanSim(10,10,[10],20,[20],20).ok,'reclassification');ok(!m.vlanSim(10,1,[10],1,[10],20).ok,'access mismatch');
const rows=[{network:'0.0.0.0/0',pref:1,cost:0,next:'a',proto:'Static'},{network:'10.1.0.0/16',pref:10,cost:1,next:'b',proto:'OSPF'},{network:'10.1.2.0/24',pref:200,cost:0,next:'c',proto:'Static'}];
ok(m.selectRoute('10.1.2.99',rows).best[0].next==='c','longest before preference');ok(m.selectRoute('8.8.8.8',rows).best[0].next==='a','default');ok(m.selectRoute('8.8.8.8',[]).best.length===0,'no route');
let eq=[...rows,{network:'10.1.2.0/24',pref:60,cost:0,next:'d',proto:'Static'}];ok(m.selectRoute('10.1.2.1',eq).best[0].next==='d','same prefix preference');eq.push({network:'10.1.2.0/24',pref:60,cost:0,next:'e',proto:'Static'});ok(m.selectRoute('10.1.2.1',eq).best.length===2,'equal candidate');eq.push({network:'10.1.2.0/24',pref:60,cost:100,next:'f',proto:'OSPF'});ok(m.selectRoute('10.1.2.1',eq).ambiguous,'no cross-protocol cost');
vm.runInContext("frame('A','B');frame('B','A');frame('A','B')",context);ok(elements['#sw-log'].textContent.includes('未知单播泛洪'),'unknown flood');ok(elements['#sw-log'].textContent.includes('出端口 2。'),'learned unicast');

const read=n=>JSON.parse(fs.readFileSync(__dirname+'/dist/'+n+'.json'));
context.fixture={content:read('content'),lessons:read('lessons'),sources:read('sources'),subskills:read('subskills'),units:read('units'),curriculum:read('curriculum')};
vm.runInContext('({content,lessons,sources,subskills,units,curriculum}=fixture)',context);
const ev=s=>vm.runInContext(s,context);
ok(context.fixture.content.length===94,'all syllabus chapters retained');
ok(context.fixture.subskills.length===322,'all syllabus subtopics retained');
const {content,subskills,units,curriculum}=context.fixture;
const sequence=curriculum.flatMap(s=>s.chapters);
ok(sequence.length===94&&new Set(sequence).size===94,'recommended order covers every chapter exactly once');
ok(units.length===322&&new Set(units.map(u=>u.id)).size===322,'every subtopic has its own section');
for(const s of subskills)ok(units.some(u=>u.id===s.id&&u.parent===s.parent&&u.term===s.term),'syllabus mapping '+s.id);
for(const x of content){
 ok(x.intro.length>35&&x.outcome.length>15,'independent beginner introduction '+x.id);
 for(const p of x.prerequisites)ok(sequence.indexOf(p)>=0&&sequence.indexOf(p)<sequence.indexOf(x.id),'prerequisite already introduced '+x.id+' <- '+p);
 const page=ev(`lessonPage(${JSON.stringify(x.id)})`),i=sequence.indexOf(x.id);
 if(i<93)ok(page.replace(/\s+/g,'').includes(('下一章：'+content.find(y=>y.id===sequence[i+1]).title).replace(/\s+/g,'')),'next follows curriculum '+x.id);
}
for(const u of units){
 if(requireComplete)ok(u.hasTeaching,'rewritten unit '+u.id);
 ok(u.hasTeaching?'level' in u&&u.goal&&u.lead:'explain' in u,'teaching fields '+u.id);
 if(u.hasTeaching)ok(u.sections.length>=2&&u.sections.every(s=>s.title&&s.text),'teaching sections '+u.id);
 if(u.hasTeaching)ok(u.example?.setup?.length>10&&u.example.steps.length>=3&&u.example.conclusion.length>10,'solved example '+u.id);
 if(u.hasTeaching)ok(u.example.steps.every(s=>s.length>12),'substantive example steps '+u.id);
 if(u.hasTeaching&&u.level==='core')ok(u.check&&u.check.question&&u.check.answer,'core comprehension check '+u.id);
 ok(u.sources.length>0&&u.sources.every(s=>/^https:\/\//.test(s.url)),'reference supplied '+u.id);
}
for(const id of ['ICT-001','ICT-002','ICT-003'])ok(ev(`lessonPage('${id}')`).includes('data-teach='),'pilot contains teaching components '+id);
ok(!ev("lessonPage('ICT-004')").includes('data-teach='),'rollout remains bounded to pilot');
const basics=ev("lessonPage('ICT-002')");
ok(basics.indexOf('id="ICT-002.05"')<basics.indexOf('id="ICT-002.02"')&&basics.indexOf('id="ICT-002.04"')<basics.indexOf('id="ICT-002.02"'),'IP and ARP precede TCP');
 ok(basics.includes('chapter-progress')&&basics.includes('chapter-objectives')&&basics.includes('level-badge'),'chapter goals, levels and progress control');
 for(const u of units.filter(u=>u.parent==='ICT-002'))ok(basics.includes('id="'+u.id+'"')&&basics.includes('unit-goal')&&basics.includes('unit-takeaway'),'new teaching layout '+u.id);
ok(ev('learningPage()').includes('先认识一条通信路径'),'route includes zero prerequisite introduction');
const banned=/错题|自测与解析|实验笔记|保存笔记|我已完成|还需复习|生成训练|学习状态|复习记录|checkbox|textarea|data-rate-unit/;
for(const x of context.fixture.content){
 const page=ev(`lessonPage(${JSON.stringify(x.id)})`);
 ok(page.replace(/\s+/g,'').includes(x.title.replace(/\s+/g,''))&&page.includes(x.detail),'chapter and syllabus preserved '+x.id);
 ok(!banned.test(page),'reading only '+x.id);
 for(const u of context.fixture.units.filter(u=>u.parent===x.id))ok(page.includes('id="'+u.id+'"'),'subtopic anchor '+u.id);
 const anchors=new Set([...page.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 for(const a of page.matchAll(/data-scroll="([^"]+)"/g))ok(anchors.has(a[1]),'valid table of contents '+a[1]);
}
ok(!banned.test(ev('mapPage()')),'directory has no progress or training');
ok(!banned.test(ev('sourcePage()')),'references contain no learning management');
ok(ev("searchable(content[3]).includes('port link-type')"),'search includes configuration');
ok(ev("safeURL('javascript:alert(1)')")==='#','unsafe URLs rejected');
for(const name of ['content','lessons','units']){const data=read(name);const raw=JSON.stringify(data);ok(!/"(?:unitCoverage|practice|task)":/.test(raw),'no legacy training payload '+name);if(name==='units')for(const u of data)ok(!('question' in u)&&!('answer' in u),'no top-level quiz fields '+u.id);}
const handbook=fs.readFileSync(__dirname+'/dist/handbook.html','utf8');
ok(!banned.test(handbook),'offline handbook reading only');
for(const x of context.fixture.content)ok(handbook.includes('id="'+x.id+'"'),'handbook includes '+x.id);
ok(!fs.existsSync(__dirname+'/dist/learning.js')&&!fs.existsSync(__dirname+'/dist/questions.json'),'obsolete runtime removed');
const indexHTML=fs.readFileSync(__dirname+'/dist/index.html','utf8'),crypto=require('node:crypto');
for(const name of ['style.css','data.js','diagrams.js','app.js']){
 const digest=crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/dist/'+name)).digest('hex').slice(0,12);
 ok(indexHTML.includes(name+'?v='+digest),'HTML points to current asset '+name);
}
ok(ev('progressCount()')===0,'progress starts empty');ev("toggleProgress('ICT-001')");ok(JSON.parse(context.localStorage.getItem('ict-progress-v1')).includes('ICT-001'),'chapter completion saved locally');ok(ev('progressCount()')===1,'progress count updates');ev("toggleProgress('ICT-001')");ok(ev('progressCount()')===0,'chapter completion can be undone');
console.log('PASS '+checks+' assertions: network models, all chapter renderers, navigation targets, reading flow and progress.');
