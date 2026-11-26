// 箱庭と連鎖問題とスコアアタックの画面（工程2 の試作を、工程4 で24匹に、工程5 で連鎖問題に、工程6 でスコアアタックに広げた）。ルールは src/core/rules.js、描くのは view.js。
import { createBoard, growIsland, place, whyNotPlace, recordFound, unlocked, isOpen } from '../core/rules.js';
import { CREATURES, PLACEABLES, GROUNDS, OBJECTS } from '../core/creatures.js';
import { parseKey } from '../core/hex.js';
import { hintLevel, usesOf, usesShown, newRumors, glowCell, STUCK_MOVES } from '../core/hints.js';
import { ACHIEVEMENTS, newAchievements } from '../core/achievements.js';
import { puzzleBoard, puzzleCreatures, puzzleOpen, cleared } from '../core/puzzle.js';
import { PUZZLES } from '../data/puzzles.js';
import { MAPS } from '../data/maps.js';
import { mapBoard, moveScore, stockLeft, starsOf, mapOpen, bestScore, SCORE_TEXT } from '../core/score.js';
import { APP_VERSION } from '../version.js';
import { drawBoard, CREATURE_LOOK } from './view.js';

const SAVE_KEY = 'mythic-mosaic:save';
const SAVE_FORMAT = 1;
const STEP_MS = 450;
const HISTORY_MAX = 50;
const TOAST_MS = 2000;

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
// 連鎖問題を遊んでいる間だけ：{ p, board, step, chains, history, done }。問題の途中は保存しない
let pz = null;
// スコアアタックを遊んでいる間だけ：{ m, board, moves: [{ key, item, a, b, chain }], history, selected }。途中は保存しない
let sa = null;
const viewBoard = () => (pz ? pz.board : sa ? sa.board : state.board);
// 試し遊び用：URL に ?test=open を付けると、問題を全部開く（工程9 で外すか決める）
const TEST_OPEN = new URLSearchParams(location.search).get('test') === 'open';

function fresh() {
  return { format: SAVE_FORMAT, found: [], board: createBoard(0), selected: 'water', achieved: [], dry: 0, cleared: [], best: {} };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s?.format !== SAVE_FORMAT || !s.board?.cells) return null;
    // 0.5.0 までの保存には実績と「新しい生き物が出ていない手数」が、0.6.1 までには解いた問題が、0.8.1 までにはスコアの記録が無い
    return { achieved: [], dry: 0, cleared: [], best: {}, ...s };
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

// 置く物の並び。スコアアタックでは地図の置ける物だけを、残りの数と一緒に出す
function renderPalette() {
  const left = sa ? stockLeft(sa.m, sa.moves) : null;
  const items = sa ? PLACEABLES.filter((p) => p.id in sa.m.stock) : PLACEABLES;
  const selected = sa ? sa.selected : state.selected;
  palette.replaceChildren(...items.map((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `item i-${item.id}`;
    const open = sa ? left[item.id] > 0 : isOpen(item, state.found);
    b.disabled = !open;
    b.setAttribute('aria-pressed', String(selected === item.id));
    b.innerHTML = `<span class="swatch"></span><span class="label">${item.name}</span>`
      + (sa ? `<span class="lock">残り${left[item.id]}</span>` : open ? '' : `<span class="lock">${lockText(item)}</span>`);
    b.addEventListener('click', () => {
      if (sa) sa.selected = item.id; else { state.selected = item.id; save(); }
      renderPalette();
    });
    return b;
  }));
}

function lockText(item) {
  return item.unlockBy ? '？？？で開く' : `${item.unlockAt}匹で開く`;
}

function renderCount() {
  $('found-count').textContent = state.found.length;
  $('found-total').textContent = CREATURES.length;
  $('undo').disabled = (pz ? pz.history.length === 0 : sa ? sa.history.length === 0 : history.length === 0) || busy;
}

// 3段目：新しい生き物が STUCK_MOVES 手出ないとき、使う物が分かっている生き物が1手で出る所を光らせる
let glowMemo = { board: null, found: -1, cell: null };
function glow() {
  if (state.dry < STUCK_MOVES) return null;
  if (glowMemo.board !== state.board || glowMemo.found !== state.found.length) {
    glowMemo = { board: state.board, found: state.found.length, cell: glowCell(state.board, state.found) };
  }
  return glowMemo.cell?.key ?? null;
}

function render(marks = {}) {
  drawBoard(svg, viewBoard(), busy || sa ? marks : pz ? { ...marks, hint: answerHint() } : { ...marks, hint: glow() });
  renderCount();
  renderMode();
}

// 箱庭と問題で、下の並びと道具の言葉を入れかえる
function renderMode() {
  document.body.classList.toggle('puzzle-mode', Boolean(pz || sa));
  palette.hidden = Boolean(pz);
  $('puzzle-bar').hidden = !pz;
  $('score-bar').hidden = !sa;
  $('puzzle-cast').hidden = !pz;
  $('clear').textContent = pz || sa ? 'やり直す' : '更地にする';
  $('open-puzzles').textContent = pz || sa ? '箱庭へ' : '問題';
  if (sa) renderScoreBar();
  if (!pz) return;
  const p = pz.p;
  $('puzzle-title').textContent = `${p.title}　${p.items.length}手で${p.target}連鎖`;
  // ねらい：入門は初めから出す。ほかはヒント1として伏せ、ヒント2で1手目の所を光らせる（判定表 第8回 R5）。
  // ヒント3は答え：答えどおりに置いている間、次に置く所を光らせる（判定表 第9回：むずかしくて答えを見たかった）
  const shown = p.intro ? 1 : pz.hints;
  const first = p.example?.[0];
  const notes = [];
  if (shown >= 1 && p.note) notes.push(`${p.intro ? '' : 'ヒント1　'}ねらい：${p.note}`);
  if (shown === 2 && first) notes.push(pz.step === 0 ? 'ヒント2　1手目は光る所に置く' : 'ヒント2　1手目は光る所（やり直すと光る）');
  if (shown >= 3 && first) {
    notes.push(pz.done ? '答え：これで届いた' : onAnswer()
      ? `答え：光る所に順に置く（${pz.step + 1}手目／${p.example.length}手）`
      : '答え：答えとちがう所に置いた。1手戻すか、やり直すと光る');
  }
  $('puzzle-note').replaceChildren(...notes.map((t) => Object.assign(document.createElement('span'), { textContent: t })));
  const nextHint = p.intro ? 0 : pz.hints + 1;
  $('puzzle-hint').hidden = !((nextHint === 1 && p.note) || ((nextHint === 2 || nextHint === 3) && first));
  $('puzzle-hint').textContent = ['', 'ヒント1を見る（ねらい）', 'ヒント2を見る（1手目の所）', '答えを見る'][nextHint] ?? '';
  // 出てくる生き物の形と効果（判定表 第7回：組み合わせを覚えていなくても考えられるように）
  if ($('puzzle-cast').dataset.for !== p.id) {
    $('puzzle-cast').dataset.for = p.id;
    const ids = puzzleCreatures(p).sort((a, b) => byId[a].no - byId[b].no);
    $('puzzle-cast').querySelector('summary').textContent = `出てくる生き物（${ids.length}）`;
    $('puzzle-cast-list').replaceChildren(...ids.map((id) => {
      const c = byId[id];
      const li = document.createElement('li');
      li.className = 'found';
      li.innerHTML = `<span class="token" style="background:${CREATURE_LOOK[id].color}">${CREATURE_LOOK[id].mark}</span>
        <div><b>${c.name}</b><p>形：${shapeText(c)}</p><p>効果：${c.text}</p></div>`;
      return li;
    }));
  }
  $('puzzle-queue').replaceChildren(...p.items.map((id, i) => {
    const item = PLACEABLES.find((x) => x.id === id);
    const li = document.createElement('li');
    li.className = `item i-${id}${i < pz.step ? ' used' : ''}${i === pz.step && !pz.done ? ' now' : ''}`;
    li.innerHTML = `<span class="swatch"></span><span class="label">${i + 1}. ${item.name}</span>`
      + (i < pz.step ? `<span class="lock">${pz.chains[i]}連鎖</span>` : '');
    return li;
  }));
}

function renderBook() {
  const waiting = CREATURES.filter((c) => hintLevel(c, state.found) === 'rumor').length;
  $('book-note').textContent = waiting ? `噂を聞いた、まだの生き物：${waiting}匹` : '';
  $('book-list').replaceChildren(...CREATURES.map((c) => {
    const li = document.createElement('li');
    const level = hintLevel(c, state.found);
    li.className = level === 'found' ? 'found' : 'unknown';
    const look = CREATURE_LOOK[c.id];
    const uses = usesShown(c, state.found) ? `<p class="uses">使う物：${usesOf(c).join('・')}</p>` : '';
    if (level === 'found') {
      li.innerHTML = `<span class="token" style="background:${look.color}">${look.mark}</span>
         <div><b>${c.name}</b><small>${c.title}</small>
         <p>形：${shapeText(c)}</p><p>効果：${c.text}</p></div>`;
    } else {
      const teller = level === 'rumor' ? byId[c.rumor.by.find((id) => state.found.includes(id))].name : '';
      li.innerHTML = `<span class="token shadow${level === 'rumor' ? ' heard' : ''}">？</span>
         <div><b>？？？</b>${level === 'rumor' ? '<span class="rumor-mark">噂</span>' : ''}<p>「${c.hint}」</p>`
        + (level === 'rumor' ? `<p class="rumor">${teller}の噂：「${c.rumor.text}」</p>` : '')
        + `${uses}</div>`;
    }
    return li;
  }));
  renderAchievements();
}

function renderAchievements() {
  const got = new Set(state.achieved);
  $('ach-count').textContent = `${got.size} / ${ACHIEVEMENTS.length}`;
  $('ach-list').replaceChildren(...ACHIEVEMENTS.map((a) => {
    const li = document.createElement('li');
    const done = got.has(a.id);
    li.className = done ? 'got' : 'not-yet';
    const secret = a.hidden && !done;
    li.innerHTML = `<span class="ach-mark">${done ? '★' : '☆'}</span><div>
      <b>${secret ? '？？？' : a.name}</b><small>${a.kind}</small>
      <p>${secret ? a.teaser : a.text}</p>
      <p class="reward">${secret ? '' : `ごほうび：${a.reward}`}${a.later ? `（${a.later}で遊べるようになる）` : ''}</p></div>`;
    return li;
  }));
}

// 実績を取ったら端に小さく知らせる（いくつもなら順に）
const toastQueue = [];
let toasting = false;
async function toast(text) {
  toastQueue.push(text);
  if (toasting) return;
  toasting = true;
  const el = $('toast');
  while (toastQueue.length) {
    el.textContent = toastQueue.shift();
    el.classList.add('show');
    await wait(TOAST_MS);
    el.classList.remove('show');
    await wait(250);
  }
  toasting = false;
}

function checkAchievements(ctx) {
  const got = newAchievements(state.achieved, { board: state.board, found: state.found, cleared: state.cleared, best: state.best, ...ctx });
  if (!got.length) return;
  state.achieved = [...state.achieved, ...got];
  for (const id of got) toast(`実績：${ACHIEVEMENTS.find((a) => a.id === id).name}`);
}

// 形を文にする（図鑑で見つけたあとに出す）
function matchText(x) {
  if (x.creature) return x.creature === 'any' ? '生き物' : byId[x.creature].name;
  const parts = [];
  if (x.height !== undefined) parts.push(`高さ${x.height}`);
  if (x.minHeight !== undefined) parts.push(`高さ${x.minHeight}以上`);
  if (x.maxHeight !== undefined) parts.push(`高さ${x.maxHeight}まで`);
  if (x.ground) parts.push(GROUNDS[x.ground].name);
  if (x.object) parts.push(OBJECTS[x.object].name);
  let t = parts.join('の') || 'マス';
  if (x.object === null) t += '（上に何もない）';
  return t;
}

function countText({ min, max }, u) {
  if (min !== undefined && min === max) return `ちょうど${min}${u}`;
  if (min !== undefined && max !== undefined) return `${min}〜${max}${u}`;
  if (min !== undefined) return `${min}${u}以上`;
  return `${max}${u}まで`;
}

function shapeText(c) {
  const arounds = c.around ? (Array.isArray(c.around) ? c.around : [c.around]) : [];
  const parts = arounds.map((a) => {
    const what = matchText(a.match);
    if (a.max === 0) return `隣に${what}がいない`;
    return `隣に${what}が${countText(a, a.match.creature ? '匹' : 'つ')}`;
  });
  if (c.line) parts.push(`中心を真ん中にした一直線${c.line.length}マスで、ほかが${matchText(c.line.match)}`);
  return `中心が${matchText(c.center)}。${parts.join('、')}`;
}

// 段ごとに見せる（箱庭と問題で同じ）。set は盤を書きかえる所。段の文を返す
async function animate(result, k, set) {
  render({ placed: k });
  set(result.placedBoard);
  render({ placed: k });
  const lines = [];
  for (const [i, st] of result.steps.entries()) {
    await wait(STEP_MS);
    set(st.spawnedBoard);
    render({ pop: new Set(st.spawned.map((s) => s.key)) });
    const names = countNames(st.spawned);
    const newIds = [...new Set(st.spawned.map((s) => s.id))].filter((id) => !state.found.includes(id));
    const gone = Object.keys(st.board.cells).filter((c) => st.spawnedBoard.cells[c].creature && !st.board.cells[c].creature);
    lines.push(`${i + 1}段目：${names} が現れた${newIds.length ? '（はじめて！）' : ''}`
      + (gone.length ? `（${goneNames(st.spawnedBoard, gone)}が帰っていった）` : ''));
    say(lines);
    if (result.steps.length >= 2) chainEl.textContent = `${i + 1}連鎖`;
    await wait(STEP_MS);
    set(st.board);
    render({ flash: new Set(st.changed) });
  }
  return lines;
}

// ---- 問題 ----
// ここまで答え（正解の例）どおりに置いているか
const onAnswer = () => pz.moves.every((k, i) => k === pz.p.example[i]);

// ヒント2：まだ1手も置いていないとき、正解の例の1手目を光らせる。
// ヒント3（答え）：答えどおりに置いている間、次の手の所を光らせる
function answerHint() {
  if (!pz || pz.p.intro || pz.hints < 2 || pz.done) return null;
  if (pz.hints === 2) return pz.step === 0 ? pz.p.example?.[0] ?? null : null;
  return onAnswer() ? pz.p.example?.[pz.step] ?? null : null;
}

function startPuzzle(p) {
  // やり直しても、見たヒントはそのまま
  const hints = pz && pz.p.id === p.id ? pz.hints : 0;
  pz = { p, board: puzzleBoard(p), step: 0, chains: [], moves: [], history: [], done: false, hints };
  chainEl.textContent = '';
  say([`下の置く物を順に置いて、${p.items.length}手のうちに${p.target}連鎖を出そう（どの手で出してもよい）`]);
  render();
}

function leavePuzzle() {
  pz = null;
  chainEl.textContent = '';
  say(['箱庭に戻った']);
  render();
  renderPalette();
}

async function onPuzzleCell(k) {
  if (pz.done) { say(['クリアした！「問題」から次の問題を選べる']); return; }
  const item = pz.p.items[pz.step];
  if (!item) { say(['置く物はもう無い。やり直すか、1手戻して別の所に置いてみよう']); return; }
  const [q, r] = parseKey(k);
  const why = whyNotPlace(pz.board, q, r, item);
  if (why) { say([`ここには置けない（${why}）`]); return; }
  busy = true;
  pz.history.push({ board: pz.board, chains: [...pz.chains] });
  pz.moves.push(k);
  const result = place(pz.board, q, r, item);
  chainEl.textContent = '';
  const lines = await animate(result, k, (b) => { pz.board = b; });
  pz.chains.push(result.steps.length);
  pz.step += 1;
  if (result.steps.length === 0) lines.push('何も起きなかった');
  if (result.steps.length >= 2) lines.push(`${result.steps.length}連鎖！`);
  if (cleared(pz.chains, pz.p.target)) {
    pz.done = true;
    lines.push(`クリア！（目標 ${pz.p.target}連鎖）`);
    if (!state.cleared.includes(pz.p.id)) state.cleared = [...state.cleared, pz.p.id];
    checkAchievements({ puzzleOnly: true });
    save();
  } else if (pz.step === pz.p.items.length) {
    lines.push(`目標の${pz.p.target}連鎖に届かなかった。やり直すか、1手戻して別の所へ`);
  }
  say(lines);
  busy = false;
  render();
}

// 一覧は狙いごとにまとめてたたむ（判定表 第9回 T5）。入門は1つの組。開いておくのは、まだ解いていない開いた問題のある最初の組
function renderPuzzleList() {
  const groups = [];
  for (const p of PUZZLES) {
    const id = p.intro ? 'intro' : p.aim;
    let g = groups.find((x) => x.id === id);
    if (!g) groups.push(g = { id, name: p.intro ? '入門' : p.title.replace(/ \d+$/, ''), list: [] });
    g.list.push(p);
  }
  const isOpen = (p) => TEST_OPEN || puzzleOpen(p, state.found);
  const next = groups.find((g) => g.list.some((p) => isOpen(p) && !state.cleared.includes(p.id)));
  $('puzzle-list').replaceChildren(...groups.map((g) => {
    const d = document.createElement('details');
    d.className = 'puzzle-group';
    d.open = g === next;
    const done = g.list.filter((p) => state.cleared.includes(p.id)).length;
    const opened = g.list.filter(isOpen).length;
    const s = document.createElement('summary');
    s.textContent = `${opened ? g.name : '？？？'}　★${done}/${g.list.length}`;
    const ol = document.createElement('ol');
    ol.className = 'ach puzzle-list';
    ol.replaceChildren(...g.list.map(puzzleItem));
    d.append(s, ol);
    return d;
  }), scoreGroup());
}

function puzzleItem(p) {
  const li = document.createElement('li');
  const open = TEST_OPEN || puzzleOpen(p, state.found);
  const done = state.cleared.includes(p.id);
  const names = p.items.map((id) => PLACEABLES.find((x) => x.id === id).name).join('→');
  li.className = done ? 'done' : open ? 'open' : 'locked';
  if (open) {
    li.innerHTML = `<span class="ach-mark">${done ? '★' : '☆'}</span><div><b>${p.title}</b>
      <p>${p.items.length}手で${p.target}連鎖　置く物：${names}</p>${p.intro && p.note ? `<p class="reward">ねらい：${p.note}</p>` : ''}</div>`;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = '遊ぶ';
    b.addEventListener('click', () => { $('puzzles').close(); startPuzzle(p); });
    li.append(b);
  } else {
    const left = puzzleCreatures(p).filter((id) => !state.found.includes(id)).length;
    li.innerHTML = `<span class="ach-mark">？</span><div><b>？？？</b><p>図鑑であと${left}匹見つけると開く</p></div>`;
  }
  return li;
}

// ---- スコアアタック（工程6）----
// 点は節目で追加点（1匹1点、3・5・8段で +3・+5・+8。判定表 第10回）。星は地図ごとの ★1・★2・★3 の点
const totalOf = () => sa.moves.reduce((s, m) => s + m.score, 0);
const movesOf = (m) => Object.values(m.stock).reduce((a, b) => a + b, 0);
const starText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

function renderScoreBar() {
  const m = sa.m;
  const left = movesOf(m) - sa.moves.length;
  $('score-title').textContent = `${m.title}　残り${left}手`;
  const last = sa.moves.at(-1);
  const total = totalOf();
  const stars = starsOf(m, total);
  const next = m.stars[stars];
  const best = bestScore(state.best[m.id]);
  const p = document.createElement('p');
  p.className = 'score-line';
  p.innerHTML = `<span class="score-num">${total}点</span><span class="score-stars">${starText(stars)}</span>`
    + `<small>${next !== undefined ? `次の★まで${next - total}` : '★3'}${last ? `　前の手 +${last.score}` : ''}${best ? `　記録 ${best}点` : ''}</small>`;
  const rule = document.createElement('p');
  rule.className = 'score-rule';
  rule.textContent = SCORE_TEXT;
  $('score-totals').replaceChildren(p, rule);
}

function startScore(m) {
  sa = { m, board: mapBoard(m), moves: [], history: [], selected: Object.keys(m.stock)[0] };
  chainEl.textContent = '';
  say([`置ける物を全部（${movesOf(m)}手）好きな順に置いて、点を集めよう。★1は${m.stars[0]}点`]);
  render();
  renderPalette();
}

function leaveScore() {
  sa = null;
  chainEl.textContent = '';
  say(['箱庭に戻った']);
  render();
  renderPalette();
}

async function onScoreCell(k) {
  if (sa.moves.length >= movesOf(sa.m)) { say(['置く物はもう無い。やり直すか、1手戻そう']); return; }
  const left = stockLeft(sa.m, sa.moves);
  if (!(left[sa.selected] > 0)) sa.selected = Object.keys(left).find((id) => left[id] > 0);
  const [q, r] = parseKey(k);
  const why = whyNotPlace(sa.board, q, r, sa.selected);
  if (why) { say([`ここには置けない（${why}）`]); return; }
  busy = true;
  const before = sa.board;
  const result = place(sa.board, q, r, sa.selected);
  chainEl.textContent = '';
  const lines = await animate(result, k, (b) => { sa.board = b; });
  sa.history.push(before);
  sa.moves.push({ key: k, item: sa.selected, score: moveScore(result.steps), chain: result.steps.length });
  // スコアアタックで初めて出た生き物も図鑑に入る（第10回 U5）
  state.found = recordFound(state, result.steps).found;
  const u = unlocked(state.found);
  if (u.stage > state.board.stage) state.board = growIsland(state.board, u.stage);
  if (result.steps.length === 0) lines.push('何も起きなかった');
  if (result.steps.length >= 2) lines.push(`${result.steps.length}連鎖！`);
  lines.push(`この手 +${sa.moves.at(-1).score}点`);
  if (sa.moves.length === movesOf(sa.m)) {
    const total = totalOf();
    const before = bestScore(state.best[sa.m.id]);
    state.best = { ...state.best, [sa.m.id]: Math.max(before, total) };
    lines.push(`終わり！　${total}点 ${starText(starsOf(sa.m, total))}${total > before ? '（記録を更新）' : ''}`);
  }
  checkAchievements({ steps: result.steps });
  const nl = stockLeft(sa.m, sa.moves);
  if (!(nl[sa.selected] > 0)) sa.selected = Object.keys(nl).find((id) => nl[id] > 0) ?? sa.selected;
  say(lines);
  busy = false;
  save();
  render();
  renderPalette();
}

// 問題の一覧の最後に、スコアアタックの組
function scoreGroup() {
  const d = document.createElement('details');
  d.className = 'puzzle-group';
  const isOpenMap = (m) => TEST_OPEN || mapOpen(m, state.found);
  const s = document.createElement('summary');
  const starsAll = MAPS.reduce((n, m) => n + starsOf(m, bestScore(state.best[m.id])), 0);
  s.textContent = `スコアアタック　★${starsAll}/${MAPS.length * 3}`;
  const note = document.createElement('p');
  note.className = 'book-note';
  note.textContent = `置ける物を自由な順に全部置いて、点を集める。${SCORE_TEXT}。`;
  const ol = document.createElement('ol');
  ol.className = 'ach puzzle-list';
  ol.replaceChildren(...MAPS.map((m) => {
    const li = document.createElement('li');
    if (!isOpenMap(m)) {
      li.className = 'locked';
      li.innerHTML = `<span class="ach-mark">？</span><div><b>？？？</b><p>図鑑で${m.unlockAt}匹見つけると開く</p></div>`;
      return li;
    }
    const best = bestScore(state.best[m.id]);
    const stars = starsOf(m, best);
    const cells = Object.keys(mapBoard(m).cells).length;
    const names = Object.entries(m.stock).map(([id, n]) => `${PLACEABLES.find((x) => x.id === id).name}${n}`).join('・');
    li.className = stars ? 'done' : 'open';
    li.innerHTML = `<span class="ach-mark">${stars ? '★' : '☆'}</span><div><b>${m.title}</b>
      <p>${cells}マス・${movesOf(m)}手　置く物：${names}</p>
      <p class="reward">${state.best[m.id] !== undefined ? `記録 ${best}点 ${starText(stars)}` : 'まだ遊んでいない'}　★の点：${m.stars.join('・')}</p></div>`;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = '遊ぶ';
    b.addEventListener('click', () => { $('puzzles').close(); startScore(m); });
    li.append(b);
    return li;
  }));
  d.append(s, note, ol);
  return d;
}

// ---- 置く ----
async function onCell(k) {
  if (busy) return;
  if (pz) { await onPuzzleCell(k); return; }
  if (sa) { await onScoreCell(k); return; }
  const [q, r] = parseKey(k);
  if (!isOpen(PLACEABLES.find((p) => p.id === state.selected), state.found)) state.selected = 'water';
  const why = whyNotPlace(state.board, q, r, state.selected, state.found);
  if (why) {
    say([`ここには置けない（${why}）`]);
    return;
  }
  busy = true;
  const before = state.board;
  const result = place(state.board, q, r, state.selected, { found: state.found });
  history.push(before);
  if (history.length > HISTORY_MAX) history.shift();
  chainEl.textContent = '';
  if (result.released) {
    state.board = result.board;
    say([`${byId[result.released].name}が帰っていった（図鑑には残る）`]);
    state.dry += 1;
    checkAchievements({ before });
    busy = false;
    save();
    render({ flash: new Set([k]) });
    return;
  }

  // 段ごとに見せる
  const lines = await animate(result, k, (b) => { state.board = b; });

  // 図鑑と解放
  const beforeFound = state.found;
  state.found = recordFound(state, result.steps).found;
  const opened = unlockMessages(beforeFound, state.found);
  const rumors = newRumors(beforeFound, state.found).map((c) => {
    const teller = byId[c.rumor.by.find((id) => state.found.includes(id) && !beforeFound.includes(id))];
    return `${teller.name}の噂：「${c.rumor.text}」`;
  });
  state.dry = state.found.length > beforeFound.length ? 0 : state.dry + 1;
  const u = unlocked(state.found);
  if (u.stage > state.board.stage) state.board = growIsland(state.board, u.stage);
  checkAchievements({ steps: result.steps, before });
  if (result.steps.length === 0) lines.push('何も起きなかった');
  if (result.steps.length >= 2) lines.push(`${result.steps.length}連鎖！`);
  say([...lines, ...rumors, ...opened]);
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

function goneNames(board, keys) {
  const n = {};
  for (const k of keys) { const id = board.cells[k].creature; n[id] = (n[id] ?? 0) + 1; }
  return Object.entries(n).map(([id, c]) => (c > 1 ? `${byId[id].name}×${c}` : byId[id].name)).join('・');
}

function unlockMessages(from, to) {
  const out = [];
  for (const item of PLACEABLES) {
    if (!isOpen(item, from) && isOpen(item, to)) out.push(`「${item.name}」が置けるようになった`);
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
  if (busy) return;
  if (pz) {
    if (pz.history.length === 0) return;
    const h = pz.history.pop();
    pz.board = h.board;
    pz.chains = h.chains;
    pz.step = h.chains.length;
    pz.moves = pz.moves.slice(0, pz.step);
    pz.done = cleared(pz.chains, pz.p.target);
    chainEl.textContent = '';
    say(['1手戻した']);
    render();
    return;
  }
  if (sa) {
    if (sa.history.length === 0) return;
    sa.board = sa.history.pop();
    sa.moves = sa.moves.slice(0, -1);
    chainEl.textContent = '';
    say(['1手戻した']);
    render();
    renderPalette();
    return;
  }
  if (history.length === 0) return;
  state.board = history.pop();
  const stage = unlocked(state.found).stage;
  if (stage > state.board.stage) state.board = growIsland(state.board, stage);
  chainEl.textContent = '';
  say(['1手戻した（図鑑はそのまま）']);
  save();
  render();
});

$('clear').addEventListener('click', () => {
  if (busy) return;
  if (pz) { startPuzzle(pz.p); return; }
  if (sa) { startScore(sa.m); return; }
  if (!confirm('島を全部荒れ地に戻す？（図鑑はそのまま。1手戻すで元に戻せる）')) return;
  history.push(state.board);
  state.board = createBoard(unlocked(state.found).stage);
  chainEl.textContent = '';
  say(['更地にした']);
  save();
  render();
});

$('puzzle-hint').addEventListener('click', () => {
  if (!pz || busy) return;
  pz.hints = Math.min(3, pz.hints + 1);
  render();
});

$('open-puzzles').addEventListener('click', () => {
  if (busy) return;
  if (pz) { leavePuzzle(); return; }
  if (sa) { leaveScore(); return; }
  renderPuzzleList();
  $('puzzles').showModal();
});
$('open-book').addEventListener('click', () => { renderBook(); showTab('creatures'); $('book').showModal(); });
function showTab(name) {
  for (const b of document.querySelectorAll('.tab')) b.setAttribute('aria-selected', String(b.dataset.tab === name));
  $('book-list').hidden = name !== 'creatures';
  $('book-note').hidden = name !== 'creatures';
  $('ach-panel').hidden = name !== 'achievements';
}
for (const b of document.querySelectorAll('.tab')) b.addEventListener('click', () => showTab(b.dataset.tab));
$('open-help').addEventListener('click', () => $('help').showModal());
$('reset').addEventListener('click', () => {
  if (!confirm('図鑑も島も全部消して最初から？（元に戻せない）')) return;
  state = fresh();
  history = [];
  toastQueue.length = 0;
  save();
  $('help').close();
  say(['最初からになった']);
  render();
  renderPalette();
});

$('version').textContent = APP_VERSION;
checkAchievements({}); // 前の記録からも、図鑑と島の実績はさかのぼって取れる（K3）
save();
render();
renderPalette();
say(state.found.length === 0 ? ['置く物を選んで、島のマスを押してみよう'] : []);
