// 盤を SVG に描く。描くだけで、ルールは持たない。
import { islandCells, toPixel, key } from '../core/hex.js';
import { ISLAND_STAGES } from '../core/hex.js';
import { CREATURES } from '../core/creatures.js';
import { creatureSvg } from '../art/creatures.js';
import { objectSvg } from '../art/objects.js';

export const SIZE = 30;      // マスの大きさ（中心から頂点）
const LIFT = 6;              // 高さ1あたりの持ち上げ
const ART = 44;              // 生き物の絵の大きさ
const NS = 'http://www.w3.org/2000/svg';

// 生き物の色と印（工程7 の絵がまだの生き物は、丸と番号）
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

// 見える範囲は今の盤に合わせる（マスを大きく）。箱庭は次に開く段を点線で見せ、はみ出す所は切れてよい
function frame(board) {
  const shown = board.puzzle ? board.stage : Math.min(board.stage + 1, ISLAND_STAGES.length - 1);
  const pts = Object.values(board.cells).map((c) => toPixel(c.q, c.r, SIZE));
  const pad = SIZE + 4;
  const minX = Math.min(...pts.map((p) => p[0])) - pad;
  const minY = Math.min(...pts.map((p) => p[1])) - pad - 2 * LIFT;
  const maxX = Math.max(...pts.map((p) => p[0])) + pad;
  const maxY = Math.max(...pts.map((p) => p[1])) + pad;
  return { shown, viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}` };
}

// 上に乗る物（木・花・岩・巣）。ドット絵（判定表 第11回 W4）
const dataUri = (svgText) => `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
function drawObject(kind, x, y, size) {
  const art = objectSvg(kind, 32);
  if (!art) return el('g');
  return el('image', { href: dataUri(art), x: x - size / 2, y: y - size / 2, width: size, height: size, class: `obj o-${kind}` });
}

// marks: { placed: key, pop: Set(key), flash: Set(key), hint: key（詰まったときに光る所）, tilt: Set(key)（首をかしげる生き物） }
export function drawBoard(svg, board, marks = {}) {
  const { shown, viewBox } = frame(board);
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
    if (marks.hint === k) top.classList.add('hint');
    g.append(top);
    if (c.height > 0) {
      const t = el('text', { x: x + SIZE * 0.55, y: y - SIZE * 0.42, class: 'height-mark' });
      t.textContent = '▲'.repeat(c.height);
      g.append(t);
    }
    // 生き物がいないとき、上の物はマスの真ん中に大きく
    if (c.object && !c.creature) g.append(drawObject(c.object, x, y - 2, ART * 0.9));
    if (c.creature) {
      const look = CREATURE_LOOK[c.creature] ?? { color: '#fff', mark: '？' };
      const cg = el('g', { class: `creature${marks.pop?.has(k) ? ' pop' : ''}${marks.tilt?.has(k) ? ' tilt' : ''}` });
      const art = creatureSvg(c.creature, 32);
      if (art) {
        // ドット絵（工程7）：足もとに小さな影
        cg.append(el('ellipse', { cx: x, cy: y + SIZE * 0.55, rx: SIZE * 0.45, ry: SIZE * 0.12, class: 'art-shadow' }));
        cg.append(el('image', { href: dataUri(art), x: x - ART / 2, y: y - ART / 2 - 2, width: ART, height: ART, class: 'art' }));
      } else {
        cg.append(el('circle', { cx: x, cy: y, r: SIZE * 0.5, fill: look.color, class: 'token' }));
        const t = el('text', { x, y: y + 6, class: 'token-mark' });
        t.textContent = look.mark;
        cg.append(t);
      }
      g.append(cg);
      // 生き物がいると、上の物は左上に小さく
      if (c.object) g.append(drawObject(c.object, x - SIZE * 0.62, y - SIZE * 0.52, ART * 0.45));
      // 首をかしげる（効果がぶつかってマスが変わらなかった。判定表 第11回 W5）
      if (marks.tilt?.has(k)) {
        const q = el('text', { x: x + SIZE * 0.5, y: y - SIZE * 0.5, class: 'tilt-mark' });
        q.textContent = '？';
        g.append(q);
      }
    }
    svg.append(g);
  }
}
