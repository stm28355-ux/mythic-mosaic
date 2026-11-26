// 連鎖問題を作る道具（ゲームには出ない）。
//   node tools/make-puzzles.mjs <狙い> [作る数] [種=1] [--write]            … 段の無い狙い（入門・丘の風）
//   node tools/make-puzzles.mjs <狙い> [--tier=N] [--seed=S] [--secs=T] [--out=x.json] [--write]
//                                                                          … 段のある狙い。N を省くと全部の段
//   node tools/make-puzzles.mjs --merge a.json b.json ...                   … --out で書いた問題を src/data/puzzles.js に入れる
//   node tools/make-puzzles.mjs <狙い> --tidy [--write]                     … ファイルにある、その狙いの問題の余分な物だけを除く
// 盤をたくさん作り、狙いに合う物だけ残す（企画まとめ「連鎖問題の作り方」）：
//   - 狙いの生き物が、目標に届いた手の連鎖に入る（狙いの生き物を決めない段は見ない）
//   - 素直な置き方（毎手その手で一番長い連鎖）では届かない（入門と、やさしい段は見ない）
//   - 出てくる生き物は、狙いが決めた生き物だけ（問題は「出てくる生き物を図鑑で全部見つけたら」開く）
// 残った盤は、解き方の変わらない物を除いて（荒れ地に戻して）すっきりさせる（判定表 第7回：余分な物が多いと狙いが分からない）。
// 狙いの3問は、入門寄り（1〜2手）→中くらい→むずかしいの3段にする（判定表 第8回 R7）。
import { writeFileSync, readFileSync } from 'node:fs';
import { place, whyNotPlace } from '../src/core/rules.js';
import { CREATURES } from '../src/core/creatures.js';
import { makeRng } from '../src/core/rng.js';
import { hexagon, key, neighbors, DIRS } from '../src/core/hex.js';
import { solveAll, greedyBest, packBoard, puzzleBoard, PUZZLE_RADIUS } from '../src/core/puzzle.js';

// 狙い。order＝一覧の並び（小さいほど先）、allow＝出てきてよい生き物、items＝置く物の候補、build＝盤を作るときに置く物、
// plant＝盤の最後に、狙いの生き物の形をほぼできた形で植える（でたらめな盤では形がめったにできない狙い）、
// moves＝手数、size＝マスの数、minChain＝目標の連鎖、intro＝入門（ねらいを初めから出す。素直な置き方で届いてもよい）、
// easy＝やさしい段（素直な置き方で届いてもよい）、maxRatio＝正解の割合の上限、want＝作る数、
// tiers＝段（1つの段で1問。段に書いた物が狙いの値より勝つ。pick は残った問題のどれを取るか：easy・mid・hard）
const ALL = CREATURES.map((c) => c.id);
export const AIMS = {
  shizuku: {
    order: 1, title: 'しずくと苔', want: 1, intro: true, maxRatio: 0.2,
    note: '水を置いてポチャを呼ぶ。ポチャが広げた草に、コケダマが来る',
    aim: 'kokedama',
    allow: ['pocha', 'kokedama'],
    items: ['water'], moves: 1, size: 19, minChain: 2,
  },
  sunayama: {
    order: 2, title: '砂山の風', want: 1, intro: true, maxRatio: 0.2,
    note: '砂を置いてスナモグリを呼ぶ。持ち上がった砂山のてっぺんに、カゼノコが来る',
    aim: 'kazenoko',
    allow: ['pocha', 'kokedama', 'sunamoguri', 'kazenoko'],
    items: ['sand'], moves: 1, size: 19, minChain: 2,
  },
  kokage: {
    order: 3, title: '木陰の沼', want: 1, intro: true, maxRatio: 0.2,
    note: 'ポチャの草にコケダマが木を生やし、木陰の水にヌマヌシが来る',
    aim: 'numanushi',
    allow: ['pocha', 'kokedama', 'numanushi'],
    items: ['water', 'grass'], moves: 2, size: 19, minChain: 3,
  },
  hasu: {
    order: 10, title: '蓮と虹',
    allow: ['pocha', 'kokedama', 'numanushi', 'hasuhime', 'nijidori', 'hanabira', 'bunbun', 'sunamoguri'],
    items: ['water', 'grass', 'hill'], build: ['water', 'grass', 'sand', 'hill'], size: 19,
    tiers: [
      { moves: 2, minChain: 3, easy: true, maxRatio: 0.2, pick: 'easy', aim: 'hasuhime',
        note: 'ポチャのそばで、木が1本だけ見える水にハスヒメが来る' },
      { moves: 2, minChain: 3, pick: 'mid', aim: 'hasuhime',
        note: 'ハスヒメの居場所は、水が少なく木が1本の所。先にそこを作る' },
      { moves: 3, minChain: 3, pick: 'mid', aim: 'nijidori', plant: true,
        allow: ['pocha', 'kokedama', 'numanushi', 'hasuhime', 'nijidori', 'hanabira', 'bunbun', 'sunamoguri', 'kazenoko', 'uzumaki', 'mofuroo'],
        note: '高い水のそばに花を咲かせて、ニジドリに虹を架けさせる' },
    ],
  },
  mori: {
    order: 20, title: '森の広がり',
    allow: ['pocha', 'kokedama', 'numanushi', 'morinoko', 'kodama', 'mofuroo', 'hanabira', 'bunbun'],
    items: ['grass', 'water'], build: ['grass', 'water'], size: 19,
    tiers: [
      { moves: 2, minChain: 3, easy: true, maxRatio: 0.2, pick: 'easy', aim: 'morinoko',
        note: '木に囲まれた木にモリノコが来て、まわりに森を広げる' },
      { moves: 2, minChain: 3, pick: 'mid', aim: 'morinoko',
        note: 'モリノコが広げた森を、次の生き物につなげる' },
      { moves: 3, minChain: 4, pick: 'mid', aim: 'kodama', plant: true,
        note: '木を5本並べて囲み、コダマに森を花畑に変えさせる' },
    ],
  },
  kiri: {
    order: 30, title: '霧で入れかえ',
    allow: ['pocha', 'kokedama', 'numanushi', 'kerori', 'kirinonushi', 'morinoko', 'sunamoguri', 'hitorisuna'],
    items: ['water', 'grass', 'sand'], build: ['water', 'grass', 'sand'], size: 19, aim: 'kirinonushi',
    note: 'キリノヌシが隣の生き物を帰す。空いたマスに、別の生き物が来る',
    tiers: [
      { moves: 2, minChain: 3, easy: true, maxRatio: 0.2, pick: 'easy' },
      { moves: 2, minChain: 4, pick: 'mid' },
      { moves: 3, minChain: 5, pick: 'mid' },
    ],
  },
  nagare: {
    order: 40, title: '川の竜',
    allow: ['pocha', 'kokedama', 'numanushi', 'kerori', 'sunamoguri', 'hitorisuna', 'nagare', 'uzumaki'],
    items: ['water', 'sand', 'grass'], build: ['water', 'sand', 'grass'], size: 19, aim: 'nagare',
    note: '水がまっすぐ並んだ真ん中の砂にナガレが来て、砂を川に変える',
    tiers: [
      { moves: 1, minChain: 2, easy: true, maxRatio: 0.2, pick: 'easy' },
      { moves: 2, minChain: 3, pick: 'mid' },
      { moves: 3, minChain: 4, pick: 'mid' },
    ],
  },
  doro: {
    order: 50, title: '泥と湿地',
    allow: ['pocha', 'kokedama', 'numanushi', 'kerori', 'hotarubi', 'doronko', 'sunamoguri', 'hitorisuna'],
    items: ['water', 'grass', 'sand'], build: ['water', 'grass', 'sand'], size: 19,
    tiers: [
      { moves: 2, minChain: 3, easy: true, maxRatio: 0.2, pick: 'easy', aim: 'doronko',
        note: '砂に囲まれた湿地にドロンコが来て、砂を泥に変える' },
      { moves: 2, minChain: 3, pick: 'mid', aim: 'hotarubi', plant: true,
        note: 'ケロリのそばの、草に囲まれた湿地にホタルビが来る' },
      { moves: 3, minChain: 4, pick: 'mid', aim: 'doronko',
        note: '湿地を広げて、ドロンコとホタルビを続けて呼ぶ' },
    ],
  },
  ookina: {
    order: 85, title: '大きな連鎖',
    allow: ALL,
    items: ['grass', 'water', 'sand', 'hill'], build: ['grass', 'water', 'sand', 'hill', 'rock'], size: 37, aim: null,
    note: '37マスの盤。組をまたいで、長くつなぐ',
    tiers: [
      { moves: 1, minChain: 5, easy: true, maxRatio: 0.2, pick: 'easy' },
      { moves: 2, minChain: 6, pick: 'mid' },
      { moves: 2, minChain: 7, pick: 'mid' },
    ],
  },
  kazenoko: {
    order: 90, title: '丘の風', want: 3,
    note: 'カゼノコの「2マス先まで草」を連鎖の途中に入れる',
    aim: 'kazenoko',
    allow: ['pocha', 'kokedama', 'numanushi', 'kerori', 'sunamoguri', 'kazenoko', 'hitorisuna', 'tsumuji'],
    items: ['grass', 'water', 'sand', 'hill'], moves: 3, size: 19, minChain: 4,
  },
};

// 問題1つの決まり（狙い＋段）
const tierOf = (name, tier) => {
  const A = AIMS[name];
  return tier && A.tiers ? { ...A, ...A.tiers[tier - 1], tier } : { ...A };
};
const label = (id) => CREATURES.find((c) => c.id === id).name;
const dataPath = new URL('../src/data/puzzles.js', import.meta.url);
const busyCount = (board) => Object.values(board.cells).filter((c) => c.ground !== 'barren' || c.height || c.object || c.creature).length;

// 箱庭のように、空の盤からでたらめに置いて「ほぼ埋まった盤」を作る。
// 作るときは出てきてよい生き物だけで動かす（答え合わせは24匹全部のルールで調べ、狙いの外が出る盤は落とす）
function makeBoard(C, rng, genCatalog) {
  const cells = {};
  for (const [q, r] of hexagon(0, 0, PUZZLE_RADIUS[C.size])) cells[key(q, r)] = { q, r, ground: 'barren', height: 0, object: null, creature: null };
  let board = { stage: 0, cells };
  const turns = (20 + rng.int(40)) * (C.size / 19);
  const tools = C.build ?? (C.intro ? [...new Set([...C.items, 'grass', 'water', 'sand'])] : C.items);
  for (let t = 0; t < turns; t++) {
    const list = Object.values(board.cells);
    const busy = list.filter((c) => c.creature).length / list.length;
    const it = busy > 0.55 && rng.next() < 0.3 ? 'release' : rng.pick(tools);
    const ok = list.filter((c) => !whyNotPlace(board, c.q, c.r, it));
    if (ok.length === 0) continue;
    const c = rng.pick(ok);
    board = place(board, c.q, c.r, it, { catalog: genCatalog }).board;
  }
  return board;
}

// 狙いの生き物の形を植える：中心と隣の条件（min の数だけ）と一直線を満たすようにマスを書き、
// たいていは植えたマスの1つを荒れ地に戻す（1手で形ができる所まで）。そのあと少しだけでたらめに置く
function satisfy(c, m, rng, allow) {
  const n = { ...c };
  if (m.ground !== undefined) n.ground = m.ground;
  if ('object' in m) n.object = m.object;
  if (m.height !== undefined) n.height = m.height;
  if (m.minHeight !== undefined) n.height = Math.max(n.height, m.minHeight);
  if (m.maxHeight !== undefined) n.height = Math.min(n.height, m.maxHeight);
  if (m.creature) {
    const id = m.creature === 'any' ? rng.pick(allow) : m.creature;
    const sp = CREATURES.find((x) => x.id === id);
    Object.assign(n, satisfy(n, sp.center, rng, allow), { creature: id });
  }
  return n;
}
function plant(C, board, rng, genCatalog) {
  const sp = CREATURES.find((x) => x.id === C.aim);
  const cells = { ...board.cells };
  const inside = Object.values(cells).filter((c) => neighbors(c.q, c.r).every(([q, r]) => cells[key(q, r)]));
  const ctr = sp.line ? cells[key(0, 0)] : rng.pick(inside);
  const touched = [];
  cells[key(ctr.q, ctr.r)] = { ...satisfy(ctr, sp.center, rng, C.allow), creature: null };
  touched.push(key(ctr.q, ctr.r));
  const free = neighbors(ctr.q, ctr.r).map(([q, r]) => key(q, r)).sort(() => rng.next() - 0.5);
  if (sp.line) {
    const [dq, dr] = rng.pick(DIRS);
    for (const d of [-2, -1, 1, 2]) {
      const k = key(ctr.q + dq * d, ctr.r + dr * d);
      if (!cells[k]) continue;
      cells[k] = satisfy({ ...cells[k], creature: null }, sp.line.match, rng, C.allow);
      touched.push(k);
      free.splice(free.indexOf(k), free.includes(k) ? 1 : 0);
    }
  }
  const arounds = sp.around ? (Array.isArray(sp.around) ? sp.around : [sp.around]) : [];
  for (const a of arounds) {
    for (let i = 0; i < (a.min ?? 0) && free.length; i++) {
      const k = free.shift();
      cells[k] = satisfy({ ...cells[k], creature: null }, a.match, rng, C.allow.filter((id) => id !== C.aim));
      touched.push(k);
    }
  }
  if (rng.next() < 0.8) {
    const k = rng.pick(touched);
    cells[k] = { ...cells[k], ground: 'barren', height: 0, object: null, creature: null };
  }
  let b = { ...board, cells };
  for (let t = rng.int(5); t > 0; t--) {
    const it = rng.pick(C.build ?? C.items);
    const ok = Object.values(b.cells).filter((c) => !whyNotPlace(b, c.q, c.r, it));
    if (ok.length) { const c = rng.pick(ok); b = place(b, c.q, c.r, it, { catalog: genCatalog }).board; }
  }
  return b;
}

// 盤と置く物の順が狙いに合うか。合えば調べた結果、合わなければ落とした理由
function judge(C, allow, board, items) {
  const all = solveAll(board, items, { aim: C.aim ?? null });
  if (all.best < C.minChain) return { why: '連鎖が短い' };
  if ([...all.appear].some((id) => !allow.has(id))) return { why: '狙いの外の生き物が出る' };
  if (C.aim && all.withAim === 0) return { why: '狙いの生き物が目標の連鎖に入らない' };
  const greedy = greedyBest(board, items);
  if (!C.intro && !C.easy && greedy >= all.best) return { why: '素直な置き方で届く' };
  if (C.maxRatio && all.solutions / all.leaves > C.maxRatio) return { why: '正解が多すぎる' };
  return { all, greedy };
}

// 余分な物を除く：マスを1つずつ「荒れ地・高さ0・何も無し」に戻し（だめなら生き物だけ・上の物だけ・高さだけ・地面だけ）、
// 目標の連鎖と、狙いに合うことが変わらなければ戻したままにする。変わらなくなるまでくり返す
function tidy(C, allow, board, items, rng, best) {
  let b = board;
  let res = judge(C, allow, b, items);
  for (let changed = true; changed;) {
    changed = false;
    const ks = Object.keys(b.cells).sort(() => rng.next() - 0.5);
    for (const k of ks) {
      const c = b.cells[k];
      const tries = [
        { ground: 'barren', height: 0, object: null, creature: null },
        { creature: null }, { object: null }, { height: 0 }, { ground: 'barren' },
      ];
      for (const t of tries) {
        const nc = { ...c, ...t };
        if (nc.ground === c.ground && nc.height === c.height && nc.object === c.object && nc.creature === c.creature) continue;
        const nb = { ...b, cells: { ...b.cells, [k]: nc } };
        const r = judge(C, allow, nb, items);
        if (!r.all || r.all.best !== best) continue;
        b = nb;
        res = r;
        changed = true;
        break;
      }
    }
  }
  return { board: b, ...res };
}

// 1つの決まりで盤を作って、狙いに合う物を集める。secs 秒か tries 枚で止める
function generate(C, { seed, secs, need }) {
  const allow = new Set(C.allow);
  const genCatalog = CREATURES.filter((c) => allow.has(c.id));
  const rng = makeRng(seed);
  const t0 = Date.now();
  const found = [];
  const reasons = {};
  const why = (k) => { reasons[k] = (reasons[k] ?? 0) + 1; };
  let tried = 0;
  while (found.length < need && tried < 150000 && (Date.now() - t0) / 1000 < secs) {
    tried++;
    const board = C.plant ? plant(C, makeBoard(C, rng, genCatalog), rng, genCatalog) : makeBoard(C, rng, genCatalog);
    const living = Object.values(board.cells).filter((c) => c.creature);
    if (living.some((c) => !allow.has(c.creature))) { why('盤に狙いの外の生き物'); continue; }
    if (!C.intro && !C.tier && living.length < C.size * 0.25) { why('生き物が少ない'); continue; }
    const items = Array.from({ length: C.moves }, () => rng.pick(C.items));
    const r = judge(C, allow, board, items);
    if (r.why) { why(r.why); continue; }
    const t = tidy(C, allow, board, items, rng, r.all.best);
    found.push({ board: t.board, items, all: t.all, greedy: t.greedy, before: busyCount(board) });
  }
  // 正解の多い（やさしい）順。同じくらいなら、何かあるマスの少ない（すっきりした）盤を先に
  found.sort((a, b) => b.all.solutions / b.all.leaves - a.all.solutions / a.all.leaves || busyCount(a.board) - busyCount(b.board));
  return { found, tried, reasons, secs: ((Date.now() - t0) / 1000).toFixed(1) };
}

const ratio = (f) => `${f.all.solutions}/${f.all.leaves}（${((100 * f.all.solutions) / f.all.leaves).toFixed(2)}%）`;
function report(C, g, picked) {
  console.log(`## ${C.title}${C.tier ? ` ${C.tier}` : ''}（狙い ${C.aim ? label(C.aim) : 'なし'}）：${C.note}`);
  console.log();
  console.log(`${C.size}マス・${C.moves}手・目標 ${C.minChain}連鎖以上・置く物 ${C.items.join('/')}。盤を ${g.tried} 枚作って ${g.found.length} 問が残った（${g.secs} 秒）。`);
  console.log('落とした理由：' + Object.entries(g.reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('、'));
  console.log();
  if (g.found.length) console.log('残った問題の正解の割合：' + g.found.map(ratio).join('、'));
  console.log();
  console.log('| 問 | 置く物 | 目標 | 素直な置き方 | 正解の割合 | 何かあるマス | 盤の生き物 | 出てくる生き物 | 正解の例 |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  picked.forEach((f) => {
    const living = Object.values(f.board.cells).filter((c) => c.creature).length;
    console.log(`| ${f.id} | ${f.items.join('→')} | ${f.all.best}連鎖 | ${f.greedy}連鎖 | ${ratio(f)} | ${f.before ? `${f.before}→` : ''}${busyCount(f.board)} | ${living}匹 | ${[...f.all.appear].map(label).join('・')} | ${f.all.example.join(' → ')} |`);
  });
  console.log();
}

// 問題をファイルの形にする
const toPuzzle = (name, C, f, id, title) => ({
  id, aim: name, title, note: C.note, size: C.size, items: f.items, target: f.all.best,
  appear: [...f.all.appear].sort(), cells: packBoard(f.board), example: f.all.example,
  ...(C.tier ? { tier: C.tier } : {}),
});

// 問題を src/data/puzzles.js に入れる（同じ id は置き換え）。狙いの order・段の順に並べ、例の置き方で届くかを確かめる
async function writePuzzles(news) {
  let old = [];
  try { old = (await import(dataPath.href)).PUZZLES; } catch { /* 初めて */ }
  const ids = new Set(news.map((p) => p.id));
  const order = (p) => AIMS[p.aim]?.order ?? 50;
  const list = [...old.filter((p) => !ids.has(p.id)), ...news]
    .sort((a, b) => order(a) - order(b) || (a.tier ?? 0) - (b.tier ?? 0) || a.id.localeCompare(b.id))
    // ねらい・狙いの生き物・入門ややさしい段の印は、いつも今の AIMS に合わせる
    .map((p) => {
      const C = AIMS[p.aim] ? tierOf(p.aim, p.tier) : p;
      const { creature, intro, easy, ...rest } = p;
      return {
        ...rest, note: C.note ?? p.note,
        ...(C.aim ?? creature ? { creature: C.aim ?? creature } : {}),
        ...(C.intro ? { intro: true } : {}), ...(C.easy ? { easy: true } : {}),
      };
    });
  const body = list.map((p) => `  ${JSON.stringify(p)}`).join(',\n');
  writeFileSync(dataPath, `// 連鎖問題（tools/make-puzzles.mjs が作る。手で直さない）\n// cells: [q, r, 地面, 高さ, 上の物, 生き物]。target 連鎖に、items を順に置いて届けば正解。example は正解の1つ（テストと、ヒント2の1手目）。\n// creature は狙いの生き物（無ければ狙いなし）、note は「ねらい」（入門は初めから出し、ほかはヒント1）、tier は狙いの中の段（1 やさしい〜3 むずかしい）\n// intro は入門、easy はやさしい段（どちらも素直な置き方で届いてもよい）\nexport const PUZZLES = Object.freeze([\n${body},\n]);\n`);
  for (const p of list.filter((x) => ids.has(x.id))) {
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
  console.log(`src/data/puzzles.js に ${news.length} 問を書いた（全部で ${list.length} 問）。`);
}

// ---- 呼び方 ----
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? true];
}));
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (flags.merge) {
  const news = args.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')));
  await writePuzzles(news);
  process.exit(0);
}

const name = args[0] ?? 'kazenoko';
const A = AIMS[name];
if (!A) throw new Error(`狙いが無い：${name}`);
const picked = [];

if (flags.tidy) {
  const old = (await import(dataPath.href)).PUZZLES.filter((p) => p.aim === name);
  for (const p of old) {
    const C = tierOf(name, p.tier);
    const before = puzzleBoard(p);
    const r = tidy(C, new Set(C.allow), before, p.items, makeRng(1), p.target);
    console.log(`${p.title}：何かあるマス ${busyCount(before)} → ${busyCount(r.board)}`);
    picked.push(toPuzzle(name, C, { ...r, items: p.items }, p.id, p.title));
  }
} else if (A.tiers) {
  // 段のある狙い：段ごとに1問。pick で、残った問題のやさしい端・真ん中・むずかしい端を取る
  const tiers = flags.tier ? [Number(flags.tier)] : A.tiers.map((_, i) => i + 1);
  for (const tier of tiers) {
    const C = tierOf(name, tier);
    const g = generate(C, { seed: Number(flags.seed ?? tier), secs: Number(flags.secs ?? 600), need: Number(flags.need ?? 6) });
    const at = { easy: 0, mid: Math.floor((g.found.length - 1) / 2), hard: g.found.length - 1 }[C.pick ?? 'mid'];
    const f = g.found[at];
    const out = f ? [{ ...f, id: `${name}-${tier}` }] : [];
    report(C, g, out);
    if (f) picked.push(toPuzzle(name, C, f, `${name}-${tier}`, `${A.title} ${tier}`));
  }
} else {
  // 段の無い狙い：want 問。やさしい・中くらい・むずかしいが混ざるように間を空けて選ぶ。置く物の並びはかぶらないように
  const want = Number(args[1] ?? A.want ?? 3);
  const C = tierOf(name);
  const g = generate(C, { seed: Number(args[2] ?? 1), secs: Number(flags.secs ?? 3600), need: want * 4 });
  const sel = [];
  for (let i = 0; i < want; i++) {
    const at = want === 1 ? 0 : Math.round((i * (g.found.length - 1)) / (want - 1));
    const f = g.found.slice(at).find((x) => !sel.includes(x) && !sel.some((p) => p.items.join() === x.items.join()))
      ?? g.found.slice(at).find((x) => !sel.includes(x));
    if (f) sel.push(f);
  }
  report(C, g, sel.map((f, i) => ({ ...f, id: `${name}-${i + 1}` })));
  sel.forEach((f, i) => picked.push(toPuzzle(name, C, f, `${name}-${i + 1}`, want === 1 ? A.title : `${A.title} ${i + 1}`)));
}

if (flags.out) writeFileSync(flags.out, JSON.stringify(picked));
if (flags.write) await writePuzzles(picked);
