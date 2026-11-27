import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBoard, growIsland, place as placeAny, readyShapes as readyAny, whyNotPlace, recordFound, unlocked, AREA_FEATURES } from '../src/core/rules.js';
import { CREATURES } from '../src/core/creatures.js';
import { stageOf, parseKey } from '../src/core/hex.js';
import { makeBoard, spawnIds } from './helpers.js';

// 試作の6匹（第3回）の決めごとを確かめるテストは、6匹だけで動かす（24匹だとほかの生き物も連鎖に入る）
const PROTO = CREATURES.slice(0, 6);
const place = (b, q, r, it, opt = {}) => placeAny(b, q, r, it, { catalog: PROTO, ...opt });
const readyShapes = (b) => readyAny(b, PROTO);

const W = { ground: 'water' };
const G = { ground: 'grass' };
const S = { ground: 'sand' };

test('空の箱庭は19マスの荒れ地', () => {
  const b = createBoard();
  const cells = Object.values(b.cells);
  assert.equal(cells.length, 19);
  assert.ok(cells.every((c) => c.ground === 'barren' && c.height === 0 && !c.object && !c.creature));
});

test('島を広げても今あるマスはそのまま、新しい所の丘は決まった所だけ', () => {
  const b = place(createBoard(), -2, 2, 'grass').board;
  const g = growIsland(b, 1);
  assert.equal(Object.keys(g.cells).length, 37);
  assert.equal(g.cells['-2,2'].ground, 'grass');
  for (const [k, h] of Object.entries(AREA_FEATURES[1].heights)) {
    assert.equal(stageOf(...parseKey(k)), 1, `${k} は2段目で開くマス`);
    assert.equal(g.cells[k].height, h);
  }
});

test('ポチャ：水の隣に水が2つで出て、隣の荒れ地を草にする', () => {
  const b = makeBoard({ '1,0': W, '0,1': W });
  const { board, steps } = place(b, 0, 0, 'water');
  assert.deepEqual(spawnIds(steps), [['pocha']]);
  assert.equal(board.cells['0,0'].creature, 'pocha');
  assert.equal(board.cells['-1,0'].ground, 'grass');
  assert.equal(board.cells['1,0'].ground, 'water');
});

test('形が1つ足りなければ何も出ない', () => {
  const b = makeBoard({ '1,0': W });
  const { board, steps } = place(b, 0, 0, 'water');
  assert.equal(steps.length, 0);
  assert.equal(board.cells['0,0'].creature, null);
});

test('前からあった形は呼ばない（変わったマスとその隣だけを調べる）', () => {
  // 遠くの (-2,2) に、まだ誰も住んでいない「水の隣に水2つ」がある盤（置く前に作っておいた形）
  const b = makeBoard({ '-2,2': W, '-1,2': W, '-2,1': W });
  assert.equal(readyShapes(b).length > 0, true);
  const { steps } = place(b, 2, -2, 'sand');
  assert.equal(steps.length, 0);
});

test('4連鎖の例（判定表 第3回）：水を1つ置くとポチャ→コケダマ→ヌマヌシ→ケロリ', () => {
  const spec = {
    '-2,1': G, '-2,2': S, '-1,-1': S, '-1,0': W, '-1,1': G, '-1,2': G, '0,-2': S, '0,-1': W,
    '0,1': G, '0,2': G, '1,-1': S, '1,0': W, '2,-2': W, '2,-1': S, '2,0': G,
  };
  const b = makeBoard(spec);
  assert.deepEqual(readyShapes(b), [], '置く前は何も出ない盤');
  const { board, steps } = place(b, 1, -2, 'water');
  assert.deepEqual(spawnIds(steps), [['pocha'], ['kokedama'], ['numanushi'], ['kerori']]);
  // 同じ段で同じ種類が2匹出る（R3）
  assert.equal(steps[0].spawned.length, 2);
  // 最後のケロリは隣の砂を水にする
  assert.ok(steps[3].changed.length > 0);
  assert.ok(steps[3].changed.every((k) => board.cells[k].ground === 'water'));
});

test('同じ種類は次の段からは出ない（D6）', () => {
  // ポチャが荒れ地を草にしても、その先でポチャの形ができるわけではないが、
  // ケロリが砂を水にしてポチャの形ができる盤で、ポチャが2回出ないことを確かめる
  const spec = {
    '-2,1': G, '-2,2': S, '-1,-1': S, '-1,0': W, '-1,1': G, '-1,2': G, '0,-2': S, '0,-1': W,
    '0,1': G, '0,2': G, '1,-1': S, '1,0': W, '2,-2': W, '2,-1': S, '2,0': G,
  };
  const { steps } = place(makeBoard(spec), 1, -2, 'water');
  const counts = {};
  steps.forEach((s, i) => new Set(s.spawned.map((x) => x.id)).forEach((id) => { (counts[id] ??= []).push(i); }));
  for (const [id, idx] of Object.entries(counts)) assert.equal(idx.length, 1, `${id} が2つの段に出た`);
});

test('同じマスに2種類が住もうとしたら、どちらも出ない（D8）', () => {
  // 中心の水の隣に、水2つと木2本 → ポチャとヌマヌシの両方の形
  const b = makeBoard({
    '1,0': W, '0,1': W,
    '-1,0': { ground: 'grass', object: 'tree' }, '0,-1': { ground: 'grass', object: 'tree' },
  });
  const { board, steps } = place(b, 0, 0, 'water');
  assert.ok(!steps[0].spawned.some((x) => x.key === '0,0'), '1段目には (0,0) に誰も出ない');
  assert.ok(steps[0].blocked.some((x) => x.key === '0,0' && x.ids.includes('pocha') && x.ids.includes('numanushi')));
  // 1段目で隣の (1,0) にポチャが出たので、ポチャはこの連鎖ではもう出ない。
  // 2段目に (0,0) をもう一度調べると、ヌマヌシだけになって住む
  assert.equal(board.cells['0,0'].creature, 'numanushi');
  assert.deepEqual(steps[1].spawned.map((x) => x.key), ['0,0']);
});

test('同じマスの同じ層を違う物にしようとしたら変わらない（D7）', () => {
  const catalog = [
    { id: 'a', center: { ground: 'water' }, around: { match: { ground: 'water' }, min: 1 },
      effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'grass' } },
    { id: 'b', center: { ground: 'sand' }, around: { match: { ground: 'water' }, min: 1 },
      effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'marsh' } },
  ];
  // (0,0) に水を置くと、(0,0) と (1,0) の水に a、(1,-1) の砂に b が出る。
  // a は隣の荒れ地を草に、b は隣の荒れ地を湿地に。a と b の両方の隣の (2,-1) はぶつかる
  const b = makeBoard({ '1,0': W, '1,-1': S });
  const { board, steps } = place(b, 0, 0, 'water', { catalog });
  assert.deepEqual(spawnIds(steps), [['a', 'b']]);
  assert.ok(steps[0].clashes.some((c) => c.key === '2,-1' && c.layer === 'ground'));
  assert.equal(board.cells['2,-1'].ground, 'barren');
  assert.equal(board.cells['2,0'].ground, 'grass');
  assert.equal(board.cells['1,-2'].ground, 'marsh', 'b の隣だけの所は湿地');
});

test('住んだ生き物は、足元が変わっても去らない（R4）', () => {
  const spec = {
    '-2,1': G, '-2,2': S, '-1,-1': S, '-1,0': W, '-1,1': G, '-1,2': G, '0,-2': S, '0,-1': W,
    '0,1': G, '0,2': G, '1,-1': S, '1,0': W, '2,-2': W, '2,-1': S, '2,0': G,
  };
  const { board, steps } = place(makeBoard(spec), 1, -2, 'water');
  const koke = steps[1].spawned[0].key;
  assert.equal(board.cells[koke].creature, 'kokedama');
  assert.equal(board.cells[koke].ground, 'marsh', 'コケダマの足元はヌマヌシで湿地になった');
});

test('スナモグリは中心と隣の砂を1高くし、2で止まる', () => {
  // 隣の砂は互いに隣り合わない3つ（ほかのマスでは形ができない）
  const b = makeBoard({ '1,0': { ground: 'sand', height: 2 }, '0,-1': S, '-1,1': S, '2,0': S });
  const { board, steps } = place(b, 0, 0, 'sand');
  assert.deepEqual(spawnIds(steps), [['sunamoguri']]);
  assert.equal(board.cells['0,0'].height, 1);
  assert.equal(board.cells['0,-1'].height, 1);
  assert.equal(board.cells['1,0'].height, 2);
  assert.equal(board.cells['2,0'].height, 0, '2マス先は上がらない');
});

test('カゼノコは高さ2の上で、2マス先までの荒れ地を草にする', () => {
  const b = makeBoard({ '0,0': { ground: 'sand', height: 1 }, '1,0': G, '0,1': G, '-1,1': G });
  const { board, steps } = place(b, 0, 0, 'hill');
  assert.deepEqual(spawnIds(steps)[0], ['kazenoko']);
  // 草が広がったので、次の段でコケダマの形ができる（連鎖）
  assert.deepEqual(spawnIds(steps)[1], ['kokedama']);
  assert.equal(board.cells['2,0'].ground, 'grass');
  assert.equal(board.cells['-2,2'].ground, 'grass');
  assert.equal(board.cells['0,0'].ground, 'sand', '中心は変えない');
});

test('地面を置くと木は消え、高さは残る（R5）', () => {
  const b = makeBoard({ '0,0': { ground: 'grass', object: 'tree', height: 1 } });
  const { board } = place(b, 0, 0, 'sand');
  assert.equal(board.cells['0,0'].object, null);
  assert.equal(board.cells['0,0'].height, 1);
});

test('置けない所と物', () => {
  const b = makeBoard({ '0,0': { ground: 'water', creature: 'pocha' }, '1,0': G, '2,0': { height: 2 } });
  assert.equal(whyNotPlace(b, 0, 0, 'grass'), '生き物が住んでいる');
  assert.equal(whyNotPlace(b, 9, 9, 'grass'), '島の外');
  assert.equal(whyNotPlace(b, 1, 0, 'grass'), '同じ地面');
  assert.equal(whyNotPlace(b, 2, 0, 'hill'), 'これ以上高くできない');
  assert.equal(whyNotPlace(b, -1, 0, 'hill', 2), 'まだ使えない');
  assert.equal(whyNotPlace(b, -1, 0, 'hill', 3), null);
  assert.throws(() => place(b, 0, 0, 'grass'), /生き物が住んでいる/);
});

test('置く前の盤は変わらない（純粋な関数）', () => {
  const b = makeBoard({ '1,0': W, '0,1': W });
  const before = JSON.stringify(b);
  place(b, 0, 0, 'water');
  assert.equal(JSON.stringify(b), before);
});

test('図鑑と解放：3匹で丘と37マス', () => {
  let p = { found: [] };
  p = recordFound(p, [{ spawned: [{ id: 'pocha' }, { id: 'pocha' }] }, { spawned: [{ id: 'kokedama' }] }]);
  assert.deepEqual(p.found, ['pocha', 'kokedama']);
  assert.deepEqual(unlocked(2), { placeables: ['grass', 'water', 'sand', 'release'], stage: 0 });
  assert.deepEqual(unlocked(3), { placeables: ['grass', 'water', 'sand', 'hill', 'release'], stage: 1 });
});

test('生き物のデータの形がそろっている', () => {
  const ids = new Set();
  for (const sp of CREATURES) {
    assert.ok(!ids.has(sp.id), `id が重なる: ${sp.id}`);
    ids.add(sp.id);
    assert.ok(sp.name && sp.text && sp.center && (sp.around || sp.line) && (sp.effect || sp.effects));
    assert.ok(sp.hint);
  }
  // 第1の島24匹＋火の山の生き物16匹＋第22回の8匹（はじまりの島の巣の2匹・火の山の6匹）
  assert.equal(CREATURES.length, 48);
  assert.deepEqual(CREATURES.map((c) => c.no), Array.from({ length: 48 }, (_, i) => i + 1));
});

test('帰す：生き物だけがいなくなり、地面・木・高さは残り、連鎖は起こさない（#1）', () => {
  const b = makeBoard({
    '0,0': { ground: 'water', creature: 'pocha', object: 'tree', height: 1 },
    '1,0': W, '0,1': W,
  });
  const { board, steps, released } = place(b, 0, 0, 'release');
  assert.equal(released, 'pocha');
  assert.deepEqual(steps, []);
  assert.deepEqual(board.cells['0,0'], { ...b.cells['0,0'], creature: null });
  // 形は残っているが、帰しただけでは呼ばない。次に隣が変わると、また出られる
  assert.equal(readyShapes(board).some((x) => x.key === '0,0'), true);
  const again = place(board, -1, 0, 'grass');
  assert.equal(again.board.cells['0,0'].creature, 'pocha');
});

test('帰すは生き物の居るマスだけ', () => {
  const b = makeBoard({ '0,0': { ground: 'water', creature: 'pocha' } });
  assert.equal(whyNotPlace(b, 0, 0, 'release'), null);
  assert.equal(whyNotPlace(b, 1, 0, 'release'), '生き物がいない');
  assert.equal(whyNotPlace(b, 0, 0, 'release', 0), null, '最初から使える');
});
