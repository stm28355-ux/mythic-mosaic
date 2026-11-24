// 試作（工程2）の箱庭の画面。ルールは src/core/rules.js、描くのは view.js。
import { createBoard, growIsland, place, whyNotPlace, recordFound, unlocked } from '../core/rules.js';
import { CREATURES, PLACEABLES, GROUNDS } from '../core/creatures.js';
import { parseKey } from '../core/hex.js';
import { APP_VERSION } from '../version.js';
import { drawBoard, CREATURE_LOOK } from './view.js';

const SAVE_KEY = 'mythic-mosaic:save';
const SAVE_FORMAT = 1;
const STEP_MS = 450;
const HISTORY_MAX = 50;

const $ = (id) => document.getElementById(id);
const svg = $('board');
const log = $('log');
const chainEl = $('chain');
const palette = document.querySelector('.palette');

const byId = Object.fromEntries(CREATURES.map((c) => [c.id, c]));
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ---- 状態 ----
let state = load() ?? fresh();
let history = [];
let busy = false;

function fresh() {
  return { format: SAVE_FORMAT, found: [], board: createBoard(0), selected: 'water' };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s?.format !== SAVE_FORMAT || !s.board?.cells) return null;
    return s;
  } catch {
    return null;
  }
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* 保存できなくても遊べる */ }
}

// ---- 表示 ----
function say(lines) {
  log.replaceChildren(...lines.map((t) => {
    const p = document.createElement('p');
    p.textContent = t;
    return p;
  }));
}

function renderPalette() {
  const n = state.found.length;
  palette.replaceChildren(...PLACEABLES.map((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `item i-${item.id}`;
    const open = n >= item.unlockAt;
    b.disabled = !open;
    b.setAttribute('aria-pressed', String(state.selected === item.id));
    b.innerHTML = `<span class="swatch"></span><span class="label">${item.name}</span>`
      + (open ? '' : `<span class="lock">${item.unlockAt}匹で開く</span>`);
    b.addEventListener('click', () => { state.selected = item.id; save(); renderPalette(); });
    return b;
  }));
}

function renderCount() {
  $('found-count').textContent = state.found.length;
  $('found-total').textContent = CREATURES.length;
  $('undo').disabled = history.length === 0 || busy;
}

function render(marks) {
  drawBoard(svg, state.board, marks);
  renderCount();
}

function renderBook() {
  $('book-list').replaceChildren(...CREATURES.map((c) => {
    const li = document.createElement('li');
    const found = state.found.includes(c.id);
    li.className = found ? 'found' : 'unknown';
    const look = CREATURE_LOOK[c.id];
    li.innerHTML = found
      ? `<span class="token" style="background:${look.color}">${look.mark}</span>
         <div><b>${c.name}</b><small>${c.title}</small>
         <p>形：${shapeText(c)}</p><p>効果：${c.text}</p></div>`
      : `<span class="token shadow">？</span>
         <div><b>？？？</b><p>「${c.hint}」</p></div>`;
    return li;
  }));
}

function shapeText(c) {
  const m = (x) => [
    x.height !== undefined ? `高さ${x.height}` : '',
    x.minHeight !== undefined ? `高さ${x.minHeight}以上` : '',
    x.ground ? GROUNDS[x.ground].name : '',
    x.object === 'tree' ? '木' : '',
  ].filter(Boolean).join('の');
  return `中心が${m(c.center)}、隣に${m(c.around.match)}が${c.around.min}つ以上`;
}

// ---- 置く ----
async function onCell(k) {
  if (busy) return;
  const [q, r] = parseKey(k);
  const why = whyNotPlace(state.board, q, r, state.selected, state.found.length);
  if (why) {
    say([`ここには置けない（${why}）`]);
    return;
  }
  busy = true;
  const before = state.board;
  const result = place(state.board, q, r, state.selected, { foundCount: state.found.length });
  history.push(before);
  if (history.length > HISTORY_MAX) history.shift();
  chainEl.textContent = '';

  // 段ごとに見せる
  render({ placed: k });
  state.board = result.placedBoard;
  render({ placed: k });
  const lines = [];
  for (const [i, st] of result.steps.entries()) {
    await wait(STEP_MS);
    state.board = st.spawnedBoard;
    render({ pop: new Set(st.spawned.map((s) => s.key)) });
    const names = countNames(st.spawned);
    const newIds = [...new Set(st.spawned.map((s) => s.id))].filter((id) => !state.found.includes(id));
    lines.push(`${i + 1}段目：${names} が現れた${newIds.length ? '（はじめて！）' : ''}`);
    say(lines);
    if (result.steps.length >= 2) chainEl.textContent = `${i + 1}連鎖`;
    await wait(STEP_MS);
    state.board = st.board;
    render({ flash: new Set(st.changed) });
  }

  // 図鑑と解放
  const beforeCount = state.found.length;
  state.found = recordFound(state, result.steps).found;
  const opened = unlockMessages(beforeCount, state.found.length);
  const u = unlocked(state.found.length);
  if (u.stage > state.board.stage) state.board = growIsland(state.board, u.stage);
  if (result.steps.length === 0) lines.push('何も起きなかった');
  if (result.steps.length >= 2) lines.push(`${result.steps.length}連鎖！`);
  say([...lines, ...opened]);
  busy = false;
  save();
  render();
  renderPalette();
}

function countNames(spawned) {
  const n = {};
  for (const s of spawned) n[s.id] = (n[s.id] ?? 0) + 1;
  return Object.entries(n).map(([id, c]) => (c > 1 ? `${byId[id].name}×${c}` : byId[id].name)).join('・');
}

function unlockMessages(from, to) {
  const out = [];
  for (const item of PLACEABLES) {
    if (from < item.unlockAt && to >= item.unlockAt) out.push(`「${item.name}」が置けるようになった`);
  }
  const a = unlocked(from).stage;
  const b = unlocked(to).stage;
  if (b > a) out.push('島が広がった');
  return out;
}

// ---- 操作 ----
svg.addEventListener('click', (e) => {
  const g = e.target.closest('.cell');
  if (g) onCell(g.dataset.key);
});

$('undo').addEventListener('click', () => {
  if (busy || history.length === 0) return;
  state.board = history.pop();
  const stage = unlocked(state.found.length).stage;
  if (stage > state.board.stage) state.board = growIsland(state.board, stage);
  chainEl.textContent = '';
  say(['1手戻した（図鑑はそのまま）']);
  save();
  render();
});

$('clear').addEventListener('click', () => {
  if (busy) return;
  if (!confirm('島を全部荒れ地に戻す？（図鑑はそのまま。1手戻すで元に戻せる）')) return;
  history.push(state.board);
  state.board = createBoard(unlocked(state.found.length).stage);
  chainEl.textContent = '';
  say(['更地にした']);
  save();
  render();
});

$('open-book').addEventListener('click', () => { renderBook(); $('book').showModal(); });
$('open-help').addEventListener('click', () => $('help').showModal());
$('reset').addEventListener('click', () => {
  if (!confirm('図鑑も島も全部消して最初から？（元に戻せない）')) return;
  state = fresh();
  history = [];
  save();
  $('help').close();
  say(['最初からになった']);
  render();
  renderPalette();
});

$('version').textContent = APP_VERSION;
render();
renderPalette();
say(state.found.length === 0 ? ['置く物を選んで、島のマスを押してみよう'] : []);
