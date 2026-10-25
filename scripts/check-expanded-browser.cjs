// Optional browser regression: install Playwright and start python3 serve.py first.
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ICT_TEST_URL||'http://127.0.0.1:8765';const scenes=JSON.parse(fs.readFileSync('content/visualizations.json')).scenarios.slice(21);let steps=0,chapters=0;
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  for(const lesson of JSON.parse(fs.readFileSync('content/knowledge.json'))){
   await page.goto(`${base}/#/lesson/${lesson.id}`);await page.waitForSelector('.lesson');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lesson.id} overflow ${width}`);chapters++;
  }
  for(const s of scenes){
   await page.goto(`${base}/#/lesson/${s.unit.split('.')[0]}`);const host=page.locator(`[data-teach="${s.id}"]`);await host.waitFor();
   for(let i=1;i<s.steps.length;i++){await host.locator('[data-action="next"]').click();assert((await host.locator('.teach-status').innerText()).includes(s.steps[i].title),`${s.id} step ${i}`);steps++;}
   assert(await host.locator('[data-action="next"]').isDisabled());await host.locator('[data-action="prev"]').click();await host.locator('[data-action="reset"]').click();assert(await host.locator('[data-action="prev"]').isDisabled());
  }
  for(const [lesson,kind] of [['014','acl'],['015','prefix'],['016','policy']]){
   await page.goto(`${base}/#/lesson/ICT-${lesson}`);const host=page.locator(`[data-rule-tool="${kind}"]`);await host.waitFor();
   for(const button of await host.locator('[data-example]').all()){
    await button.click();while(!await host.locator('[data-rule-next]').isDisabled())await host.locator('[data-rule-next]').click();assert((await host.locator('[data-rule-result]').innerText()).match(/允许|拒绝|接收/));
   }
   await host.locator('input').fill('<script>');await host.locator('button[type="submit"]').click();assert(await host.locator('[data-rule-next]').isDisabled());assert(!(await host.locator('[data-rule-result]').innerHTML()).includes('<script>'));await host.locator('[data-rule-reset]').click();assert((await host.locator('[data-rule-result]').innerText()).includes('第 1')); 
  }
  for(const [lesson,name] of [['074','sta'],['015','prefix'],['045','vxlan'],['054','spine']]){
   await page.goto(`${base}/#/lesson/ICT-${lesson}`);
   const host=page.locator(lesson==='015'?'[data-rule-tool]':lesson==='074'?'[data-teach="sta-wpa2-online"]':lesson==='045'?'[data-teach="vxlan-central-gateway"]':'[data-teach="leaf-spine-failure"]');
   await host.scrollIntoViewIfNeeded();await host.screenshot({path:`docs/reviews/screenshots/expanded-${name}-${width}.png`});
  }
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({chapters,scenes:scenes.length,widths:[1280,390],steps,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
