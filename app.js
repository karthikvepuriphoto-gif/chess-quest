import { Chess } from './lib/chess.js';
window.__cq=window.__cq||{};
import { PUZZLES } from './puzzles.js';
import { pieceSVG } from './pieces.js';
import { analyze, warm } from './engine.js';

const $=s=>document.querySelector(s);const app=$('#app');
const FILES='abcdefgh';const NAMES={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};const VAL={p:1,n:3,b:3,r:5,q:9,k:100};
const SQS=[];for(let r=8;r>=1;r--)for(const f of FILES)SQS.push(f+r);
// ---------- storage ----------
const KEY='chessquest_v1';
const S=Object.assign({stars:{},lessons:{},badges:{},wins:{},games:0,daily:{},path:{},settings:{read:false,sound:true,threats:true,coach:true,unsafe:false}},JSON.parse(localStorage.getItem(KEY)||'{}'));
S.settings=Object.assign({read:false,sound:true,threats:true,coach:true,unsafe:false},S.settings);
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
// ---------- voice & sound ----------
let voice=null;function pickVoice(){const vs=speechSynthesis.getVoices();voice=vs.find(v=>v.lang==='en-US'&&/Samantha|Allison|Ava|Google US/i.test(v.name))||vs.find(v=>v.lang==='en-US')||vs.find(v=>/^en-US/i.test(v.lang))||null}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function speak(t,force){if(!('speechSynthesis' in window))return;if(!force&&!S.settings.read)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.replace(/[🌟⭐🎉👑♟️]/gu,''));u.lang='en-US';if(voice)u.voice=voice;u.rate=.95;speechSynthesis.speak(u)}
let actx=null;function beep(kind){if(!S.settings.sound)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const seq={move:[[520,.06]],cap:[[300,.08],[220,.08]],good:[[660,.09],[880,.12]],bad:[[260,.18]],win:[[523,.1],[659,.1],[784,.1],[1046,.25]],star:[[990,.07]]}[kind]||[[440,.05]];let t=actx.currentTime;for(const [f,d] of seq){const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(actx.destination);o.start(t);o.stop(t+d+.02);t+=d}}catch(e){}}
function confetti(){const c=$('#confetti'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const P=Array.from({length:140},()=>({x:Math.random()*c.width,y:-20-Math.random()*c.height*.5,v:2+Math.random()*4,s:6+Math.random()*8,a:Math.random()*6,c:`hsl(${Math.random()*360},90%,60%)`}));let n=0;(function f(){x.clearRect(0,0,c.width,c.height);for(const p of P){p.y+=p.v;p.a+=.1;x.fillStyle=p.c;x.save();x.translate(p.x+Math.sin(p.a)*8,p.y);x.rotate(p.a);x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()}if(++n<170)requestAnimationFrame(f);else x.clearRect(0,0,c.width,c.height)})()}
function badge(id){if(S.badges[id])return;S.badges[id]=Date.now();save();const b=BADGES.find(b=>b.id===id);if(b)toast(`🏅 New badge: ${b.e} ${b.name}!`)}
function toast(t){const d=document.createElement('div');d.className='card';d.style.cssText='position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:40;font-weight:bold;max-width:90vw';d.textContent=t;document.body.appendChild(d);speak(t);setTimeout(()=>d.remove(),2800)}
const BADGES=[{id:'firstLesson',e:'📘',name:'First Lesson'},{id:'allLessons',e:'🎓',name:'Piece Master'},{id:'firstPuzzle',e:'🧩',name:'First Puzzle'},{id:'five',e:'🖐️',name:'5 Puzzles'},{id:'mate1',e:'⚡',name:'Mate-in-1 Champ'},{id:'famous',e:'🏛️',name:'Chess History Hero'},{id:'allPuzzles',e:'👑',name:'Puzzle King'},{id:'daily',e:'📅',name:'Daily Solver'},{id:'easy',e:'🐣',name:'Beat Easy Bot'},{id:'medium',e:'🦊',name:'Beat Medium Bot'},{id:'hard',e:'🦁',name:'Beat Hard Bot'},{id:'path',e:'🗺️',name:'Finished the Quest Path'}];
// ---------- helpers ----------
const opp=c=>c==='w'?'b':'w';
const colorName=c=>c==='w'?'White':'Black';
function flipTurn(ch,turn){const p=ch.fen().split(' ');p[1]=turn;p[3]='-';ch.load(p.join(' '))}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function speakBtn(text){return `<button class="alt sp" data-say="${esc(text)}" aria-label="Read to me">🔊</button>`}
document.addEventListener('click',e=>{const b=e.target.closest('.sp');if(b)speak(b.dataset.say,true)});
// ---------- board ----------
class Board{
  constructor(el,orient='w'){this.el=el;this.orient=orient;el.innerHTML='<div class="board"></div><svg class="arrows" viewBox="0 0 8 8"></svg>';this.b=el.querySelector('.board');this.svg=el.querySelector('.arrows');this.onTap=null;
    this.b.addEventListener('click',e=>{const s=e.target.closest('.sq');if(s&&this.onTap)this.onTap(s.dataset.sq)});}
  xy(sq){let f=FILES.indexOf(sq[0]),r=8-+sq[1];if(this.orient==='b'){f=7-f;r=7-r}return[f+.5,r+.5]}
  render(ch,o={}){const order=this.orient==='w'?SQS:[...SQS].reverse();let h='';
    for(const sq of order){const fi=FILES.indexOf(sq[0]),ri=+sq[1];const light=(fi+ri)%2===1;const pc=ch.get(sq);
      const cls=['sq',light?'l':'d'];if(o.sel===sq)cls.push('sel');if(o.last&&o.last.includes(sq))cls.push('last');
      if(o.hl&&o.hl[sq])cls.push(...o.hl[sq].split(' '));if(o.marks&&o.marks[sq])cls.push(...o.marks[sq].split(' '));
      h+=`<div class="${cls.join(' ')}" data-sq="${sq}">${pc?pieceSVG(pc.type,pc.color):''}${o.stars&&o.stars.includes(sq)?'<span class="star">⭐</span>':''}${(this.orient==='w'?sq[1]==='1':sq[1]==='8')?`<span class="coord">${sq[0]}</span>`:''}</div>`}
    this.b.innerHTML=h;
    let a='<defs><marker id="ah" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#7b2ff7"/></marker></defs>';
    for(const [f,t] of (o.arrows||[])){const [x1,y1]=this.xy(f),[x2,y2]=this.xy(t);const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1;a+=`<line x1="${x1}" y1="${y1}" x2="${x2-dx/L*.35}" y2="${y2-dy/L*.35}" stroke="#7b2ff7" stroke-width=".16" stroke-linecap="round" opacity=".85" marker-end="url(#ah)"/>`}
    this.svg.innerHTML=a;}
}
function legalHL(ch,sq){const hl={};for(const m of ch.moves({square:sq,verbose:true}))hl[m.to]=(m.captured||m.flags.includes('e'))?'cap':'hl';return hl}
function unsafeMarks(ch,side){const m={};for(const sq of SQS)if(ch.isAttacked(sq,opp(side)))m[sq]='unsafe';return m}
function askPromotion(color){return new Promise(res=>{const d=document.createElement('div');d.className='modal';d.innerHTML=`<div class="card"><h2>Your pawn made it! Pick a new piece:</h2><div class="row">${['q','r','b','n'].map(t=>`<button class="alt" data-t="${t}" style="width:76px;height:76px">${pieceSVG(t,color)}</button>`).join('')}</div></div>`;d.onclick=e=>{const b=e.target.closest('button');if(b){d.remove();res(b.dataset.t)}};document.body.appendChild(d)})}
// ---------- coach ----------
function attackersOf(ch,sq,color){try{return ch.attackers(sq,color)}catch(e){return []}}
function hangs(ch,sq,owner){const pc=ch.get(sq);if(!pc||pc.type==='k')return false;const att=attackersOf(ch,sq,opp(owner));if(!att.length)return false;const def=attackersOf(ch,sq,owner);const minAtt=Math.min(...att.map(s=>VAL[ch.get(s).type]));return !def.length||minAtt<VAL[pc.type]}
function explainMove(fen,m){const before=new Chess(fen),me=before.turn(),after=new Chess(m.after||fen);if(!m.after){after.load(fen);after.move(m.san)}
  const R=[];const pn=NAMES[m.piece];
  if(after.isCheckmate())return{text:'Checkmate! You win! 🎉',bad:false};
  if(after.isStalemate())return{text:'Careful, this is stalemate. That is a tie!',bad:true};
  let bad=false;
  if(before.inCheck()){if(m.piece==='k')R.push('moves your king out of check');else if(m.captured)R.push('captures the piece giving check');else R.push('blocks the check')}
  if(m.flags.includes('k')||m.flags.includes('q'))R.push('castles to keep your king safe');
  if(m.promotion)R.push(`turns your pawn into a ${NAMES[m.promotion]}!`);
  if(m.captured){const gain=VAL[m.captured];R.push(`captures their ${NAMES[m.captured]}`)}
  if(hangs(after,m.to,me)){const v=VAL[m.piece],cap=m.captured?VAL[m.captured]:0;if(v>cap){R.unshift(`this hangs your ${pn}! They can take it`);bad=true}}
  for(const sq of SQS){const pc=after.get(sq);if(sq===m.to||!pc||pc.color!==me||VAL[pc.type]<3||pc.type==='k')continue;if(hangs(after,sq,me)&&!hangs(before,sq,me)){R.push(`leaves your ${NAMES[pc.type]} on ${sq} unprotected`);bad=true;break}}
  if(after.inCheck())R.push('puts their king in check');
  // attacks after move
  const tmp=new Chess(after.fen());for(const sq of SQS){const pc=tmp.get(sq);if(!pc||pc.color===me||pc.type==='k')continue;if(attackersOf(tmp,sq,me).includes(m.to)){const def=attackersOf(tmp,sq,opp(me)).length;if(!def){R.push(`attacks their undefended ${NAMES[pc.type]}`);break}if(VAL[pc.type]>VAL[m.piece]){R.push(`attacks their ${NAMES[pc.type]}`);break}}}
  if(['d4','e4','d5','e5'].includes(m.to)&&'pn'.includes(m.piece))R.push('controls the center');
  if('nb'.includes(m.piece)&&(m.from[1]==='1'||m.from[1]==='8'))R.push('develops a piece');
  return{text:R.length?R.slice(0,2).join(', and '):'',bad}}
async function coachPiece(ch,sq){const fen=ch.fen();const moves=ch.moves({square:sq,verbose:true});if(!moves.length)return[];
  const best=await analyze(fen,{depth:9});const bestScore=best.lines[0]?best.lines[0].score:0;
  const uci=moves.map(m=>m.from+m.to+(m.promotion||''));const uniq=[...new Set(uci)];
  const res=await analyze(fen,{depth:8,multipv:uniq.length,searchmoves:uniq});const sc={};for(const l of res.lines)sc[l.move]=l.score;
  const out=[];const seen=new Set();for(const m of moves){if(m.promotion&&m.promotion!=='q')continue;const u=m.from+m.to+(m.promotion||'');if(seen.has(m.to))continue;seen.add(m.to);
    const s=sc[u]??-9999;const diff=bestScore-s;const ex=explainMove(fen,m);let cls=diff<=45?'good':diff<=150?'ok':'risky';if(ex.bad&&cls==='good'&&diff>20)cls='ok';
    let text=ex.text;if(!text)text=cls==='good'?'a solid move':cls==='ok'?'okay, but there is something better':'the computer sees a problem with this move';
    if(cls==='risky'&&!ex.bad)text+=' (the computer sees a problem after this)';
    out.push({m,cls,text,diff})}
  return out}
function threats(ch,side,lastMove){const msgs=[];const marks={};if(ch.inCheck()&&ch.turn()===side){msgs.push('Your king is in check! Get it to safety.');}
  for(const sq of SQS){const pc=ch.get(sq);if(!pc||pc.color!==side||pc.type==='k')continue;if(hangs(ch,sq,side)){marks[sq]='danger';const att=attackersOf(ch,sq,opp(side));const a=lastMove&&att.includes(lastMove.to)?lastMove.to:att[0];msgs.push(`Their ${NAMES[ch.get(a).type]} is attacking your ${NAMES[pc.type]}!`)}}
  return{msgs:[...new Set(msgs)].slice(0,3),marks}}
// ---------- screens ----------
let screenCleanup=null;
function go(name,...a){if(screenCleanup){screenCleanup();screenCleanup=null}speechSynthesis&&speechSynthesis.cancel();window.scrollTo(0,0);SCREENS[name](...a);history.replaceState(null,'','#'+name)}
const back=(to='home')=>`<button class="alt" data-go="${to}">⬅ Back</button>`;
app.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});
const totalStars=()=>Object.values(S.stars).reduce((a,b)=>a+b,0);
function today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function dailyPuzzle(){const d=new Date();const n=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5)+d.getFullYear();return PUZZLES[n%PUZZLES.length]}
const SCREENS={};
SCREENS.home=()=>{const dp=dailyPuzzle();app.innerHTML=`<h1>♞ Chess Quest</h1>
<div class="card msg" style="text-align:center">⭐ ${totalStars()} stars · 🏅 ${Object.keys(S.badges).length} badges</div>
<div class="tiles">
<div class="tile" data-go="path"><span class="e">🗺️</span><b>Start Here</b><small>Your step-by-step quest</small></div>
<div class="tile" data-go="learn"><span class="e">♟️</span><b>Learn the Pieces</b><small>How every piece moves</small></div>
<div class="tile" data-go="puzzles"><span class="e">🧩</span><b>Puzzles</b><small>Famous games & checkmates</small></div>
<div class="tile" id="dailyT"><span class="e">📅</span><b>Daily Puzzle</b><small>${S.daily[today()]?'Solved today ✅':esc(dp.title)}</small></div>
<div class="tile" data-go="play"><span class="e">🤖</span><b>Play the Computer</b><small>Easy, Medium or Hard</small></div>
<div class="tile" data-go="coach"><span class="e">🦉</span><b>Move Coach</b><small>Which moves are good?</small></div>
<div class="tile" data-go="badges"><span class="e">🏅</span><b>Badges</b><small>Your trophies</small></div>
<div class="tile" data-go="parents"><span class="e">👪</span><b>Grown-ups</b><small>Settings & teaching tips</small></div>
</div><p style="text-align:center;font-size:13px;opacity:.7">Chess Quest · <a href="CREDITS.md">credits & licenses</a></p>`;
$('#dailyT').onclick=()=>go('puzzle',dp.id,true);warm();}
// ----- lessons -----
const LESSONS=[
{id:'pawn',e:'♙',title:'The Pawn',text:['Pawns march straight forward, one square at a time.','On its very first move, a pawn may jump two squares.','Pawns capture one square diagonally forward. Try it!'],fen:'7k/8/8/3p1p2/8/8/4P3/K7 w - - 0 1',stars:['d5','d7'],goal:'Collect both stars with your pawn.'},
{id:'promo',e:'👑',title:'Pawn Promotion',text:['When a pawn reaches the other end of the board, it turns into a new piece!','Most players pick a queen, the strongest piece.'],fen:'7k/3P4/8/8/8/8/8/K7 w - - 0 1',target:m=>!!m.promotion,goal:'Push the pawn to the last row.'},
{id:'ep',e:'🥷',title:'En Passant',text:['A sneaky pawn rule! If an enemy pawn jumps two squares and lands right beside your pawn...','...you may capture it as if it had only moved one square. It is called "en passant" (French for "in passing").','You can only do it right away, on the very next move.'],fen:'7k/8/8/3pP3/8/8/8/K7 w - d6 0 1',target:m=>m.flags.includes('e'),goal:'Black just moved d7 to d5. Capture it en passant!'},
{id:'knight',e:'♘',title:'The Knight',text:['The knight moves in an L shape: two squares one way, then one square to the side.','It is the only piece that can jump over other pieces!'],fen:'7k/8/8/8/8/8/8/K5N1 w - - 0 1',stars:['f3','e5','c4','b6'],goal:'Capture all the stars with the knight.'},
{id:'bishop',e:'♗',title:'The Bishop',text:['The bishop slides diagonally as far as it wants.','A bishop always stays on the same color square.'],fen:'7k/8/8/8/8/8/8/K1B5 w - - 0 1',stars:['e3','h6','f8'],goal:'Collect the stars with the bishop.'},
{id:'rook',e:'♖',title:'The Rook',text:['The rook slides in straight lines: up, down, left and right.','Rooks are strong. Each one is worth about 5 pawns.'],fen:'7k/8/8/8/8/8/8/R3K3 w - - 0 1',stars:['a7','g7','g2'],goal:'Collect the stars with the rook.'},
{id:'queen',e:'♕',title:'The Queen',text:['The queen is the strongest piece. She moves like a rook AND a bishop together!','Keep her safe. She is worth about 9 pawns.'],fen:'7k/8/8/8/8/8/8/K2Q4 w - - 0 1',stars:['d6','a3','f8'],goal:'Collect the stars with the queen.'},
{id:'king',e:'♔',title:'The King',text:['The king moves one square in any direction.','The king is the most important piece. If it is trapped, the game is over!','The king can never move to a square that is attacked.'],fen:'7k/8/8/8/8/8/8/K7 w - - 0 1',stars:['b2','c3','c4'],goal:'Walk the king to the stars.'},
{id:'castle',e:'🏰',title:'Castling',text:['Castling is a special move to tuck your king away safely.','The king jumps two squares toward a rook, and the rook hops over to the other side of the king.','You can only castle if the king and that rook have not moved yet, nothing is in between, and the king is not in check and does not pass through an attacked square.'],fen:'4k3/8/8/8/8/8/8/4K2R w K - 0 1',target:m=>m.flags.includes('k')||m.flags.includes('q'),goal:'Tap the king, then tap the square two steps toward the rook.'},
{id:'check',e:'⚠️',title:'Check',text:['When a piece attacks the king, the king is "in check".','A king in check must escape right away: move the king, block the attack, or capture the attacker.'],fen:'4k3/8/8/8/8/8/8/R3K3 w - - 0 1',target:(m,a)=>a.inCheck(),goal:'Put the black king in check with your rook.'},
{id:'mate',e:'🏆',title:'Checkmate',text:['Checkmate means the king is in check and has NO way to escape.','Checkmate wins the game!'],fen:'6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',target:(m,a)=>a.isCheckmate(),goal:'Find the checkmate with the rook.'},
{id:'stale',e:'🤝',title:'Stalemate',text:['Stalemate is when a player is NOT in check but has no legal moves. The game is a tie!','When you are winning, be careful not to stalemate your opponent.'],fen:'k7/8/1K6/8/8/8/8/2Q5 w - - 0 1',target:(m,a)=>a.isCheckmate(),goal:'Checkmate the king, but do not stalemate it! (Qc7 would be stalemate.)'},
];
SCREENS.learn=()=>{app.innerHTML=`<div class="top">${back()}<h2>Learn the Pieces</h2></div><div class="tiles">${LESSONS.map((l,i)=>`<div class="tile" data-l="${i}"><span class="e">${l.e}</span><b>${l.title}</b><small>${S.lessons[l.id]?'✅ Done':'Tap to learn'}</small></div>`).join('')}</div>`;
  app.querySelectorAll('[data-l]').forEach(t=>t.onclick=()=>go('lesson',+t.dataset.l))};
SCREENS.lesson=(i)=>{const L=LESSONS[i];const ch=new Chess(L.fen);let stars=L.stars?[...L.stars]:null,sel=null,done=false,moves=0;
  const txt=L.text.join(' ');
  app.innerHTML=`<div class="top">${back('learn')}<h2>${L.e} ${L.title}</h2>${speakBtn(txt+' '+L.goal)}</div><div class="layout"><div class="boardwrap" id="bw"></div><div class="side">
  <div class="card msg">${L.text.map(t=>`<p style="margin:4px 0">${esc(t)}</p>`).join('')}</div><div class="card msg" id="goal">🎯 ${esc(L.goal)}</div>
  <label class="toggle"><input type="checkbox" id="unsafe" ${S.settings.unsafe?'checked':''}> Show squares the other side attacks</label>
  <div class="legend"><span style="background:#2f9be0">can move</span><span style="background:#ff4d6d">can capture</span><span style="background:#ff4d6d88">attacked square</span></div>
  <div class="row"><button class="alt" id="reset">↺ Try again</button>${i+1<LESSONS.length?`<button id="next">Next lesson ➡</button>`:''}</div></div></div>`;
  const B=new Board($('#bw'));speak(txt+' '+L.goal);
  const draw=(extra={})=>{const marks=$('#unsafe').checked?unsafeMarks(ch,'w'):{};B.render(ch,{sel,hl:sel?legalHL(ch,sel):{},marks,stars:stars||[],...extra})};
  $('#unsafe').onchange=e=>{S.settings.unsafe=e.target.checked;save();draw()};
  $('#reset').onclick=()=>go('lesson',i);if($('#next'))$('#next').onclick=()=>go('lesson',i+1);
  const finish=(msg)=>{done=true;S.lessons[L.id]=true;S.path['lesson:'+L.id]=true;save();badge('firstLesson');if(LESSONS.every(l=>S.lessons[l.id]))badge('allLessons');beep('win');confetti();$('#goal').innerHTML='🎉 '+esc(msg);speak(msg)};
  B.onTap=async sq=>{if(done)return;const pc=ch.get(sq);
    if(sel&&legalHL(ch,sel)[sq]){const cand=ch.moves({square:sel,verbose:true}).filter(m=>m.to===sq);let m=cand[0];if(cand.length>1&&cand[0].promotion){const t=await askPromotion('w');m=cand.find(c=>c.promotion===t)}
      const mv=ch.move({from:m.from,to:m.to,promotion:m.promotion});moves++;sel=null;beep(mv.captured?'cap':'move');
      if(stars){if(stars.includes(mv.to)){stars=stars.filter(s=>s!==mv.to);beep('star')}
        if(!stars.length){draw({last:[mv.from,mv.to]});return finish(`Amazing! You got every star in ${moves} moves!`)}
        flipTurn(ch,'w');draw({last:[mv.from,mv.to]});return}
      if(L.target&&L.target(mv,ch)){draw({last:[mv.from,mv.to]});return finish('You did it! Great job!')}
      draw({last:[mv.from,mv.to]});let msg='Not quite. Tap "Try again" and give it another go!';if(ch.isStalemate())msg='Oops, that is stalemate. The black king cannot move but is not in check, so it is a tie! Try again.';$('#goal').textContent=msg;beep('bad');speak(msg);done=true;return}
    sel=(pc&&pc.color===ch.turn())?sq:null;draw()};
  draw()};
// ----- puzzles -----
const CATS=[['mate1','⚡ Mate in 1','Beginner'],['mate2','🪜 Mate in 2','Beginner'],['material','💰 Win Material','Tactics'],['famous','🏛️ Famous Games','Chess greats']];
const starStr=n=>'★'.repeat(n)+'☆'.repeat(3-n);
SCREENS.puzzles=()=>{app.innerHTML=`<div class="top">${back()}<h2>🧩 Puzzles</h2></div>${CATS.map(([c,t,s])=>`<div class="card"><h2>${t} <small style="font-size:14px;opacity:.6">${s}</small></h2>${PUZZLES.filter(p=>p.cat===c).map(p=>`<div class="pz" data-p="${p.id}"><div><b>${esc(p.title)}</b><br><small>${esc(p.players)}${p.year?' · '+p.year:''}</small></div><span class="stars">${starStr(S.stars[p.id]||0)}</span></div>`).join('')}</div>`).join('')}`;
  app.querySelectorAll('[data-p]').forEach(t=>t.onclick=()=>go('puzzle',t.dataset.p))};
SCREENS.puzzle=(id,isDaily)=>{const P=PUZZLES.find(p=>p.id===id);const ch=new Chess(P.fen);const me=ch.turn();let ply=0,sel=null,hints=0,miss=0,solved=false,last=null,hintSq=null,hintArrow=null;
  const kidMoves=Math.ceil(P.solution.length/2);
  app.innerHTML=`<div class="top">${back('puzzles')}<h2>${esc(P.title)}</h2>${speakBtn(P.story)}</div><div class="layout"><div class="boardwrap" id="bw"></div><div class="side">
  <div class="card"><b>${esc(P.players)}</b>${P.year?' · '+P.year:''}<div class="msg">${esc(P.story)}</div>${P.source?`<small><a href="${P.source}" target="_blank" rel="noopener">About this game</a></small>`:''}</div>
  <div class="card msg" id="st">${colorName(me)} to move. ${P.cat==='mate1'?'Checkmate in 1 move!':P.cat==='mate2'?'Checkmate in 2 moves!':P.cat==='material'?'Win something big!':`Find the move ${P.players.split(' vs ')[me==='w'?0:1]||''} played!`}</div>
  <div class="row"><button class="orange" id="hint">💡 Hint</button><button class="alt" id="retry">↺ Restart</button></div><div id="why"></div></div></div>`;
  const B=new Board($('#bw'),me);speak(P.story);
  const draw=()=>{const hl=sel?legalHL(ch,sel):{};const marks={};if(hintSq)marks[hintSq]='hintp';B.render(ch,{sel,hl,marks,last,arrows:hintArrow?[hintArrow]:[]})};
  const st=t=>{$('#st').textContent=t;speak(t)};
  $('#retry').onclick=()=>go('puzzle',id,isDaily);
  $('#hint').onclick=()=>{if(solved)return;hints++;const u=P.uci[ply];if(hints===1)st('Hint: '+(P.hint||'Look at all the checks first!'));else if(hints===2){hintSq=u.slice(0,2);st('Hint: try moving this piece.');draw()}else{hintSq=u.slice(0,2);hintArrow=[u.slice(0,2),u.slice(2,4)];st('Hint: move it here!');draw()}};
  const won=()=>{solved=true;const stars=Math.max(1,3-Math.min(2,hints+miss));S.stars[id]=Math.max(S.stars[id]||0,stars);S.path['puzzle:'+id]=true;if(isDaily||dailyPuzzle().id===id){S.daily[today()]=true;badge('daily')}save();
    const solvedN=Object.keys(S.stars).length;badge('firstPuzzle');if(solvedN>=5)badge('five');if(PUZZLES.filter(p=>p.cat==='mate1').every(p=>S.stars[p.id]))badge('mate1');if(PUZZLES.filter(p=>p.cat==='famous').every(p=>S.stars[p.id]))badge('famous');if(PUZZLES.every(p=>S.stars[p.id]))badge('allPuzzles');
    beep('win');confetti();st(`Solved! ${'⭐'.repeat(stars)}`);showWhy()};
  function showWhy(){let k=0;const replay=new Chess(P.fen);const states=[];for(let i=0;i<P.solution.length;i++){if(i%2===0)states.push({fen:replay.fen(),kid:P.solution[i],reply:P.solution[i+1]});replay.move(P.solution[i])}
    const box=$('#why');const show=()=>{const w=P.why[k]||{t:''};const s=states[k];const c=new Chess(s.fen);const marks={};(w.s||[]).forEach(q=>marks[q]='mark');B.render(c,{arrows:w.a||[],marks});
      const txt=`Step ${k+1}: ${s.kid}. ${w.t}${s.reply?` Then ${colorName(opp(me))} plays ${s.reply}.`:''}`;
      box.innerHTML=`<div class="card msg"><h2>🤔 Why it works</h2><p>${esc(txt)}</p>${P.engineNote?`<p style="font-size:15px">💻 ${esc(P.engineNote)}</p>`:''}<div class="row">${k>0?'<button class="alt" id="wp">⬅</button>':''}${k<states.length-1?'<button id="wn">Next step ➡</button>':''}${speakBtn(txt)}<button class="green" id="more">More puzzles</button></div></div>`;speak(txt);
      if($('#wp'))$('#wp').onclick=()=>{k--;show()};if($('#wn'))$('#wn').onclick=()=>{k++;show()};$('#more').onclick=()=>{const idx=PUZZLES.indexOf(P);go('puzzle',PUZZLES[(idx+1)%PUZZLES.length].id)}};show()}
  B.onTap=async sq=>{if(solved||ch.turn()!==me)return;const pc=ch.get(sq);
    if(sel&&legalHL(ch,sel)[sq]){const cand=ch.moves({square:sel,verbose:true}).filter(m=>m.to===sq);let m=cand[0];if(cand.length>1&&cand[0].promotion){const t=await askPromotion(me);m=cand.find(c=>c.promotion===t)}
      const u=m.from+m.to+(m.promotion||'');const t=new Chess(ch.fen());t.move(m.san);const finalKid=ply>=P.solution.length-1;
      const ok=u===P.uci[ply]||(P.anyMate&&finalKid&&t.isCheckmate())||(P.cat==='mate1'&&t.isCheckmate());sel=null;
      if(!ok){miss++;beep('bad');const why=explainMove(ch.fen(),m);st(`Not this time. ${why.bad?'That '+why.text.replace(/^this /,'')+'. ':''}Try again!`);draw();return}
      const mv=ch.move(m.san);last=[mv.from,mv.to];hintSq=null;hintArrow=null;hints=Math.min(hints,2);beep(mv.captured?'cap':'good');ply++;draw();
      if(t.isCheckmate()||ply>=P.solution.length)return won();
      st('Great move! Now watch the reply...');setTimeout(()=>{const r=ch.move(P.solution[ply]);ply++;last=[r.from,r.to];beep('move');draw();st(`${colorName(opp(me))} played ${r.san}. Your move!`);hints=0},800);return}
    sel=(pc&&pc.color===me)?sq:null;draw()};
  draw()};
// ----- play -----
const LEVELS={easy:{n:'Easy 🐣',skill:0,depth:1,rand:.45},medium:{n:'Medium 🦊',skill:6,depth:6,rand:.05},hard:{n:'Hard 🦁',skill:16,depth:12,rand:0}};
SCREENS.play=()=>{app.innerHTML=`<div class="top">${back()}<h2>🤖 Play the Computer</h2></div><div class="card"><h2>Pick a level</h2><div class="row">${Object.entries(LEVELS).map(([k,v])=>`<button data-lv="${k}" class="${k==='easy'?'green':k==='medium'?'':'orange'}">${v.n}</button>`).join('')}</div>
  <h2>Pick your color</h2><div class="row"><button class="alt" data-c="w">⚪ White (moves first)</button><button class="alt" data-c="b">⚫ Black</button><button class="alt" data-c="r">🎲 Surprise me</button></div></div>`;
  let lv=null,c=null;const start=()=>{if(lv&&c)go('game',lv,c==='r'?(Math.random()<.5?'w':'b'):c)};
  app.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{lv=b.dataset.lv;app.querySelectorAll('[data-lv]').forEach(x=>x.style.outline='');b.style.outline='4px solid #2b2550';start()});
  app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{c=b.dataset.c;app.querySelectorAll('[data-c]').forEach(x=>x.style.outline='');b.style.outline='4px solid #2b2550';start()})};
async function engineMove(ch,lvKey){const L=LEVELS[lvKey];const moves=ch.moves({verbose:true});
  if(Math.random()<L.rand){return moves[Math.floor(Math.random()*moves.length)]}
  const r=await analyze(ch.fen(),{depth:L.depth,skill:L.skill});const u=r.best;return moves.find(m=>m.from+m.to+(m.promotion||'')===u)||moves[0]}
SCREENS.game=(lvKey,me,coachOnly)=>{const ch=new Chess();window.__cq.game=ch;let sel=null,last=null,busy=false,over=false,coach=null,hintA=null,threatMarks={};const evals=[];const keyMoments=[];let alive=true;screenCleanup=()=>{alive=false};
  app.innerHTML=`<div class="top">${back(coachOnly?'home':'play')}<h2>${coachOnly?'🦉 Move Coach':LEVELS[lvKey].n+' bot'}</h2></div><div class="layout"><div class="boardwrap" id="bw"></div><div class="side">
  <div class="card msg" id="st"></div><div class="card" id="th" style="display:none"></div>
  <div class="row"><button class="orange" id="hint">💡 Hint</button><button class="alt" id="undo">↶ Take back</button><button class="alt" id="new">New game</button></div>
  <label class="toggle"><input type="checkbox" id="tc" ${S.settings.coach?'checked':''}> 🦉 Coach colors (good / okay / risky)</label>
  <label class="toggle"><input type="checkbox" id="tt" ${S.settings.threats?'checked':''}> ⚠️ Show threats</label>
  <div class="legend"><span style="background:#2fb36b">good</span><span style="background:#f5b400">okay</span><span style="background:#ff4d6d">risky</span></div>
  <div class="card coachlist" id="cl" style="display:none"></div></div></div>`;
  const B=new Board($('#bw'),me);
  const st=t=>{$('#st').innerHTML=t};
  const draw=()=>{let hl={};if(sel){hl=legalHL(ch,sel);if(coach)for(const c of coach)hl[c.m.to]=(hl[c.m.to]||'hl')+' '+c.cls}
    B.render(ch,{sel,hl,last,marks:$('#tt').checked?threatMarks:{},arrows:hintA?[hintA]:[]})};
  const showThreats=(lastMove)=>{const t=threats(ch,me,lastMove);threatMarks=t.marks;const el=$('#th');if($('#tt').checked&&t.msgs.length){el.style.display='';el.innerHTML='⚠️ '+t.msgs.map(esc).join('<br>⚠️ ');speak(t.msgs.join(' '))}else el.style.display='none'};
  $('#tc').onchange=e=>{S.settings.coach=e.target.checked;save();coach=null;$('#cl').style.display='none';draw()};
  $('#tt').onchange=e=>{S.settings.threats=e.target.checked;save();showThreats(null);draw()};
  $('#new').onclick=()=>go(coachOnly?'coach':'game',lvKey,me);
  $('#undo').onclick=()=>{if(busy)return;ch.undo();if(ch.turn()!==me)ch.undo();evals.length=Math.min(evals.length,ch.history().length);over=false;sel=null;coach=null;hintA=null;last=null;showThreats(null);status();draw()};
  $('#hint').onclick=async()=>{if(busy||over||ch.turn()!==me)return;st('🦉 Thinking...');const r=await analyze(ch.fen(),{depth:11});const m=ch.moves({verbose:true}).find(x=>x.from+x.to+(x.promotion||'')===r.best);if(!m)return;hintA=[m.from,m.to];const ex=explainMove(ch.fen(),m);const t=`🦉 Coach suggests ${m.san}${ex.text?': it '+ex.text.replace(/^this /,''):''}.`;st(esc(t));speak(t);draw()};
  function status(){if(ch.isCheckmate()){return end(ch.turn()===me?'lose':'win')}if(ch.isDraw()||ch.isStalemate()){return end('draw')}
    st(ch.turn()===me?(ch.inCheck()?'⚠️ You are in check! ':'')+'Your turn! Tap a piece.':'<span class="thinking">🤖 Thinking...</span>')}
  function end(r){over=true;S.games++;let msg;if(r==='win'&&!coachOnly){S.wins[lvKey]=(S.wins[lvKey]||0)+1;badge(lvKey);S.path['play:easy']=S.path['play:easy']||lvKey==='easy';msg='🎉 Checkmate! You WIN!';confetti();beep('win')}else if(r==='win'){msg='🎉 Checkmate!';confetti()}else if(r==='lose'){msg='The computer won this time. Every loss teaches you something!';beep('bad')}else msg='It is a draw (a tie).';
    if(!coachOnly)S.path['play:try']=true;save();st(esc(msg));speak(msg);recap(r)}
  function recap(r){const h=ch.history({verbose:true});const items=[];
    h.forEach((m,i)=>{const mine=m.color===me;if(m.captured&&VAL[m.captured]>=3)items.push({i,t:`${mine?'You':'The computer'} captured a ${NAMES[m.captured]} with ${m.san}.`,good:mine});});
    keyMoments.forEach(k=>items.push(k));const sorted=items.sort((a,b)=>a.i-b.i).slice(-6);
    const ex=r==='win'?'You finished with checkmate. Awesome!':r==='lose'?'Tip: before every move, check what the other side is attacking.':'A tie means neither side could win.';
    const d=document.createElement('div');d.className='modal';d.innerHTML=`<div class="card"><h2>📜 Game Recap</h2><p class="msg">${esc(ex)}</p>${sorted.length?sorted.map(s=>`<div class="${s.good?'cg':'cr'}" style="padding:8px;border-radius:10px;margin:4px 0">Move ${Math.floor(s.i/2)+1}: ${esc(s.t)}</div>`).join(''):'<p>A quiet game with no big captures.</p>'}<div class="row"><button id="cx">OK</button></div></div>`;document.body.appendChild(d);d.querySelector('#cx').onclick=()=>d.remove()}
  async function afterMyMove(mv,fenBefore){if(!coachOnly){// judge my move quickly for recap
      try{const r=await analyze(fenBefore,{depth:8});const bestS=r.lines[0]?.score??0;const r2=await analyze(fenBefore,{depth:8,searchmoves:[mv.from+mv.to+(mv.promotion||'')]});const s=r2.lines[0]?.score??0;const i=ch.history().length-1;
        if(bestS-s>250)keyMoments.push({i,t:`${mv.san} was a slip. ${r.best?'A better move was '+(new Chess(fenBefore).moves({verbose:true}).find(x=>x.from+x.to+(x.promotion||'')===r.best)?.san||'')+'.':''}`,good:false});
        else if(mv.captured===undefined&&new Chess(ch.fen()).inCheck()&&s>300)keyMoments.push({i,t:`${mv.san} was a strong check!`,good:true})}catch(e){}}}
  async function botTurn(){if(over||!alive)return;busy=true;status();const fenB=ch.fen();const m=coachOnly?await engineMove(ch,'medium'):await engineMove(ch,lvKey);if(!alive)return;await new Promise(r=>setTimeout(r,350));const mv=ch.move(m.san);last=[mv.from,mv.to];beep(mv.captured?'cap':'move');busy=false;showThreats(mv);draw();status()}
  B.onTap=async sq=>{if(busy||over||ch.turn()!==me)return;const pc=ch.get(sq);
    if(sel&&legalHL(ch,sel)[sq]){const cand=ch.moves({square:sel,verbose:true}).filter(m=>m.to===sq);let m=cand[0];if(cand.length>1&&cand[0].promotion){const t=await askPromotion(me);m=cand.find(c=>c.promotion===t)}
      const fenB=ch.fen();const mv=ch.move({from:m.from,to:m.to,promotion:m.promotion});sel=null;coach=null;hintA=null;last=[mv.from,mv.to];$('#cl').style.display='none';beep(mv.captured?'cap':'move');draw();status();if(over)return;
      busy=true;await afterMyMove(mv,fenB);busy=false;await botTurn();return}
    if(pc&&pc.color===me){sel=sq;coach=null;draw();if($('#tc').checked){const mySel=sq;$('#cl').style.display='';$('#cl').innerHTML='<span class="thinking">🦉 Coach is looking...</span>';const res=await coachPiece(ch,sq);if(sel!==mySel||!alive)return;coach=res;
        const lab={good:'cg',ok:'co',risky:'cr'};$('#cl').innerHTML=`<b>🦉 Your ${NAMES[pc.type]}'s moves:</b>`+res.sort((a,b)=>a.diff-b.diff).map(c=>`<div class="${lab[c.cls]}"><b>${c.m.san}</b> ${c.cls==='good'?'👍':c.cls==='ok'?'🙂':'⚠️'} ${esc(c.text)}</div>`).join('');draw()}}
    else{sel=null;coach=null;$('#cl').style.display='none';draw()}};
  draw();status();if(ch.turn()!==me)botTurn()};
SCREENS.coach=()=>SCREENS.game('medium','w',true);
// ----- path -----
const PATH=[...LESSONS.map(l=>({k:'lesson:'+l.id,t:`${l.e} Lesson: ${l.title}`,go:()=>go('lesson',LESSONS.indexOf(l))})),
 ...['b1','b4','b6','b2','b9','w1','f1','f5'].map(id=>{const p=PUZZLES.find(x=>x.id===id);return{k:'puzzle:'+id,t:`🧩 Puzzle: ${p.title}`,go:()=>go('puzzle',id)}}),
 {k:'play:try',t:'🤖 Play a whole game vs the Easy bot',go:()=>go('game','easy','w')},{k:'play:easy',t:'🏆 Beat the Easy bot',go:()=>go('game','easy','w')}];
SCREENS.path=()=>{const doneN=PATH.filter(p=>S.path[p.k]).length;if(doneN===PATH.length)badge('path');const next=PATH.find(p=>!S.path[p.k]);
  app.innerHTML=`<div class="top">${back()}<h2>🗺️ Your Chess Quest</h2></div><div class="card msg">You have finished ${doneN} of ${PATH.length} steps. ${next?'':'You finished the whole quest! 🏆'}</div>${next?'<div class="row"><button class="green" id="nx">▶ Continue: '+esc(next.t)+'</button></div>':''}<div class="path">${PATH.map((p,i)=>`<div class="step ${S.path[p.k]?'done':''}" data-i="${i}"><b>${S.path[p.k]?'✅':i+1+'.'}</b> ${esc(p.t)}</div>`).join('')}</div>`;
  if(next)$('#nx').onclick=next.go;app.querySelectorAll('.step').forEach(s=>s.onclick=()=>PATH[+s.dataset.i].go())};
SCREENS.badges=()=>{app.innerHTML=`<div class="top">${back()}<h2>🏅 Badges</h2></div><div class="card">${BADGES.map(b=>`<span class="badge ${S.badges[b.id]?'':'off'}">${b.e} ${b.name}</span>`).join('')}</div><div class="card msg">⭐ ${totalStars()} puzzle stars · Wins: Easy ${S.wins.easy||0}, Medium ${S.wins.medium||0}, Hard ${S.wins.hard||0}</div>`};
SCREENS.parents=()=>{const T=(k,l)=>`<label class="toggle"><input type="checkbox" data-s="${k}" ${S.settings[k]?'checked':''}> ${l}</label>`;
  app.innerHTML=`<div class="top">${back()}<h2>👪 Grown-ups</h2></div><div class="card"><h2>Settings</h2>${T('read','🔊 Read to me (American English voice)')}${T('sound','🎵 Sounds')}${T('coach','🦉 Coach colors in games')}${T('threats','⚠️ Show threats in games')}<p style="font-size:14px">Voice: ${voice?esc(voice.name+' ('+voice.lang+')'):'default en-US'}</p></div>
  <div class="card msg"><h2>Teaching tips</h2><ul>
  <li><b>Ages 5–6:</b> do one lesson at a time. The star challenges (knight, bishop, rook) are great first games. Skip en passant and castling until later.</li>
  <li><b>Ages 8–10:</b> follow the Start Here path, then the mate-in-1 puzzles. Ask "What is your opponent threatening?" before every move. Turn on Show threats.</li>
  <li><b>Use the Coach:</b> tap a piece and talk about why green moves are good and red ones are risky.</li>
  <li><b>Famous games:</b> after solving, step through "Why it works" together and tell the story of the players.</li>
  <li><b>Play together:</b> Easy bot first. Use Take back freely, it is how kids learn.</li></ul></div>
  <div class="card"><h2>Progress</h2><p>Lessons: ${Object.keys(S.lessons).length}/${LESSONS.length} · Puzzles solved: ${Object.keys(S.stars).length}/${PUZZLES.length} · Games played: ${S.games}</p><button class="orange" id="rs">Reset all progress</button></div>`;
  app.querySelectorAll('[data-s]').forEach(i=>i.onchange=()=>{S.settings[i.dataset.s]=i.checked;save();if(i.dataset.s==='read'&&i.checked)speak('Read to me is on.',true)});
  $('#rs').onclick=()=>{if(confirm('Erase all stars, badges and progress?')){localStorage.removeItem(KEY);location.reload()}}};
// boot
const h=location.hash.slice(1);go(['learn','puzzles','play','coach','path','badges','parents'].includes(h)?h:'home');
window.__cq=Object.assign(window.__cq||{},{S,PUZZLES,LESSONS,analyze,fen:()=>window.__cq.game&&window.__cq.game.fen()});
