const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs=require('fs');const assert=require('assert/strict');
const path=require('path');
const root=path.resolve(__dirname,'../..');
const base=process.env.BASE_URL || 'http://127.0.0.1:8765';
const cards=JSON.parse(fs.readFileSync(root+'/tools/asistente-estudio/data/historia-at-maclear.json')).cards;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 await page.addInitScript(()=>localStorage.setItem('verbo:uiLang','es'));
 const errors=[],maclearRequests=[],report=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const r=route.request();
  if(r.postData()?.includes('maclear-asst-')) maclearRequests.push(r.url());
  if(!r.url().startsWith(base+'/')) return route.abort();
  return route.continue();
 });
 await page.goto(base+'/biblia/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.VerboPassageSelection && window.VerboI18n);
 await page.locator('#studyAssistantToggle').click();
 for(const lang of ['es','en']){
  await page.evaluate(lang=>window.VerboI18n.setUiLang(lang),lang);
  for(const [i,c] of cards.entries()){
   const p=c.passage;
   if(lang==='es' && i===0) await page.evaluate(p=>window.VerboPassageSelection.selectPassage(p.book,p.chapterStart,p.verseStart),p);
   else await page.evaluate(p=>document.dispatchEvent(new CustomEvent('verbo:selected-passage-changed',{detail:{book:p.book,ranges:[{chapterStart:p.chapterStart,verseStart:p.verseStart,chapterEnd:p.chapterStart,verseEnd:p.verseStart}]}})),p);
   const chip=page.locator('.study-assistant__summary-chip--historia');await chip.waitFor();await chip.click();
   const article=page.locator('.study-assistant__entry').filter({has:page.locator('.study-assistant__entry-source',{hasText:'G. F. Maclear'})});
   if(!await article.count()) {const more=page.locator('.study-assistant__more');if(await more.count())await more.click();}
   await article.waitFor();
   assert.equal(await article.locator('.study-assistant__text').textContent(),lang==='es'?c.text:c.translations.en);
   assert.ok((await article.locator('.study-assistant__type').textContent()).trim());
   assert.equal(await article.locator('.study-assistant__translation-status').count(),0);
   await article.locator('.study-assistant__resource-link').click();
   await page.locator(`.history-reader .dict-entry__def[data-entry-id="${c.sourceEntryId}"]`).waitFor();
   assert.ok((await page.locator(`.history-reader .dict-entry__def[data-entry-id="${c.sourceEntryId}"]`).textContent()).length>1000);
   report.push({id:c.id,lang,entry:c.sourceEntryId,status:'PASS'});
   if(i===0)await page.screenshot({path:`/tmp/maclear-${lang}.png`});
  }
 }
 assert.deepEqual(maclearRequests,[]);assert.deepEqual(errors,[]);
 fs.writeFileSync('/tmp/maclear-browser-report.json',JSON.stringify({cases:report,maclearTranslationRequests:maclearRequests,pageErrors:errors},null,2));
 console.log(JSON.stringify({cases:report.length,categories:new Set(cards.map(c=>c.relationType)).size,maclearTranslationRequests:0,pageErrors:0,status:'PASS'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
