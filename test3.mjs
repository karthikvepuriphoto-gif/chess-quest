import { chromium } from '/node_modules/playwright-core/index.mjs';
const BASE=process.argv[2]||'http://127.0.0.1:18431/';const OUT=process.argv[3]||'playtest';
const VP=[['phone-portrait',390,844,true],['phone-landscape',844,390,true],['ipad-portrait',820,1180,true],['ipad-landscape',1180,820,true]];
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});let fails=0;
for(const [n,w,h,t] of VP){const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:t,isMobile:n.startsWith('phone')})).newPage();const errs=[];p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(e.message));
 await p.goto(BASE+'#fastwins');await p.waitForSelector('[data-f]');const nE=await p.$$eval('[data-f]',x=>x.length);
 if(n==='phone-portrait')await p.screenshot({path:`${OUT}/fw-list-${n}.png`,fullPage:true});
 const ids=await p.$$eval('[data-f]',x=>x.map(e=>e.dataset.f));
 for(const id of (n==='phone-portrait'?ids:['legal','scholar','teed'])){await p.goto(BASE+'?r='+id+'#home');await p.click('[data-go="fastwins"]');await p.click(`[data-f="${id}"]`);
  await p.click('#bad');const st=await p.textContent('#st');if(!st.includes('BAD MOVE'))throw id+' no bad';
  if(['legal','fool','kieninger'].includes(id))await p.screenshot({path:`${OUT}/fw-${id}-bad-${n}.png`});
  while(!(await p.$('#nx[disabled]')))await p.click('#nx');await p.click('#bt');const t2=await p.textContent('#st');if(!t2.includes('Better was'))throw id+' no better';
  if(id==='legal')await p.screenshot({path:`${OUT}/fw-legal-better-${n}.png`});}
 await p.goto(BASE+'?p#patterns');await p.waitForSelector('.card');if(n.startsWith('ipad-p'))await p.screenshot({path:`${OUT}/fw-patterns-${n}.png`,fullPage:true});
 // quiz: answer using the stored accepted list
 await p.goto(BASE+'?q#blunders');await p.waitForSelector('#bw .sq');
 for(let q=0;q<8;q++){const u=await p.evaluate(async()=>{const st=document.querySelector('#sc').textContent;const n=+st.match(/Question (\d+)/)[1]-1;return n});
  const mv=await p.evaluate(()=>window.__fwAnswer&&window.__fwAnswer());if(!mv)throw 'no answer hook';
  await p.click(`[data-sq="${mv.slice(0,2)}"]`);await p.click(`[data-sq="${mv.slice(2,4)}"]`);if(q===0)await p.screenshot({path:`${OUT}/fw-quiz-answer-${n}.png`});await p.click('#nq');}
 const fin=await p.textContent('#st');if(!fin.includes('8 out of 8'))throw 'quiz '+fin;await p.screenshot({path:`${OUT}/fw-quiz-done-${n}.png`});
 const bd=await p.evaluate(()=>window.__cq.S.badges);
 console.log(n,'entries',nE,'quiz',fin.slice(0,30),'badges',['trapSpotter','blunderBuster','patternPro'].filter(x=>bd[x]).join(','),'errors',errs.length,errs.slice(0,3));if(errs.length)fails++;await p.close()}
await b.close();process.exit(fails?1:0);
