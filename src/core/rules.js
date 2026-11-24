// ルールの心臓部：「盤＋置く物 → 新しい盤と出た生き物」。画面にも乱数にも依存しない純粋な関数だけ。
// 決まったこと（企画まとめ「決まったこと（11/24 判定表 第1回・第2回）」と第3回の R1〜R8）:
// - 連鎖は段ごとにまとめて動かす。順番は組まない。
// - 調べるのは、その段で変わったマスとその隣を中心にした形だけ（D3・R2）。
// - 生き物は中心に住む。1マスに1匹。生き物の居るマスも隣の条件には数える（D4・R1）。
// - 同じ段で2つの形が同じマスに住もうとしたら、どちらも出ない（D8）。
// - 同じ段なら同じ種類が何匹でも出る。その種類は次の段からは出ない（D6・R3）。
// - 同じ段で同じマスの同じ層を違う値に変えようとしたら、そのマスのその層は変わらない（D7）。
// - 住んだ生き物は、条件が崩れても去らない（R4）。
// - 地面を置くと上に乗る物は消え、高さは残る（R5）。生き物の居るマスには置けない（D9）。

import { key, neighbors, distance, islandCells } from './hex.js';
import { CREATURES, PLACEABLES, ISLAND_UNLOCKS, MAX_HEIGHT } from './creatures.js';

// 新しく開く所の丘（第2回 F3「所々に岩や丘」。岩は24匹の表で足す）
export const AREA_HEIGHTS = Object.freeze({
  1: Object.freeze({ '2,-1': 1, '0,-2': 1, '-1,-2': 2 }),
});

const blank = (q, r) => ({ q, r, ground: 'barren', height: 0, object: null, creature: null });

// 島の段 stage（0＝19マス）の空の箱庭
export function createBoard(stage = 0) {
  let board = { stage: 0, cells: {} };
  for (const [q, r] of islandCells(0)) board.cells[key(q, r)] = blank(q, r);
  for (let s = 1; s <= stage; s++) board = growIsland(board, s);
  return board;
}

// 島を stage まで広げる。今あるマスはそのまま、新しいマスは荒れ地（決まった所だけ丘）
export function growIsland(board, stage) {
  if (stage <= board.stage) return board;
  const cells = { ...board.cells };
  for (let s = board.stage + 1; s <= stage; s++) {
    const hills = AREA_HEIGHTS[s] ?? {};
    for (const [q, r] of islandCells(s)) {
      const k = key(q, r);
      if (!cells[k]) cells[k] = { ...blank(q, r), height: hills[k] ?? 0 };
    }
  }
  return { stage, cells };
}

// マスが条件に合うか
export function matches(cell, m) {
  if (!cell) return false;
  if (m.ground !== undefined && cell.ground !== m.ground) return false;
  if (m.object !== undefined && cell.object !== m.object) return false;
  if (m.height !== undefined && cell.height !== m.height) return false;
  if (m.minHeight !== undefined && cell.height < m.minHeight) return false;
  return true;
}

const around = (board, c) => neighbors(c.q, c.r).map(([q, r]) => board.cells[key(q, r)]).filter(Boolean);

// 範囲 range のマス（中心は含まない）
function inRange(board, c, range) {
  if (range === 1) return around(board, c);
  return Object.values(board.cells).filter((x) => {
    const d = distance(c.q, c.r, x.q, x.r);
    return d >= 1 && d <= range;
  });
}

// この生き物の形が、マス c を中心にできているか（住めるかは別）
export function shapeAt(board, c, sp) {
  if (!matches(c, sp.center)) return false;
  return around(board, c).filter((x) => matches(x, sp.around.match)).length >= sp.around.min;
}

// 生き物が住める形ができているのに住んでいない中心（置く前に何も起きない盤かを確かめるのに使う）
export function readyShapes(board, catalog = CREATURES) {
  const out = [];
  for (const [k, c] of Object.entries(board.cells)) {
    if (c.creature) continue;
    for (const sp of catalog) if (shapeAt(board, c, sp)) out.push({ key: k, id: sp.id });
  }
  return out;
}

// 1段ぶん：changed のマスとその隣を中心に調べて、生き物を出し、効果をまとめて当てる
function runStep(board, changed, used, catalog) {
  const candidates = new Set();
  for (const k of changed) {
    const c = board.cells[k];
    if (!c) continue;
    candidates.add(k);
    for (const x of around(board, c)) candidates.add(key(x.q, x.r));
  }

  // 中心ごとに出たい生き物を集める
  const wants = new Map();
  for (const k of [...candidates].sort()) {
    const c = board.cells[k];
    if (c.creature) continue;
    for (const sp of catalog) {
      if (used.has(sp.id)) continue;
      if (shapeAt(board, c, sp)) wants.set(k, [...(wants.get(k) ?? []), sp]);
    }
  }
  const spawned = [];
  const blocked = [];
  for (const [k, list] of wants) {
    if (list.length === 1) spawned.push({ key: k, id: list[0].id });
    else blocked.push({ key: k, ids: list.map((sp) => sp.id) });
  }
  if (spawned.length === 0) return { board, step: null };

  const cells = { ...board.cells };
  for (const s of spawned) cells[s.key] = { ...cells[s.key], creature: s.id };
  for (const s of spawned) used.add(s.id);
  const placed = { ...board, cells };

  // 効果の頼みを層ごとに集める（同じ段の中では、生き物が出たあとの盤を見る）
  const requests = new Map(); // "key|layer" -> Set(値)
  const ask = (k, layer, value) => {
    const id = `${k}|${layer}`;
    if (!requests.has(id)) requests.set(id, new Set());
    requests.get(id).add(JSON.stringify(value));
  };
  for (const s of spawned) {
    const sp = catalog.find((x) => x.id === s.id);
    const c = cells[s.key];
    const fx = sp.effect;
    const targets = inRange(placed, c, fx.range).filter((x) => matches(x, fx.from));
    if (fx.kind === 'convert') for (const x of targets) ask(key(x.q, x.r), 'ground', fx.to);
    if (fx.kind === 'grow') for (const x of targets) ask(key(x.q, x.r), 'object', fx.object);
    if (fx.kind === 'raise') {
      for (const x of [c, ...targets]) ask(key(x.q, x.r), 'height', Math.min(MAX_HEIGHT, x.height + 1));
    }
  }

  const touched = new Set();
  const clashes = [];
  for (const [id, values] of requests) {
    const [k, layer] = id.split('|');
    if (values.size > 1) { clashes.push({ key: k, layer }); continue; }
    const value = JSON.parse([...values][0]);
    if (cells[k][layer] === value) continue;
    cells[k] = { ...cells[k], [layer]: value };
    touched.add(k);
  }
  const changedKeys = [...touched].sort();
  const after = { ...board, cells };
  // spawnedBoard＝生き物が出た直後（効果の前）、board＝効果を当てた後。画面が段ごとに見せるのに使う
  return {
    board: after,
    step: { spawned, blocked, clashes, changed: changedKeys, spawnedBoard: placed, board: after },
  };
}

// 置けるか。置けないときは理由の文字列、置けるときは null
export function whyNotPlace(board, q, r, itemId, foundCount = Infinity) {
  const c = board.cells[key(q, r)];
  if (!c) return '島の外';
  const item = PLACEABLES.find((p) => p.id === itemId);
  if (!item) return '知らない物';
  if (foundCount < item.unlockAt) return 'まだ使えない';
  if (item.kind === 'release') return c.creature ? null : '生き物がいない';
  if (c.creature) return '生き物が住んでいる';
  if (item.kind === 'ground' && c.ground === item.ground && c.object === null) return '同じ地面';
  if (item.kind === 'raise' && c.height >= MAX_HEIGHT) return 'これ以上高くできない';
  return null;
}

// 置いて、連鎖が止まるまで動かす。
// 返り値：{ board, placedBoard, steps }。placedBoard＝置いた直後の盤。steps[i] は i+1 段目
// （spawned＝出た生き物、changed＝変わったマス、spawnedBoard・board＝その段の途中と後の盤）。
// 連鎖の数＝steps.length。
export function place(board, q, r, itemId, { catalog = CREATURES, foundCount = Infinity } = {}) {
  const why = whyNotPlace(board, q, r, itemId, foundCount);
  if (why) throw new Error(`置けない（${why}）: ${itemId} @ ${key(q, r)}`);
  const item = PLACEABLES.find((p) => p.id === itemId);
  const k = key(q, r);
  const c = board.cells[k];
  // 帰す：生き物だけがいなくなる。地面は変わらないので連鎖は起こさない
  if (item.kind === 'release') {
    const released = { ...board, cells: { ...board.cells, [k]: { ...c, creature: null } } };
    return { board: released, placedBoard: released, steps: [], released: c.creature };
  }
  const next = item.kind === 'ground'
    ? { ...c, ground: item.ground, object: null }
    : { ...c, height: c.height + 1 };
  const placedBoard = { ...board, cells: { ...board.cells, [k]: next } };
  let cur = placedBoard;

  const used = new Set();
  const steps = [];
  let changed = [k];
  for (let guard = 0; guard < catalog.length + 1; guard++) {
    const { board: after, step } = runStep(cur, changed, used, catalog);
    if (!step) break;
    cur = after;
    steps.push(step);
    if (step.changed.length === 0) break;
    changed = step.changed;
  }
  return { board: cur, placedBoard, steps };
}

// 見つけた生き物の記録。found は見つけた順の id の並び（図鑑。島から居なくなっても残る＝G1）
export function recordFound(progress, steps) {
  const found = [...progress.found];
  for (const st of steps) for (const s of st.spawned) if (!found.includes(s.id)) found.push(s.id);
  return { ...progress, found };
}

// 見つけた数で開く物と島の段
export function unlocked(foundCount) {
  return {
    placeables: PLACEABLES.filter((p) => foundCount >= p.unlockAt).map((p) => p.id),
    stage: Math.max(0, ...ISLAND_UNLOCKS.filter((u) => foundCount >= u.unlockAt).map((u) => u.stage)),
  };
}
