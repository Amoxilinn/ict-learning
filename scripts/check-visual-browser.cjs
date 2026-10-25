// Run after build.py with a local server; checks actual SVG boxes and every branch.
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ICT_TEST_URL||'http://127.0.0.1:8765';
 const data=JSON.parse(fs.readFileSync('content/visualizations.json')),scenes=data.scenarios;
 const stats={pages:0,snapshots:0,branches:0,geometry:0,floorRuns:0};
 fs.mkdirSync('docs/reviews/screenshots/visual-completion',{recursive:true});
 // Include the generated switch-learning scene too.
 await page.goto(base);await page.waitForFunction(()=>window.ICTTeaching);
 const generated=await page.evaluate(()=>window.ICTTeaching.scenarios().filter(s=>!window.ICT_TEACHING_DATA.scenarios.some(x=>x.id===s.id)));scenes.push(...generated);
 const only=process.env.ICT_SCENES?.split(",");if(only)for(let i=scenes.length-1;i>=0;i--)if(!only.includes(scenes[i].id))scenes.splice(i,1);
 for(const width of [1280,768,390]){
  await page.setViewportSize({width,height:900});
  for(const lesson of JSON.parse(fs.readFileSync('content/knowledge.json')).filter(l=>!only||scenes.some(s=>s.unit.startsWith(l.id+'.')))){
   await page.goto(`${base}/#/lesson/${lesson.id}`);await page.waitForSelector('.lesson');stats.pages++;if(stats.pages%47===0)console.log('chapter pages checked',stats.pages);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lesson.id} whole-page overflow ${width}`);
  }
  for(const scene of scenes){
   await page.goto(`${base}/#/lesson/${scene.unit.split('.')[0]}`);const rootScene=scene.variant?scenes.find(s=>s.variant===scene.variant):scene;const host=page.locator(`[data-teach="${rootScene.id}"]`);await host.waitFor();if(scene.variant)await host.locator("[data-scene]").selectOption(scene.id);
   const check=async(index)=>{
    stats.snapshots++;
    assert((await host.locator('.teach-status').innerText()).includes(scene.steps[index].title),`${scene.id} step ${index}`);
    const faults=await host.evaluate(root=>{
     const out=[];
     for(const svg of root.querySelectorAll('svg')){
      const vb=svg.viewBox.baseVal;
      for(const text of svg.querySelectorAll('text')){
       const b=text.getBBox();
       if(b.x < -1||b.y < -1||b.x+b.width>vb.width+1||b.y+b.height>vb.height+1)out.push('text outside SVG: '+text.textContent);
      }
      if(svg.classList.contains('teach-topology')){
       const nodes=[...svg.querySelectorAll('g[data-topology-node]')].map(g=>({id:g.dataset.topologyNode,b:g.querySelector('rect').getBBox(),text:g.querySelector('text').getBBox()}));
       for(const n of nodes){if(n.text.x<n.b.x-1||n.text.y<n.b.y-1||n.text.x+n.text.width>n.b.x+n.b.width+1||n.text.y+n.text.height>n.b.y+n.b.height+1)out.push('label outside node '+n.id)}
       for(let a=0;a<nodes.length;a++)for(let b=a+1;b<nodes.length;b++){const x=nodes[a].b,y=nodes[b].b;if(x.x<y.x+y.width&&x.x+x.width>y.x&&x.y<y.y+y.height&&x.y+x.height>y.y)out.push('node overlap '+nodes[a].id+'/'+nodes[b].id)}
      }
     }
     // Each scrollable visual must stay inside its parent card.
     const c=root.getBoundingClientRect();for(const v of root.querySelectorAll('.teach-visual')){const b=v.getBoundingClientRect();if(b.width>0&&(b.left<c.left-3||b.right>c.right+3))out.push('visual escapes card')}
     return out;
    });assert.deepEqual(faults,[],`${scene.id} ${index} ${width}`);stats.geometry++;
   };
   const walk=async(index,path=[])=>{
    assert(!path.includes(index),'cycle in scenario '+scene.id);await check(index);
    const step=scene.steps[index];
    if(step.terminal)return;
    const targets=step.actions||((step.next??index+1)<scene.steps.length?[{target:step.next??index+1}]:[]);
    for(const action of targets){
     const button=step.actions?host.locator(`[data-action="branch"][data-target="${action.target}"]`):host.locator('[data-action="next"]');
     await button.click();if(step.actions)stats.branches++;
     await walk(action.target,[...path,index]);
     await host.locator('[data-action="prev"]').click();await check(index);
    }
   };
   await walk(0);if(stats.snapshots%50<10)console.log('snapshots checked',stats.snapshots,scene.id,width);await host.locator('[data-action="reset"]').click();assert(await host.locator('[data-action="prev"]').isDisabled());
   if(['stack-istack','ospfv3-area','aaa-02','switch-security-07','bgp-path-select','vpn-gre','flexe-calendar','ifit-window','igmp-copy-tree','wlan-location-map','sdwan-path'].includes(scene.id)&&width!==768){
    const paths={'stack-istack':[1,2,4],'ospfv3-area':[1,2,3],'aaa-02':[1,3],'switch-security-07':[1],'bgp-path-select':[1],'vpn-gre':[1],'flexe-calendar':[1],'ifit-window':[1,2],'igmp-copy-tree':[1,2],'wlan-location-map':[1,3],'sdwan-path':[1,2,3]};
    let current=0;for(const target of paths[scene.id]){const st=scene.steps[current];await host.locator(st.actions?`[data-target="${target}"]`:'[data-action="next"]').click();current=target}
    await host.screenshot({path:`docs/reviews/screenshots/visual-completion/${scene.id}-${width}.png`});
   }
  }
  for(const tool of only?[]:data.floorTools){
   await page.goto(`${base}/#/lesson/${tool.unit.split('.')[0]}`);const host=page.locator('[data-floor-tool]');
   await host.locator('[data-floor="layout"]').selectOption('one');await host.locator('[data-floor-stage="3"]').click();
   const before=await host.locator('[data-floor-result]').innerText();await host.locator('[data-floor-save]').click();
   await host.locator('[data-floor="layout"]').selectOption('two');assert((await host.locator('[data-floor-result]').innerText()).includes('调整前'));
   assert(before!==(await host.locator('[data-floor-result]').innerText()));
   await host.locator('[data-floor="wall"]').selectOption('18');await host.locator('[data-floor="scale"]').fill('12');await host.locator('[data-floor="scale"]').dispatchEvent('change');assert((await host.locator('[data-floor-result]').innerText()).includes('面积已变'));
   await host.locator('[data-floor="layout"]').selectOption('custom');await host.locator('[data-floor="x"]').fill('99');await host.locator('[data-floor="x"]').dispatchEvent('change');assert((await host.locator('[data-floor-result]').innerText()).includes('AP坐标'));assert(await host.locator('[data-floor-save]').isDisabled());
   await host.locator('[data-floor-reset]').click();assert((await host.locator('[data-floor-result]').innerText()).includes('第 1 步'));
   await host.locator('[data-floor-stage="3"]').click();stats.floorRuns++;
   if(tool.unit==='ICT-087.01'&&width!==768)await host.screenshot({path:`docs/reviews/screenshots/visual-completion/planner-${width}.png`});
  }
 }
 // Branch history must not leak failed-auth messages into allowed sessions.
 await page.goto(`${base}/#/lesson/ICT-034`);const aaa=page.locator('[data-teach="aaa-01"]');await aaa.locator('[data-action="next"]').click();await aaa.locator('[data-target="4"]').click();assert(!(await aaa.locator('.teach-sequence').innerText()).includes('拒绝身份'));await aaa.locator('[data-action="reset"]').click();
 assert.deepEqual(errors,[]);fs.writeFileSync(only?'docs/reviews/visual-browser-followup.json':'docs/reviews/visual-browser-results.json',JSON.stringify({...stats,widths:[1280,768,390],scenes:scenes.length,errors},null,2)+'\n');console.log(JSON.stringify(stats));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
