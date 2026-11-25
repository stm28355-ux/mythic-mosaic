// 連鎖問題（工程5）：同梱した問題が、作ったときの約束を守っているか
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES } from '../src/data/puzzles.js';
import { place } from '../src/core/rules.js';
import { puzzleBoard, packBoard, puzzleCreatures, puzzleOpen, cleared, solveAll, greedyBest } from '../src/core/puzzle.js';
import { PLACEABLES } from '../src/core/creatures.js';

const playExample = (p) => {
  let b = puzzleBoard(p);
  const chains = [];
  p.items.forEach((it, i) => {
    const [q, r] = p.example[i].split(',').map(Number);
    const res = place(b, q, r, it);
    chains.push(res.steps.length);
    b = res.board;
  });
  return chains;
};

test('問題は1つ以上あり、id がかぶらない', () => {
  assert.ok(PUZZLES.length >= 1);
  assert.equal(new Set(PUZZLES.map((p) => p.id)).size, PUZZLES.length);
});

for (const p of PUZZLES) {
  test(`${p.id}：正解の例で目標に届く。盤は読み書きで変わらない`, () => {
    assert.ok(cleared(playExample(p), p.target));
    assert.deepEqual(packBoard(puzzleBoard(p)), p.cells);
    for (const it of p.items) assert.ok(PLACEABLES.some((x) => x.id === it && x.kind !== 'release'));
  });

  test(`${p.id}：素直な置き方では届かず、出てくる生き物はファイルのとおり`, () => {
    const board = puzzleBoard(p);
    assert.ok(greedyBest(board, p.items) < p.target);
    const all = solveAll(board, p.items, { aim: p.aim });
    assert.equal(all.best, p.target);
    assert.ok(all.withAim > 0, '狙いの生き物が正解に入る');
    assert.deepEqual([...all.appear].sort(), p.appear);
  });
}

test('問題は、出てくる生き物を図鑑で全部見つけると開く', () => {
  const p = PUZZLES[0];
  const need = puzzleCreatures(p);
  assert.equal(puzzleOpen(p, need), true);
  assert.equal(puzzleOpen(p, need.slice(1)), false);
});

test('答え合わせ：どの手で出してもよい', () => {
  assert.equal(cleared([0, 4, 1], 4), true);
  assert.equal(cleared([3, 3, 3], 4), false);
  assert.equal(cleared([], 1), false);
});
