import { chromium } from '/node_modules/playwright-core/index.mjs';
const base=process.argv[2]||'http://localhost:18431/';const errs=[];
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
const p=await (await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true})).newPage();
p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
await p.goto(base);await p.click('[data-go="play"]');await p.click('[data-lv="easy"]');await p.click('[data-c="w"]');await p.uncheck('#tc');
let n=0;
while(n<150){const over=await p.evaluate(()=>!!document.querySelector('.modal'));if(over)break;
  await p.waitForFunction(()=>/Your turn|WIN|won|draw/.test(document.querySelector('#st').textContent)||document.querySelector('.modal'),null,{timeout:60000});
  if(await p.evaluate(()=>!!document.querySelector('.modal')))break;
  const fen=await p.evaluate(()=>window.__cq.fen());
  const mv=await p.evaluate(f=>window.__cq.analyze(f,{depth:10}).then(r=>r.best),fen);
  await p.click(`.sq[data-sq="${mv.slice(0,2)}"]`);await p.click(`.sq[data-sq="${mv.slice(2,4)}"]`);
  if(mv.length>4){await p.waitForSelector('.modal [data-t]');await p.click(`.modal [data-t="${mv[4]}"]`)}
  n++;await p.waitForTimeout(150)}
await p.waitForSelector('.modal',{timeout:30000});
console.log('moves played by kid side:',n);console.log('status:',(await p.textContent('#st')).trim());console.log('recap:',(await p.textContent('.modal')).replace(/\s+/g,' ').slice(0,700));
await p.screenshot({path:'playtest/phone-easy-game-recap.png'});
// new puzzles
for(const [id,mv] of [['f10',[['b6','b2']]],['f11',[['e5','e8'],['e4','e6'],['e6','f7']]],['f13',[['e7','e5'],['e5','f5'],['f5','d7']]],['f12',[['f4','h2'],['d1','h1']]],['f5',[['c4','f7'],['c3','d5']]]]){
  await p.goto(base);await p.click('[data-go="puzzles"]');await p.click(`[data-p="${id}"]`);
  for(const [f,t] of mv){await p.click(`.sq[data-sq="${f}"]`);await p.click(`.sq[data-sq="${t}"]`);await p.waitForTimeout(1100)}
  console.log(id,(await p.textContent('#st')).trim());if(id==='f10')await p.screenshot({path:'playtest/phone-capablanca-why.png'})}
console.log('ERRORS',errs.length,errs.join('\n'));await b.close();
