import { chromium } from '/node_modules/playwright-core/index.mjs';
const base='http://localhost:18431/';const errs=[];const out=[];
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
async function mk(w,h,name){const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<900,deviceScaleFactor:2})).newPage();p.on('console',m=>{if(m.type()==='error')errs.push(name+': '+m.text())});p.on('pageerror',e=>errs.push(name+': '+e.message));await p.goto(base);return p}
const tap=(p,sq)=>p.click(`.sq[data-sq="${sq}"]`);
const hscroll=p=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
async function solve(p,id,moves,name){await p.evaluate(id=>{location.hash='';},id);await p.goto(base);await p.evaluate(()=>0);
  await p.evaluate(id=>window.__go?0:0,id);
  await p.click('[data-go="puzzles"]');await p.click(`[data-p="${id}"]`);
  for(const [f,t] of moves){await tap(p,f);await tap(p,t);await p.waitForTimeout(1100)}
  const st=await p.textContent('#st');out.push(`${name} puzzle ${id}: ${st.trim()}`);return st.includes('Solved')}
for(const [w,h,name] of [[390,844,'phone'],[844,390,'phoneL'],[820,1180,'ipad'],[1180,820,'ipadL']]){
  const p=await mk(w,h,name);await p.screenshot({path:`playtest/${name}-home.png`});out.push(`${name} hscroll home: ${await hscroll(p)}`);
  // lesson highlight
  await p.click('[data-go="learn"]');await p.click('[data-l="3"]');await tap(p,'g1');out.push(`${name} knight highlights: ${await p.locator('.sq.hl,.sq.cap').count()}`);
  await tap(p,'f3');await tap(p,'f3');await tap(p,'e5');await tap(p,'e5');await tap(p,'c4');await tap(p,'c4');await tap(p,'b6');out.push(`${name} knight lesson: ${(await p.textContent('#goal')).trim()}`);
  await p.screenshot({path:`playtest/${name}-lesson-knight.png`});out.push(`${name} hscroll lesson: ${await hscroll(p)}`);
  if(name==='phone'||name==='ipad'){
    await p.goto(base);await p.click('[data-go="learn"]');await p.click('[data-l="0"]');await p.check('#unsafe');await tap(p,'e2');await p.screenshot({path:`playtest/${name}-lesson-pawn-unsafe.png`});
    await solve(p,'b1',[['a1','a8']],name);
    await solve(p,'f1',[['b3','b8'],['d1','d8']],name);await p.screenshot({path:`playtest/${name}-opera-why.png`});
    await solve(p,'f2',[['f3','f6'],['d6','e7']],name);
    await solve(p,'f4',[['g4','e6']],name);await p.screenshot({path:`playtest/${name}-fischer-why.png`});
    // wrong move + hints
    await p.goto(base);await p.click('[data-go="puzzles"]');await p.click('[data-p="f5"]');await tap(p,'c3');await tap(p,'d5');out.push(`${name} wrong move msg: ${(await p.textContent('#st')).trim()}`);
    await p.click('#hint');await p.click('#hint');await p.click('#hint');await p.screenshot({path:`playtest/${name}-hint3.png`});
    await tap(p,'c4');await tap(p,'f7');await p.waitForTimeout(1200);await tap(p,'c3');await tap(p,'d5');await p.waitForTimeout(500);out.push(`${name} legal after hints: ${(await p.textContent('#st')).trim()}`);
    // games
    for(const lv of ['easy','medium','hard']){await p.goto(base);await p.click('[data-go="play"]');await p.click(`[data-lv="${lv}"]`);await p.click('[data-c="w"]');
      await p.uncheck('#tc');await tap(p,'e2');await tap(p,'e4');const t0=Date.now();await p.waitForFunction(()=>document.querySelector('#st').textContent.includes('Your turn'),null,{timeout:30000});
      out.push(`${name} ${lv} engine replied in ${Date.now()-t0}ms`);
      await tap(p,'g1');await tap(p,'f3');await p.waitForFunction(()=>document.querySelector('#st').textContent.includes('Your turn'),null,{timeout:30000});
      if(lv==='medium'){await p.check('#tc');await tap(p,'f1');await p.waitForSelector('#cl .cg,#cl .co,#cl .cr',{timeout:30000});out.push(`${name} coach: `+(await p.textContent('#cl')).replace(/\s+/g,' ').slice(0,300));await p.screenshot({path:`playtest/${name}-coach.png`});
        await p.click('#hint');await p.waitForFunction(()=>document.querySelector('#st').textContent.includes('suggests'),null,{timeout:30000});out.push(`${name} hint: ${(await p.textContent('#st')).trim()}`);
        await p.click('#undo');out.push(`${name} undo ok: ${(await p.textContent('#st')).trim()}`);}
    }
    // black as player, hard
    await p.goto(base);await p.click('[data-go="play"]');await p.click('[data-lv="easy"]');await p.click('[data-c="b"]');await p.waitForFunction(()=>document.querySelector('#st').textContent.includes('Your turn'),null,{timeout:30000});await p.screenshot({path:`playtest/${name}-play-black.png`});
    await p.goto(base);await p.click('[data-go="path"]');await p.screenshot({path:`playtest/${name}-path.png`});
    await p.goto(base);await p.click('[data-go="parents"]');await p.screenshot({path:`playtest/${name}-parents.png`});out.push(`${name} hscroll parents: ${await hscroll(p)}`);
  }
}
console.log(out.join('\n'));console.log('ERRORS',errs.length,errs.slice(0,10).join('\n'));await b.close();
