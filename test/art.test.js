// 生き物と上に乗る物の絵（工程7）：絵は32×32で、縁取りがあり、生き物には顔（目）がある
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRAW, creatureSvg, hasArt } from '../src/art/creatures.js';
import { CREATURES, OBJECTS } from '../src/core/creatures.js';
import { OBJECT_DRAW, objectSvg } from '../src/art/objects.js';

test('24匹全部に絵がある（判定表 第11回：見本6匹のあと18匹）', () => {
  for (const id of Object.keys(DRAW)) assert.ok(CREATURES.some((c) => c.id === id), id);
  for (const c of CREATURES) assert.ok(hasArt(c.id), c.name);
  assert.equal(hasArt('pocha'), true);
});

for (const id of Object.keys(DRAW)) {
  test(`${id}：32×32 に収まり、縁取りと目の光がある`, () => {
    const g = DRAW[id]();
    assert.equal(g.n, 32);
    const colors = g.px.flat().filter(Boolean);
    assert.ok(colors.includes('#1d1a33'), '縁取り');
    assert.ok(colors.includes('#ffffff') || id === 'kirinonushi', '目の光か白目（霧の主は閉じた目）');
    assert.ok(colors.length > 200, 'ちゃんと塗ってある');
    // 単独の画像（盤の <image>）として読めるように xmlns を付ける
    assert.ok(creatureSvg(id, 40).startsWith('<svg xmlns="http://www.w3.org/2000/svg" class="px" width="40"'));
  });
}

test('上に乗る物（木・花・岩・巣）にも絵があり、顔は描かない（W4）', () => {
  for (const kind of Object.keys(OBJECTS)) {
    const g = OBJECT_DRAW[kind]();
    assert.equal(g.n, 32);
    assert.ok(g.px.flat().includes('#1d1a33'), kind + ' の縁取り');
    assert.ok(!g.px.flat().includes('#ffffff'), kind + ' に目の光（白）は無い');
    assert.ok(objectSvg(kind).startsWith('<svg xmlns='));
  }
});
