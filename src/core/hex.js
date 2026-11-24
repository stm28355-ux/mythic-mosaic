// 六角の盤の座標（軸座標 q, r。頂点が上の六角）。
// 画面では x = √3·(q + r/2)、y = 1.5·r（r が大きいほど下）。
// ルールの心臓部はこの上に乗る。ここは画面にもルールにも依存しない純粋な関数だけ。

// 隣の6方向（右から反時計回り）
export const DIRS = Object.freeze([
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
]);

export const key = (q, r) => `${q},${r}`;

export const parseKey = (k) => k.split(',').map(Number);

export const neighbors = (q, r) => DIRS.map(([dq, dr]) => [q + dq, r + dr]);

// 2マスの距離（何歩で行けるか）
export const distance = (q1, r1, q2, r2) =>
  Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(q1 - q2 + r1 - r2));

// 中心 (cq, cr)・半径 radius の六角の盤のマス。半径2・3・4 で 19・37・61 マス。
export function hexagon(cq, cr, radius) {
  const cells = [];
  for (let dq = -radius; dq <= radius; dq++) {
    for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
      cells.push([cq + dq, cr + dr]);
    }
  }
  return cells;
}

// 箱庭の島の段（11/24 判定表 第2回 F1）。
// 最後の61マスの島の左下の角に19マスで始まり、37 → 61 マスと右上へ広がる。どの段も六角。
export const ISLAND_STAGES = Object.freeze([
  Object.freeze({ cells: 19, center: [-2, 2], radius: 2 }),
  Object.freeze({ cells: 37, center: [-1, 1], radius: 3 }),
  Object.freeze({ cells: 61, center: [0, 0], radius: 4 }),
]);

// 段（0・1・2）の島のマス
export function islandCells(stage) {
  const s = ISLAND_STAGES[stage];
  if (!s) throw new RangeError(`島の段は 0〜${ISLAND_STAGES.length - 1}: ${stage}`);
  return hexagon(s.center[0], s.center[1], s.radius);
}

// マスが初めて島に入る段（島の外なら -1）
export function stageOf(q, r) {
  return ISLAND_STAGES.findIndex((s) => distance(q, r, s.center[0], s.center[1]) <= s.radius);
}

// 画面の位置（マスの大きさ size＝中心から頂点まで）
export const toPixel = (q, r, size) => [Math.sqrt(3) * size * (q + r / 2), 1.5 * size * r];
