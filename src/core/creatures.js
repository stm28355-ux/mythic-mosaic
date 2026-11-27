// 生き物と置ける物のデータ。ルール（rules.js）はこのデータを読むだけで、生き物ごとの処理は書かない。
// 判定：Claude Docs「Mythic Mosaic 判定表（第3回 工程1：試作の6匹）」（2026-11-25 全部 OK）、
//       「第5回 工程4：24匹の表」（①〜⑥のあとの18匹。2026-11-25 全部 OK）、
//       「第6回 工程4：噂と実績」（噂。2026-11-25 全部 OK）。
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
// no：図鑑の番号（判定表 第31回 N1・N2：巣の2匹は組の仲間の後、ハジマリははじまりの島の最後㉖、ヒノヤマヌシは火の山の最後㊽）。並びの順は追加した順のまま
// rumor：by の生き物のどれかを見つけると聞ける噂（2段目。判定表 第6回 U1〜U21）。①②⑤は最初に見つかるので噂はない。
// 火の山の生き物と巣の2匹の噂は判定表 第24回（㉕ヒノコ・㉖ハイモグラは火の山の最初の2匹なので噂はない）
// 同じマスに2種類が住もうとするとどちらも出ない（D8）ので、中心の条件が重なる生き物は max で分ける。
// match に書ける物：ground（地面）、object（上に乗る物。null は何もない）、height（ちょうど）、minHeight（以上）、maxHeight（以下）、
//   creature（生き物の id、または 'any'＝どれでも）

export const GROUNDS = Object.freeze({
  barren: { name: '荒れ地' },
  grass: { name: '草' },
  water: { name: '水' },
  sand: { name: '砂' },
  marsh: { name: '湿地' },
  // 第2の島（判定表 第16回）
  ash: { name: '灰' },
  lava: { name: '溶岩' },
});

export const OBJECTS = Object.freeze({
  tree: { name: '木' },
  flower: { name: '花' },
  rock: { name: '岩' },
  nest: { name: '巣' },
  // 第2の島（判定表 第16回）：薪と種は手で置く。炎は生き物だけが出す（第15回 K3）
  firewood: { name: '薪' },
  seed: { name: '種' },
  fire: { name: '炎' },
});

export const MAX_HEIGHT = 2;

// 人が置ける物（R6）。unlockAt＝見つけた生き物の数がこれ以上で使える、unlockBy＝その生き物を見つけたら使える、
// unlock2＝第2の島の生き物をこの数見つけたら使える、islands＝置ける島（書かなければどちらでも。第16回 案②：島ごとに8つ）
export const PLACEABLES = Object.freeze([
  { id: 'grass', name: '草', kind: 'ground', ground: 'grass', unlockAt: 0 },
  // 水は火の山の島では手で置けない。㉛カコウコなど生き物だけが出す（判定表 第19回 U6：湿地と同じ考え）
  { id: 'water', name: '水', kind: 'ground', ground: 'water', unlockAt: 0, islands: [1] },
  { id: 'sand', name: '砂', kind: 'ground', ground: 'sand', unlockAt: 0, islands: [1] },
  { id: 'hill', name: '丘', kind: 'raise', unlockAt: 3 },
  // 谷：高さを1下げる。第2の島で開くと、第1の島でも使える（第16回 I5）
  { id: 'valley', name: '谷', kind: 'lower', unlock2: 3 },
  { id: 'rock', name: '岩', kind: 'object', object: 'rock', unlockAt: 8, islands: [1] },
  { id: 'nest', name: '巣', kind: 'object', object: 'nest', unlockBy: 'mofuroo', islands: [1] },
  // 第2の島の物（島を渡れる図鑑20匹で開く。種は第2の島の生き物5匹）
  { id: 'ash', name: '灰', kind: 'ground', ground: 'ash', unlockAt: 20, islands: [2] },
  { id: 'lava', name: '溶岩', kind: 'ground', ground: 'lava', unlockAt: 20, islands: [2] },
  { id: 'firewood', name: '薪', kind: 'object', object: 'firewood', unlockAt: 20, islands: [2] },
  { id: 'seed', name: '種', kind: 'object', object: 'seed', unlock2: 5, islands: [2] },
  // 帰す（Issue #1）：生き物を島から帰す。地面・木・高さはそのまま、連鎖は起こさない、図鑑には残る
  { id: 'release', name: '帰す', kind: 'release', unlockAt: 0 },
]);

// 島が広がる節目。stage 1 = 37マス、stage 2 = 61マス
export const ISLAND_UNLOCKS = Object.freeze([
  { stage: 1, unlockAt: 3 },
  { stage: 2, unlockAt: 10 },
]);

// 2つの島（判定表 第15回・第16回）。items＝その島の置く物の並び（8つ）、late＝その島でだけ遅れて開く物（第2の島の生き物の数）、
// openAt＝渡れるようになる図鑑の数、unlocks＝第2の島が広がる節目（第2の島の生き物の数）
export const ISLANDS = Object.freeze({
  1: Object.freeze({ name: 'はじまりの島', items: ['grass', 'water', 'sand', 'hill', 'valley', 'rock', 'nest', 'release'] }),
  2: Object.freeze({
    name: '火の山の島', items: ['grass', 'ash', 'lava', 'hill', 'valley', 'firewood', 'seed', 'release'],
    late: { hill: 3 }, openAt: 20,
    unlocks: [{ stage: 1, unlock2: 3 }, { stage: 2, unlock2: 6 }],
  }),
});

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
    rumor: { by: ['kokedama'], text: '水辺に木が2本並ぶと、沼の主の子が顔を出すんだって' },
  },
  {
    id: 'kerori', no: 4, name: 'ケロリ', title: '湿地のカエルの精', group: '湿地',
    center: { ground: 'marsh' },
    around: { match: { ground: 'marsh' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'sand' }, to: 'water' },
    text: '隣の砂をすべて水にする',
    hint: 'じめじめした所が大好き',
    rumor: { by: ['numanushi'], text: 'ぼくが作った湿地を3つ寄せてごらん。ケロケロ聞こえるよ' },
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
    rumor: { by: ['sunamoguri'], text: '砂山に丘をもう1段のせると、てっぺんに風が来る。まわりは草がいい' },
  },

  // ---- 第5回の案（18匹）----
  {
    id: 'hasuhime', no: 7, name: 'ハスヒメ', title: '蓮の姫', group: '水辺',
    center: { ground: 'water' },
    around: [{ match: { creature: 'pocha' }, min: 1 }, { match: { object: 'tree' }, min: 1, max: 1 }, { match: { ground: 'water' }, max: 1 }],
    effect: { kind: 'grow', range: 1, from: { ground: 'water', object: null }, object: 'flower' },
    text: '隣の水すべてに花（蓮）を咲かせる',
    hint: 'しずくの精と、一本の木の影が好き',
    rumor: { by: ['pocha'], text: 'ぼくのそばの水に、木の影が1つだけ落ちると、蓮の姫が来る' },
  },
  {
    id: 'uzumaki', no: 8, name: 'ウズマキ', title: '渦の子', group: '水辺',
    center: { ground: 'water' },
    around: { match: { ground: 'water' }, min: 5 },
    effect: { kind: 'lower', range: 2, from: { minHeight: 1 } },
    text: '2マス先までの高い所を1ずつ削る',
    hint: '大きな湖の真ん中で、ぐるぐる回る',
    rumor: { by: ['pocha'], text: 'ぼくは水4つまでの池が好き。もっと大きな湖だと、渦の子のもの' },
  },
  {
    id: 'nagare', no: 9, name: 'ナガレ', title: '流れの竜', group: '水辺',
    center: { ground: 'sand', maxHeight: 1 },
    around: { match: { ground: 'sand' }, max: 1 },
    line: { match: { ground: 'water' }, length: 5 },
    effect: { kind: 'convert', range: 2, from: { ground: 'sand' }, to: 'water' },
    text: '2マス先までの砂をすべて水にする',
    hint: 'まっすぐな川の、真ん中の中洲で休む',
    rumor: { by: ['uzumaki', 'doronko'], text: 'まっすぐ5マスの川。真ん中だけ砂にしておくと、竜がひと休みする' },
  },
  {
    id: 'morinoko', no: 10, name: 'モリノコ', title: '森の子守', group: '草と森',
    center: { ground: 'grass', object: 'tree' },
    around: { match: { object: 'tree' }, min: 3, max: 4 },
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'grass', object: 'tree' },
    text: '隣の荒れ地を草にして木を生やす',
    hint: '木が何本か寄り添う所で、森を広げたがる',
    rumor: { by: ['kokedama'], text: 'ぼくが生やした木の1本が、ほかの木にぐるり囲まれると、森の子守が来る' },
  },
  {
    id: 'kodama', no: 11, name: 'コダマ', title: '木霊', group: '草と森',
    center: { ground: 'grass', object: 'tree' },
    around: { match: { object: 'tree' }, min: 5 },
    effect: { kind: 'grow', range: 1, from: { object: 'tree' }, object: 'flower' },
    text: '隣の木をすべて花にする',
    hint: '深い深い森の奥で、こだまを返す',
    rumor: { by: ['morinoko'], text: '木のまわりをほとんど木にしてごらん。森の奥から声が返ってくる' },
  },
  {
    id: 'mofuroo', no: 12, name: 'モリフクロ', title: '森のふくろう', group: '草と森',
    center: { ground: 'grass', object: 'tree' },
    around: [{ match: { object: 'tree' }, min: 2, max: 2 }, { match: ANY, max: 0 }],
    effect: { kind: 'grow', range: 1, from: { ground: 'grass', object: null }, object: 'flower' },
    text: '隣の草に花を咲かせる。見つけると「巣」が置けるようになる',
    hint: 'ひっそりした木立で、ほうと鳴く',
    rumor: { by: ['morinoko'], text: '木が3本だけの小さな木立。ふくろうは、そばに誰もいない時だけ来る' },
  },
  {
    id: 'hinadori', no: 13, name: 'ヒナドリ', title: '雛鳥', group: '草と森',
    center: { ground: 'grass', object: 'nest' },
    around: { match: { object: 'tree' }, min: 2 },
    effect: { kind: 'grow', range: 2, from: { ground: 'grass', object: null }, object: 'flower' },
    text: '2マス先までの草に花を咲かせる',
    hint: '木に守られた巣で、ふ化を待っている',
    rumor: { by: ['mofuroo'], text: '巣は草の上に置いて。木が2本見守っていれば、雛がかえる' },
  },
  {
    id: 'hanabira', no: 15, name: 'ハナビラ', title: '花びらの妖精', group: '花',
    center: { ground: 'grass', object: 'flower' },
    around: [{ match: { object: 'flower' }, min: 2 }, { match: ANY, max: 0 }],
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'grass', object: 'flower' },
    text: '隣の荒れ地を、花の咲いた草にする',
    hint: '誰もいない花畑で、ひらひら踊る',
    rumor: { by: ['hinadori', 'bunbun'], text: '花に囲まれた花。でもそばに誰かいると恥ずかしがる。先に帰してあげて' },
  },
  {
    id: 'bunbun', no: 16, name: 'ブンブ', title: '蜜蜂の精', group: '花',
    center: { ground: 'grass', object: 'flower' },
    around: [{ match: { object: 'flower' }, min: 2 }, { match: ANY, min: 1 }],
    effect: { kind: 'grow', range: 1, from: { object: 'flower' }, object: 'tree' },
    text: '隣の花をすべて木にする',
    hint: 'にぎやかな花畑で、花粉を運ぶ',
    rumor: { by: ['kodama'], text: 'ぼくが咲かせた花畑に、誰か1匹でもいると、蜜蜂がにぎやかに来る' },
  },
  {
    id: 'nijidori', no: 17, name: 'ニジドリ', title: '虹の鳥', group: '花',
    center: { height: 2, ground: 'water' },
    around: [{ match: { object: 'flower' }, min: 1 }, { match: { object: 'tree' }, min: 1, max: 1 }, { match: { ground: 'water' }, max: 1 }, { match: { ground: 'grass' }, max: 2 }],
    effect: { kind: 'convert', range: 2, from: { ground: 'barren' }, to: 'grass', object: 'flower' },
    text: '2マス先までの荒れ地を、花の咲いた草にする',
    hint: '高い泉のほとりに、花と木がそろうと虹がかかる',
    rumor: { by: ['kazenoko', 'hasuhime'], text: '高い所の水。花が咲いて、木が1本。虹はそこにかかる' },
  },
  {
    id: 'hitorisuna', no: 18, name: 'ヒトリスナ', title: '独りの砂狐', group: '砂と丘',
    center: { ground: 'sand', maxHeight: 1 },
    around: [{ match: { ground: 'sand' }, min: 2, max: 2 }, { match: ANY, max: 0 }],
    effect: { kind: 'convert', range: 1, from: { ground: 'grass' }, to: 'sand' },
    text: '隣の草をすべて砂にする',
    hint: '小さな砂地で、ひとりぼっちが好き',
    rumor: { by: ['sunamoguri'], text: '砂が3つだけの小さな砂地。ひとりが好きな子がいる' },
  },
  {
    id: 'iwao', no: 19, name: 'イワオ', title: '岩の巨人の子', group: '岩と山',
    center: { ground: 'barren', object: 'rock' },
    around: { match: { minHeight: 1 }, min: 2 },
    effects: [
      { kind: 'raise', range: 1, from: { object: 'rock' }, withCenter: false },
      { kind: 'clear', range: 1, from: { object: 'rock' } },
    ],
    text: '隣の岩を砕いて、そのマスを1高くする',
    hint: '丘に囲まれた荒れ地の岩の上で、力試しをしたい',
    rumor: { by: ['hitorisuna'], text: '荒れ地の岩を、丘で2つ以上囲んでごらん' },
  },
  {
    id: 'yamanami', no: 21, name: 'ヤマナミ', title: '山並みの竜', group: '岩と山',
    center: { height: 2, ground: 'sand' },
    around: [{ match: { creature: 'any' }, max: 1 }, { match: { ground: 'grass' }, max: 2 }],
    line: { match: { minHeight: 2 }, length: 3 },
    effect: { kind: 'grow', range: 2, from: { ground: 'barren', object: null }, object: 'rock' },
    text: '2マス先までの荒れ地に岩を置く',
    hint: '高い砂山が一直線に連なると、背を伸ばす',
    rumor: { by: ['iwao', 'nagare'], text: '高い砂山を3つ、まっすぐ並べると、竜が背を伸ばす' },
  },
  {
    id: 'tsumuji', no: 22, name: 'ツムジ', title: 'つむじ風', group: '砂と丘',
    center: { height: 2, ground: 'sand' },
    around: [{ match: ANY, min: 2 }, { match: { ground: 'grass' }, max: 2 }],
    effect: { kind: 'release', range: 1, from: ANY },
    text: '隣の生き物をすべて帰す（風で飛ばす）',
    hint: '高い砂山のてっぺんで、にぎやかさを吹き飛ばす',
    rumor: { by: ['kazenoko', 'yamanami'], text: '高い砂山のてっぺん。まわりに2匹以上いると、つむじ風が吹く' },
  },
  {
    id: 'hotarubi', no: 23, name: 'ホタルビ', title: '蛍の灯', group: '湿地',
    center: { ground: 'marsh' },
    around: [{ match: { creature: 'kerori' }, min: 1 }, { match: { ground: 'grass' }, min: 2 }, { match: { ground: 'marsh' }, max: 1 }, { match: ANY, max: 2 }, { match: { ground: 'sand' }, max: 1 }],
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'marsh' },
    text: '隣の荒れ地をすべて湿地にする',
    hint: 'カエルの精のそばの、草の生えた湿地で光る',
    rumor: { by: ['kerori'], text: 'ぼくのそばの湿地に、草が2つあれば灯がともる' },
  },
  {
    id: 'kirinonushi', no: 24, name: 'キリノヌシ', title: '霧の主', group: '湿地',
    center: { ground: 'marsh' },
    around: [{ match: ANY, min: 3 }, { match: { ground: 'marsh' }, max: 1 }],
    effect: { kind: 'release', range: 1, from: ANY },
    text: '隣の生き物をすべて帰す（霧で眠らせる）',
    hint: '人だかりのできた湿地に、霧が立ちこめる',
    rumor: { by: ['tsumuji', 'hotarubi'], text: '湿地のまわりに3匹集まると、霧の主が来てみんな眠らせちゃう' },
  },
  {
    id: 'doronko', no: 25, name: 'ドロンコ', title: '泥の子', group: '湿地',
    center: { ground: 'marsh' },
    around: [{ match: { ground: 'sand' }, min: 2 }, { match: { ground: 'marsh' }, max: 1 }, { match: ANY, max: 2 }],
    effects: [
      { kind: 'convert', range: 1, from: { ground: 'sand' }, to: 'marsh' },
      { kind: 'lower', range: 1, from: { ground: 'sand', minHeight: 1 } },
    ],
    text: '隣の砂を湿地（泥）にして、1低くする',
    hint: '湿地と砂の境目で、泥遊びをする',
    rumor: { by: ['kerori'], text: '湿地のそばに砂が2つ。泥遊びにちょうどいい' },
  },
  {
    id: 'hajimari', no: 26, name: 'ハジマリ', title: '始まりの竜', group: '始まり',
    center: { ground: 'barren' },
    around: { match: ANY, min: 6 },
    effects: [
      { kind: 'release', range: 1, from: ANY },
      { kind: 'convert', range: 2, from: { ground: 'barren' }, to: 'grass', object: 'flower' },
    ],
    text: '隣の生き物をすべて帰し、2マス先までの荒れ地を花の咲いた草にする',
    hint: '六匹に囲まれた荒れ地に、すべての始まりが眠る',
    rumor: { by: ['nijidori', 'kirinonushi'], text: '6匹に囲まれた荒れ地。最後のひと押しは、丘' },
  },

  // ---- 第2の島「火の山の島」の試作6匹（判定表 第16回。噂はまだ無い＝使う物を最初から見せる）----
  {
    id: 'hinoko', no: 27, name: 'ヒノコ', title: '火の子', group: '火の山', island: 2,
    center: { ground: 'lava' },
    around: { match: { object: 'firewood' }, min: 1 },
    effect: { kind: 'grow', range: 1, from: { object: 'firewood' }, object: 'fire' },
    text: '隣の薪すべてに火をつける（炎にする）',
    hint: '熱い所のそばに、燃える物があると',
  },
  {
    id: 'haimogura', no: 28, name: 'ハイモグラ', title: '灰の子', group: '火の山', island: 2,
    center: { ground: 'ash', object: null, height: 0 },
    around: { match: { ground: 'ash' }, min: 3 },
    effect: { kind: 'convert', range: 1, from: { ground: 'ash' }, to: 'grass' },
    text: '隣の灰をすべて草にする（灰は肥やし）',
    hint: '灰がたっぷり積もった所にもぐる',
  },
  {
    id: 'tsukisusu', no: 29, name: 'ツキスス', title: '突進の子', group: '火の山', island: 2,
    center: { ground: 'ash', minHeight: 1 },
    around: { match: ANY, min: 2 },
    effect: { kind: 'push', range: 1, from: ANY },
    rumor: { by: ['haimogura'], text: '丘で高くした灰のまわりに2匹以上集まると、突っこんでくる子がいるんだって' },
    text: '隣の生き物を、反対側へ1マス押す（島の外なら帰る）',
    hint: '高い灰の上で、にぎやかな所に突っこむ',
  },
  {
    id: 'tanebouzu', no: 30, name: 'タネボウズ', title: '種の子', group: '火の山', island: 2,
    center: { ground: 'ash', object: 'seed' },
    around: { match: { ground: 'grass' }, min: 2 },
    effect: { kind: 'grow', range: 1, from: { ground: 'grass' }, object: 'flower' },
    rumor: { by: ['haimogura'], text: 'ぼくが草にした所のそばの灰に、種をまいてごらん。草が2つあれば芽が出る' },
    text: '隣の草すべてに花を咲かせる',
    hint: '灰にまいた種が、草に囲まれると',
  },
  {
    id: 'fuigo', no: 31, name: 'フイゴ', title: 'ふいごの風', group: '火の山', island: 2,
    center: { object: 'fire' },
    around: [{ match: ANY, min: 1 }, { match: { object: 'firewood' }, min: 2 }],
    effects: [
      { kind: 'push', range: 1, from: ANY },
      { kind: 'grow', range: 1, from: { object: 'firewood' }, object: 'fire' },
    ],
    rumor: { by: ['hinoko'], text: 'ぼくがつけた炎のそばに、薪2つと誰か1匹。風が吹いてもっと燃える' },
    text: '隣の生き物を押し、隣の薪に火をつける',
    hint: '燃える所で、まだ燃えていない物を見ると',
  },
  {
    id: 'homuradori', no: 32, name: 'ホムラドリ', title: '炎の鳥', group: '火の山', island: 2,
    center: { height: 2 },
    around: { match: { object: 'fire' }, min: 3 },
    effect: { kind: 'convert', range: 2, from: { ground: 'ash' }, to: 'grass', object: 'flower' },
    rumor: { by: ['hinoko', 'fuigo'], text: '高い所を炎3つで囲むと、炎の鳥が翼を広げる' },
    text: '2マス先までの灰を、花の咲いた草にする',
    hint: '高い所が炎に囲まれると、翼を広げる',
  },

  // ---- 火の山の生き物の残り（判定表 第18回）。まず ㉛〜㉟ の5匹 ----
  {
    id: 'kakouko', no: 33, name: 'カコウコ', title: '火口の湖', group: '火の山', island: 2,
    center: { ground: 'lava', height: 0 },
    around: { match: { minHeight: 1 }, min: 3 },
    effect: { kind: 'convert', range: 1, from: { ground: 'lava' }, to: 'water', object: null },
    rumor: { by: ['tsukisusu'], text: '高い所を走り回ってたら、高い所を3つもつくぼみに溶岩がたまって、湖になってた' },
    text: '隣の溶岩をすべて水にする（火の山の島の水は、生き物だけが出す）',
    hint: '高い所に囲まれた、熱いくぼみ',
  },
  {
    id: 'kuroishi', no: 34, name: 'クロイシ', title: '黒曜の子', group: '火の山', island: 2,
    center: { ground: 'lava' },
    around: { match: { ground: 'water' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'water' }, to: 'barren', object: 'rock' },
    rumor: { by: ['kakouko'], text: 'ぼくの水が2つ並ぶそばに溶岩を置くと、黒い石の子が固まる' },
    text: '隣の水をすべて、岩のある荒れ地にする（冷えて黒い石）',
    hint: '熱い所が水にふれると',
  },
  {
    id: 'kikorisu', no: 35, name: 'キコリス', title: '木こりのりす', group: '火の山', island: 2,
    center: { ground: 'ash', object: null },
    around: { match: { object: 'tree' }, min: 2 },
    effect: { kind: 'grow', range: 1, from: { object: 'tree' }, object: 'firewood' },
    rumor: { by: ['tanebouzu'], text: '木が2本並ぶそばの灰で、斧の音がするよ' },
    text: '隣の木をすべて薪にする（草は残る）',
    hint: '灰の上で、木を見上げて斧をかまえる',
  },
  {
    id: 'suminoko', no: 36, name: 'スミノコ', title: '炭の子', group: '火の山', island: 2,
    center: { ground: 'ash' },
    around: { match: { object: 'fire' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { object: 'fire' }, to: 'ash', object: null },
    rumor: { by: ['fuigo'], text: '炎が2つ並ぶそばの灰は、ひんやり。炭の子が火を消しに来る' },
    text: '隣の炎を消し、そのマスを灰にする（燃え尽きる）',
    hint: '燃える所のそばの、冷たい灰',
  },
  {
    id: 'magumaru', no: 37, name: 'マグマル', title: '溶岩の子', group: '火の山', island: 2,
    center: { ground: 'lava', minHeight: 1 },
    around: { match: { ground: 'barren' }, min: 3 },
    effect: { kind: 'convert', range: 1, from: { ground: 'barren' }, to: 'lava' },
    rumor: { by: ['kuroishi'], text: 'ぼくが作った荒れ地のそば。高い所に溶岩を置くと、荒れ地3つへ流れ出す' },
    text: '隣の荒れ地をすべて溶岩にする',
    hint: '高い所から、何もない所へ流れる',
  },

  // ---- 火の山の生き物の残り ㊱〜㊵（判定表 第18回）----
  {
    id: 'kemuri', no: 38, name: 'ケムリ', title: '煙の子', group: '火の山', island: 2,
    center: { object: 'fire' },
    around: [{ match: { ground: 'ash' }, min: 3 }, { match: ANY, min: 1 }],
    effect: { kind: 'release', range: 1, from: ANY },
    rumor: { by: ['suminoko'], text: '炎を灰3つで囲んで、そばに誰かいると、煙たくてみんな帰っちゃう' },
    text: '隣の生き物を帰す（煙たくて）',
    hint: '灰に囲まれた火のそばに、誰かがいると',
  },
  {
    id: 'anahori', no: 39, name: 'アナホリ', title: '穴掘りの子', group: '火の山', island: 2,
    center: { ground: 'ash', height: 2 },
    around: { match: { ground: 'ash' }, min: 2 },
    effect: { kind: 'lower', range: 1 },
    rumor: { by: ['tsukisusu'], text: '高さ2の灰のてっぺん。まわりに灰が2つあると、穴を掘り始める' },
    text: '隣の高さをすべて1下げる（中心は高いまま）',
    hint: '灰の山のてっぺんで、まわりを掘る',
  },
  {
    id: 'hibachi', no: 40, name: 'ヒバチ', title: '火鉢の子', group: '火の山', island: 2,
    center: { object: 'firewood' },
    around: [{ match: { object: 'fire' }, min: 1, max: 1 }, { match: ANY, max: 0 }],
    effect: { kind: 'grow', range: 1, from: { ground: 'ash', object: null }, object: 'seed' },
    rumor: { by: ['hinoko', 'suminoko'], text: '炎がひとつだけのそばの薪。誰もいない時に、火の番が来る' },
    text: '隣の灰（上に何もない）すべてに種をまく',
    hint: 'ひとりで小さな火の番をする',
  },
  {
    id: 'yamaokoshi', no: 41, name: 'ヤマオコシ', title: '山起こし', group: '火の山', island: 2,
    center: { ground: 'lava', height: 0 },
    around: [{ match: ANY, min: 2 }, { match: { ground: 'lava' }, min: 2 }],
    effects: [
      { kind: 'push', range: 1, from: ANY },
      { kind: 'raise', range: 1 },
    ],
    rumor: { by: ['magumaru'], text: '低い所の溶岩に、溶岩2つと2匹が寄ると、山が目を覚ます' },
    text: '隣の生き物を押し、中心と隣の高さを1上げる',
    hint: 'にぎやかな溶岩の下で、山が目を覚ます',
  },
  {
    id: 'hinoyamanushi', no: 48, name: 'ヒノヤマヌシ', title: '火の山の主', group: '火の山', island: 2,
    center: { object: 'fire', height: 2 },
    around: { match: ANY, min: 4 },
    effects: [
      { kind: 'convert', range: 2, from: { ground: 'lava' }, to: 'ash' },
      { kind: 'convert', range: 2, from: { ground: 'ash' }, to: 'grass', object: 'flower' },
    ],
    rumor: { by: ['homuradori', 'yamaokoshi'], text: '高い所の炎のまわりに4匹集まると、火の山の主が来る' },
    text: '2マス先までの溶岩を灰に、灰を花の咲いた草にする',
    hint: '火の山のてっぺんに、みんなが集まると',
  },

  // ---- 足りない所に足す8匹（判定表 第21回・第22回）。㊶㊷ははじまりの島の巣の生き物（問題・スコアアタックの盤に巣は無い）----
  {
    id: 'sudachi', no: 14, name: 'スダチ', title: '巣立ちの子', group: '草と森',
    center: { ground: 'grass', object: 'nest' },
    around: { match: { object: 'nest' }, min: 2 },
    effect: { kind: 'clear', range: 1, from: { object: 'nest' } },
    rumor: { by: ['hinadori'], text: '草の上の巣のまわりに、巣をあと2つ。そろって巣立つよ' },
    text: '隣の巣をすべて消す（巣立って空になる）',
    hint: '巣がいくつも並ぶと、そろって飛び立つ',
  },
  {
    id: 'iwatsubame', no: 20, name: 'イワツバメ', title: '岩の燕', group: '岩と山',
    center: { object: 'rock', minHeight: 1 },
    around: [{ match: { object: 'nest' }, min: 1 }, { match: { object: 'rock' }, min: 1 }],
    effect: { kind: 'release', range: 1, from: ANY },
    rumor: { by: ['iwao'], text: '高い所の岩のそばに、巣と岩がひとつずつ。燕がにぎやかに飛ぶ' },
    text: '隣の生き物を帰す（飛び回ってにぎやか）',
    hint: '高い岩場に巣があると',
  },
  {
    id: 'nobi', no: 42, name: 'ノビ', title: '野火の子', group: '火の山', island: 2,
    center: { ground: 'grass', object: 'flower' },
    around: { match: { object: 'fire' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { ground: 'grass' }, to: 'barren', object: null },
    rumor: { by: ['tanebouzu'], text: 'ぼくの咲かせた花のそばに炎が2つ来ると、野火が走る' },
    text: '隣の草をすべて荒れ地にする（上の物も消える）',
    hint: '花畑に火が近づくと',
  },
  {
    id: 'minori', no: 43, name: 'ミノリ', title: '実りの子', group: '火の山', island: 2,
    center: { ground: 'ash', object: null },
    around: { match: { object: 'flower' }, min: 3 },
    effect: { kind: 'grow', range: 1, from: { object: 'flower' }, object: 'seed' },
    rumor: { by: ['homuradori'], text: '花3つに囲まれた灰。花が実を結ぶんだって' },
    text: '隣の花をすべて種にする（花が実る）',
    hint: '灰の上で、花に囲まれると',
  },
  {
    id: 'mebuki', no: 44, name: 'メブキ', title: '芽吹きの子', group: '火の山', island: 2,
    center: { ground: 'grass', object: null },
    around: { match: { object: 'seed' }, min: 2 },
    effect: { kind: 'convert', range: 1, from: { object: 'seed' }, to: 'grass', object: 'tree' },
    rumor: { by: ['minori', 'hibachi'], text: '種2つのそばの草で、芽吹きを待ってる子がいる' },
    text: '隣の種のマスをすべて、木のある草にする',
    hint: '草の上で、まわりの種を見守る',
  },
  {
    id: 'gankui', no: 45, name: 'ガンクイ', title: '岩食いの子', group: '火の山', island: 2,
    center: { ground: 'ash' },
    around: { match: { object: 'rock' }, min: 2 },
    effect: { kind: 'clear', range: 1, from: { object: 'rock' } },
    rumor: { by: ['kuroishi'], text: 'ぼくの黒い石が2つ並ぶそばの灰。かじる音がする' },
    text: '隣の岩をすべて消す',
    hint: '灰の上で、岩をかじる音',
  },
  {
    id: 'tanikaze', no: 46, name: 'タニカゼ', title: '谷風の子', group: '火の山', island: 2,
    center: { ground: 'ash', height: 0 },
    around: [{ match: { height: 2 }, min: 2 }, { match: { ground: 'barren' }, min: 2 }],
    effect: { kind: 'release', range: 1, from: ANY },
    rumor: { by: ['anahori'], text: '高さ2の所2つにはさまれた低い灰。荒れ地も2つあると、谷風が吹く' },
    text: '隣の生き物を帰す（谷を吹き抜ける風）',
    hint: '高い所にはさまれた、低い灰の谷',
  },
  {
    id: 'kazan', no: 47, name: 'カザン', title: '火山の子', group: '火の山', island: 2,
    center: { ground: 'ash', height: 2 },
    around: [{ match: { ground: 'lava' }, min: 2 }, { match: { minHeight: 1 }, min: 3 }],
    effect: { kind: 'clear', range: 1 },
    rumor: { by: ['magumaru', 'anahori'], text: '高さ2の灰のまわりに、溶岩2つと高い所3つ。灰が降ってくる' },
    text: '隣の上の物をすべて消す（灰が降る）',
    hint: '溶岩に囲まれた灰の山のてっぺん',
  },
]);
