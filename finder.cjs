(async()=>{const {Chess}=await import('chess.js');const fs=require('fs');
const load=k=>{let t=fs.readFileSync('/tmp/pgn/'+k+'.pgn','utf8').replace(/\r/g,'');const body=t.split(/\n\n/).slice(1).join(' ');let s=body.replace(/\{[^}]*\}/g,' ');while(/\([^()]*\)/.test(s))s=s.replace(/\([^()]*\)/g,' ');s=s.replace(/\$\d+/g,' ');const g=new Chess();g.loadPgn(s);return g.history({verbose:true})};
const sf=require('stockfish')();let cb=null;sf.onmessage=l=>{l=typeof l=='string'?l:l.data;cb&&cb(l)};sf.postMessage('uci');sf.postMessage('setoption name MultiPV value 2');
const ask=fen=>new Promise(r=>{const L={};cb=l=>{if(l.startsWith('info')&&l.includes(' pv ')){const mp=+l.match(/multipv (\d)/)[1];const m=l.match(/score (cp|mate) (-?\d+)/);L[mp]={mv:l.split(' pv ')[1].split(' ')[0],s:m[1]=='mate'?(+m[2]>0?100000-+m[2]:-100000):+m[2],raw:m[1]+' '+m[2]}}if(l.startsWith('bestmove')){cb=null;r(L)}};sf.postMessage('position fen '+fen);sf.postMessage('go depth 16')});
for(const [k,win] of [['polgar','w'],['carlsen','w']]){const h=load(k);console.log('==',k,h.length,'plies');
 for(let i=Math.max(0,h.length-40);i<h.length;i++){const m=h[i];if(m.color!==win)continue;const L=await ask(m.before);const u=m.from+m.to+(m.promotion||'');
  if(L[1]&&L[1].mv===u&&L[1].s>=250&&(!L[2]||L[1].s-L[2].s>=200))console.log(' ply',i+1,'move',Math.floor(i/2)+1+(win=='b'?'...':'.'),m.san,'best',L[1].raw,'2nd',L[2]&&L[2].raw)}}
process.exit(0)})();
