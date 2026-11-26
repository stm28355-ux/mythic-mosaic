// 生き物の絵（工程7）：絵は32×32で、縁取りがあり、顔（目）がある
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRAW, creatureSvg, hasArt } from '../src/art/creatures.js';
import { CREATURES } from '../src/core/creatures.js';

test('絵のある生き物は、生き物の表にいる', () => {
  for (const id of Object.keys(DRAW)) assert.ok(CREATURES.some((c) => c.id === id), id);
  assert.ok(Object.keys(DRAW).length >= 6);
  assert.equal(hasArt('pocha'), true);
});

for (const id of Object.keys(DRAW)) {
  test(`${id}：32×32 に収まり、縁取りと目の光がある`, () => {
    const g = DRAW[id]();
    assert.equal(g.n, 32);
    const colors = g.px.flat().filter(Boolean);
    assert.ok(colors.includes('#1d1a33'), '縁取り');
    assert.ok(colors.includes('#ffffff') || id === 'kirinonushi', '目の光（霧の主は閉じた目）');
    assert.ok(colors.length > 200, 'ちゃんと塗ってある');
    // 単独の画像（盤の <image>）として読めるように xmlns を付ける
    assert.ok(creatureSvg(id, 40).startsWith('<svg xmlns="http://www.w3.org/2000/svg" class="px" width="40"'));
  });
}
