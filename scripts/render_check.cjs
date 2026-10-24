const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let elements={};const element=()=>({textContent:'',innerHTML:'',value:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){}});
const storage={getItem:()=>null,setItem(){}};
const context={document:{querySelector:s=>elements[s]??=element(),querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},localStorage:storage,fetch:()=>new Promise(()=>{}),setTimeout,clearTimeout,setInterval,clearInterval,URL,console,location:{hash:''}};
vm.createContext(context);
for(const f of ['teaching-data.js','teaching.js','diagrams.js','app.js'])vm.runInContext(fs.readFileSync(root+'/dist/'+f,'utf8'),context);
const read=n=>JSON.parse(fs.readFileSync(root+'/dist/'+n+'.json'));
context.fixture={content:read('content'),lessons:read('lessons'),sources:read('sources'),subskills:read('subskills'),units:read('units'),curriculum:read('curriculum')};
vm.runInContext('({content,lessons,sources,subskills,units,curriculum}=fixture)',context);
let bad=0;
for(const x of context.fixture.content){
  try{const html=vm.runInContext(`lessonPage(${JSON.stringify(x.id)})`,context);
    if(!html||html.includes('undefined')||html.includes('[object Object]')){console.log('BAD',x.id,html.includes('undefined')?'undefined':'object');bad++}
    const anchors=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
    for(const m of html.matchAll(/data-scroll="([^"]+)"/g))if(!anchors.has(m[1])){console.log('BAD TOC',x.id,m[1]);bad++}
  }catch(e){console.log('THROW',x.id,e.message);bad++}
}
for(const route of ['learningPage()','mapPage(null)','sourcePage()']){try{const html=vm.runInContext(route,context);if(!html||html.includes('undefined')){console.log('BAD',route);bad++}}catch(e){console.log('THROW',route,e.message);bad++}}
console.log(bad?`FAILED ${bad}`:'PASS render all chapters');
process.exit(bad?1:0);
