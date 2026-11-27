// スコアアタック（工程6）：地図と点の数え方
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../src/data/maps.js';
import { CREATURES } from '../src/core/creatures.js';
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

test('はじまりの島の地図は5面、火の山の地図はそのあと。開く数はあとの面ほど上がる', () => {
  const one = MAPS.filter((m) => m.island !== 2);
  const two = MAPS.filter((m) => m.island === 2);
  assert.equal(one.length, 5);
  assert.equal(new Set(MAPS.map((m) => m.id)).size, MAPS.length);
  assert.deepEqual(MAPS, [...one, ...two]);
  one.forEach((m, i) => { if (i) assert.ok(m.unlockAt > one[i - 1].unlockAt); });
  two.forEach((m, i) => { if (i) assert.ok(m.unlock2 > two[i - 1].unlock2); });
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
    if (m.island === 2) {
      // 火の山の地図は、火の山の生き物の数で開く（判定表 第25回 P3）
      const fire = CREATURES.filter((c) => c.island === 2).map((c) => c.id);
      assert.equal(mapOpen(m, fire.slice(0, m.unlock2)), true);
      assert.equal(mapOpen(m, [...CREATURES.filter((c) => !c.island).map((c) => c.id), ...fire.slice(0, m.unlock2 - 1)]), false);
      assert.equal(b.island, 2);
    } else {
      assert.equal(mapOpen(m, Array(m.unlockAt).fill('x')), true);
      assert.equal(mapOpen(m, Array(m.unlockAt - 1).fill('x')), false);
    }
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

// 判定表 第29回 Z7：スコアアタックの手順を書き出す
import { cellLabel, stepsText } from '../src/core/score.js';
test('手順の書き出し：場所は地図の行と並びで言い、1手ずつ点と連鎖を書く', () => {
  assert.equal(cellLabel('0,-4'), '上から1行目・左から1番目');
  assert.equal(cellLabel('-4,0'), '上から5行目・左から1番目');
  assert.equal(cellLabel('4,0'), '上から5行目・左から9番目');
  const m = MAPS[0];
  const t = stepsText(m, [{ key: '0,0', item: 'water', score: 1, chain: 1 }, { key: '1,0', item: 'grass', score: 7, chain: 3 }]);
  const lines = t.split('\n');
  assert.ok(lines[0].startsWith(`スコアアタック「${m.title}」　8点`));
  assert.ok(lines[0].endsWith(`（2／${Object.values(m.stock).reduce((a, b) => a + b, 0)}手）`));
  assert.equal(lines[1], '1. 水を 上から5行目・左から5番目 に置く → +1点');
  assert.equal(lines[2], '2. 草を 上から5行目・左から6番目 に置く → +7点（3連鎖）');
});
