// Complements all-scene geometry traversal with input tools, printing and corrected stack links.
const {chromium}=require('playwright'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ICT_TEST_URL||'http://127.0.0.1:8765';let runs=0;
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  for(const [lesson,kind] of [['014','acl'],['015','prefix'],['016','policy']]){
   await page.goto(`${base}/#/lesson/ICT-${lesson}`);const host=page.locator(`[data-rule-tool="${kind}"]`);await host.waitFor();
   for(const button of await host.locator('[data-example]').all()){
    await button.click();while(!await host.locator('[data-rule-next]').isDisabled())await host.locator('[data-rule-next]').click();assert.match(await host.locator('[data-rule-result]').innerText(),/允许|拒绝|接收/);runs++;
   }
   await host.locator('input').fill('<script>');await host.locator('button[type="submit"]').click();assert(await host.locator('[data-rule-next]').isDisabled());assert(!(await host.locator('[data-rule-result]').innerHTML()).includes('<script>'));await host.locator('[data-rule-reset]').click();assert((await host.locator('[data-rule-result]').innerText()).includes('第 1'));
  }
  await page.goto(`${base}/#/lesson/ICT-006`);const stack=page.locator('[data-teach="stack-istack"]');await stack.waitFor();await stack.locator('[data-action="next"]').click();
  assert.deepEqual(await stack.locator('svg line').evaluateAll(lines=>{
   const svg=lines[0].ownerSVGElement,rects=[...svg.querySelectorAll('g[data-topology-node]')].map(g=>({id:g.dataset.topologyNode,b:g.querySelector('rect').getBBox()}));const faults=[];
   // Active path goes via each of the two separate interconnect nodes.
   if(lines.filter(l=>l.classList.contains('active')).length!==4)faults.push('two interconnect paths not visible');
   for(const line of lines){const ax=Number(line.getAttribute('x1')),ay=Number(line.getAttribute('y1')),bx=Number(line.getAttribute('x2')),by=Number(line.getAttribute('y2'));
    for(const {id,b} of rects){for(let t=.05;t<.96;t+=.05){const x=ax+(bx-ax)*t,y=ay+(by-ay)*t;if(x>b.x+1&&x<b.x+b.width-1&&y>b.y+1&&y<b.y+b.height-1){faults.push('link crosses node '+id);break}}}
   }return faults;
  }),[]);
  await stack.screenshot({path:`docs/reviews/screenshots/visual-completion/stack-links-${width}.png`});
  await page.goto(`${base}/#/lesson/ICT-087`);await page.waitForSelector('[data-floor-tool]');
  const before=await page.evaluate(()=>[...document.querySelectorAll('details')].map(d=>d.open));
  await page.evaluate(()=>preparePrint());await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('[data-floor-map] svg').count(),1);assert(await page.evaluate(()=>[...document.querySelectorAll('.lab-guide')].every(d=>d.open)));
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>finishPrint());
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('details')].map(d=>d.open)),before);
  // Download is a usable file with the correct fixture content, not an empty placeholder.
  const response=await page.request.get(`${base}/labs/automation_fixture.py`);assert(response.ok());assert((await response.text()).includes('def reconcile'));
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ruleExamples:runs,stackWidths:2,printRestore:true,fixtureDownload:true,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
