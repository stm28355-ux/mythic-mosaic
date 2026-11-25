// 24匹の表（第5回の案）の新しい部品と、見つけにくい生き物が本当に出られるかを確かめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { place, unlocked, whyNotPlace } from '../src/core/rules.js';
import { makeBoard, spawnIds } from './helpers.js';

const G = { ground: 'grass' };
const W = { ground: 'water' };
const S = { ground: 'sand' };
const firstStep = (r) => spawnIds(r.steps)[0] ?? [];

test('生き物の条件：⑦ハスヒメは隣にポチャと木1本', () => {
  const b = makeBoard({ '1,0': { ground: 'water', creature: 'pocha' }, '0,1': { ground: 'grass', object: 'tree' } });
  const r = place(b, 0, 0, 'water');
  assert.deepEqual(firstStep(r), ['hasuhime']);
  assert.equal(r.board.cells['1,0'].object, 'flower', 'ポチャの居る水にも蓮が咲く');
});

test('一直線の形：⑨ナガレは水の一直線5マスの真ん中の中洲', () => {
  const b = makeBoard({ '-2,0': W, '-1,0': W, '1,0': W, '2,0': W, '0,-1': S });
  const r = place(b, 0, 0, 'sand');
  assert.ok(firstStep(r).includes('nagare'));
  // 曲がっていると出ない
  const bent = makeBoard({ '-2,0': W, '-1,0': W, '1,0': W, '1,1': W });
  assert.ok(!firstStep(place(bent, 0, 0, 'sand')).includes('nagare'));
});

test('「誰もいない」の条件：⑫モリフクロは木ちょうど2本で、隣に生き物がいない。見つけると巣が置ける', () => {
  const b = makeBoard({ '0,0': { ground: 'grass', object: 'tree' }, '1,0': { ground: 'grass', object: 'tree' }, '0,1': { ground: 'grass', object: 'tree' } });
  const r = place(b, -1, 0, 'grass');
  assert.ok(firstStep(r).includes('mofuroo'));
  // 隣に生き物がいると出ない
  const crowded = makeBoard({ ...{ '0,0': { ground: 'grass', object: 'tree' }, '1,0': { ground: 'grass', object: 'tree' }, '0,1': { ground: 'grass', object: 'tree' } }, '0,-1': { ground: 'sand', creature: 'pocha' } });
  assert.ok(!firstStep(place(crowded, -1, 0, 'grass')).includes('mofuroo'));
  assert.ok(!unlocked(['pocha']).placeables.includes('nest'));
  assert.ok(unlocked(['pocha', 'mofuroo']).placeables.includes('nest'));
  assert.equal(whyNotPlace(makeBoard(), 0, 0, 'nest', ['pocha']), 'まだ使えない');
});

test('置ける物「巣」から⑬ヒナドリ', () => {
  const b = makeBoard({ '0,0': { ground: 'grass' }, '1,0': { ground: 'grass', object: 'tree' }, '0,1': { ground: 'grass', object: 'tree' } });
  const r = place(b, 0, 0, 'nest', { found: ['mofuroo'] });
  assert.ok(firstStep(r).includes('hinadori'));
});

test('⑭ハナビラは、誰もいない花畑（帰したあとに隣を変えると出る）', () => {
  const flowers = { '0,0': { ground: 'grass', object: 'flower' }, '1,0': { ground: 'grass', object: 'flower' }, '0,1': { ground: 'grass', object: 'flower' } };
  const busy = makeBoard({ ...flowers, '-1,1': { ground: 'grass', creature: 'kodama' } });
  assert.ok(!firstStep(place(busy, -1, 0, 'grass')).includes('hanabira'), '隣に生き物がいると出ない');
  const empty = place(busy, -1, 1, 'release').board;
  assert.ok(firstStep(place(empty, -1, 0, 'grass')).includes('hanabira'));
});

test('効果で帰す：㉒キリノヌシが帰すと、空いたマスで連鎖が続く', () => {
  const b = makeBoard({
    '0,0': { ground: 'marsh' },
    '1,0': { ground: 'water', creature: 'pocha' }, '2,0': W, '2,-1': W,
    '0,1': { ground: 'grass', creature: 'kokedama' }, '-1,1': { ground: 'grass', creature: 'kerori' },
  });
  const r = place(b, -1, 0, 'sand');
  const ids = spawnIds(r.steps);
  assert.deepEqual(ids[0], ['kirinonushi']);
  assert.equal(r.steps[0].changed.includes('1,0'), true, '帰ったマスは「変わった」に数える');
  assert.ok(ids[1].includes('pocha'), '空いた水にポチャがまた出る');
});

test('人の「帰す」では連鎖は起きないが、効果の帰すでは起きる（違いを確かめる）', () => {
  const b = makeBoard({ '0,0': { ground: 'water', creature: 'pocha' }, '1,0': W, '0,1': W });
  assert.deepEqual(place(b, 0, 0, 'release').steps, []);
});

test('高さを下げる：⑧ウズマキは湖の真ん中で、2マス先までを1ずつ削る', () => {
  const lake = { '1,0': W, '1,-1': W, '0,-1': W, '-1,0': W, '-1,1': W, '2,0': { ground: 'sand', height: 2 }, '0,2': { ground: 'grass', height: 1 } };
  const r = place(makeBoard(lake), 0, 0, 'water');
  assert.ok(firstStep(r).includes('uzumaki'));
  assert.equal(r.board.cells['2,0'].height, 1);
  assert.equal(r.board.cells['0,2'].height, 0);
});

test('上の物を消す・高さを上げる：⑱イワオは隣の岩を砕いて1高くする', () => {
  const b = makeBoard({
    '0,0': { ground: 'barren', object: 'rock' }, '1,0': { ground: 'sand', height: 1 },
    '0,1': { ground: 'barren', object: 'rock' },
  });
  const r = place(b, -1, 0, 'hill');
  assert.ok(firstStep(r).includes('iwao'));
  assert.equal(r.board.cells['0,1'].object, null);
  assert.equal(r.board.cells['0,1'].height, 1);
});

test('最後の㉔ハジマリ：6匹に囲まれた荒れ地に丘を置くと出る（荒れ地のまま高くなる）', () => {
  const ring = {};
  for (const k of ['1,0', '1,-1', '0,-1', '-1,0', '-1,1', '0,1']) ring[k] = { ground: 'grass', creature: 'pocha' };
  const r = place(makeBoard(ring), 0, 0, 'hill');
  assert.ok(firstStep(r).includes('hajimari'));
  assert.ok(['1,0', '1,-1', '0,-1', '-1,0', '-1,1', '0,1'].every((k) => r.steps[0].board.cells[k].creature === null), '隣の6匹は帰る');
});

test('岩は置ける物（8匹で開く）。地面は変えない', () => {
  const b = makeBoard({ '0,0': { ground: 'grass', object: 'tree' } });
  assert.equal(whyNotPlace(b, 0, 0, 'rock', 7), 'まだ使えない');
  const r = place(b, 0, 0, 'rock', { found: 8 });
  assert.equal(r.board.cells['0,0'].ground, 'grass');
  assert.equal(r.board.cells['0,0'].object, 'rock');
});

test('島は3匹で37マス、10匹で61マス', () => {
  assert.equal(unlocked(9).stage, 1);
  assert.equal(unlocked(10).stage, 2);
});

test('段の途中の盤（spawnedBoard）は効果の前のまま', () => {
  const b = makeBoard({
    '0,0': { ground: 'marsh' },
    '1,0': { ground: 'water', creature: 'pocha' }, '2,0': W, '2,-1': W,
    '0,1': { ground: 'grass', creature: 'kokedama' }, '-1,1': { ground: 'grass', creature: 'kerori' },
  });
  const st = place(b, -1, 0, 'sand').steps[0];
  assert.equal(st.spawnedBoard.cells['1,0'].creature, 'pocha', '帰る前はまだ居る');
  assert.equal(st.board.cells['1,0'].creature, null);
});
