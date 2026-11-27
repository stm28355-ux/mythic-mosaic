// 第2の島「火の山の島」（判定表 第15回・第16回）：島ごとの置く物、谷、押す、試作6匹
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { place, whyNotPlace, isOpen, isOpenOn, canCross, island2Stage, island2Count, createBoard, growIsland } from '../src/core/rules.js';
import { CREATURES, PLACEABLES, ISLANDS } from '../src/core/creatures.js';
import { makeBoard, spawnIds } from './helpers.js';

const isle2 = (spec, radius) => ({ ...makeBoard(spec, radius), island: 2 });
const item = (id) => PLACEABLES.find((p) => p.id === id);
const firstStep = (r) => spawnIds(r.steps)[0] ?? [];
const ISLAND2 = CREATURES.filter((c) => c.island === 2).map((c) => c.id);
const island1Found = CREATURES.filter((c) => !c.island).map((c) => c.id); // 24匹

test('火の山の生き物は㉕から続く番号（試作6匹＋第18回の5匹）', () => {
  assert.deepEqual(ISLAND2.slice(0, 6), ['hinoko', 'haimogura', 'tsukisusu', 'tanebouzu', 'fuigo', 'homuradori']);
  assert.deepEqual(CREATURES.filter((c) => c.island === 2).map((c) => c.no), Array.from({ length: ISLAND2.length }, (_, i) => 25 + i));
});

test('島ごとに置く物は8つ（案②。火の山の島は第18回で水を足して9つ）。第2の島に砂・岩・巣は置けず、第1の島に灰・溶岩・薪・種は置けない', () => {
  assert.equal(ISLANDS[1].items.length, 8);
  assert.equal(ISLANDS[2].items.length, 9);
  const one = makeBoard();
  const two = isle2();
  for (const id of ['ash', 'lava', 'firewood', 'seed']) assert.equal(whyNotPlace(one, 0, 0, id), 'この島では置けない', id);
  for (const id of ['sand', 'rock', 'nest']) assert.equal(whyNotPlace(two, 0, 0, id), 'この島では置けない', id);
  for (const id of ['grass', 'hill', 'release']) assert.notEqual(whyNotPlace(two, 0, 0, id), 'この島では置けない', id);
  assert.equal(whyNotPlace(one, 0, 0, 'valley'), 'これ以上低くできない', '谷はどちらの島でも置ける（高さ0には置けない）');
});

test('開き方：島は図鑑20匹で渡れる。谷は第2の島の生き物3匹、種は5匹。第2の島の丘は第2の島の生き物3匹', () => {
  assert.equal(canCross(19), false);
  assert.equal(canCross(20), true);
  const f20 = island1Found.slice(0, 20);
  assert.equal(isOpen(item('ash'), f20), true);
  assert.equal(isOpen(item('valley'), f20), false);
  assert.equal(isOpen(item('valley'), [...f20, ...ISLAND2.slice(0, 3)]), true);
  assert.equal(isOpen(item('seed'), [...f20, ...ISLAND2.slice(0, 4)]), false);
  assert.equal(isOpen(item('seed'), [...f20, ...ISLAND2.slice(0, 5)]), true);
  assert.equal(isOpenOn(item('hill'), f20, 1), true);
  assert.equal(isOpenOn(item('hill'), f20, 2), false);
  assert.equal(isOpenOn(item('hill'), [...f20, ...ISLAND2.slice(0, 3)], 2), true);
  assert.equal(island2Count([...f20, 'hinoko']), 1);
  assert.equal(island2Stage(ISLAND2.slice(0, 2)), 0);
  assert.equal(island2Stage(ISLAND2.slice(0, 3)), 1);
  assert.equal(island2Stage(ISLAND2), 2);
});

test('第2の島の盤：19マスから始まり、広がっても第2の島のまま', () => {
  const b = createBoard(0, 2);
  assert.equal(b.island, 2);
  assert.equal(Object.keys(b.cells).length, 19);
  const g = growIsland(b, 2);
  assert.equal(g.island, 2);
  assert.equal(Object.keys(g.cells).length, 61);
  assert.ok(Object.values(g.cells).every((c) => !c.object), '第2の島には岩を置かない');
  assert.equal(createBoard(0).island, undefined, '第1の島は今までどおり');
});

test('谷：高さを1下げる', () => {
  const b = makeBoard({ '0,0': { height: 2 } });
  const r = place(b, 0, 0, 'valley');
  assert.equal(r.board.cells['0,0'].height, 1);
});

test('㉕ヒノコ：溶岩の隣に薪があると出て、薪に火をつける', () => {
  const b = isle2({ '1,0': { object: 'firewood' }, '0,1': { object: 'firewood' } });
  const r = place(b, 0, 0, 'lava');
  assert.deepEqual(firstStep(r), ['hinoko']);
  assert.equal(r.board.cells['1,0'].object, 'fire');
  assert.equal(r.board.cells['0,1'].object, 'fire');
});

test('㉖ハイモグラ：高さ0の灰に、隣の灰3つで出て、灰を草にする', () => {
  const b = isle2({ '1,0': { ground: 'ash' }, '0,1': { ground: 'ash' }, '-1,1': { ground: 'ash' } });
  const r = place(b, 0, 0, 'ash');
  assert.ok(firstStep(r).includes('haimogura'));
  assert.equal(r.board.cells['1,0'].ground, 'grass');
});

test('㉗ツキスス：高い灰の上で、隣の生き物を反対側へ1マス押す。島の外なら帰る、先に生き物がいれば動かない', () => {
  // (0,0) の灰を丘で高くする。隣の (1,0)・(-1,0) の生き物が (2,0)・(-2,0) へ動く
  const b = isle2({ '0,0': { ground: 'ash' }, '1,0': { creature: 'kokedama' }, '-1,0': { creature: 'iwao' } });
  const r = place(b, 0, 0, 'hill');
  assert.deepEqual(firstStep(r), ['tsukisusu']);
  assert.equal(r.board.cells['2,0'].creature, 'kokedama');
  assert.equal(r.board.cells['-2,0'].creature, 'iwao');
  assert.equal(r.board.cells['1,0'].creature, null);
  assert.deepEqual(r.steps[0].moved.map((m) => m.id).sort(), ['iwao', 'kokedama']);
  assert.ok(r.steps[0].changed.includes('1,0') && r.steps[0].changed.includes('2,0'), '動いた元と先は「変わった」');
  // 島の外へ：(1,0) から見て (2,0) の生き物は (3,0)＝島の外へ → 帰る
  const out = isle2({ '1,0': { ground: 'ash' }, '2,0': { creature: 'kokedama' }, '0,0': { creature: 'iwao' } });
  const ro = place(out, 1, 0, 'hill');
  assert.deepEqual(firstStep(ro), ['tsukisusu']);
  assert.equal(ro.board.cells['2,0'].creature, null);
  assert.deepEqual(ro.steps[0].pushedOut.map((m) => m.id), ['kokedama']);
  assert.equal(ro.board.cells['-1,0'].creature, 'iwao');
  // 先に生き物がいる：(1,0) の生き物の先 (2,0) にも生き物 → 動かず、ぶつかりに数える
  const blocked = isle2({ '0,0': { ground: 'ash' }, '1,0': { creature: 'kokedama' }, '2,0': { creature: 'pocha' }, '-1,0': { creature: 'iwao' } });
  const rb = place(blocked, 0, 0, 'hill');
  assert.equal(rb.board.cells['1,0'].creature, 'kokedama');
  assert.equal(rb.board.cells['-2,0'].creature, 'iwao');
  assert.ok(rb.steps[0].clashes.some((c) => c.key === '1,0' && c.layer === 'creature'));
});

test('㉘タネボウズ：種のある灰に、隣の草2つで出て、草に花を咲かせる', () => {
  const b = isle2({ '0,0': { ground: 'ash' }, '1,0': { ground: 'grass' }, '0,1': { ground: 'grass' } });
  const r = place(b, 0, 0, 'seed');
  assert.deepEqual(firstStep(r), ['tanebouzu']);
  assert.equal(r.board.cells['1,0'].object, 'flower');
});

test('㉙フイゴ：炎のマスに、隣の生き物と薪2つで出て、押して火をつける', () => {
  const b = isle2({ '0,0': { object: 'fire' }, '0,1': { object: 'firewood' }, '-1,0': { creature: 'iwao' } });
  const r = place(b, 1, 0, 'firewood');
  assert.deepEqual(firstStep(r), ['fuigo']);
  assert.equal(r.board.cells['-2,0'].creature, 'iwao');
  assert.equal(r.board.cells['1,0'].object, 'fire');
  assert.equal(r.board.cells['0,1'].object, 'fire');
});

test('㉚ホムラドリ：高さ2が炎3つに囲まれると出て、2マス先までの灰を花の咲いた草にする', () => {
  const b = isle2({ '0,0': { height: 2 }, '1,0': { object: 'fire' }, '0,1': { object: 'fire' }, '-1,1': { object: 'fire' }, '2,0': { ground: 'ash' } });
  const r = place(b, -1, 0, 'ash');
  assert.ok(firstStep(r).includes('homuradori'));
  assert.equal(r.board.cells['2,0'].ground, 'grass');
  assert.equal(r.board.cells['2,0'].object, 'flower');
});

// ---- 第18回：火の山の生き物の残り（まず ㉛〜㉟）と、火の山の島の水 ----
test('火の山の島の水は ㉛カコウコを見つけると置ける（はじまりの島ではいつでも）', () => {
  const f = island1Found.slice(0, 20);
  assert.equal(whyNotPlace(isle2(), 0, 0, 'water', f), 'まだ使えない');
  assert.equal(whyNotPlace(isle2(), 0, 0, 'water', [...f, 'kakouko']), null);
  assert.equal(whyNotPlace(makeBoard(), 0, 0, 'water', []), null);
});

test('火の山の生き物は、はじまりの島（と問題・スコアアタックの盤）には出ない', () => {
  // 草のマスの隣に木2つ：火の山の島なら㉝キコリス、はじまりの島では出ない
  const spec = { '1,0': { ground: 'grass', object: 'tree' }, '0,1': { ground: 'grass', object: 'tree' } };
  assert.ok(!firstStep(place(makeBoard(spec), 0, 0, 'grass')).includes('kikorisu'));
  assert.ok(firstStep(place(isle2(spec), 0, 0, 'grass')).includes('kikorisu'));
});

test('㉛カコウコ：高さ0の溶岩が、高さ1以上のマス3つに囲まれると出て、隣の溶岩を水にする', () => {
  const b = isle2({ '1,0': { height: 1 }, '0,1': { height: 1 }, '-1,1': { height: 2 }, '-1,0': { ground: 'lava', object: 'fire' } });
  const r = place(b, 0, 0, 'lava');
  assert.deepEqual(firstStep(r), ['kakouko']);
  assert.equal(r.board.cells['-1,0'].ground, 'water');
  assert.equal(r.board.cells['-1,0'].object, null, '水になったら炎は消える');
});

test('㉜クロイシ：溶岩の隣に水2つで出て、水を岩のある荒れ地にする', () => {
  const b = isle2({ '1,0': { ground: 'water' }, '0,1': { ground: 'water' } });
  const r = place(b, 0, 0, 'lava');
  assert.deepEqual(firstStep(r), ['kuroishi']);
  assert.equal(r.board.cells['1,0'].ground, 'barren');
  assert.equal(r.board.cells['1,0'].object, 'rock');
});

test('㉝キコリス：草の隣に木2つで出て、木を薪にする（草は残る）', () => {
  const b = isle2({ '1,0': { ground: 'grass', object: 'tree' }, '0,1': { ground: 'grass', object: 'tree' } });
  const r = place(b, 0, 0, 'grass');
  assert.deepEqual(firstStep(r), ['kikorisu']);
  assert.equal(r.board.cells['1,0'].object, 'firewood');
  assert.equal(r.board.cells['1,0'].ground, 'grass');
});

test('㉞スミノコ：灰の隣に炎2つで出て、炎を消して灰にする', () => {
  const b = isle2({ '1,0': { ground: 'grass', object: 'fire' }, '0,1': { object: 'fire' } });
  const r = place(b, 0, 0, 'ash');
  assert.deepEqual(firstStep(r), ['suminoko']);
  assert.equal(r.board.cells['1,0'].ground, 'ash');
  assert.equal(r.board.cells['1,0'].object, null);
});

test('㉟マグマル：高い溶岩の隣に荒れ地3つで出て、荒れ地を溶岩にする', () => {
  const b = isle2({ '0,0': { height: 1 }, '1,0': { ground: 'grass' }, '0,1': { ground: 'grass' }, '-1,1': { ground: 'grass' } });
  const r = place(b, 0, 0, 'lava');
  assert.deepEqual(firstStep(r), ['magumaru']);
  assert.equal(r.board.cells['1,-1'].ground, 'lava');
  assert.equal(r.board.cells['1,0'].ground, 'grass');
});
