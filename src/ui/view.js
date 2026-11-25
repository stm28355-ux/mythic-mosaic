// 盤を SVG に描く。描くだけで、ルールは持たない。
import { islandCells, toPixel, key } from '../core/hex.js';
import { ISLAND_STAGES } from '../core/hex.js';
import { CREATURES } from '../core/creatures.js';

export const SIZE = 30;      // マスの大きさ（中心から頂点）
const LIFT = 6;              // 高さ1あたりの持ち上げ
const NS = 'http://www.w3.org/2000/svg';

// 生き物の色と印（絵は工程7。いまは丸と番号）
const MARKS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔';
const COLORS = {
  pocha: '#5fb3e8', kokedama: '#8bc34a', numanushi: '#3f8f8a', kerori: '#c3d84f', sunamoguri: '#e0a458', kazenoko: '#d7e3f4',
  hasuhime: '#f3a6c8', uzumaki: '#7fa8ff', nagare: '#9fe0f0',
  morinoko: '#4caf6a', kodama: '#b6e3a0', mofuroo: '#a0825a', hinadori: '#ffd56b',
  hanabira: '#ff9bb3', bunbun: '#f6c343', nijidori: '#c9a7ff',
  hitorisuna: '#f0cf96', iwao: '#a9a39a', yamanami: '#c08a6a', tsumuji: '#e8f0ff',
  hotarubi: '#e6f58a', kirinonushi: '#b9c7c0', doronko: '#8a6a4a', hajimari: '#ffffff',
};
// 生き物の色と印（絵は工程7。いまは丸と番号）
export const CREATURE_LOOK = Object.fromEntries(CREATURES.map((c) => [c.id, { color: COLORS[c.id] ?? '#fff', mark: MARKS[c.no - 1] ?? '？' }]));

const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

const corners = (x, y, s = SIZE) => Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return `${(x + s * Math.cos(a)).toFixed(1)},${(y + s * Math.sin(a)).toFixed(1)}`;
}).join(' ');

// 見える範囲は今の島に合わせる（マスを大きく）。次に開く段は点線で、はみ出す所は切れてよい
function frame(stage) {
  const shown = Math.min(stage + 1, ISLAND_STAGES.length - 1);
  const pts = islandCells(stage).map(([q, r]) => toPixel(q, r, SIZE));
  const pad = SIZE + 4;
  const minX = Math.min(...pts.map((p) => p[0])) - pad;
  const minY = Math.min(...pts.map((p) => p[1])) - pad - 2 * LIFT;
  const maxX = Math.max(...pts.map((p) => p[0])) + pad;
  const maxY = Math.max(...pts.map((p) => p[1])) + pad;
  return { shown, viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}` };
}

// 上に乗る物（木・花・岩・巣）
function drawObject(kind, x, y, k) {
  const g = el('g', { class: `obj o-${kind}`, transform: `translate(${x} ${y}) scale(${k})` });
  if (kind === 'tree') {
    g.append(el('rect', { x: -2, y: 2, width: 4, height: 8, class: 'trunk' }));
    g.append(el('polygon', { points: '0,-14 -10,4 10,4', class: 'leaves' }));
  } else if (kind === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      g.append(el('circle', { cx: (Math.cos(a) * 5).toFixed(1), cy: (Math.sin(a) * 5).toFixed(1), r: 4, class: 'petal' }));
    }
    g.append(el('circle', { cx: 0, cy: 0, r: 2.6, class: 'pistil' }));
  } else if (kind === 'rock') {
    g.append(el('polygon', { points: '-11,7 -8,-3 -2,-9 6,-7 11,0 10,7', class: 'rock' }));
    g.append(el('polyline', { points: '-2,-9 0,-1 10,7', class: 'rock-line' }));
  } else if (kind === 'nest') {
    g.append(el('ellipse', { cx: 0, cy: 3, rx: 11, ry: 6, class: 'nest' }));
    g.append(el('ellipse', { cx: 0, cy: 1, rx: 7, ry: 3, class: 'nest-hole' }));
    for (const dx of [-3, 3]) g.append(el('ellipse', { cx: dx, cy: 0, rx: 2.6, ry: 3.2, class: 'egg' }));
  }
  return g;
}

// marks: { placed: key, pop: Set(key), flash: Set(key) }
export function drawBoard(svg, board, marks = {}) {
  const { shown, viewBox } = frame(board.stage);
  svg.setAttribute('viewBox', viewBox);
  svg.replaceChildren();

  // まだ開いていない所
  if (shown > board.stage) {
    for (const [q, r] of islandCells(shown)) {
      if (board.cells[key(q, r)]) continue;
      const [x, y] = toPixel(q, r, SIZE);
      svg.append(el('polygon', { points: corners(x, y, SIZE - 1), class: 'future' }));
    }
  }

  const cells = Object.values(board.cells).sort((a, b) => a.r - b.r || a.q - b.q);
  for (const c of cells) {
    const k = key(c.q, c.r);
    const [x, y0] = toPixel(c.q, c.r, SIZE);
    const y = y0 - c.height * LIFT;
    const g = el('g', { class: 'cell', 'data-key': k });
    if (c.height > 0) {
      g.append(el('polygon', { points: corners(x, y0 + 2, SIZE - 1), class: `side h${c.height}` }));
    }
    const top = el('polygon', { points: corners(x, y, SIZE - 1), class: `top g-${c.ground} h${c.height}` });
    if (marks.placed === k) top.classList.add('placed');
    if (marks.flash?.has(k)) top.classList.add('flash');
    g.append(top);
    if (c.height > 0) {
      const t = el('text', { x: x + SIZE * 0.55, y: y - SIZE * 0.42, class: 'height-mark' });
      t.textContent = '▲'.repeat(c.height);
      g.append(t);
    }
    if (c.object) {
      // 生き物がいると、上の物は左上に小さく寄せる
      const tx = c.creature ? x - SIZE * 0.5 : x;
      const ty = c.creature ? y - SIZE * 0.3 : y;
      g.append(drawObject(c.object, tx, ty, c.creature ? 0.75 : 1));
    }
    if (c.creature) {
      const look = CREATURE_LOOK[c.creature] ?? { color: '#fff', mark: '？' };
      const cg = el('g', { class: marks.pop?.has(k) ? 'creature pop' : 'creature' });
      cg.append(el('circle', { cx: x, cy: y, r: SIZE * 0.5, fill: look.color, class: 'token' }));
      const t = el('text', { x, y: y + 6, class: 'token-mark' });
      t.textContent = look.mark;
      cg.append(t);
      g.append(cg);
    }
    svg.append(g);
  }
}
