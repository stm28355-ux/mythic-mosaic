import { hexagon, key } from '../src/core/hex.js';

// テスト用の盤：中心 (0,0) 半径 radius の六角。spec は { "q,r": { ground, height, object, creature } }
export function makeBoard(spec = {}, radius = 2) {
  const cells = {};
  for (const [q, r] of hexagon(0, 0, radius)) {
    cells[key(q, r)] = { q, r, ground: 'barren', height: 0, object: null, creature: null, ...(spec[key(q, r)] ?? {}) };
  }
  return { stage: 0, cells };
}

// 段ごとの出た生き物の id（重ならないように並べる）
export const spawnIds = (steps) => steps.map((s) => [...new Set(s.spawned.map((x) => x.id))].sort());
