// Builds puzzles.js from puzzles.src.mjs. Famous games are checked move-by-move against the
// source PGNs in sources/ (downloaded from chessgames.com), replayed with chess.js and checked with Stockfish.
(async()=>{
const {Chess}=await import('chess.js');const {SRC}=await import('./puzzles.src.mjs');const fs=require('fs');
const pgnMoves=k=>{let t=fs.readFileSync('sources/'+k+'.pgn','utf8');const fen=(t.match(/\[FEN "([^"]+)"\]/)||[])[1];const body=t.split(/\n\n/).slice(1).join(' ');let s=body.replace(/\{[^}]*\}/g,' ');while(/\([^()]*\)/.test(s))s=s.replace(/\([^()]*\)/g,' ');s=s.replace(/\$\d+/g,' ');const g=new Chess();g.loadPgn(s);return g.history()};
// Existing famous puzzles -> source PGN. Evergreen: chessgames gives 21-24 in a source note (Schachzeitung, Oct 1852), checked below.
const SRCMAP={f1:'opera',f2:'immortal',f3:'evergreen',f4:'century',f6:'lasker',f7:'reti',f8:'kt',f9:'kt'};
const EVERGREEN_END=['Qxd7+','Kxd7','Bf5+','Ke8','Bd7+','Kf8','Bxe7#'];
// Légal: Wikipedia "Legal versus Saint Brie" (rook odds, Walker 1835). chessgames.com gives a different move order.
const LEGAL_WIKI='e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#'.split(' ');
const sf=require('stockfish')();let cb=null;sf.onmessage=l=>{l=typeof l=='string'?l:l.data;cb&&cb(l)};
const ask=(fen,cmd)=>new Promise(r=>{let last='';cb=l=>{if(l.startsWith('info')&&l.includes(' score ')&&!/bound/.test(l))last=l;if(l.startsWith('bestmove')){cb=null;r({best:l.split(' ')[1],info:last})}};sf.postMessage('position fen '+fen);sf.postMessage(cmd)});
sf.postMessage('uci');const out=[];let bad=0;const strip=x=>x.replace(/[+#]/g,'');
for(const p0 of SRC){const p={...p0};
 if(p.pgn){const h=pgnMoves(p.pgn);p.moves=h.slice(0,p.startPly);p.solution=h.slice(p.startPly,p.endPly||h.length);p.verifiedAgainst='sources/'+p.pgn+'.pgn';}
 const g=new Chess();try{ if(p.fen)g.load(p.fen); for(const m of (p.moves||[]))g.move(m);}catch(e){console.log('BAD PREFIX',p.id,e.message);bad++;continue}
 const full=[...(p.moves||[]),...p.solution];
 if(SRCMAP[p.id]){let src=pgnMoves(SRCMAP[p.id]);if(p.id==='f3')src=src.concat(EVERGREEN_END);const mm=full.findIndex((m,i)=>strip(m)!==strip(src[i]||''));if(mm>=0){console.log('SOURCE MISMATCH',p.id,'ply',mm+1,full[mm],src[mm]);bad++}else p.verifiedAgainst='sources/'+SRCMAP[p.id]+'.pgn'}
 if(p.id==='f5'){if(full.join(' ')!==LEGAL_WIKI.join(' ')){console.log('LEGAL MISMATCH');bad++}else p.verifiedAgainst='Wikipedia: Légal Trap (Legal versus Saint Brie)'}
 const fen=g.fen();const t=new Chess(fen);const uci=[];let ok=true;
 for(const m of p.solution){try{const mv=t.move(m);uci.push(mv.from+mv.to+(mv.promotion||''))}catch(e){console.log('BAD SOL',p.id,m);ok=false;bad++;break}}
 if(!ok)continue;
 // arrow sanity: first arrow of each why-step must be the kid's move
 (p.why||[]).forEach((w,i)=>{const u=uci[i*2];if(u&&w.a&&w.a[0]&&(w.a[0][0]+w.a[0][1])!==u.slice(0,4)){console.log('ARROW MISMATCH',p.id,'step',i+1,w.a[0],u);bad++}});
 if(p.why&&p.why.length!==Math.ceil(p.solution.length/2)){console.log('WHY COUNT',p.id,p.why.length,Math.ceil(p.solution.length/2));bad++}
 const last=t.isCheckmate();
 const best=await ask(fen,'go depth 20');const mine=await ask(fen,'go depth 20 searchmoves '+uci[0]);
 const sc=s=>{const m=s.info.match(/score (cp|mate) (-?\d+)/);return m[1]+' '+m[2]};
 console.log(p.id,p.title,'| src:',p.verifiedAgainst||'-','| ends mate:',last,'| engine best',best.best,sc(best),'| solution',uci[0],sc(mine));
 delete p.pgn;delete p.startPly;delete p.endPly;
 out.push({...p,fen,uci,verify:{endsInMate:last,engineBest:best.best,engineBestScore:sc(best),solutionScore:sc(mine)}});}
fs.writeFileSync('puzzles.js','export const PUZZLES='+JSON.stringify(out)+';\n');console.log('bad',bad);process.exit(0)})();
