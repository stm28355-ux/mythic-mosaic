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

test('問題は1つ以上あり、id がかぶらない。はじまりの島の問題が先で、島ごとに入門が先に並ぶ', () => {
  assert.ok(PUZZLES.length >= 1);
  assert.equal(new Set(PUZZLES.map((p) => p.id)).size, PUZZLES.length);
  const firstFire = PUZZLES.findIndex((p) => p.island === 2);
  assert.ok(firstFire === -1 || PUZZLES.slice(firstFire).every((p) => p.island === 2), '火の山の問題はあとにまとまる');
  for (const list of [PUZZLES.filter((p) => p.island !== 2), PUZZLES.filter((p) => p.island === 2)]) {
    const firstHard = list.findIndex((p) => !p.intro);
    assert.ok(firstHard === -1 || list.slice(firstHard).every((p) => !p.intro));
  }
  assert.ok(PUZZLES.every((p) => p.note), 'どの問題にも、ねらいがある');
  // 狙いの中は段の順（やさしい→むずかしい）。同じ狙いはまとまって並ぶ
  const aims = PUZZLES.map((p) => p.aim).filter((a, i, l) => l.indexOf(a) === i);
  for (const a of aims) {
    const at = PUZZLES.map((p, i) => (p.aim === a ? i : -1)).filter((i) => i >= 0);
    assert.equal(at[at.length - 1] - at[0] + 1, at.length, `${a} がまとまって並ぶ`);
    const tiers = at.map((i) => PUZZLES[i].tier ?? 0);
    assert.deepEqual(tiers, [...tiers].sort((x, y) => x - y), `${a} は段の順`);
  }
});

for (const p of PUZZLES) {
  test(`${p.id}：正解の例で目標に届く。盤は読み書きで変わらない`, () => {
    assert.ok(cleared(playExample(p), p.target));
    assert.deepEqual(packBoard(puzzleBoard(p)), p.cells);
    for (const it of p.items) assert.ok(PLACEABLES.some((x) => x.id === it && x.kind !== 'release'));
  });

  const easy = p.intro || p.easy;
  test(`${p.id}：${easy ? '入門・やさしい段' : '素直な置き方では届かず'}、出てくる生き物はファイルのとおり`, () => {
    const board = puzzleBoard(p);
    if (!easy) assert.ok(greedyBest(board, p.items) < p.target);
    const all = solveAll(board, p.items, { aim: p.creature });
    assert.equal(all.best, p.target);
    if (p.creature) assert.ok(all.withAim > 0, '狙いの生き物が正解に入る');
    // どの手も要る（1手を抜くと届かない）
    p.items.forEach((_, i) => {
      if (p.items.length > 1) assert.ok(solveAll(board, p.items.filter((__, j) => j !== i)).best < p.target, `${i + 1}手目が要る`);
    });
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
