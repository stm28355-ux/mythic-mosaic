// スコアアタック（工程6）：地図と点の数え方
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../src/data/maps.js';
import { mapBoard, moveScore, starsOf, stockLeft, mapOpen } from '../src/core/score.js';
import { readyShapes, place } from '../src/core/rules.js';
import { PLACEABLES } from '../src/core/creatures.js';

// 段の数と、段ごとの出た生き物の数だけを持つ steps
const steps = (...counts) => counts.map((n) => ({ spawned: Array.from({ length: n }, () => ({ id: 'pocha' })) }));

test('a 上限付きの足し算：n段目に n点、4段目からは4点', () => {
  assert.equal(moveScore([], 'a'), 0);
  assert.equal(moveScore(steps(1), 'a'), 1);
  assert.equal(moveScore(steps(1, 1, 1), 'a'), 6);
  assert.equal(moveScore(steps(1, 1, 1, 1, 1), 'a'), 14);
  assert.equal(moveScore(steps(1, 1, 1, 1, 1, 1, 1, 1), 'a'), 26);
  assert.equal(moveScore(steps(3, 1), 'a'), 3, '生き物の数は数えない');
});

test('b 節目で追加点：1匹1点、3・5・8段で +3・+5・+8', () => {
  assert.equal(moveScore(steps(1, 1), 'b'), 2);
  assert.equal(moveScore(steps(1, 1, 1), 'b'), 6);
  assert.equal(moveScore(steps(1, 1, 1, 1, 1), 'b'), 13);
  assert.equal(moveScore(steps(1, 1, 1, 1, 1, 1, 1, 1), 'b'), 24);
  assert.equal(moveScore(steps(3, 1), 'b'), 4, '1段に3匹なら3点');
});

for (const m of MAPS) {
  test(`${m.title}：盤が作れて、置く前に何も起きない。置く物・星・開き方が正しい`, () => {
    const b = mapBoard(m);
    const n = Object.keys(b.cells).length;
    assert.ok(n >= 37 && n <= 61, `37〜61マス（今は ${n}）`);
    assert.deepEqual(readyShapes(b), []);
    for (const it of Object.keys(m.stock)) assert.ok(PLACEABLES.some((p) => p.id === it && p.kind !== 'release'), it);
    for (const k of ['a', 'b']) {
      const s = m.stars[k];
      assert.equal(s.length, 3);
      assert.ok(s[0] > 0 && s[0] < s[1] && s[1] < s[2], `${k} の星は上がっていく`);
      assert.equal(starsOf(m, k, s[1]), 2);
      assert.equal(starsOf(m, k, s[1] - 1), 1);
    }
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

test('地図の盤に置ける（地図の外には置けない）', () => {
  const b = mapBoard(MAPS[0]);
  assert.throws(() => place(b, 0, -4, 'water'));
  assert.doesNotThrow(() => place(b, 0, 0, 'water'));
});
