// スコアアタック（工程6）。企画まとめ「進み方」：荒れ地のある決まった地図に、数の決まった物を自由に置いて点を狙う。
// 点の付け方（判定表 第10回で b に決めた。「何匹も出すことに意味がある方がよい」）：
//   節目で追加点 … 出た生き物1匹に1点。1手の連鎖が 3・5・8 段に届くと、そのたびに +3・+5・+8
//   （試作でくらべた「上限付きの足し算」＝n段目に n点・4段目からは4点、は使わない）
// 地図は src/data/maps.js。ここには、地図から盤を作る・点を数える・星を数える関数を置く。
import { key } from './hex.js';

// 地図の行の文字 → マス（'.' は地図の外）
export const MAP_CODES = Object.freeze({
  o: { ground: 'barren' },
  w: { ground: 'water' },
  g: { ground: 'grass' },
  s: { ground: 'sand' },
  m: { ground: 'marsh' },
  1: { ground: 'barren', height: 1 },
  2: { ground: 'barren', height: 2 },
  r: { ground: 'barren', object: 'rock' },
  t: { ground: 'grass', object: 'tree' },
  S: { ground: 'sand', height: 1 },
});

// 地図の盤。rows は (0,0) を中心にした半径4の六角の行（r = -4 … 4、上から）。行の文字数はその行のマスの数
export const MAP_RADIUS = 4;
export function mapBoard(map) {
  const cells = {};
  map.rows.forEach((row, i) => {
    const r = i - MAP_RADIUS;
    const q0 = Math.max(-MAP_RADIUS, -MAP_RADIUS - r);
    const len = Math.min(MAP_RADIUS, MAP_RADIUS - r) - q0 + 1;
    if (row.length !== len) throw new Error(`${map.id} の ${i + 1} 行目は ${len} 文字（今は ${row.length}）`);
    [...row].forEach((ch, j) => {
      if (ch === '.') return;
      const code = MAP_CODES[ch];
      if (!code) throw new Error(`${map.id} の知らない文字：${ch}`);
      const q = q0 + j;
      cells[key(q, r)] = { q, r, ground: 'barren', height: 0, object: null, creature: null, ...code };
    });
  });
  return { stage: 0, puzzle: true, cells };
}

export const SCORE_TEXT = '出た生き物1匹に1点。1手の連鎖が3・5・8段に届くと +3・+5・+8';
export const MILESTONES = Object.freeze([[3, 3], [5, 5], [8, 8]]);

// 1手の点。steps は place() の steps（段の並び）
export function moveScore(steps) {
  const creatures = steps.reduce((s, st) => s + st.spawned.length, 0);
  return creatures + MILESTONES.filter(([n]) => steps.length >= n).reduce((s, [, bonus]) => s + bonus, 0);
}

// 置ける物の残り：stock から置いた物を引く
export function stockLeft(map, moves) {
  const left = { ...map.stock };
  for (const m of moves) left[m.item] -= 1;
  return left;
}

// 星の数（0〜3）：map.stars は ★1・★2・★3 に要る点
export function starsOf(map, score) {
  return (map.stars ?? []).filter((t) => score >= t).length;
}

// 保存した記録（0.9.0 は { a, b } で残した。b が今の点）
export const bestScore = (v) => (typeof v === 'number' ? v : v?.b ?? 0);

// 地図が開いているか：見つけた生き物の数
export function mapOpen(map, found) {
  return found.length >= map.unlockAt;
}
