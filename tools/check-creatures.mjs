// 工程4 の確かめる道具（ゲームには出ない）。
//   node tools/check-creatures.mjs [overlap|discover|curious|glow|all] [種=1]
// overlap  … ばらばらな盤で、同じマスに2種類の形が同時にできる組（D8 でどちらも出なくなる）を数える
// discover … でたらめに遊ぶ人（解放あり・帰すあり）が、何手目で各生き物を見つけるか
// curious  … 1手先を全部試して、まだの生き物が出る手を選ぶ人
// glow     … でたらめに遊ぶが、詰まって光る所（判定表 第6回 V5）が出たらそこを試す人
import { createBoard, growIsland, place, whyNotPlace, shapeAt, recordFound, unlocked } from '../src/core/rules.js';
import { makeRng } from '../src/core/rng.js';
import { parseKey } from '../src/core/hex.js';
import { CREATURES, PLACEABLES } from '../src/core/creatures.js';
import { glowCell, STUCK_MOVES } from '../src/core/hints.js';

const mode = process.argv[2] ?? 'all';
const seed = Number(process.argv[3] ?? 1);
const byId = Object.fromEntries(CREATURES.map((c) => [c.id, c]));
const label = (id) => `${'①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔'[byId[id].no - 1]}${byId[id].name}`;

function messyBoard(rng) {
  const b = createBoard(2);
  for (const c of Object.values(b.cells)) {
    const g = rng.next();
    c.ground = g < 0.2 ? 'barren' : g < 0.45 ? 'grass' : g < 0.65 ? 'water' : g < 0.85 ? 'sand' : 'marsh';
    const h = rng.next();
    c.height = h < 0.6 ? 0 : h < 0.8 ? 1 : 2;
    const o = rng.next();
    c.object = o < 0.6 ? null : o < 0.75 ? 'tree' : o < 0.87 ? 'flower' : o < 0.95 ? 'rock' : 'nest';
    c.creature = rng.next() < 0.25 ? rng.pick(CREATURES).id : null;
  }
  return b;
}

function overlap() {
  console.log('## 同じマスに2種類の形ができる組（D8 でどちらも出ない）');
  console.log();
  const rng = makeRng(seed);
  const pairs = {};
  const alone = {};
  let cells = 0;
  for (let i = 0; i < 3000; i++) {
    const b = messyBoard(rng);
    for (const c of Object.values(b.cells)) {
      if (c.creature) continue;
      cells++;
      const hit = CREATURES.filter((sp) => shapeAt(b, c, sp)).map((sp) => sp.id);
      for (const id of hit) alone[id] = (alone[id] ?? 0) + 1;
      for (let x = 0; x < hit.length; x++) for (let y = x + 1; y < hit.length; y++) {
        const k = `${hit[x]}|${hit[y]}`;
        pairs[k] = (pairs[k] ?? 0) + 1;
      }
    }
  }
  console.log(`ばらばらな61マスの盤 3,000枚（空いたマス ${cells.toLocaleString()}）。「重なり」＝その生き物の形ができたマスのうち、別の生き物の形も同時にできていた割合。`);
  console.log();
  console.log('| 組 | 同時にできた数 | 重なり（前の生き物から見て） | 重なり（後の生き物から見て） |');
  console.log('| --- | --- | --- | --- |');
  const rows = Object.entries(pairs).sort((a, b) => b[1] - a[1]);
  for (const [k, n] of rows) {
    const [a, b] = k.split('|');
    console.log(`| ${label(a)} と ${label(b)} | ${n} | ${((100 * n) / alone[a]).toFixed(1)}% | ${((100 * n) / alone[b]).toFixed(1)}% |`);
  }
  if (rows.length === 0) console.log('| （なし） | 0 | | |');
  console.log();
  console.log('形ができた数（空いたマスあたり）：');
  console.log();
  console.log(CREATURES.map((sp) => `${label(sp.id)} ${alone[sp.id] ?? 0}`).join('、'));
  console.log();
}

function discover(policy) {
  const curious = policy === 'curious';
  const glows = policy === 'glow';
  console.log(curious ? '## 気づく人が、何手目で見つけるか' : glows ? '## でたらめに遊び、光る所を使う人が、何手目で見つけるか' : '## でたらめに遊ぶ人が、何手目で見つけるか');
  console.log();
  const RUNS = curious ? 6 : 12;
  const MOVES = curious ? 1500 : 3000;
  console.log(`空の19マスから始め、解放（丘・岩・巣・島）も帰すも使う人を ${RUNS} 回、${MOVES} 手ずつ。` + (glows
    ? `でたらめに置くが、新しい生き物が ${STUCK_MOVES} 手出ないと光る所（使う物が分かっている生き物＝噂を聞いた生き物と①②⑤が1手で出る所）に、置く物を順に試して出る物を置く。`
    : curious
    ? '毎手、置ける手を全部1手だけ試し、まだ見つけていない生き物が出る手があればそれを選ぶ。なければでたらめ（島の6割以上が生き物なら、3回に1回は帰す）。先を読んで組む人ならもっと早い。'
    : '毎手、置ける物と置ける所をでたらめに選ぶ（島の6割以上が生き物なら、3回に1回は帰す）。狙って組む人ならもっと早い。'));
  console.log();
  const firsts = Object.fromEntries(CREATURES.map((c) => [c.id, []]));
  for (let run = 0; run < RUNS; run++) {
    const rng = makeRng(seed * 101 + run);
    let board = createBoard(0);
    let progress = { found: [] };
    let dry = 0;
    for (let t = 1; t <= MOVES; t++) {
      const open = unlocked(progress.found);
      if (open.stage > board.stage) board = growIsland(board, open.stage);
      const cells = Object.values(board.cells);
      const busy = cells.filter((c) => c.creature).length / cells.length;
      const items = busy > 0.6 && rng.next() < 0.34 ? ['release'] : open.placeables.filter((id) => id !== 'release');
      const moves = [];
      for (const c of cells) for (const it of items) if (!whyNotPlace(board, c.q, c.r, it, progress.found)) moves.push([c.q, c.r, it]);
      if (moves.length === 0) continue;
      let res = null;
      if (curious) {
        const seen = new Set(progress.found);
        const good = [];
        for (const c of cells) {
          for (const it of open.placeables) {
            if (it === 'release' || whyNotPlace(board, c.q, c.r, it, progress.found)) continue;
            const r = place(board, c.q, c.r, it, { found: progress.found });
            if (r.steps.some((st) => st.spawned.some((x) => !seen.has(x.id)))) good.push(r);
          }
        }
        if (good.length) res = rng.pick(good);
      }
      if (glows && dry >= STUCK_MOVES) {
        const g = glowCell(board, progress.found);
        if (g) {
          const [q, r] = g.key.split(',').map(Number);
          for (const it of open.placeables) {
            if (it === 'release' || whyNotPlace(board, q, r, it, progress.found)) continue;
            const tryRes = place(board, q, r, it, { found: progress.found });
            if (tryRes.steps.some((st) => st.spawned.some((x) => x.id === g.id))) { res = tryRes; break; }
          }
        }
      }
      if (!res) {
        const [q, r, it] = rng.pick(moves);
        res = place(board, q, r, it, { found: progress.found });
      }
      board = res.board;
      const before = new Set(progress.found);
      progress = recordFound(progress, res.steps);
      for (const id of progress.found) if (!before.has(id)) firsts[id].push(t);
      dry = progress.found.length > before.size ? 0 : dry + 1;
    }
  }
  console.log('| 生き物 | 見つけた回数 | 何手目（中央値） | 何手目（早い〜遅い） |');
  console.log('| --- | --- | --- | --- |');
  for (const sp of CREATURES) {
    const xs = firsts[sp.id].sort((a, b) => a - b);
    const med = xs.length ? xs[Math.floor((xs.length - 1) / 2)] : '—';
    console.log(`| ${label(sp.id)} | ${xs.length} / ${RUNS} | ${med} | ${xs.length ? `${xs[0]}〜${xs.at(-1)}` : '—'} |`);
  }
  console.log();
}

console.log(`# 工程4 の生き物の確かめ（種 ${seed}）`);
console.log();
if (mode === 'overlap' || mode === 'all') overlap();
if (mode === 'discover' || mode === 'all') discover('random');
if (mode === 'curious' || mode === 'all') discover('curious');
if (mode === 'glow' || mode === 'all') discover('glow');
