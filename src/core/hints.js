// ヒントの段（判定表 第6回 V1〜V6）。画面は持たず、図鑑と盤に出す中身だけを作る。
//   1段目 一言（hint）… 最初から
//   2段目 噂と使う物 … 噂を言う生き物（rumor.by）のどれかを見つけたら。噂のない①②⑤は使う物を最初から
//   3段目 光る所     … 新しい生き物が STUCK_MOVES 手出ないとき、使う物が分かっているまだの生き物（噂を聞いた生き物と、噂のない①②⑤）が「あと1手で出る所」を1つ
//   4段目 形の全部   … 見つけたあと（図鑑）
import { CREATURES, PLACEABLES, GROUNDS, OBJECTS } from './creatures.js';
import { place, whyNotPlace, isOpen } from './rules.js';

export const STUCK_MOVES = 20;

const byId = Object.fromEntries(CREATURES.map((c) => [c.id, c]));

// 噂を聞いたか（言う生き物のどれかを見つけている）
export function rumorHeard(creature, found) {
  return Boolean(creature.rumor) && creature.rumor.by.some((id) => found.includes(id));
}

// 図鑑のその生き物の段：'found'（見つけた）／'rumor'（噂あり）／'hint'（一言だけ）
export function hintLevel(creature, found) {
  if (found.includes(creature.id)) return 'found';
  if (rumorHeard(creature, found)) return 'rumor';
  return 'hint';
}

// 使う物を見せてよいか（噂を聞いた、または噂のない生き物）
export function usesShown(creature, found) {
  return !creature.rumor || rumorHeard(creature, found);
}

// 形に使う物の名前（地面・上の物・高さ・生き物）。「〜まで」「いない」だけの条件と数は出さない
export function usesOf(creature) {
  const out = [];
  const add = (name) => { if (!out.includes(name)) out.push(name); };
  const take = (m) => {
    if (m.ground) add(GROUNDS[m.ground].name);
    if (m.object) add(OBJECTS[m.object].name);
    if ((m.height ?? 0) >= 1 || (m.minHeight ?? 0) >= 1) add('高さ');
    if (m.creature) add(m.creature === 'any' ? '生き物' : byId[m.creature].name);
  };
  take(creature.center);
  const arounds = creature.around ? (Array.isArray(creature.around) ? creature.around : [creature.around]) : [];
  for (const a of arounds) if ((a.min ?? 0) >= 1) take(a.match);
  if (creature.line) take(creature.line.match);
  return out;
}

// 1つの手で新しく噂が聞けるようになった生き物（前と後の図鑑をくらべる）
export function newRumors(before, after) {
  return CREATURES.filter((c) => !after.includes(c.id) && !rumorHeard(c, before) && rumorHeard(c, after));
}

// 3段目：使う物が分かっているまだの生き物（噂を聞いた生き物と、噂のない①②⑤）が、今の盤で1手で出る所。{ key, id } か null
// 置く物は教えないので、マスだけ返す。マスは決まった順に調べる（同じ盤なら同じ所が光る）
export function glowCell(board, found, { catalog = CREATURES } = {}) {
  const targets = new Set(catalog.filter((c) => !found.includes(c.id) && usesShown(c, found)).map((c) => c.id));
  if (targets.size === 0) return null;
  const items = PLACEABLES.filter((p) => p.kind !== 'release' && isOpen(p, found)).map((p) => p.id);
  const cells = Object.values(board.cells).sort((a, b) => a.r - b.r || a.q - b.q);
  for (const c of cells) {
    for (const it of items) {
      if (whyNotPlace(board, c.q, c.r, it, found)) continue;
      const r = place(board, c.q, c.r, it, { catalog, found });
      const hit = r.steps.flatMap((s) => s.spawned).find((x) => targets.has(x.id));
      if (hit) return { key: `${c.q},${c.r}`, id: hit.id };
    }
  }
  return null;
}
