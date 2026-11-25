// 連鎖問題を作る道具（ゲームには出ない）。
//   node tools/make-puzzles.mjs <狙い> [作る数=3] [種=1] [--write]
// 盤をたくさん作り、狙いに合う物だけ残す（企画まとめ「連鎖問題の作り方」）：
//   - 狙いの生き物が、目標に届いた手の連鎖に入る
//   - 素直な置き方（毎手その手で一番長い連鎖）では届かない
//   - 出てくる生き物は、狙いが決めた生き物だけ（問題は「出てくる生き物を図鑑で全部見つけたら」開く）
// --write を付けると src/data/puzzles.js の、その狙いの問題を置き換える。
import { writeFileSync, readFileSync } from 'node:fs';
import { place, whyNotPlace } from '../src/core/rules.js';
import { CREATURES } from '../src/core/creatures.js';
import { makeRng } from '../src/core/rng.js';
import { hexagon, key } from '../src/core/hex.js';
import { solveAll, greedyBest, packBoard, puzzleBoard, PUZZLE_RADIUS } from '../src/core/puzzle.js';

// 狙い。allow＝出てきてよい生き物、items＝置く物の候補、moves＝手数、size＝マスの数
export const AIMS = {
  kazenoko: {
    title: '丘の風',
    note: 'カゼノコの「2マス先まで草」を連鎖の途中に入れる',
    aim: 'kazenoko',
    allow: ['pocha', 'kokedama', 'numanushi', 'kerori', 'sunamoguri', 'kazenoko', 'hitorisuna', 'tsumuji'],
    items: ['grass', 'water', 'sand', 'hill'],
    moves: 3,
    size: 19,
    minChain: 4,
  },
};

const name = process.argv[2] ?? 'kazenoko';
const want = Number(process.argv[3] ?? 3);
const seed = Number(process.argv[4] ?? 1);
const write = process.argv.includes('--write');
const A = AIMS[name];
if (!A) throw new Error(`狙いが無い：${name}`);
const allow = new Set(A.allow);
const label = (id) => CREATURES.find((c) => c.id === id).name;

// 箱庭のように、空の盤からでたらめに置いて「ほぼ埋まった盤」を作る。
// 作るときは出てきてよい生き物だけで動かす（答え合わせは24匹全部のルールで調べ、狙いの外が出る盤は落とす）
const genCatalog = CREATURES.filter((c) => allow.has(c.id));
function makeBoard(rng) {
  const cells = {};
  for (const [q, r] of hexagon(0, 0, PUZZLE_RADIUS[A.size])) cells[key(q, r)] = { q, r, ground: 'barren', height: 0, object: null, creature: null };
  let board = { stage: 0, cells };
  const turns = 20 + rng.int(40);
  for (let t = 0; t < turns; t++) {
    const list = Object.values(board.cells);
    const busy = list.filter((c) => c.creature).length / list.length;
    const it = busy > 0.55 && rng.next() < 0.3 ? 'release' : rng.pick(A.items);
    const ok = list.filter((c) => !whyNotPlace(board, c.q, c.r, it));
    if (ok.length === 0) continue;
    const c = rng.pick(ok);
    board = place(board, c.q, c.r, it, { catalog: genCatalog }).board;
  }
  return board;
}

const rng = makeRng(seed);
const found = [];
const t0 = Date.now();
let tried = 0;
const reasons = {};
const why = (k) => { reasons[k] = (reasons[k] ?? 0) + 1; };
while (found.length < want * 4 && tried < 150000) {
  tried++;
  const board = makeBoard(rng);
  const living = Object.values(board.cells).filter((c) => c.creature);
  if (living.some((c) => !allow.has(c.creature))) { why('盤に狙いの外の生き物'); continue; }
  if (living.length < A.size * 0.25) { why('生き物が少ない'); continue; }
  const items = Array.from({ length: A.moves }, () => rng.pick(A.items));
  const all = solveAll(board, items, { aim: A.aim });
  if (all.best < A.minChain) { why('連鎖が短い'); continue; }
  if ([...all.appear].some((id) => !allow.has(id))) { why('狙いの外の生き物が出る'); continue; }
  if (all.withAim === 0) { why('狙いの生き物が目標の連鎖に入らない'); continue; }
  const greedy = greedyBest(board, items);
  if (greedy >= all.best) { why('素直な置き方で届く'); continue; }
  found.push({ board, items, all, greedy, living: living.length });
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`# 狙い「${A.title}」（${name}）：${A.note}`);
console.log();
console.log(`${A.size}マス・${A.moves}手・置く物 ${A.items.join('/')}。盤を ${tried} 枚作って ${found.length} 問が残った（${secs} 秒）。`);
console.log('落とした理由：' + Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('、'));
console.log();
// 正解の多い（やさしい）順に並べ、やさしい・中くらい・むずかしいが混ざるように、間を空けて選ぶ。置く物の並びはかぶらないように
found.sort((a, b) => b.all.solutions / b.all.leaves - a.all.solutions / a.all.leaves || a.all.best - b.all.best);
const picked = [];
for (let i = 0; i < want; i++) {
  const at = want === 1 ? 0 : Math.round((i * (found.length - 1)) / (want - 1));
  const f = found.slice(at).find((x) => !picked.includes(x) && !picked.some((p) => p.items.join() === x.items.join()));
  if (f) picked.push(f);
}
console.log('| 問 | 置く物 | 目標 | 素直な置き方 | 正解の割合 | 盤の生き物 | 出てくる生き物 |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');
picked.forEach((f, i) => {
  console.log(`| ${i + 1} | ${f.items.join('→')} | ${f.all.best}連鎖 | ${f.greedy}連鎖 | ${f.all.solutions}/${f.all.leaves}（${((100 * f.all.solutions) / f.all.leaves).toFixed(2)}%） | ${f.living}匹 | ${[...f.all.appear].map(label).join('・')} |`);
});
console.log();
picked.forEach((f, i) => console.log(`問${i + 1} の正解の例：${f.all.example.join(' → ')}`));

if (write) {
  const path = new URL('../src/data/puzzles.js', import.meta.url);
  let old = [];
  try { old = (await import(path.href)).PUZZLES.filter((p) => p.aim !== name); } catch { /* 初めて */ }
  const list = [...old, ...picked.map((f, i) => ({
    id: `${name}-${i + 1}`,
    aim: name,
    title: `${A.title} ${i + 1}`,
    size: A.size,
    items: f.items,
    target: f.all.best,
    appear: [...f.all.appear].sort(),
    cells: packBoard(f.board),
    example: f.all.example,
  }))];
  const body = list.map((p) => `  ${JSON.stringify(p)}`).join(',\n');
  writeFileSync(path, `// 連鎖問題（tools/make-puzzles.mjs が作る。手で直さない）\n// cells: [q, r, 地面, 高さ, 上の物, 生き物]。target 連鎖に、items を順に置いて届けば正解。example は正解の1つ（テスト用）\nexport const PUZZLES = Object.freeze([\n${body},\n]);\n`);
  // 書いた問題が読み戻せて、例の置き方で目標に届くかを確かめる
  for (const p of list.filter((x) => x.aim === name)) {
    let b = puzzleBoard(p);
    let best = 0;
    p.items.forEach((it, i) => {
      const [q, r] = p.example[i].split(',').map(Number);
      const res = place(b, q, r, it);
      best = Math.max(best, res.steps.length);
      b = res.board;
    });
    if (best < p.target) throw new Error(`${p.id} の例が目標に届かない`);
  }
  console.log();
  console.log(`src/data/puzzles.js に ${picked.length} 問を書いた（全部で ${list.length} 問）。`);
  void readFileSync;
}
