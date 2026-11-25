// 噂と使う物・光る所（判定表 第6回 U・V）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CREATURES } from '../src/core/creatures.js';
import { hintLevel, usesOf, usesShown, newRumors, glowCell } from '../src/core/hints.js';
import { place } from '../src/core/rules.js';
import { makeBoard } from './helpers.js';

const byId = Object.fromEntries(CREATURES.map((c) => [c.id, c]));

test('噂は21匹。①②⑤には無く、言う生き物はみな居る', () => {
  const withRumor = CREATURES.filter((c) => c.rumor);
  assert.equal(withRumor.length, 21);
  for (const id of ['pocha', 'kokedama', 'sunamoguri']) assert.equal(byId[id].rumor, undefined);
  for (const c of withRumor) for (const by of c.rumor.by) assert.ok(byId[by], `${c.id} の噂を言う ${by}`);
  // 見つけにくい7匹は2匹から聞ける（V3）
  for (const id of ['nagare', 'hanabira', 'nijidori', 'yamanami', 'tsumuji', 'kirinonushi', 'hajimari']) assert.equal(byId[id].rumor.by.length, 2, id);
});

test('図鑑の段：一言→噂→見つけた', () => {
  const m = byId.mofuroo;
  assert.equal(hintLevel(m, []), 'hint');
  assert.equal(usesShown(m, []), false);
  assert.equal(hintLevel(m, ['morinoko']), 'rumor');
  assert.equal(usesShown(m, ['morinoko']), true);
  assert.equal(hintLevel(m, ['morinoko', 'mofuroo']), 'found');
  assert.equal(usesShown(byId.pocha, []), true, '噂のない①は使う物を最初から');
});

test('使う物は形のデータから作る（「〜まで」「いない」と数は出さない）', () => {
  assert.deepEqual(usesOf(byId.mofuroo), ['草', '木']);
  assert.deepEqual(usesOf(byId.hasuhime), ['水', 'ポチャ', '木']);
  assert.deepEqual(usesOf(byId.nagare), ['砂', '水']);
  assert.deepEqual(usesOf(byId.iwao), ['荒れ地', '岩', '高さ']);
  assert.deepEqual(usesOf(byId.hajimari), ['荒れ地', '生き物']);
  assert.deepEqual(usesOf(byId.kazenoko), ['高さ', '草']);
});

test('新しく聞けた噂：2匹から聞ける噂は、片方を見つけた時だけ', () => {
  assert.deepEqual(newRumors([], ['morinoko']).map((c) => c.id).sort(), ['kodama', 'mofuroo']);
  assert.deepEqual(newRumors(['hinadori'], ['hinadori', 'bunbun']).map((c) => c.id), [], '⑭は⑬で聞いた');
  assert.deepEqual(newRumors(['morinoko'], ['morinoko', 'kodama']).map((c) => c.id), ['bunbun'], '見つけた⑪自身は出さない');
});

test('光る所：使う物が分かっているまだの生き物が、1手で出る所', () => {
  const trees = { '0,0': { ground: 'grass', object: 'tree' }, '1,0': { ground: 'grass', object: 'tree' }, '0,1': { ground: 'grass', object: 'tree' } };
  const found = ['pocha', 'kokedama', 'sunamoguri', 'morinoko'];
  const g = glowCell(makeBoard(trees), found);
  assert.equal(g.id, 'mofuroo');
  const [q, r] = g.key.split(',').map(Number);
  assert.ok(['grass', 'water', 'sand', 'hill'].some((it) => place(makeBoard(trees), q, r, it, { found }).steps.some((st) => st.spawned.some((x) => x.id === 'mofuroo'))), '光るマスに何か置くと出る');
  assert.equal(glowCell(makeBoard(trees), ['pocha']), null, '噂を聞いていなければ光らない');
  assert.equal(glowCell(makeBoard(), found), null, '1手で出る所が無ければ光らない');
  // 噂のない②コケダマも光る（草4つの真ん中に草）
  const meadow = makeBoard({ '1,0': { ground: 'grass' }, '1,-1': { ground: 'grass' }, '0,-1': { ground: 'grass' }, '-1,0': { ground: 'grass' } });
  assert.equal(glowCell(meadow, ['pocha']).id, 'kokedama');
});
