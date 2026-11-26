// 実績（判定表 第6回 J・K）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, newAchievements } from '../src/core/achievements.js';
import { CREATURES } from '../src/core/creatures.js';
import { createBoard, place } from '../src/core/rules.js';
import { MAPS } from '../src/data/maps.js';
import { makeBoard } from './helpers.js';

test('実績は33個。ふしぎは6個で隠す', () => {
  assert.equal(ACHIEVEMENTS.length, 33);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 33);
  const hidden = ACHIEVEMENTS.filter((a) => a.hidden);
  assert.equal(hidden.length, 6);
  assert.ok(hidden.every((a) => a.teaser));
});

test('図鑑と島の実績は、手が無くても（読み込みのとき）取れる＝さかのぼり', () => {
  const found = CREATURES.slice(0, 12).map((c) => c.id);
  const got = newAchievements([], { board: createBoard(1), found });
  assert.ok(got.includes('first') && got.includes('half') && got.includes('stage1'));
  assert.ok(!got.includes('stage2') && !got.includes('chain2'));
  assert.deepEqual(newAchievements(got, { board: createBoard(1), found }), [], '取ったものは二度出ない');
});

test('連鎖とふしぎ：㉒キリノヌシが帰した水にポチャがまた出る', () => {
  const b = makeBoard({
    '0,0': { ground: 'marsh' },
    '1,0': { ground: 'water', creature: 'pocha' }, '2,0': { ground: 'water' }, '2,-1': { ground: 'water' },
    '0,1': { ground: 'grass', creature: 'kokedama' }, '-1,1': { ground: 'grass', creature: 'kerori' },
  });
  const r = place(b, -1, 0, 'sand');
  const got = newAchievements([], { steps: r.steps, before: b, board: r.board, found: ['kirinonushi', 'pocha'] });
  assert.ok(got.includes('chain2'));
  assert.ok(got.includes('reborn'), 'また会えたね');
  assert.ok(!got.includes('chain3'));
});

test('ポチャの国と満員の島', () => {
  const spec = {};
  const b = createBoard(2);
  let i = 0;
  for (const c of Object.values(b.cells)) { if (i++ < 10) spec[`${c.q},${c.r}`] = true; }
  const cells = Object.fromEntries(Object.entries(b.cells).map(([k, c]) => [k, { ...c, creature: spec[k] ? 'pocha' : null }]));
  const board = { ...b, cells };
  assert.ok(newAchievements([], { board, found: ['pocha'] }).includes('pocha'));
  const full = { ...b, cells: Object.fromEntries(Object.entries(b.cells).map(([k, c]) => [k, { ...c, creature: 'kokedama' }])) };
  const got = newAchievements([], { board: full, found: ['kokedama'] });
  assert.ok(got.includes('full') && !got.includes('pocha'));
});

test('問題の実績は解いた問題で、スコアの実績は全部の面の★2で取れる', () => {
  assert.deepEqual(ACHIEVEMENTS.filter((a) => a.later).map((a) => a.id), []);
  const all2 = Object.fromEntries(MAPS.map((m) => [m.id, m.stars[1]]));
  assert.ok(newAchievements([], { board: createBoard(0), found: [], best: all2, puzzleOnly: true }).includes('scoreAll'));
  const short = { ...all2, [MAPS[0].id]: MAPS[0].stars[1] - 1 };
  assert.ok(!newAchievements([], { board: createBoard(0), found: [], best: short, puzzleOnly: true }).includes('scoreAll'));
  const got = newAchievements([], { board: createBoard(2), found: CREATURES.map((c) => c.id) });
  assert.ok(!got.includes('puzzle1') && !got.includes('scoreAll'));
  assert.ok(got.includes('all') && got.includes('rumors') && got.includes('g-flower'));
  const one = newAchievements([], { board: createBoard(0), found: [], cleared: ['x'], puzzleOnly: true });
  assert.deepEqual(one, ['puzzle1'], '問題の盤では、問題の実績だけ見る');
});
