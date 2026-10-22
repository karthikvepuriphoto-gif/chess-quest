(async()=>{const {Chess}=await import('chess.js');const {SRC}=await import('./puzzles.src.mjs');const fs=require('fs');
const load=k=>{let t=fs.readFileSync('/tmp/pgn/'+k+'.pgn','utf8').replace(/\r/g,'');const body=t.split(/\n\n/).slice(1).join(' ');let s=body.replace(/\{[^}]*\}/g,' ');while(/\([^()]*\)/.test(s))s=s.replace(/\([^()]*\)/g,' ');s=s.replace(/\$\d+/g,' ');const g=new Chess();g.loadPgn(s);return g.history()};
const map={f1:'opera',f2:'immortal',f3:'evergreen',f4:'century',f5:'legal',f6:'lasker',f7:'reti',f8:'kt',f9:'kt'};
for(const p of SRC){const k=map[p.id];if(!k)continue;const game=load(k);const mine=[...p.moves,...p.solution];let ok=true;
 for(let i=0;i<mine.length;i++){if(mine[i].replace(/[+#]/g,'')!==(game[i]||'').replace(/[+#]/g,'')){console.log(p.id,'MISMATCH at ply',i+1,'mine',mine[i],'source',game[i]);ok=false;break}}
 const tail=game.length===mine.length?'(solution ends where game ends)':`(game continues ${game.length-mine.length} more plies: ${game.slice(mine.length,mine.length+4).join(' ')})`;
 console.log(p.id,p.title,ok?'MATCH all '+mine.length+' plies':'',tail)}
process.exit(0)})();
