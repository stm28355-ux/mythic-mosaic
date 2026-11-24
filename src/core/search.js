// 答え探し：決まった順の置く物（連鎖問題は置く物の順が決まっている＝企画まとめ）を、
// どのマスに置くと一番長い連鎖が出るかを全部試して探す。
// いまは道具（tools/）だけが使う。ゲームの中では使っていない。
import { place, whyNotPlace } from './rules.js';
import { parseKey } from './hex.js';

// 盤 board に items を順に置く全部の置き方を試す。
// 返り値：{ best, bestMoves, nodes } … best＝1手で出た連鎖のうち一番長い数、bestMoves＝そのときの置き場所、nodes＝試した置き方の数
// limit を超えたら打ち切って { aborted: true } を付ける。
export function searchBestChain(board, items, { limit = Infinity } = {}) {
  const keys = Object.keys(board.cells).sort();
  let best = -1;
  let bestMoves = null;
  let nodes = 0;
  let aborted = false;
  const moves = [];

  function dfs(b, depth, sofar) {
    if (aborted) return;
    if (depth === items.length) {
      if (sofar > best) { best = sofar; bestMoves = [...moves]; }
      return;
    }
    for (const k of keys) {
      const [q, r] = parseKey(k);
      if (whyNotPlace(b, q, r, items[depth])) continue;
      if (++nodes > limit) { aborted = true; return; }
      const { board: next, steps } = place(b, q, r, items[depth]);
      moves.push(k);
      dfs(next, depth + 1, Math.max(sofar, steps.length));
      moves.pop();
      if (aborted) return;
    }
  }
  dfs(board, 0, 0);
  return { best, bestMoves, nodes, aborted };
}
