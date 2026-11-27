// スコアアタックの測る道具（ゲームには出ない）。工程6：星の目安を決めるため。
//   node tools/measure-score.mjs [地図id] [--runs=300] [--beam=200] [--names] [--steps]
// 3人の遊び手で、地図ごとに点を測る（点は節目で追加点。判定表 第10回）：
//   でたらめ … 置ける所と物をでたらめに選ぶ（runs 回）
//   欲ばり   … 毎手、その手の点が一番大きい所と物を選ぶ（同じ点はでたらめに。runs/10 回）
//   先読み   … 毎手、合計点の高い盤を beam 個残して進める（一番よい1回）
// 星の目安：★1＝欲ばりの真ん中、★2＝欲ばりの一番、★3＝先読みの7割（でたらめは荒れ地ばかりの地図ではほぼ0点なので目安にしない）。
import { place, whyNotPlace, readyShapes } from '../src/core/rules.js';
import { parseKey } from '../src/core/hex.js';
import { makeRng } from '../src/core/rng.js';
import { MAPS } from '../src/data/maps.js';
import { mapBoard, moveScore, stepsText } from '../src/core/score.js';
import { CREATURES } from '../src/core/creatures.js';

const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
const RUNS = Number(flags.runs ?? 300);
const BEAM = Number(flags.beam ?? 200);
const name = (id) => CREATURES.find((c) => c.id === id).name;

function options(board, left) {
  const out = [];
  for (const k of Object.keys(board.cells)) {
    const [q, r] = parseKey(k);
    for (const [it, n] of Object.entries(left)) if (n > 0 && !whyNotPlace(board, q, r, it)) out.push([q, r, it]);
  }
  return out;
}

// 1回遊ぶ。choose(board, left, opts) が [q, r, item] を返す
function play(map, choose) {
  let board = mapBoard(map);
  const left = { ...map.stock };
  let total = 0;
  let longest = 0;
  const seen = new Set();
  const total0 = Object.values(left).reduce((a, b) => a + b, 0);
  for (let t = 0; t < total0; t++) {
    const opts = options(board, left);
    if (!opts.length) break;
    const [q, r, it] = choose(board, left, opts);
    const res = place(board, q, r, it);
    total += moveScore(res.steps);
    longest = Math.max(longest, res.steps.length);
    for (const st of res.steps) for (const s of st.spawned) seen.add(s.id);
    left[it] -= 1;
    board = res.board;
  }
  return { total, longest, seen };
}

const randomChooser = (rng) => (_b, _l, opts) => rng.pick(opts);
const greedyChooser = (rng) => (board, _l, opts) => {
  let best = -1;
  let picks = [];
  for (const o of opts) {
    const s = moveScore(place(board, o[0], o[1], o[2]).steps);
    if (s > best) { best = s; picks = [o]; } else if (s === best) picks.push(o);
  }
  return rng.pick(picks);
};

// 先読み：合計点の高い盤を BEAM 個残す
function beam(map, rng) {
  let states = [{ board: mapBoard(map), left: { ...map.stock }, total: 0, longest: 0, moves: [] }];
  const total0 = Object.values(map.stock).reduce((a, b) => a + b, 0);
  for (let t = 0; t < total0; t++) {
    const next = [];
    for (const s of states) {
      for (const [q, r, it] of options(s.board, s.left)) {
        const res = place(s.board, q, r, it);
        next.push({ board: res.board, left: { ...s.left, [it]: s.left[it] - 1 }, total: s.total + moveScore(res.steps),
          longest: Math.max(s.longest, res.steps.length), tie: rng.next(),
          moves: [...s.moves, { key: `${q},${r}`, item: it, score: moveScore(res.steps), chain: res.steps.length }] });
      }
    }
    if (!next.length) break;
    next.sort((a, b) => b.total - a.total || a.tie - b.tie);
    states = next.slice(0, BEAM);
  }
  return states[0];
}

const pctl = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const avg = (xs) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);

console.log('# 工程6 スコアアタックの測り（tools/measure-score.mjs）');
console.log();
console.log(`点は節目で追加点（1匹1点、3・5・8段で +3・+5・+8）。でたらめ ${RUNS} 回、欲ばり ${Math.max(10, RUNS / 10)} 回（同じ点はでたらめに選ぶ）、先読み（${BEAM} 個残す）1回。`);
console.log('星の目安：★1＝欲ばりの真ん中、★2＝欲ばりの一番、★3＝先読みの7割（でたらめは荒れ地ばかりの地図ではほぼ0点なので目安にしない）。');
console.log();
console.log('| 地図 | マス・手 | 置く前に出る形 | でたらめ 平均 | 欲ばり 真ん中 | 欲ばり 一番 | 先読み | 一番長い連鎖（でたらめ・欲ばり・先読み） | 出てきた生き物 | 星の目安 | 秒 |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
const FENCE = '`'.repeat(3);
const bests = [];
for (const map of MAPS.filter((m) => !only || m.id === only)) {
  const t0 = Date.now();
  const b0 = mapBoard(map);
  const moves = Object.values(map.stock).reduce((a, b) => a + b, 0);
  const rng = makeRng(1);
  const rnd = Array.from({ length: RUNS }, () => play(map, randomChooser(rng)));
  const gr = Array.from({ length: Math.max(10, RUNS / 10) }, () => play(map, greedyChooser(rng)));
  const bm = beam(map, rng);
  const seen = new Set();
  for (const x of [...rnd, ...gr]) for (const id of x.seen) seen.add(id);
  const s1 = Math.max(1, pctl(gr.map((x) => x.total), 0.5));
  const s2 = Math.max(s1 + 1, ...gr.map((x) => x.total));
  const s3 = Math.max(s2 + 1, Math.round(bm.total * 0.7));
  console.log(`| ${map.title}（${map.id}） | ${Object.keys(b0.cells).length}・${moves} | ${readyShapes(b0).length} | ${avg(rnd.map((x) => x.total))} | ${s1} | ${Math.max(...gr.map((x) => x.total))} | ${bm.total} | ${Math.max(...rnd.map((x) => x.longest))}・${Math.max(...gr.map((x) => x.longest))}・${bm.longest} | ${seen.size}種 | ${s1}・${s2}・${s3} | ${((Date.now() - t0) / 1000).toFixed(1)} |`);
  // --steps：先読みの一番よい置き方を、ゲームの「手順を書き出す」と同じ文で出す
  if ('steps' in flags) bests.push(['### ' + map.title + '（' + bm.total + '点）', '', FENCE, stepsText(map, bm.moves), FENCE, ''].join('\n'));
  if (flags.names) console.log(`|  |  |  |  |  |  |  |  | ${[...seen].map(name).join('・')} |  |  |`);
}
if (bests.length) { console.log(); console.log(bests.join('\n')); }
