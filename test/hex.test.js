import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIRS, key, parseKey, neighbors, distance, hexagon, ISLAND_STAGES, islandCells, stageOf, toPixel } from '../src/core/hex.js';

test('隣は6つで、どれも距離1', () => {
  const ns = neighbors(2, -1);
  assert.equal(ns.length, 6);
  assert.equal(new Set(ns.map(([q, r]) => key(q, r))).size, 6);
  for (const [q, r] of ns) assert.equal(distance(2, -1, q, r), 1);
});

test('6方向を全部足すと元に戻る', () => {
  const sum = DIRS.reduce(([a, b], [q, r]) => [a + q, b + r], [0, 0]);
  assert.deepEqual(sum, [0, 0]);
});

test('key と parseKey は行って戻る', () => {
  assert.deepEqual(parseKey(key(-3, 4)), [-3, 4]);
});

test('距離は向きによらない', () => {
  assert.equal(distance(0, 0, 3, -1), distance(3, -1, 0, 0));
  assert.equal(distance(0, 0, 3, -1), 3);
});

test('六角の盤は半径2・3・4で19・37・61マス', () => {
  assert.equal(hexagon(0, 0, 2).length, 19);
  assert.equal(hexagon(0, 0, 3).length, 37);
  assert.equal(hexagon(0, 0, 4).length, 61);
});

test('島の段は19→37→61マスで、前の段を全部含む', () => {
  const sets = ISLAND_STAGES.map((_, i) => new Set(islandCells(i).map(([q, r]) => key(q, r))));
  assert.deepEqual(sets.map((s) => s.size), [19, 37, 61]);
  for (let i = 1; i < sets.length; i++) {
    for (const k of sets[i - 1]) assert.ok(sets[i].has(k), `段${i}に ${k} がない`);
  }
});

test('はじめの19マスは最後の島の左下の角にある', () => {
  // 61マスの島の左下の頂点のマス (-4, 4) は、はじめから島にある
  assert.equal(stageOf(-4, 4), 0);
  // 反対の右上の頂点のマス (4, -4) は最後の段で開く
  assert.equal(stageOf(4, -4), 2);
  // はじめの19マスの中心は、画面で真ん中より左下
  const [x, y] = toPixel(...ISLAND_STAGES[0].center, 1);
  assert.ok(x < 0 && y > 0);
});

test('stageOf は島の外で -1', () => {
  assert.equal(stageOf(5, 0), -1);
});

test('段の数の外は RangeError', () => {
  assert.throws(() => islandCells(3), RangeError);
});
