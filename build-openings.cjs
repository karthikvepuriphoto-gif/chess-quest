(async()=>{const {Chess}=await import('chess.js');const {OPENINGS,TRAPS}=await import('./openings.src.mjs');const fs=require('fs');
const db=[];for(const f of 'abcde')for(const l of fs.readFileSync('sources/lichess-openings/'+f+'.tsv','utf8').split('\n').slice(1)){const [eco,name,pgn]=l.split('\t');if(!pgn)continue;const g=new Chess();g.loadPgn(pgn);db.push({eco,name,moves:g.history().join(' ')})}
let bad=0;const out={openings:[],traps:[]};
for(const [k,list] of [['openings',OPENINGS],['traps',TRAPS]])for(const o of list){const g=new Chess();try{o.moves.forEach(m=>g.move(m))}catch(e){console.log('ILLEGAL',o.id,e.message);bad++;continue}
 if(o.why.length!==o.moves.length){console.log('WHY COUNT',o.id);bad++}
 const san=g.history();let best=null;for(let n=san.length;n>0&&!best;n--){const s=san.slice(0,n).join(' ');best=db.filter(d=>d.moves===s).pop();if(best)best={...best,plies:n}}
 let wikiOK='-';if(o.wiki){const f='/tmp/wiki_'+o.id+'.txt';const t=fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';const miss=o.players.filter(p=>!t.includes(p));wikiOK=miss.length?'MISSING '+miss.join(','):'players found';if(miss.length)bad++}
 console.log(o.id,'|',best?`${best.eco} ${best.name} (matches first ${best.plies}/${san.length} plies)`:'NO LICHESS MATCH','|',wikiOK);
 out[k].push({...o,eco:best?best.eco:null,lichessName:best?best.name:null,matchedPlies:best?best.plies:0})}
fs.writeFileSync('openings.js','export const OPEN='+JSON.stringify(out)+';\n');console.log('bad',bad);process.exit(0)})();
