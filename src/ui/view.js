// 盤を SVG に描く。描くだけで、ルールは持たない。
import { islandCells, toPixel, key } from '../core/hex.js';
import { ISLAND_STAGES } from '../core/hex.js';

export const SIZE = 30;      // マスの大きさ（中心から頂点）
const LIFT = 6;              // 高さ1あたりの持ち上げ
const NS = 'http://www.w3.org/2000/svg';

// 生き物の色と印（絵は工程7。いまは丸と番号）
export const CREATURE_LOOK = {
  pocha: { color: '#5fb3e8', mark: '①' },
  kokedama: { color: '#8bc34a', mark: '②' },
  numanushi: { color: '#3f8f8a', mark: '③' },
  kerori: { color: '#c3d84f', mark: '④' },
  sunamoguri: { color: '#e0a458', mark: '⑤' },
  kazenoko: { color: '#d7e3f4', mark: '⑥' },
};

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
    if (c.object === 'tree') {
      const tx = c.creature ? x - SIZE * 0.45 : x;
      const ty = c.creature ? y - SIZE * 0.25 : y;
      g.append(el('rect', { x: tx - 2, y: ty + 2, width: 4, height: 8, class: 'trunk' }));
      g.append(el('polygon', { points: `${tx},${ty - 14} ${tx - 10},${ty + 4} ${tx + 10},${ty + 4}`, class: 'leaves' }));
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
