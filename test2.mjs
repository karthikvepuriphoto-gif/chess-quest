import { chromium } from '/node_modules/playwright-core/index.mjs';
const base=process.argv[2]||'http://localhost:18431/';const errs=[];const out=[];
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
const tap=(p,sq)=>p.click(`.sq[data-sq="${sq}"]`);const hs=p=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
for(const [w,h,name] of [[390,844,'phone'],[844,390,'phoneL'],[820,1180,'ipad'],[1180,820,'ipadL']]){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<900});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin});
 const p=await ctx.newPage();p.on('console',m=>{if(m.type()==='error')errs.push(name+': '+m.text())});p.on('pageerror',e=>errs.push(name+': '+e.message));
 await p.goto(base);await p.screenshot({path:`playtest/${name}-home2.png`});
 await p.click('[data-go="notation"]');await p.screenshot({path:`playtest/${name}-notation-hub.png`});out.push(`${name} hs hub ${await hs(p)}`);
 if(name==='phoneL'||name==='ipadL'){ // quick layout check
   await p.click('[data-n="findb"]');await p.click('#go');for(let i=0;i<10;i++){const t=await p.textContent('#tg');await tap(p,t)}out.push(`${name} find(b): ${await p.textContent('#st')}`);await p.screenshot({path:`playtest/${name}-findsq.png`});out.push(`${name} hs ${await hs(p)}`);
   await p.goto(base);await p.click('[data-go="openings"]');await p.click('[data-o="ruy"]');await p.click('#nx');await p.click('#nx');await p.screenshot({path:`playtest/${name}-opening.png`});out.push(`${name} hs open ${await hs(p)}`);continue}
 await p.click('[data-n="coords"]');await p.check('#co');await tap(p,'e4');out.push(`${name} coords: ${await p.textContent('#st')}`);await p.screenshot({path:`playtest/${name}-coords.png`});await p.uncheck('#co');
 for(const o of ['w','b']){await p.goto(base);await p.click('[data-go="notation"]');await p.click(`[data-n="find${o}"]`);await p.click('#go');await tap(p,(await p.textContent('#tg'))==='a1'?'h8':'a1').catch(()=>{});
   for(let i=0;i<10;i++){const t=await p.textContent('#tg');await tap(p,t)}out.push(`${name} find(${o}): ${await p.textContent('#st')}`);if(o==='b')await p.screenshot({path:`playtest/${name}-findsq-black.png`})}
 await p.goto(base);await p.click('[data-go="notation"]');await p.click('[data-n="color"]');
 for(let i=0;i<8;i++){const t=await p.textContent('#tg');const c=('abcdefgh'.indexOf(t[0])+ +t[1])%2===1?'light':'dark';await p.click(`[data-c="${c}"]`)}out.push(`${name} light/dark: ${await p.textContent('#st')}`);
 await p.goto(base);await p.click('[data-go="notation"]');await p.click('[data-n="guide"]');await p.screenshot({path:`playtest/${name}-guide.png`,fullPage:false});
 await p.goto(base);await p.click('[data-go="notation"]');await p.click('[data-n="write"]');const seen=[];
 for(let i=0;i<8;i++){const san=await p.evaluate(()=>window.__cq.quiz.m.san);seen.push(san);if(i===2)await p.screenshot({path:`playtest/${name}-writequiz.png`});await p.click(`[data-o="${san}"]`);await p.waitForTimeout(1700)}
 out.push(`${name} write quiz: ${await p.textContent('#st')} moves: ${seen.join(' ')}`);
 await p.goto(base);await p.click('[data-go="notation"]');await p.click('[data-n="playq"]');const seen2=[];
 for(let i=0;i<8;i++){const m=await p.evaluate(()=>{const m=window.__cq.quiz.m;return{f:m.from,t:m.to,s:m.san,pr:m.promotion}});seen2.push(m.s);if(i===1)await p.screenshot({path:`playtest/${name}-playquiz.png`});await tap(p,m.f);await tap(p,m.t);if(m.pr){await p.click(`.modal [data-t="${m.pr}"]`)}await p.waitForTimeout(1700)}
 out.push(`${name} play quiz: ${await p.textContent('#st')} moves: ${seen2.join(' ')}`);
 // openings drills
 const OP=await p.evaluate(()=>import('./openings.js').then(m=>m.OPEN));
 for(const o of [...OP.openings,...OP.traps]){await p.goto(base);await p.click('[data-go="openings"]');await p.click(`[data-o="${o.id}"]`);
   if(o.id==='italian'){await p.click('#nx');await p.click('#nx');await p.click('#nx');await p.screenshot({path:`playtest/${name}-opening-learn.png`})}
   await p.click('#dr');const g=await p.evaluate(()=>0);
   for(let i=0;i<o.moves.length;i++){const sideToMove=i%2===0?'w':'b';if(sideToMove!==o.side)continue;const mv=await p.evaluate(([mv,i])=>{return null},[o.moves[i],i]);
     const ft=await p.evaluate(([moves,i])=>import('./lib/chess.js').then(({Chess})=>{const c=new Chess();for(let j=0;j<i;j++)c.move(moves[j]);const m=c.move(moves[i]);return[m.from,m.to]}),[o.moves,i]);await tap(p,ft[0]);await tap(p,ft[1])}
   const st=await p.textContent('#st');if(!st.includes('You know'))out.push(`${name} DRILL FAIL ${o.id}: ${st}`);if(o.id==='sicilian')await p.screenshot({path:`playtest/${name}-opening-drill-done.png`})}
 out.push(`${name} drills done; badges: ${await p.evaluate(()=>Object.keys(JSON.parse(localStorage.chessquest_v1).badges).join(','))}`);
 // scoresheet in game + copy + print
 await p.goto(base);await p.click('[data-go="play"]');await p.click('[data-lv="easy"]');await p.click('[data-c="w"]');await p.uncheck('#tc');await tap(p,'e2');await tap(p,'e4');await p.waitForFunction(()=>document.querySelector('#st').textContent.includes('Your turn'));
 out.push(`${name} sheet: ${(await p.textContent('#sheet .sheet')).replace(/\s+/g,' ')}`);await p.click('[data-cp]');const clip=await p.evaluate(()=>navigator.clipboard.readText());out.push(`${name} PGN: ${clip.replace(/\n/g,' | ')}`);
 const [pop]=await Promise.all([p.waitForEvent('popup'),p.click('[data-pr]')]);await pop.waitForLoadState();await pop.screenshot({path:`playtest/${name}-print-scoresheet.png`});out.push(`${name} print rows: ${await pop.locator('tr').count()}`);await pop.close();
 await p.screenshot({path:`playtest/${name}-game-sheet.png`});
 await p.goto(base);await p.click('[data-go="puzzles"]');await p.click('[data-p="f1"]');await tap(p,'b3');await tap(p,'b8');await p.waitForTimeout(1200);await tap(p,'d1');await tap(p,'d8');await p.waitForTimeout(500);out.push(`${name} puzzle sheet: ${(await p.textContent('#sheet .sheet')).replace(/\s+/g,' ')}`);
 await p.click('[data-cp]');out.push(`${name} puzzle PGN: ${(await p.evaluate(()=>navigator.clipboard.readText())).replace(/\n/g,' | ').slice(0,300)}`);
 out.push(`${name} hs ${await hs(p)}`);
}
console.log(out.join('\n'));console.log('ERRORS',errs.length,errs.slice(0,10).join('\n'));await b.close();
