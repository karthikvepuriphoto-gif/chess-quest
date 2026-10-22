// Original friendly piece art for Chess Quest (CC0 / public domain, made for this app).
const BODY={
p:'<circle cx="50" cy="32" r="15"/><path d="M38 50 Q50 42 62 50 L68 78 H32 Z"/><rect x="24" y="76" width="52" height="12" rx="6"/>',
r:'<path d="M26 18 h10 v8 h8 v-8 h12 v8 h8 v-8 h10 v20 l-6 6 v28 h6 v12 H26 V72 h6 V44 l-6-6 Z"/>',
n:'<path d="M30 86 H74 V74 C74 52 70 30 50 18 L44 12 L40 22 C30 26 22 40 22 50 C22 56 28 58 34 54 L44 48 C40 60 30 66 30 74 Z"/>',
b:'<path d="M50 10 C38 22 32 34 32 46 C32 58 40 64 50 64 C60 64 68 58 68 46 C68 34 62 22 50 10 Z"/><path d="M38 66 H62 L66 76 H34 Z"/><rect x="24" y="76" width="52" height="12" rx="6"/><path d="M54 26 L46 40" stroke-width="5" class="cut"/>',
q:'<path d="M20 30 L32 62 L40 26 L50 60 L60 26 L68 62 L80 30 L72 76 H28 Z"/><circle cx="20" cy="26" r="6"/><circle cx="40" cy="22" r="6"/><circle cx="60" cy="22" r="6"/><circle cx="80" cy="26" r="6"/><rect x="24" y="76" width="52" height="12" rx="6"/>',
k:'<path d="M46 6 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 v-8 h8 Z"/><path d="M24 40 C24 28 40 28 50 38 C60 28 76 28 76 40 C76 54 68 62 68 76 H32 C32 62 24 54 24 40 Z"/><rect x="24" y="76" width="52" height="12" rx="6"/>'};
const EYES={p:[44,56,32],r:[42,58,52],n:[38,38,36],b:[44,56,48],q:[42,58,56],k:[42,58,52]};
export function pieceSVG(type,color){
  const fill=color==='w'?'#fffdf5':'#3b2f63',stroke=color==='w'?'#5a4a2a':'#120c2b',eye=color==='w'?'#2b2550':'#fff';
  const [x1,x2,y]=EYES[type];
  const eyes=type==='n'?`<circle cx="${x1}" cy="${y}" r="3.6" fill="${eye}"/>`:`<circle cx="${x1}" cy="${y}" r="3.4" fill="${eye}"/><circle cx="${x2}" cy="${y}" r="3.4" fill="${eye}"/><path d="M${x1+1} ${y+7} Q50 ${y+12} ${x2-1} ${y+7}" stroke="${eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  return `<svg class="pc" viewBox="0 0 100 100"><g fill="${fill}" stroke="${stroke}" stroke-width="3.5" stroke-linejoin="round">${BODY[type].replace('class="cut"',`stroke="${stroke}"`)}</g>${eyes}</svg>`;
}
