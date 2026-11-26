// スコアアタック（工程6）：地図と点の数え方
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../src/data/maps.js';
import { mapBoard, moveScore, starsOf, stockLeft, mapOpen, bestScore } from '../src/core/score.js';
import { readyShapes, place } from '../src/core/rules.js';
import { PLACEABLES } from '../src/core/creatures.js';

// 段の数と、段ごとの出た生き物の数だけを持つ steps
const steps = (...counts) => counts.map((n) => ({ spawned: Array.from({ length: n }, () => ({ id: 'pocha' })) }));

test('点：1匹1点、1手の連鎖が3・5・8段に届くと +3・+5・+8（判定表 第10回）', () => {
  assert.equal(moveScore([]), 0);
  assert.equal(moveScore(steps(1, 1)), 2);
  assert.equal(moveScore(steps(1, 1, 1)), 6);
  assert.equal(moveScore(steps(1, 1, 1, 1, 1)), 13);
  assert.equal(moveScore(steps(1, 1, 1, 1, 1, 1, 1, 1)), 24);
  assert.equal(moveScore(steps(3, 1)), 4, '1段に3匹なら3点');
});

test('地図は5面で、開く数と星はあとの面ほど上がる', () => {
  assert.equal(MAPS.length, 5);
  assert.equal(new Set(MAPS.map((m) => m.id)).size, 5);
  MAPS.forEach((m, i) => { if (i) assert.ok(m.unlockAt > MAPS[i - 1].unlockAt); });
});

for (const m of MAPS) {
  test(`${m.title}：盤が作れて、置く前に何も起きない。置く物・星・開き方が正しい`, () => {
    const b = mapBoard(m);
    const n = Object.keys(b.cells).length;
    assert.ok(n >= 37 && n <= 61, `37〜61マス（今は ${n}）`);
    assert.deepEqual(readyShapes(b), []);
    for (const it of Object.keys(m.stock)) assert.ok(PLACEABLES.some((p) => p.id === it && p.kind !== 'release'), it);
    const s = m.stars;
    assert.equal(s.length, 3);
    assert.ok(s[0] > 0 && s[0] < s[1] && s[1] < s[2], '星は上がっていく');
    assert.equal(starsOf(m, s[1]), 2);
    assert.equal(starsOf(m, s[1] - 1), 1);
    assert.equal(mapOpen(m, Array(m.unlockAt).fill('x')), true);
    assert.equal(mapOpen(m, Array(m.unlockAt - 1).fill('x')), false);
  });
}

test('置ける物の残りは、置いた分だけ減る', () => {
  const m = MAPS[0];
  const left = stockLeft(m, [{ item: 'water' }, { item: 'water' }, { item: 'grass' }]);
  assert.equal(left.water, m.stock.water - 2);
  assert.equal(left.grass, m.stock.grass - 1);
});

test('記録は数。0.9.0 の { a, b } は b を読む', () => {
  assert.equal(bestScore(23), 23);
  assert.equal(bestScore({ a: 17, b: 23 }), 23);
  assert.equal(bestScore(undefined), 0);
});

test('地図の盤に置ける（地図の外には置けない）', () => {
  const b = mapBoard(MAPS[0]);
  assert.throws(() => place(b, 0, -4, 'water'));
  assert.doesNotThrow(() => place(b, 0, 0, 'water'));
});
