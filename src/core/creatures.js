// 生き物と置ける物のデータ。ルール（rules.js）はこのデータを読むだけで、生き物ごとの処理は書かない。
// 判定：Claude Docs「Mythic Mosaic 判定表（第3回 工程1：試作の6匹）」（2026-11-25 全部 OK）。
//
// 形（R1）：すべて「中心のマス＋隣の条件」。生き物は中心に住む。隣の条件は数だけなので、回しても同じ。
//   center: 中心のマスの条件（match）
//   around: { match, min } … 隣6マスのうち match に合うマスが min 個以上
// 効果：
//   convert … 範囲の中の from に合うマスの地面を to にする
//   grow    … 範囲の中の from に合うマスに上に乗る物 object を置く
//   raise   … 中心と、範囲の中の from に合うマスの高さを 1 上げる（最大 2）
//   range: 1 なら隣6マス、2 なら2マス先まで（中心は含まない）
// hint：見つける前に図鑑に出る一言（企画まとめ「ヒントと図鑑」の最初の段。形の答えは書かない）
// match に書ける物：ground（地面）、object（上に乗る物。null は何もない）、height（ちょうど）、minHeight（以上）

export const GROUNDS = Object.freeze({
  barren: { name: '荒れ地' },
  grass: { name: '草' },
  water: { name: '水' },
  sand: { name: '砂' },
  marsh: { name: '湿地' },
});

export const OBJECTS = Object.freeze({
  tree: { name: '木' },
});

export const MAX_HEIGHT = 2;

// 人が置ける物（R6）。unlockAt＝見つけた生き物の数がこれ以上で使える
export const PLACEABLES = Object.freeze([
  { id: 'grass', name: '草', kind: 'ground', ground: 'grass', unlockAt: 0 },
  { id: 'water', name: '水', kind: 'ground', ground: 'water', unlockAt: 0 },
  { id: 'sand', name: '砂', kind: 'ground', ground: 'sand', unlockAt: 0 },
  { id: 'hill', name: '丘', kind: 'raise', unlockAt: 3 },
]);

// 島が広がる節目（R7、試作だけの数）。stage 1 = 37マス。61マスは24匹の表から。
export const ISLAND_UNLOCKS = Object.freeze([
  { stage: 1, unlockAt: 3 },
]);

export const CREATURES = Object.freeze([
  {
    id: 'pocha', no: 1, name: 'ポチャ', title: 'しずくの精',
    center: { ground: 'water' },
    around: { match: { ground: 'water' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'grass' },
    text: '隣の荒れ地をすべて草にする',
    hint: '水たまりが寄り集まると、しずくが跳ねる',
  },
  {
    id: 'kokedama', no: 2, name: 'コケダマ', title: '苔の毛玉',
    center: { ground: 'grass' },
    around: { match: { ground: 'grass' }, min: 4 },
    effect: { kind: 'grow', range: 1, from: { ground: 'grass' }, object: 'tree' },
    text: '隣の草すべてに木を生やす',
    hint: '草がたっぷり茂った所で、ころころ転がる',
  },
  {
    id: 'numanushi', no: 3, name: 'ヌマヌシ', title: '沼の主の子',
    center: { ground: 'water' },
    around: { match: { object: 'tree' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'grass' }, to: 'marsh' },
    text: '隣の草をすべて湿地にする',
    hint: '木陰の水辺がすみか',
  },
  {
    id: 'kerori', no: 4, name: 'ケロリ', title: '湿地のカエルの精',
    center: { ground: 'marsh' },
    around: { match: { ground: 'marsh' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'sand' }, to: 'water' },
    text: '隣の砂をすべて水にする',
    hint: 'じめじめした所が大好き',
  },
  {
    id: 'sunamoguri', no: 5, name: 'スナモグリ', title: '砂の竜の子',
    center: { ground: 'sand' },
    around: { match: { ground: 'sand' }, min: 3 },
    effect: { kind: 'raise', range: 1, from: { ground: 'sand' } },
    text: '中心と隣の砂の高さを1上げる（最大2）',
    hint: '砂がたくさんあると、もぐりたくなる',
  },
  {
    id: 'kazenoko', no: 6, name: 'カゼノコ', title: '丘の風の子',
    center: { height: 2 },
    around: { match: { ground: 'grass' }, min: 3 },
    effect: { kind: 'convert', range: 2, from: { ground: 'barren' }, to: 'grass' },
    text: '2マス先までの荒れ地をすべて草にする',
    hint: 'いちばん高い丘の上で、風を待っている',
  },
]);
