// Stockfish.js (GPL-3.0) running in a Web Worker. See lib/LICENSE-stockfish-GPL3.txt
let w=null,queue=Promise.resolve(),ready=null;
function init(){ if(ready)return ready; w=new Worker('lib/stockfish.js');
  ready=new Promise(res=>{w.onmessage=e=>{if(String(e.data).startsWith('uciok'))res()};w.postMessage('uci')});
  return ready.then(()=>{w.postMessage('setoption name Hash value 16')}); }
function parseScore(line){const m=line.match(/score (cp|mate) (-?\d+)/);if(!m)return null;const v=+m[2];return m[1]==='mate'?(v>0?100000-v*100:-100000-v*100):v}
// Returns {best, lines:[{move,score,pv}]} with scores from side-to-move point of view (centipawns).
export function analyze(fen,{depth=10,movetime=null,multipv=1,searchmoves=null,skill=20}={}){
  const job=queue.then(async()=>{await init();return new Promise(res=>{const lines={};
    w.onmessage=e=>{const l=String(e.data);
      if(l.startsWith('info')&&l.includes(' pv ')){const mp=+(l.match(/multipv (\d+)/)||[0,1])[1];const s=parseScore(l);const pv=l.split(' pv ')[1].split(' ');if(s!==null)lines[mp]={move:pv[0],score:s,pv}}
      if(l.startsWith('bestmove')){res({best:l.split(' ')[1],lines:Object.values(lines)})}};
    w.postMessage('setoption name Skill Level value '+skill);
    w.postMessage('setoption name MultiPV value '+multipv);
    w.postMessage('position fen '+fen);
    w.postMessage('go '+(movetime?'movetime '+movetime:'depth '+depth)+(searchmoves?' searchmoves '+searchmoves.join(' '):''));});});
  queue=job.catch(()=>{});return job;}
export function warm(){return init()}
