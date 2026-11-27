// 実績（判定表 第6回 J1〜J33・K1〜K6）。
// 判定は「今の手の結果＋今の盤＋図鑑」だけを見る（K2）。長い数え上げはしない。
// 取った実績は消えない（K1）。ごほうびは見た目だけで、絵は工程7（K6）。
import { CREATURES } from './creatures.js';
import { rumorHeard } from './hints.js';
import { PUZZLES } from '../data/puzzles.js';
import { MAPS } from '../data/maps.js';
import { starsOf, bestScore } from './score.js';

const has = (found, ids) => ids.every((id) => found.includes(id));
const groupIds = (g) => CREATURES.filter((c) => c.group === g).map((c) => c.id);
const cellsOf = (board) => Object.values(board.cells);
const spawnedAll = (steps) => steps.flatMap((s) => s.spawned);
// その段で効果により帰ったマス（spawnedBoard では居て、段のあとに居ない）
const goneIn = (st) => Object.keys(st.board.cells).filter((k) => st.spawnedBoard.cells[k].creature && !st.board.cells[k].creature);

// ctx: { steps, before, board, found, cleared, best, puzzleOnly }（puzzleOnly＝問題の盤なので、問題の実績だけ見る）
//   steps … 今の手の段（帰す・読み込み直後は []）、before … 手の前の盤（無いときは null）、
//   board … 手の後の盤、found … 手の後の図鑑
const group = (id, name, g, reward) => ({
  id, kind: '図鑑（組）', name, text: `${g}の組（${groupIds(g).map((x) => CREATURES.find((c) => c.id === x).name).join('・')}）をそろえる`,
  reward, check: ({ found }) => has(found, groupIds(g)),
});

export const ACHIEVEMENTS = Object.freeze([
  { id: 'first', kind: '図鑑', name: 'はじめまして', text: 'はじめて生き物を見つける', reward: '称号', check: ({ found }) => found.length >= 1 },
  { id: 'half', kind: '図鑑', name: '半分の図鑑', text: '12匹見つける', reward: '図鑑の枠（銅）', check: ({ found }) => found.length >= 12 },
  { id: 'all', kind: '図鑑', name: '島のものしり', text: `${CREATURES.length}匹全部見つける`, reward: '図鑑の枠（金）', check: ({ found }) => found.length >= CREATURES.length },
  { id: 'rumors', kind: '図鑑', name: '噂の聞き手', text: `噂を全部（${CREATURES.filter((c) => c.rumor).length}）聞く`, reward: '図鑑の枠（銀）',
    check: ({ found }) => CREATURES.every((c) => !c.rumor || rumorHeard(c, found)) },
  group('g-water', '水辺の友', '水辺', '島の飾り：蓮の葉'),
  group('g-forest', '森の友', '草と森', '島の飾り：大きな木'),
  group('g-flower', '花の友', '花', '島の飾り：花のアーチ'),
  group('g-dune', '砂丘の友', '砂と丘', '島の飾り：風車'),
  group('g-mountain', '山の友', '岩と山', '島の飾り：立ち石'),
  group('g-marsh', '沼の友', '湿地', '島の飾り：蛍の灯り'),
  { id: 'hajimari', kind: '図鑑', name: '始まりに会う', text: 'ハジマリを見つける', reward: '島の飾り：竜の卵', check: ({ found }) => found.includes('hajimari') },

  { id: 'chain2', kind: '連鎖', name: 'つながり', text: '2連鎖', reward: '称号', check: ({ steps }) => steps.length >= 2 },
  { id: 'chain3', kind: '連鎖', name: 'ひろがり', text: '3連鎖', reward: '称号', check: ({ steps }) => steps.length >= 3 },
  { id: 'chain5', kind: '連鎖', name: 'うずまく連鎖', text: '5連鎖', reward: '称号', check: ({ steps }) => steps.length >= 5 },
  { id: 'chain7', kind: '連鎖', name: '島じゅうの目覚め', text: '7連鎖', reward: '称号', check: ({ steps }) => steps.length >= 7 },
  { id: 'crowd10', kind: '連鎖', name: 'にぎやかな一手', text: '1回の手で生き物10匹', reward: '称号', check: ({ steps }) => spawnedAll(steps).length >= 10 },
  { id: 'kinds8', kind: '連鎖', name: 'いろどりの一手', text: '1回の手で8種類', reward: '称号', check: ({ steps }) => new Set(spawnedAll(steps).map((x) => x.id)).size >= 8 },
  { id: 'same5', kind: '連鎖', name: '大繁盛', text: '1つの段で同じ種類が5匹', reward: '称号',
    check: ({ steps }) => steps.some((s) => {
      const n = {};
      for (const x of s.spawned) n[x.id] = (n[x.id] ?? 0) + 1;
      return Object.values(n).some((v) => v >= 5);
    }) },

  { id: 'stage1', kind: '島', name: '島が広がる', text: '37マスに広げる', reward: '称号', check: ({ board }) => board.stage >= 1 },
  { id: 'stage2', kind: '島', name: '大きな島', text: '61マスに広げる', reward: '称号', check: ({ board }) => board.stage >= 2 },
  { id: 'grounds', kind: '島', name: '五つの地面', text: '荒れ地・草・水・砂・湿地が島にそろう', reward: '称号',
    // はじまりの島の5つ（火の山の島の灰・溶岩は数えない）
    check: ({ board }) => { const g = new Set(cellsOf(board).map((c) => c.ground)); return ['barren', 'grass', 'water', 'sand', 'marsh'].every((x) => g.has(x)); } },
  { id: 'nobarren', kind: '島', name: '荒れ地のない島', text: '61マスの島に荒れ地が1つもない', reward: '称号',
    check: ({ board }) => board.stage >= 2 && cellsOf(board).every((c) => c.ground !== 'barren') },
  { id: 'full', kind: '島', name: '満員の島', text: '61マスが全部生き物で埋まる', reward: '称号',
    check: ({ board }) => board.stage >= 2 && cellsOf(board).every((c) => c.creature) },
  { id: 'high20', kind: '島', name: '高い島', text: '高さ2のマスが20', reward: '称号', check: ({ board }) => cellsOf(board).filter((c) => c.height === 2).length >= 20 },

  { id: 'puzzle1', kind: '問題とスコア', name: 'はじめの一問', text: '連鎖問題を1問解く', reward: '称号', puzzle: true, check: ({ cleared }) => cleared.length >= 1 },
  { id: 'puzzleAll', kind: '問題とスコア', name: '連鎖の達人', text: '連鎖問題を全部解く', reward: '図鑑の枠（虹）', puzzle: true,
    check: ({ cleared }) => PUZZLES.length > 0 && PUZZLES.every((p) => cleared.includes(p.id)) },
  { id: 'scoreAll', kind: '問題とスコア', name: '島づくりの名人', text: 'スコアアタックの全部の面で★2', reward: '島の飾り：灯台', puzzle: true,
    check: ({ best = {} }) => MAPS.every((m) => starsOf(m, bestScore(best[m.id])) >= 2) },

  // ふしぎ：取るまで名前も条件も隠し、なぞかけ（teaser）だけ出す（K5）
  { id: 'clash', kind: 'ふしぎ', hidden: true, name: '首かしげ', text: '効果がぶつかって、そのマスが変わらない', teaser: '生き物どうしの頼みごとが、ぶつかると…？', reward: '称号',
    check: ({ steps }) => steps.some((s) => s.clashes.length > 0) },
  { id: 'blocked', kind: 'ふしぎ', hidden: true, name: '取り合い', text: '2種類が同じマスを狙って、どちらも出ない', teaser: '住みたい所が同じだと…？', reward: '称号',
    check: ({ steps }) => steps.some((s) => s.blocked.length > 0) },
  { id: 'reborn', kind: 'ふしぎ', hidden: true, name: 'また会えたね', text: '効果で帰った種類が、同じ連鎖のうちにまた現れる', teaser: 'さよならのすぐあとに…？', reward: '称号',
    check: ({ steps }) => steps.some((s, i) => {
      const gone = goneIn(s).map((k) => s.spawnedBoard.cells[k].creature);
      return gone.length > 0 && steps.slice(i + 1).some((t) => t.spawned.some((x) => gone.includes(x.id)));
    }) },
  { id: 'wind', kind: 'ふしぎ', hidden: true, name: '始まりの風', text: 'ハジマリが隣の6匹を帰す', teaser: '始まりは、みんなを送り出すことから…？', reward: '称号',
    check: ({ steps }) => steps.some((s) => s.spawned.some((x) => x.id === 'hajimari') && goneIn(s).length >= 6) },
  { id: 'remake', kind: 'ふしぎ', hidden: true, name: '大変身', text: '1回の手で25マス以上の土地が変わる', teaser: '一手で島の顔が変わるほど…？', reward: '称号',
    check: ({ before, board }) => Boolean(before) && cellsOf(board).filter((c) => {
      const b = before.cells[`${c.q},${c.r}`];
      return b && (b.ground !== c.ground || b.object !== c.object || b.height !== c.height);
    }).length >= 25 },
  { id: 'pocha', kind: 'ふしぎ', hidden: true, name: 'ポチャの国', text: '島の生き物が10匹以上で、全部ポチャ', teaser: 'しずくだけの島…？', reward: '称号',
    check: ({ board }) => {
      const living = cellsOf(board).filter((c) => c.creature);
      return living.length >= 10 && living.every((c) => c.creature === 'pocha');
    } },
]);

// まだ取っていない実績のうち、今取れたもの（id の並び）
export function newAchievements(have, ctx) {
  const c = { steps: [], before: null, cleared: [], ...ctx };
  return ACHIEVEMENTS.filter((a) => !have.includes(a.id) && (!c.puzzleOnly || a.puzzle) && a.check(c)).map((a) => a.id);
}
