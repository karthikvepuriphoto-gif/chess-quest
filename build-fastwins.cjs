// Validates Fast Wins: (1) each move list appears in its source file (as consecutive SAN, ignoring move numbers/annotations),
// (2) legal in chess.js, (3) Stockfish: the bad move loses (loser's eval after it <= -150 or mated), the better move is much better and not losing,
// (4) precomputes accepted answers for the Spot-the-Blunder quiz.
(async()=>{const {Chess}=await import('chess.js');const {FAST,PATTERNS}=await import('./fastwins.src.mjs');const fs=require('fs');
const sf=require('stockfish')();let cb=null;sf.onmessage=l=>{l=typeof l=='string'?l:l.data;cb&&cb(l)};sf.postMessage('uci');
const ask=(fen,{depth=16,multipv=1,searchmoves}={})=>new Promise(r=>{const L={};cb=l=>{if(l.startsWith('info')&&l.includes(' pv ')&&!/bound/.test(l)){const mp=+(l.match(/multipv (\d+)/)||[0,1])[1];const m=l.match(/score (cp|mate) (-?\d+)/);if(m)L[mp]={mv:l.split(' pv ')[1].split(' ')[0],s:m[1]=='mate'?(+m[2]>0?100000-100*+m[2]:-100000-100*+m[2]):+m[2],raw:m[1]+' '+m[2]}}if(l.startsWith('bestmove')){cb=null;r(Object.values(L))}};sf.postMessage('setoption name MultiPV value '+multipv);sf.postMessage('position fen '+fen);sf.postMessage('go depth '+depth+(searchmoves?' searchmoves '+searchmoves.join(' '):''))});
const norm=s=>s.replace(/<ref[^>]*\/>/g,' ').replace(/<ref[\s\S]*?<\/ref>/g,' ').replace(/\{\{(?:chessAN|chesspunc)\|([^}]*)\}\}/g,'$1').replace(/\{\{=\}\}/g,'=').replace(/\{\{[^}]*\}\}/g,' ').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g,'$1').replace(/'''/g,' ').replace(/\{[^}]*\}/g,' ').replace(/(\d+)\.\s*(\.\.)?\s*/g,(m,n,d)=>' '+n+(d?'...':'.')).replace(/[!?]+/g,'').replace(/0-0-0/g,'O-O-O').replace(/0-0/g,'O-O').replace(/[+#]/g,'').replace(/\s+/g,' ');
let bad=0;const out=[];
for(const e of FAST){const src=norm(fs.readFileSync('sources/'+e.srcFile,'utf8'));const S=e.moves.map(m=>m.replace(/[+#]/g,''));const want=S.map((m,i)=>i%2?m:(i/2+1)+'.'+m).join(' ');const esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 // allow the source to split the line into chunks: check every chunk of 4 plies appears, and whole line where possible
 const whole=src.includes(' '+want+' ')||src.includes(' '+want);let chunks=0,miss=[];S.forEach((m,i)=>{const n=Math.floor(i/2)+1;const re=i%2?new RegExp('(\\b'+n+'\\.\\.\\.'+esc(m)+'|\\b'+n+'\\.'+esc(S[i-1])+' '+esc(m)+')(?![\\w=])'):new RegExp('\\b'+n+'\\.'+esc(m)+'(?![\\w=])');if(re.test(src))chunks++;else miss.push(n+(i%2?'...':'.')+m)});
 const g=new Chess();let fens=[g.fen()],ver=[];try{for(const m of e.moves){ver.push(g.move(m));fens.push(g.fen())}}catch(err){console.log('ILLEGAL',e.id,err.message);bad++;continue}
 const before=fens[e.bad],after=fens[e.bad+1];const loser=ver[e.bad].color;
 if(e.better=='@engine'){const r=await ask(before,{depth:20});const tt=new Chess(before);e.better=tt.move({from:r[0].mv.slice(0,2),to:r[0].mv.slice(2,4),promotion:r[0].mv[4]}).san;e.betterBy='engine'}else e.betterBy='source';
 const t=new Chess(before);let betterMv;try{betterMv=t.move(e.better)}catch(err){console.log('BAD BETTER',e.id,e.better);bad++;continue}
 const ev=await ask(after,{depth:18});const afterScore=-(ev[0]?ev[0].s:0);// from loser's view
 const evB=await ask(betterMv.after,{depth:18});const betterScore=-(evB[0]?evB[0].s:0);
 const ok=afterScore<=-150&&betterScore-afterScore>=150;if(!ok)bad++;
 // quiz: punish (position after bad) - accept moves within 60cp of best and winning; safe (position before bad) - accept moves scoring >= -100 for loser and >= best-120
 const pm=await ask(after,{depth:12,multipv:40});const pbest=pm[0].s;const punishOK=pm.filter(x=>x.s>=pbest-60&&x.s>=150).map(x=>x.mv);
 const sm=await ask(before,{depth:12,multipv:40});const sbest=sm[0].s;const safeOK=sm.filter(x=>x.s>=-100&&x.s>=sbest-120).map(x=>x.mv);
 const gameP=ver[e.bad+1]?ver[e.bad+1].from+ver[e.bad+1].to+(ver[e.bad+1].promotion||''):null;if(gameP&&!punishOK.includes(gameP))punishOK.push(gameP);
 const bu=betterMv.from+betterMv.to+(betterMv.promotion||'');if(!safeOK.includes(bu))safeOK.push(bu);
 const disp=s=>Math.abs(s)>=90000?(s>0?'mates':'gets mated'):(s/100).toFixed(1);
 console.log(`${ok?'OK ':'XX '} ${e.id.padEnd(10)} src ${whole?'whole line':chunks+'/'+S.length+' plies'+(miss.length?' MISSING '+miss.join(' | '):'')} | bad ${ver[e.bad].san}: loser ${disp(afterScore)} | better ${e.better}: loser ${disp(betterScore)} | punish ${punishOK.length} safe ${safeOK.length}`);
 if(!whole&&miss.length>1)bad++;
 out.push({...e,loser,uci:ver.map(m=>m.from+m.to+(m.promotion||'')),check:{afterBad:afterScore,afterBetter:betterScore},quiz:{punishFen:after,punishOK,safeFen:before,safeOK}})}
fs.writeFileSync('fastwins.js','export const FAST='+JSON.stringify(out)+';\n');console.log('bad',bad);process.exit(0)})();
