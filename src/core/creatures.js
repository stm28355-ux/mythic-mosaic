// 生き物と置ける物のデータ。ルール（rules.js）はこのデータを読むだけで、生き物ごとの処理は書かない。
// 判定：Claude Docs「Mythic Mosaic 判定表（第3回 工程1：試作の6匹）」（2026-11-25 全部 OK）、
//       「第5回 工程4：24匹の表」（①〜⑥のあとの18匹。2026-11-25 全部 OK）。
//
// 形（R1）：「中心のマス＋隣の条件」。生き物は中心に住む。隣の条件は数だけなので、回しても同じ。
//   center: 中心のマスの条件（match）
//   around: { match, min, max } またはその並び … 隣6マスのうち match に合うマスが min 個以上・max 個以下。並びは全部そろって成り立つ
//   line:   { match, length } … 中心を真ん中に、一直線に length マス match が並ぶ（3つの向きのどれか。⑨⑲だけ）
// 効果：effect（1つ）か effects（並び。全部同時に当てる）
//   convert … 範囲の中の from に合うマスの地面を to にする（object を書けば上の物も）
//   grow    … 範囲の中の from に合うマスの上の物を object にする
//   raise   … 範囲の中の from に合うマスの高さを 1 上げる（最大 2）。withCenter が false でなければ中心も
//   lower   … 範囲の中の from に合うマスの高さを 1 下げる（最小 0）
//   clear   … 範囲の中の from に合うマスの上の物を消す
//   release … 範囲の中の生き物を帰す（帰ったマスは「変わった」に数え、次の段で調べる）
//   range: 1 なら隣6マス、2 なら2マス先まで（中心は含まない）
// hint：見つける前に図鑑に出る一言（企画まとめ「ヒントと図鑑」の最初の段。形の答えは書かない）
// 同じマスに2種類が住もうとするとどちらも出ない（D8）ので、中心の条件が重なる生き物は max で分ける。
// match に書ける物：ground（地面）、object（上に乗る物。null は何もない）、height（ちょうど）、minHeight（以上）、maxHeight（以下）、
//   creature（生き物の id、または 'any'＝どれでも）

export const GROUNDS = Object.freeze({
  barren: { name: '荒れ地' },
  grass: { name: '草' },
  water: { name: '水' },
  sand: { name: '砂' },
  marsh: { name: '湿地' },
});

export const OBJECTS = Object.freeze({
  tree: { name: '木' },
  flower: { name: '花' },
  rock: { name: '岩' },
  nest: { name: '巣' },
});

export const MAX_HEIGHT = 2;

// 人が置ける物（R6）。unlockAt＝見つけた生き物の数がこれ以上で使える、unlockBy＝その生き物を見つけたら使える
export const PLACEABLES = Object.freeze([
  { id: 'grass', name: '草', kind: 'ground', ground: 'grass', unlockAt: 0 },
  { id: 'water', name: '水', kind: 'ground', ground: 'water', unlockAt: 0 },
  { id: 'sand', name: '砂', kind: 'ground', ground: 'sand', unlockAt: 0 },
  { id: 'hill', name: '丘', kind: 'raise', unlockAt: 3 },
  { id: 'rock', name: '岩', kind: 'object', object: 'rock', unlockAt: 8 },
  { id: 'nest', name: '巣', kind: 'object', object: 'nest', unlockBy: 'mofuroo' },
  // 帰す（Issue #1）：生き物を島から帰す。地面・木・高さはそのまま、連鎖は起こさない、図鑑には残る
  { id: 'release', name: '帰す', kind: 'release', unlockAt: 0 },
]);

// 島が広がる節目。stage 1 = 37マス、stage 2 = 61マス
export const ISLAND_UNLOCKS = Object.freeze([
  { stage: 1, unlockAt: 3 },
  { stage: 2, unlockAt: 10 },
]);

const ANY = { creature: 'any' };

export const CREATURES = Object.freeze([
  // ---- 試作の6匹（第3回）----
  {
    id: 'pocha', no: 1, name: 'ポチャ', title: 'しずくの精', group: '水辺',
    center: { ground: 'water' },
    around: { match: { ground: 'water' }, min: 2, max: 4 },
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'grass' },
    text: '隣の荒れ地をすべて草にする',
    hint: '水たまりが寄り集まると、しずくが跳ねる',
  },
  {
    id: 'kokedama', no: 2, name: 'コケダマ', title: '苔の毛玉', group: '草と森',
    center: { ground: 'grass', object: null, maxHeight: 1 },
    around: { match: { ground: 'grass' }, min: 4 },
    effect: { kind: 'grow', range: 1, from: { ground: 'grass' }, object: 'tree' },
    text: '隣の草すべてに木を生やす',
    hint: '草がたっぷり茂った所で、ころころ転がる',
  },
  {
    id: 'numanushi', no: 3, name: 'ヌマヌシ', title: '沼の主の子', group: '湿地',
    center: { ground: 'water' },
    around: { match: { object: 'tree' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'grass' }, to: 'marsh' },
    text: '隣の草をすべて湿地にする',
    hint: '木陰の水辺がすみか',
  },
  {
    id: 'kerori', no: 4, name: 'ケロリ', title: '湿地のカエルの精', group: '湿地',
    center: { ground: 'marsh' },
    around: { match: { ground: 'marsh' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'sand' }, to: 'water' },
    text: '隣の砂をすべて水にする',
    hint: 'じめじめした所が大好き',
  },
  {
    id: 'sunamoguri', no: 5, name: 'スナモグリ', title: '砂の竜の子', group: '砂と丘',
    center: { ground: 'sand', maxHeight: 1 },
    around: { match: { ground: 'sand' }, min: 3 },
    effect: { kind: 'raise', range: 1, from: { ground: 'sand' } },
    text: '中心と隣の砂の高さを1上げる（最大2）',
    hint: '砂がたくさんあると、もぐりたくなる',
  },
  {
    id: 'kazenoko', no: 6, name: 'カゼノコ', title: '丘の風の子', group: '砂と丘',
    center: { height: 2 },
    around: { match: { ground: 'grass' }, min: 3 },
    effect: { kind: 'convert', range: 2, from: { ground: 'barren' }, to: 'grass' },
    text: '2マス先までの荒れ地をすべて草にする',
    hint: '丘を重ねたいちばん高い所で、草に囲まれて風を待っている',
  },

  // ---- 第5回の案（18匹）----
  {
    id: 'hasuhime', no: 7, name: 'ハスヒメ', title: '蓮の姫', group: '水辺',
    center: { ground: 'water' },
    around: [{ match: { creature: 'pocha' }, min: 1 }, { match: { object: 'tree' }, min: 1, max: 1 }, { match: { ground: 'water' }, max: 1 }],
    effect: { kind: 'grow', range: 1, from: { ground: 'water', object: null }, object: 'flower' },
    text: '隣の水すべてに花（蓮）を咲かせる',
    hint: 'しずくの精と、一本の木の影が好き',
  },
  {
    id: 'uzumaki', no: 8, name: 'ウズマキ', title: '渦の子', group: '水辺',
    center: { ground: 'water' },
    around: { match: { ground: 'water' }, min: 5 },
    effect: { kind: 'lower', range: 2, from: { minHeight: 1 } },
    text: '2マス先までの高い所を1ずつ削る',
    hint: '大きな湖の真ん中で、ぐるぐる回る',
  },
  {
    id: 'nagare', no: 9, name: 'ナガレ', title: '流れの竜', group: '水辺',
    center: { ground: 'sand', maxHeight: 1 },
    around: { match: { ground: 'sand' }, max: 1 },
    line: { match: { ground: 'water' }, length: 5 },
    effect: { kind: 'convert', range: 2, from: { ground: 'sand' }, to: 'water' },
    text: '2マス先までの砂をすべて水にする',
    hint: 'まっすぐな川の、真ん中の中洲で休む',
  },
  {
    id: 'morinoko', no: 10, name: 'モリノコ', title: '森の子守', group: '草と森',
    center: { ground: 'grass', object: 'tree' },
    around: { match: { object: 'tree' }, min: 3, max: 4 },
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'grass', object: 'tree' },
    text: '隣の荒れ地を草にして木を生やす',
    hint: '木が何本か寄り添う所で、森を広げたがる',
  },
  {
    id: 'kodama', no: 11, name: 'コダマ', title: '木霊', group: '草と森',
    center: { ground: 'grass', object: 'tree' },
    around: { match: { object: 'tree' }, min: 5 },
    effect: { kind: 'grow', range: 1, from: { object: 'tree' }, object: 'flower' },
    text: '隣の木をすべて花にする',
    hint: '深い深い森の奥で、こだまを返す',
  },
  {
    id: 'mofuroo', no: 12, name: 'モリフクロ', title: '森のふくろう', group: '草と森',
    center: { ground: 'grass', object: 'tree' },
    around: [{ match: { object: 'tree' }, min: 2, max: 2 }, { match: ANY, max: 0 }],
    effect: { kind: 'grow', range: 1, from: { ground: 'grass', object: null }, object: 'flower' },
    text: '隣の草に花を咲かせる。見つけると「巣」が置けるようになる',
    hint: 'ひっそりした木立で、ほうと鳴く',
  },
  {
    id: 'hinadori', no: 13, name: 'ヒナドリ', title: '雛鳥', group: '草と森',
    center: { ground: 'grass', object: 'nest' },
    around: { match: { object: 'tree' }, min: 2 },
    effect: { kind: 'grow', range: 2, from: { ground: 'grass', object: null }, object: 'flower' },
    text: '2マス先までの草に花を咲かせる',
    hint: '木に守られた巣で、ふ化を待っている',
  },
  {
    id: 'hanabira', no: 14, name: 'ハナビラ', title: '花びらの妖精', group: '花',
    center: { ground: 'grass', object: 'flower' },
    around: [{ match: { object: 'flower' }, min: 2 }, { match: ANY, max: 0 }],
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'grass', object: 'flower' },
    text: '隣の荒れ地を、花の咲いた草にする',
    hint: '誰もいない花畑で、ひらひら踊る',
  },
  {
    id: 'bunbun', no: 15, name: 'ブンブ', title: '蜜蜂の精', group: '花',
    center: { ground: 'grass', object: 'flower' },
    around: [{ match: { object: 'flower' }, min: 2 }, { match: ANY, min: 1 }],
    effect: { kind: 'grow', range: 1, from: { object: 'flower' }, object: 'tree' },
    text: '隣の花をすべて木にする',
    hint: 'にぎやかな花畑で、花粉を運ぶ',
  },
  {
    id: 'nijidori', no: 16, name: 'ニジドリ', title: '虹の鳥', group: '花',
    center: { height: 2, ground: 'water' },
    around: [{ match: { object: 'flower' }, min: 1 }, { match: { object: 'tree' }, min: 1, max: 1 }, { match: { ground: 'water' }, max: 1 }, { match: { ground: 'grass' }, max: 2 }],
    effect: { kind: 'convert', range: 2, from: { ground: 'barren' }, to: 'grass', object: 'flower' },
    text: '2マス先までの荒れ地を、花の咲いた草にする',
    hint: '高い泉のほとりに、花と木がそろうと虹がかかる',
  },
  {
    id: 'hitorisuna', no: 17, name: 'ヒトリスナ', title: '独りの砂狐', group: '砂と丘',
    center: { ground: 'sand', maxHeight: 1 },
    around: [{ match: { ground: 'sand' }, min: 2, max: 2 }, { match: ANY, max: 0 }],
    effect: { kind: 'convert', range: 1, from: { ground: 'grass' }, to: 'sand' },
    text: '隣の草をすべて砂にする',
    hint: '小さな砂地で、ひとりぼっちが好き',
  },
  {
    id: 'iwao', no: 18, name: 'イワオ', title: '岩の巨人の子', group: '岩と山',
    center: { ground: 'barren', object: 'rock' },
    around: { match: { minHeight: 1 }, min: 2 },
    effects: [
      { kind: 'raise', range: 1, from: { object: 'rock' }, withCenter: false },
      { kind: 'clear', range: 1, from: { object: 'rock' } },
    ],
    text: '隣の岩を砕いて、そのマスを1高くする',
    hint: '丘に囲まれた荒れ地の岩の上で、力試しをしたい',
  },
  {
    id: 'yamanami', no: 19, name: 'ヤマナミ', title: '山並みの竜', group: '岩と山',
    center: { height: 2, ground: 'sand' },
    around: [{ match: { creature: 'any' }, max: 1 }, { match: { ground: 'grass' }, max: 2 }],
    line: { match: { minHeight: 2 }, length: 3 },
    effect: { kind: 'grow', range: 2, from: { ground: 'barren', object: null }, object: 'rock' },
    text: '2マス先までの荒れ地に岩を置く',
    hint: '高い砂山が一直線に連なると、背を伸ばす',
  },
  {
    id: 'tsumuji', no: 20, name: 'ツムジ', title: 'つむじ風', group: '砂と丘',
    center: { height: 2, ground: 'sand' },
    around: [{ match: ANY, min: 2 }, { match: { ground: 'grass' }, max: 2 }],
    effect: { kind: 'release', range: 1, from: ANY },
    text: '隣の生き物をすべて帰す（風で飛ばす）',
    hint: '高い砂山のてっぺんで、にぎやかさを吹き飛ばす',
  },
  {
    id: 'hotarubi', no: 21, name: 'ホタルビ', title: '蛍の灯', group: '湿地',
    center: { ground: 'marsh' },
    around: [{ match: { creature: 'kerori' }, min: 1 }, { match: { ground: 'grass' }, min: 2 }, { match: { ground: 'marsh' }, max: 1 }, { match: ANY, max: 2 }, { match: { ground: 'sand' }, max: 1 }],
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'marsh' },
    text: '隣の荒れ地をすべて湿地にする',
    hint: 'カエルの精のそばの、草の生えた湿地で光る',
  },
  {
    id: 'kirinonushi', no: 22, name: 'キリノヌシ', title: '霧の主', group: '湿地',
    center: { ground: 'marsh' },
    around: [{ match: ANY, min: 3 }, { match: { ground: 'marsh' }, max: 1 }],
    effect: { kind: 'release', range: 1, from: ANY },
    text: '隣の生き物をすべて帰す（霧で眠らせる）',
    hint: '人だかりのできた湿地に、霧が立ちこめる',
  },
  {
    id: 'doronko', no: 23, name: 'ドロンコ', title: '泥の子', group: '湿地',
    center: { ground: 'marsh' },
    around: [{ match: { ground: 'sand' }, min: 2 }, { match: { ground: 'marsh' }, max: 1 }, { match: ANY, max: 2 }],
    effects: [
      { kind: 'convert', range: 1, from: { ground: 'sand' }, to: 'marsh' },
      { kind: 'lower', range: 1, from: { ground: 'sand', minHeight: 1 } },
    ],
    text: '隣の砂を湿地（泥）にして、1低くする',
    hint: '湿地と砂の境目で、泥遊びをする',
  },
  {
    id: 'hajimari', no: 24, name: 'ハジマリ', title: '始まりの竜', group: '始まり',
    center: { ground: 'barren' },
    around: { match: ANY, min: 6 },
    effects: [
      { kind: 'release', range: 1, from: ANY },
      { kind: 'convert', range: 2, from: { ground: 'barren' }, to: 'grass', object: 'flower' },
    ],
    text: '隣の生き物をすべて帰し、2マス先までの荒れ地を花の咲いた草にする',
    hint: '六匹に囲まれた荒れ地に、すべての始まりが眠る',
  },
]);
