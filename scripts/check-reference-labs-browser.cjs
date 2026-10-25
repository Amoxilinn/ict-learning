const {chromium}=require('playwright'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const base=process.env.ICT_TEST_URL||'http://127.0.0.1:8765';
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});await page.goto(`${base}/#/lesson/ICT-087`);const gallery=page.locator('.reference-gallery');await gallery.waitFor();
  const figures=gallery.locator('figure');assert.equal(await figures.count(),3);
  for(const f of await figures.all()){
   await f.scrollIntoViewIfNeeded();const img=f.locator('img');await img.waitFor();assert(await img.evaluate(async i=>{await i.decode();return i.complete&&i.naturalWidth>1900}));assert.match(await f.locator('figcaption').innerText(),/华为官方操作说明/);
   assert(await f.locator('a').first().getAttribute('href'));assert(await img.getAttribute('alt'));
   assert(await img.evaluate(i=>i.getBoundingClientRect().width<=i.closest('.teach-card').getBoundingClientRect().width));
  }
  const tool=page.locator('[data-floor-tool]');await tool.locator('[data-floor-stage="3"]').click();await tool.locator('[data-floor="power"]').fill('');await tool.locator('[data-floor="power"]').dispatchEvent('change');assert((await tool.locator('[data-floor-result]').innerText()).includes('填写完整'));assert(await tool.locator('[data-floor-save]').isDisabled());await tool.locator('[data-floor-reset]').click();await tool.locator('[data-floor="x"]').fill('18');await tool.locator('[data-floor="x"]').dispatchEvent('change');assert.equal(await tool.locator('[data-floor="layout"]').inputValue(),'custom');await tool.locator('[data-floor-stage="3"]').click();assert((await tool.locator('[data-floor-result]').innerText()).includes('AP 1 台'));await tool.locator('[data-floor-reset]').click();
  await gallery.screenshot({path:`docs/reviews/screenshots/visual-completion/planner-official-${width}.png`});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(`${base}/#/lesson/ICT-035`);const labs=page.locator('.lab-guide');assert.equal(await labs.count(),2);
  for(const lab of await labs.all()){
   await lab.locator('summary').click();const text=await lab.innerText();assert(text.includes('S9300/S9300X V200R023C00'));assert(text.includes('dhcp snooping trusted interface GigabitEthernet1/0/2'));assert(text.includes('阶段A'));assert(text.includes('阶段B'));assert(text.includes('192.0.2.1'));
   assert(await lab.locator('a').getAttribute('href'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  assert((await labs.last().innerText()).includes('undo ip source check user-bind enable'));
 }
 await page.goto(`${base}/handbook.html`);for(const img of await page.locator('img[src^="assets/wlan-planner/"]').all()){assert(await img.evaluate(async i=>{await i.decode();return i.complete&&i.naturalWidth>1900}))}
 assert.equal(await page.locator('img[src^="assets/wlan-planner/"]').count(),3);assert((await page.locator('body').innerText()).includes('阶段C：确认绑定存在后'));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({officialFigures:3,widths:[1280,390],securityLabScripts:2,offlineImages:true,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
