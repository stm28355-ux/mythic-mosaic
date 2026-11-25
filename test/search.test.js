import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchBestChain } from '../src/core/search.js';
import { makeRng } from '../src/core/rng.js';
import { place } from '../src/core/rules.js';
import { CREATURES } from '../src/core/creatures.js';

const PROTO = CREATURES.slice(0, 6);
import { makeBoard } from './helpers.js';

const W = { ground: 'water' };
const G = { ground: 'grass' };
const S = { ground: 'sand' };
const EXAMPLE = {
  '-2,1': G, '-2,2': S, '-1,-1': S, '-1,0': W, '-1,1': G, '-1,2': G, '0,-2': S, '0,-1': W,
  '0,1': G, '0,2': G, '1,-1': S, '1,0': W, '2,-2': W, '2,-1': S, '2,0': G,
};

test('乱数は種が同じなら同じ並び', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  const xs = Array.from({ length: 5 }, () => a.next());
  assert.deepEqual(xs, Array.from({ length: 5 }, () => b.next()));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.notDeepEqual(xs, Array.from({ length: 5 }, () => makeRng(43).next()));
});

test('答え探しは判定表の盤で、水1つの4連鎖を見つける', () => {
  const { best, bestMoves, nodes } = searchBestChain(makeBoard(EXAMPLE), ['water'], { catalog: PROTO });
  assert.equal(best, 4);
  // 4連鎖になる置き場所は1つだけではない（例の (1,-2) のほかに、砂の (0,-2) を水にしても4連鎖）
  assert.equal(bestMoves.length, 1);
  const [q, r] = bestMoves[0].split(',').map(Number);
  assert.equal(place(makeBoard(EXAMPLE), q, r, 'water', { catalog: PROTO }).steps.length, 4);
  assert.ok(nodes > 0 && nodes <= 19);
});

test('答え探しは上限で打ち切る', () => {
  const r = searchBestChain(makeBoard(EXAMPLE), ['water', 'grass'], { limit: 10 });
  assert.equal(r.aborted, true);
});
