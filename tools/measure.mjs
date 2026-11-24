// 工程3 の測る道具（ゲームには出ない）。
//   node tools/measure.mjs [chains|capacity|search|all] [種=1]
// 結果は Markdown で標準出力に出す。docs/measure/ に保存して記録にする。
import { createBoard, place, whyNotPlace, readyShapes } from '../src/core/rules.js';
import { searchBestChain } from '../src/core/search.js';
import { makeRng } from '../src/core/rng.js';
import { parseKey } from '../src/core/hex.js';
import { PLACEABLES } from '../src/core/creatures.js';

const mode = process.argv[2] ?? 'all';
const seed = Number(process.argv[3] ?? 1);
const SIZES = [{ stage: 0, cells: 19 }, { stage: 1, cells: 37 }, { stage: 2, cells: 61 }];
// 工程3 の測りは回収なしで測った。帰す（release）は入れない
const ITEMS = PLACEABLES.filter((p) => p.kind !== 'release').map((p) => p.id);
const pct = (a, b) => `${((100 * a) / b).toFixed(1)}%`;
const out = [];
const line = (s = '') => { out.push(s); console.log(s); };

// ばらばらな盤：遊んだあとのような盤を作る。置く前に何も起きない盤（readyShapes が空）だけ使う
function randomBoard(stage, rng) {
  const b = createBoard(stage);
  for (const c of Object.values(b.cells)) {
    const x = rng.next();
    c.ground = x < 0.3 ? 'barren' : x < 0.6 ? 'grass' : x < 0.8 ? 'water' : 'sand';
    const h = rng.next();
    c.height = h < 0.85 ? 0 : h < 0.95 ? 1 : 2;
    c.object = c.ground === 'grass' && rng.next() < 0.1 ? 'tree' : null;
  }
  return b;
}

function stableBoard(stage, rng, tries = 5000) {
  for (let i = 1; i <= tries; i++) {
    const b = randomBoard(stage, rng);
    if (readyShapes(b).length === 0) return { board: b, tries: i };
  }
  return null;
}

function allowedMoves(b, items = ITEMS) {
  const moves = [];
  for (const k of Object.keys(b.cells)) {
    const [q, r] = parseKey(k);
    for (const it of items) if (!whyNotPlace(b, q, r, it)) moves.push([q, r, it]);
  }
  return moves;
}

// ---- 1. ばらばらな盤に1つ置いたときの連鎖 ----
function chains() {
  line('## 1. ばらばらな盤に1つ置いたときの連鎖');
  line();
  line('遊んだあとのような盤（荒れ地30%・草30%・水20%・砂20%、高さ1が10%・2が5%、草の1割に木）のうち、置く前に何も起きない盤だけを使い、草・水・砂のどれかを1つ、ばらばらな所に置いた。');
  line();
  line('| 盤 | 試した数 | 何か出た | 2連鎖以上 | 3連鎖以上 | 4連鎖以上 | 一番長い | 盤を作る手間（何回で1つ） |');
  line('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const { stage, cells } of SIZES) {
    const rng = makeRng(seed * 100 + stage);
    const N = 4000;
    const hist = [];
    let tries = 0;
    let made = 0;
    for (let i = 0; i < N; i++) {
      const s = stableBoard(stage, rng);
      if (!s) continue;
      made++;
      tries += s.tries;
      const moves = allowedMoves(s.board, ['grass', 'water', 'sand']);
      const [q, r, it] = rng.pick(moves);
      const n = place(s.board, q, r, it).steps.length;
      hist[n] = (hist[n] ?? 0) + 1;
    }
    const atLeast = (k) => hist.slice(k).reduce((a, b) => a + (b ?? 0), 0);
    line(`| ${cells}マス | ${made} | ${pct(atLeast(1), made)} | ${pct(atLeast(2), made)} | ${pct(atLeast(3), made)} | ${pct(atLeast(4), made)} | ${hist.length - 1} | ${(tries / made).toFixed(1)} |`);
  }
  line();
}

// ---- 2. 61マスに同時に何匹住めるか ----
function capacity() {
  line('## 2. 61マスに同時に何匹住めるか');
  line();
  line('空の61マスから、草・水・砂・丘を300手置く。「ばらばら」は置ける所からでたらめに、「欲ばり」は毎手、次の1手で一番多く生き物が出る所に置く（同じならでたらめ）。生き物は回収しない（回収はまだない）。');
  line();
  line('| 置き方 | 回数 | 300手後の匹数（平均） | 一番多いとき | 埋まり方（50・100・200・300手の平均） | 出た種類（平均） |');
  line('| --- | --- | --- | --- | --- | --- |');
  for (const policy of ['ばらばら', '欲ばり']) {
    const runs = policy === 'ばらばら' ? 20 : 6;
    const ends = [];
    const peaks = [];
    const kinds = [];
    const marks = { 50: [], 100: [], 200: [], 300: [] };
    for (let run = 0; run < runs; run++) {
      const rng = makeRng(seed * 1000 + run + (policy === '欲ばり' ? 500 : 0));
      let b = createBoard(2);
      let peak = 0;
      const seen = new Set();
      for (let t = 1; t <= 300; t++) {
        const moves = allowedMoves(b);
        if (moves.length === 0) break;
        let pick;
        if (policy === 'ばらばら') pick = rng.pick(moves);
        else {
          let best = -1;
          let cands = [];
          for (const m of moves) {
            const n = place(b, ...m).steps.reduce((a, s) => a + s.spawned.length, 0);
            if (n > best) { best = n; cands = [m]; } else if (n === best) cands.push(m);
          }
          pick = rng.pick(cands);
        }
        const res = place(b, ...pick);
        b = res.board;
        for (const s of res.steps) for (const x of s.spawned) seen.add(x.id);
        const count = Object.values(b.cells).filter((c) => c.creature).length;
        peak = Math.max(peak, count);
        if (marks[t]) marks[t].push(count);
      }
      ends.push(Object.values(b.cells).filter((c) => c.creature).length);
      peaks.push(peak);
      kinds.push(seen.size);
    }
    const avg = (xs) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
    line(`| ${policy} | ${runs} | ${avg(ends)} | ${Math.max(...peaks)} | ${[50, 100, 200, 300].map((t) => avg(marks[t])).join('・')} | ${avg(kinds)} / 6 |`);
  }
  line();
}

// ---- 3. 答え探しの速さ ----
function search() {
  line('## 3. 答え探しの速さ');
  line();
  line('ばらばらな盤（1 と同じ作り方）に、決まった順の置く物（水 → 草 → 砂 → 丘）を k 手置く全部の置き方を試し、一番長い連鎖を探した。1つの盤あたりの時間。30秒を超えそうな所は、1つの置き方あたりの時間から見積もった（「見積」）。');
  line();
  line('| 盤 | 手数 | 試した置き方 | 時間 | 見つかった一番長い連鎖 |');
  line('| --- | --- | --- | --- | --- |');
  const seq = ['water', 'grass', 'sand', 'hill'];
  for (const { stage, cells } of SIZES) {
    const rng = makeRng(seed * 7 + stage);
    const { board } = stableBoard(stage, rng);
    let perNode = null;
    for (let k = 1; k <= 4; k++) {
      const items = seq.slice(0, k);
      const est = perNode ? perNode * cells ** k : 0;
      if (est > 30000) {
        line(`| ${cells}マス | ${k} | 約${(cells ** k).toLocaleString()} | 見積 ${(est / 1000).toFixed(0)}秒 | — |`);
        continue;
      }
      const t0 = performance.now();
      const r = searchBestChain(board, items);
      const ms = performance.now() - t0;
      perNode = ms / r.nodes;
      line(`| ${cells}マス | ${k} | ${r.nodes.toLocaleString()} | ${ms < 1000 ? `${ms.toFixed(0)}ミリ秒` : `${(ms / 1000).toFixed(1)}秒`} | ${r.best} |`);
    }
  }
  line();
}

line(`# 工程3 の測り（種 ${seed}）`);
line();
if (mode === 'chains' || mode === 'all') chains();
if (mode === 'capacity' || mode === 'all') capacity();
if (mode === 'search' || mode === 'all') search();
