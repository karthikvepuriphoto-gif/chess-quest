(async()=>{
const {Chess}=await import('chess.js');const {SRC}=await import('./puzzles.src.mjs');
const sf=require('stockfish')();let cb=null;sf.onmessage=l=>{l=typeof l=='string'?l:l.data;cb&&cb(l)};
const ask=(fen,cmd)=>new Promise(r=>{let last='';cb=l=>{if(l.startsWith('info')&&l.includes(' score '))last=l;if(l.startsWith('bestmove')){cb=null;r({best:l.split(' ')[1],info:last})}};sf.postMessage('position fen '+fen);sf.postMessage(cmd)});
sf.postMessage('uci');const out=[];let bad=0;
for(const p of SRC){const g=new Chess();try{ if(p.fen)g.load(p.fen); else for(const m of p.moves)g.move(m);}catch(e){console.log('BAD PREFIX',p.id,e.message);bad++;continue}
 const fen=g.fen();const t=new Chess(fen);const uci=[];let ok=true;
 for(const m of p.solution){try{const mv=t.move(m);uci.push(mv.from+mv.to+(mv.promotion||''))}catch(e){console.log('BAD SOL',p.id,m);ok=false;bad++;break}}
 if(!ok)continue;const last=t.isCheckmate();
 const best=await ask(fen,'go depth 18');const mine=await ask(fen,'go depth 18 searchmoves '+uci[0]);
 const sc=s=>{const m=s.info.match(/score (cp|mate) (-?\d+)/);return m[1]+' '+m[2]};
 console.log(p.id,p.title,'| ends mate:',last,'| engine best',best.best,sc(best),'| solution',uci[0],sc(mine));
 out.push({...p,fen,uci,verify:{endsInMate:last,engineBest:best.best,engineBestScore:sc(best),solutionScore:sc(mine)}});}
require('fs').writeFileSync('puzzles.js','export const PUZZLES='+JSON.stringify(out)+';\n');console.log('bad',bad);process.exit(0)})();
