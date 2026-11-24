// 工程0の見本ページ：島の広がり方を描くだけ。工程2で箱庭の画面に置き換える。
import { islandCells, stageOf, toPixel } from '../core/hex.js';
import { APP_VERSION } from '../version.js';

const SIZE = 24;
const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('island');
const buttons = [...document.querySelectorAll('.stages button')];

const corners = (x, y) => Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return `${(x + SIZE * Math.cos(a)).toFixed(1)},${(y + SIZE * Math.sin(a)).toFixed(1)}`;
}).join(' ');

function draw(stage) {
  const all = islandCells(2);
  const pts = all.map(([q, r]) => toPixel(q, r, SIZE));
  const xs = pts.map(([x]) => x);
  const ys = pts.map(([, y]) => y);
  const pad = SIZE + 2;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  svg.setAttribute('viewBox', `${minX} ${minY} ${Math.max(...xs) - minX + pad} ${Math.max(...ys) - minY + pad}`);
  svg.replaceChildren();
  all.forEach(([q, r], i) => {
    const s = stageOf(q, r);
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', corners(...pts[i]));
    poly.setAttribute('class', s <= stage ? `cell open s${s}` : 'cell closed');
    svg.append(poly);
  });
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.stage) === stage)));
}

buttons.forEach((b) => b.addEventListener('click', () => draw(Number(b.dataset.stage))));
document.getElementById('version').textContent = APP_VERSION;
draw(0);
