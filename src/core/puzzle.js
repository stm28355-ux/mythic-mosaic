// 連鎖問題（工程5）。企画まとめ「連鎖問題の作り方」：
//   ほぼ埋まった盤に、決まった順の置く物を置く。「n手で m連鎖」に届けば、どの置き方でも正解。
//   問題は道具（tools/make-puzzles.mjs）が作ってファイルにし、ゲームに同梱する。
// ここには、問題の盤の作り方・答え合わせ・全部の置き方を調べる関数を置く（調べる関数は道具とテストだけが使う）。
import { CREATURES } from './creatures.js';
import { place, whyNotPlace } from './rules.js';
import { hexagon, key, parseKey } from './hex.js';

// 問題の盤は (0,0) を中心にした六角。半径2で19マス、半径3で37マス
export const PUZZLE_RADIUS = { 19: 2, 37: 3 };

// cells: [[q, r, ground, height, object, creature], ...]（object・creature は無ければ null）
export function puzzleBoard(p) {
  const cells = {};
  for (const [q, r] of hexagon(0, 0, PUZZLE_RADIUS[p.size])) cells[key(q, r)] = { q, r, ground: 'barren', height: 0, object: null, creature: null };
  for (const [q, r, ground, height, object, creature] of p.cells) cells[key(q, r)] = { q, r, ground, height, object, creature };
  // 火の山の島の問題（判定表 第25回 P2）：火の山の8つが置け、火の山の生き物も出る盤
  return p.island === 2 ? { stage: 0, puzzle: true, island: 2, cells } : { stage: 0, puzzle: true, cells };
}

export function packBoard(board) {
  return Object.values(board.cells)
    .sort((a, b) => a.r - b.r || a.q - b.q)
    .map((c) => [c.q, c.r, c.ground, c.height, c.object, c.creature]);
}

// 問題に出てくる生き物（盤にいる物と、どこかの置き方で現れる物）。開く条件に使う
export function puzzleCreatures(p) {
  return [...new Set([...p.cells.map((c) => c[5]).filter(Boolean), ...p.appear])];
}

// 問題が開いているか：出てくる生き物を図鑑で全部見つけている
export function puzzleOpen(p, found) {
  return puzzleCreatures(p).every((id) => found.includes(id));
}

// 全部の置き方を調べる。
//   best      … どれかの手で出た一番長い連鎖の、置き方ぜんぶの中の最大
//   leaves    … 置き方の数、solutions … best に届く置き方の数
//   appear    … どこかの置き方で現れる生き物（Set）
//   withAim   … best に届く置き方のうち、best に届いた手の連鎖に aim の生き物が入るものの数
//   example   … best に届く置き方の1つ（マスの並び）
export function solveAll(board, items, { catalog = CREATURES, aim = null } = {}) {
  const out = { best: 0, leaves: 0, solutions: 0, withAim: 0, appear: new Set(), example: null, nodes: 0 };
  const leaves = [];
  const moves = [];
  const per = []; // 手ごとの [連鎖の長さ, aim が入ったか]
  function dfs(b, depth, sofar) {
    if (depth === items.length) {
      out.leaves++;
      leaves.push([sofar, per.map((x) => [...x]), [...moves]]);
      return;
    }
    for (const c of Object.values(b.cells)) {
      if (whyNotPlace(b, c.q, c.r, items[depth])) continue;
      out.nodes++;
      const r = place(b, c.q, c.r, items[depth], { catalog });
      for (const st of r.steps) for (const s of st.spawned) out.appear.add(s.id);
      per.push([r.steps.length, aim !== null && r.steps.some((st) => st.spawned.some((s) => s.id === aim))]);
      moves.push(key(c.q, c.r));
      dfs(r.board, depth + 1, Math.max(sofar, r.steps.length));
      moves.pop();
      per.pop();
    }
  }
  dfs(board, 0, 0);
  out.best = Math.max(0, ...leaves.map((l) => l[0]));
  for (const [chain, list, ms] of leaves) {
    if (chain < out.best) continue;
    const seen = list.some(([n, a]) => n >= out.best && a);
    out.solutions++;
    if (seen) out.withAim++;
    if (!out.example || (seen && !out.exampleAim)) { out.example = ms; out.exampleAim = seen; }
  }
  return out;
}

// 素直な置き方：毎手、その手で一番長い連鎖が出る所に置く（同じ長さが並んだら全部試す）。届く最大を返す
export function greedyBest(board, items, { catalog = CREATURES } = {}) {
  let best = 0;
  function go(b, depth, sofar) {
    if (depth === items.length) { best = Math.max(best, sofar); return; }
    const tries = [];
    for (const c of Object.values(b.cells)) {
      if (whyNotPlace(b, c.q, c.r, items[depth])) continue;
      const r = place(b, c.q, c.r, items[depth], { catalog });
      tries.push([r.steps.length, r.board]);
    }
    if (tries.length === 0) { best = Math.max(best, sofar); return; }
    const top = Math.max(...tries.map((t) => t[0]));
    for (const [n, nb] of tries) if (n === top) go(nb, depth + 1, Math.max(sofar, n));
  }
  go(board, 0, 0);
  return best;
}

// 遊んだ手の答え合わせ：手ごとの連鎖の長さの最大が target に届いたか
export function cleared(chains, target) {
  return chains.length > 0 && Math.max(...chains) >= target;
}

export { parseKey };
