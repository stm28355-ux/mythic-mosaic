// 生き物の絵の残り18匹（工程7。判定表 第11回で見本6匹と方向が OK になってから描いた）。
// 見本と同じく、32×32・太い縁取り・顔あり・形で見分ける。竜が4匹いるので形を変える：
//   ⑤スナモグリ＝砂から顔を出す、⑨ナガレ＝S字の長い体、⑲ヤマナミ＝背中が山並み、㉔ハジマリ＝白く丸まって金の輪
import { grid } from './pixel.js';

const INK = '#1d1a33';
const C = {
  white: '#ffffff', cream: '#fff3d6', skin: '#ffe5d8', gold: '#ffd35c', goldShade: '#e0a91c', orange: '#f0a03c',
  water: '#4f86b8', waterLight: '#9fd0f0',
  teal: '#3f8f8a', tealLight: '#7cc0b4', tealDark: '#24605c',
  frog: '#a8c83a', frogLight: '#e3ef9a', frogDark: '#5f7f1e', leaf: '#5aa04a', leafLight: '#8fd39a',
  wind: '#e3ecf8', windShade: '#b8c8e4', windLine: '#9fc4ec', scarf: '#7fb8e8',
  lotus: '#f3a6c8', lotusLight: '#ffd6e6', pad: '#4f9a4f', padLight: '#7cc26a', hair: '#c0507a',
  swirl: '#7fa8ff', swirlLight: '#c4d6ff', swirlDark: '#3f5fc0',
  river: '#5ec2dc', riverLight: '#bff0fa', riverShade: '#3a95b4',
  fawn: '#c08a5a', fawnLight: '#e8c39a', fawnShade: '#946238', antler: '#6b4a2b', forest: '#4caf6a',
  kodama: '#e8f5dc', kodamaShade: '#c4dfb0', kodamaMouth: '#8aa57a',
  owl: '#a0825a', owlShade: '#7a6040', owlBelly: '#c9ab80', disc: '#efe4c8', beak: '#e8a43c',
  chick: '#ffd56b', chickShade: '#e8b23c', nest: '#9a6b3e', nestShade: '#6f4a2a', shell: '#f5efe0',
  bee: '#f6c343', stripe: '#3a2c20', beeWing: '#e8f4ff', beeWingEdge: '#b8d6f0',
  rainbowBody: '#c9a7ff', rainbowShade: '#9f7fe0', red: '#ff6b6b', yellow: '#ffe066', green: '#6fd18a', blue: '#6aa8ff', purple: '#b07cff',
  fox: '#f0cf96', foxShade: '#d4a868', foxInner: '#f4a07a',
  ridge: '#9b948c', ridgeShade: '#77706a', snow: '#f4f6f8', mtDragon: '#c08a6a', mtDragonShade: '#946446',
  tornado: '#e8f0ff', tornadoLine: '#a9bce0',
  bug: '#4a3f5c', glow: '#e6f58a', glowHalo: '#fbffd6', bugWing: '#dfe8ff',
  mud: '#8a6a4a', mudLight: '#b08a62', mudDark: '#5a432e', puddle: '#6b4f36',
  dragonWhite: '#ffffff', dragonShade: '#e2e2f0', halo: '#fff1a8',
};

export const MORE = {
  // 沼の主の子：水たまりに座る、ひげのある小さな主（なまずの子）
  numanushi: () => grid()
    .ellipse(16, 27, 13, 4, C.water).line(6, 27, 9, 27, C.waterLight).line(22, 28, 25, 28, C.waterLight)
    .poly([[14, 12], [16, 6], [18, 12]], C.tealDark)
    .ellipse(16, 18, 9, 7, C.teal).ellipse(16, 22, 6, 2.5, C.tealLight)
    .eye(11, 15).eye(19, 15).rect(12, 20, 20, 20, C.tealDark)
    .line(8, 19, 3, 17, C.tealDark).line(8, 21, 3, 23, C.tealDark).line(24, 19, 29, 17, C.tealDark).line(24, 21, 29, 23, C.tealDark)
    .outline(INK),
  // 湿地のカエルの精：大きな目玉のカエル。頭に葉っぱ
  kerori: () => grid()
    .ellipse(10, 12, 4, 4, C.frog).ellipse(22, 12, 4, 4, C.frog)
    .ellipse(16, 20, 11, 8, C.frog).ellipse(16, 24, 7, 3, C.frogLight)
    .ellipse(8, 28, 3, 1.5, C.frog).ellipse(24, 28, 3, 1.5, C.frog)
    .rect(9, 11, 11, 13, C.white).rect(21, 11, 23, 13, C.white).rect(10, 12, 11, 13, INK).rect(22, 12, 23, 13, INK)
    .line(11, 19, 21, 19, C.frogDark).px1(10, 18, C.frogDark).px1(22, 18, C.frogDark)
    .line(16, 7, 16, 9, C.frogDark).ellipse(14, 6, 2.5, 1.2, C.leaf)
    .outline(INK),
  // 丘の風の子：しっぽと頭の毛がうずまく風の子。首にスカーフ、風に乗る葉っぱ
  kazenoko: () => grid()
    .path([[16, 20], [19, 25], [24, 27], [28, 24], [26, 20], [23, 21]], 1.6, C.wind)
    .ellipse(15, 13, 7, 6.5, C.wind).ellipse(16, 20, 5, 4, C.wind)
    .tint(10, 18, 22, 24, C.windShade, C.wind)
    .rect(9, 17, 21, 18, C.scarf).poly([[19, 18], [24, 21], [21, 22]], C.scarf)
    .line(14, 6, 14, 4, C.wind).px1(15, 3, C.wind).px1(16, 3, C.wind).px1(17, 4, C.wind).px1(16, 5, C.wind)
    .eye(11, 12).eye(17, 12).px1(14, 15, C.windShade)
    .ellipse(26, 9, 2, 1, C.leaf).px1(24, 10, C.leaf)
    .line(1, 8, 6, 8, C.windLine).line(26, 6, 30, 6, C.windLine).line(2, 22, 6, 22, C.windLine).line(27, 13, 30, 13, C.windLine)
    .outline(INK),
  // 蓮の姫：蓮の花の上に座る姫。小さな金の冠
  hasuhime: () => grid()
    .ellipse(16, 28, 14, 3, C.pad).line(5, 28, 9, 28, C.padLight)
    .rect(12, 14, 20, 20, C.lotusLight)
    .ellipse(16, 10, 4.5, 4.5, C.skin).ellipse(16, 7, 5, 2.5, C.hair).px1(11, 9, C.hair).px1(21, 9, C.hair)
    .px1(14, 4, C.gold).px1(16, 3, C.gold).px1(18, 4, C.gold).rect(14, 5, 18, 5, C.gold)
    .ellipse(16, 24, 11, 3.5, C.lotus)
    .poly([[5, 25], [7, 16], [12, 25]], C.lotus).poly([[20, 25], [25, 16], [27, 25]], C.lotus)
    .poly([[10, 26], [13, 17], [16, 26]], C.lotusLight).poly([[16, 26], [19, 17], [22, 26]], C.lotusLight)
    .eye(13, 10).eye(18, 10)
    .outline(INK),
  // 渦の子：うずまきの殻を背負った水の子
  uzumaki: () => {
    const g = grid().ellipse(18, 14, 11, 10, C.swirl);
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const a = i * 0.42;
      const r = 1 + i * 0.29;
      pts.push([18 + Math.cos(a) * r, 14 + Math.sin(a) * r * 0.92]);
    }
    for (let i = 0; i < pts.length - 1; i++) g.line(Math.round(pts[i][0]), Math.round(pts[i][1]), Math.round(pts[i + 1][0]), Math.round(pts[i + 1][1]), C.swirlDark);
    return g.ellipse(9, 23, 7, 5, C.swirlLight).ellipse(16, 27, 9, 2.5, C.swirlLight)
      .eye(6, 21).eye(11, 21).rect(8, 25, 9, 25, C.swirlDark)
      .px1(2, 10, C.swirlLight).px1(3, 12, C.swirlLight).px1(29, 25, C.swirlLight)
      .outline(INK);
  },
  // 流れの竜：S字にうねる長い水の竜。ひれと1本の角
  nagare: () => grid()
    .path([[3, 27], [9, 25], [14, 19], [12, 13], [16, 8], [21, 7]], 2.6, C.river)
    .ellipse(24, 8, 4.5, 3.5, C.river).ellipse(28, 9.5, 2.5, 2, C.river)
    .poly([[11, 15], [6, 12], [10, 19]], C.riverLight).poly([[8, 23], [4, 19], [12, 22]], C.riverLight).poly([[16, 6], [14, 2], [19, 5]], C.riverLight)
    .tint(0, 26, 12, 30, C.riverShade, C.river)
    .line(23, 4, 21, 1, C.cream).line(29, 11, 31, 13, C.riverShade)
    .eye(23, 7).eye(26, 7)
    .px1(2, 30, C.riverLight).px1(6, 30, C.riverLight).px1(17, 29, C.riverLight)
    .outline(INK),
  // 森の子守：枝の角に葉をつけた子鹿。背中に白い斑点
  morinoko: () => grid()
    .ellipse(18, 21, 8, 5, C.fawn).ellipse(11, 14, 4.5, 4, C.fawn).ellipse(7.5, 16, 2.2, 1.6, C.fawnLight)
    .poly([[14, 11], [19, 8], [15, 13]], C.fawn)
    .rect(13, 25, 14, 29, C.fawnShade).rect(21, 25, 22, 29, C.fawnShade).px1(26, 19, C.fawnLight)
    .px1(16, 19, C.cream).px1(19, 20, C.cream).px1(17, 22, C.cream).px1(21, 22, C.cream)
    .line(10, 10, 8, 5, C.antler).line(8, 5, 6, 4, C.antler).line(12, 10, 13, 5, C.antler).line(13, 5, 15, 4, C.antler)
    .ellipse(5.5, 3.5, 1.6, 1, C.forest).ellipse(15.5, 3.5, 1.6, 1, C.forest).ellipse(8, 3, 1, 1, C.leafLight)
    .eye(8, 13).eye(12, 13).px1(6, 16, INK)
    .outline(INK),
  // 木霊：大きな丸い頭の、白っぽい森の子。頭に1枚の葉
  kodama: () => grid()
    .poly([[11, 18], [21, 18], [24, 29], [8, 29]], C.kodamaShade)
    .ellipse(7, 23, 2, 3, C.kodama).ellipse(25, 23, 2, 3, C.kodama)
    .ellipse(16, 12, 8.5, 7.5, C.kodama)
    .line(16, 5, 16, 3, C.leaf).ellipse(18, 2.5, 2.2, 1.2, C.leaf)
    .eye(12, 11).eye(18, 11).ellipse(15.5, 15.5, 1, 0.8, C.kodamaMouth)
    .outline(INK),
  // 森のふくろう：まるい顔の皿と耳の羽、おなかに羽の模様
  mofuroo: () => grid()
    .poly([[7, 9], [8, 3], [12, 8]], C.owl).poly([[25, 9], [24, 3], [20, 8]], C.owl)
    .ellipse(16, 18, 10, 11, C.owl).tint(5, 14, 8, 26, C.owlShade).tint(24, 14, 27, 26, C.owlShade)
    .ellipse(12, 13, 4.3, 4.3, C.disc).ellipse(20, 13, 4.3, 4.3, C.disc)
    .ellipse(16, 23, 6, 5, C.owlBelly)
    .px1(13, 22, C.owlShade).px1(16, 21, C.owlShade).px1(19, 22, C.owlShade).px1(14, 25, C.owlShade).px1(18, 25, C.owlShade)
    .poly([[15, 16], [17, 16], [16, 19]], C.beak)
    .eye(11, 12).eye(19, 12)
    .rect(12, 29, 13, 29, C.beak).rect(19, 29, 20, 29, C.beak)
    .outline(INK),
  // 雛鳥：巣の中のふわふわのひな。頭に卵の殻、小さな羽
  hinadori: () => grid()
    .ellipse(16, 16, 10, 9, C.chick).tint(6, 19, 26, 24, C.chickShade, C.chick)
    .ellipse(6, 17, 2, 3, C.chick).ellipse(26, 17, 2, 3, C.chick)
    .rect(10, 5, 22, 8, C.shell).px1(10, 9, C.shell).px1(12, 9, C.shell).px1(14, 9, C.shell).px1(16, 9, C.shell).px1(18, 9, C.shell).px1(20, 9, C.shell).px1(22, 9, C.shell)
    .poly([[15, 16], [17, 16], [16, 18]], C.orange)
    .eye(11, 13).eye(19, 13)
    .ellipse(16, 26, 13, 4, C.nest)
    .line(5, 25, 12, 27, C.nestShade).line(14, 28, 22, 25, C.nestShade).line(20, 28, 27, 26, C.nestShade).px1(3, 24, C.nest).px1(29, 24, C.nest)
    .outline(INK),
  // 蜜蜂の精：しま模様のまるい体、すき通る羽、触角
  bunbun: () => grid()
    .ellipse(10, 9, 4.5, 3.5, C.beeWing).ellipse(22, 9, 4.5, 3.5, C.beeWing)
    .tint(6, 10, 26, 12, C.beeWingEdge, C.beeWing)
    .ellipse(16, 19, 9, 8, C.bee)
    .tint(7, 21, 25, 22, C.stripe, C.bee).tint(7, 25, 25, 26, C.stripe, C.bee)
    .line(13, 12, 11, 6, C.stripe).line(19, 12, 21, 6, C.stripe).px1(10, 5, C.stripe).px1(22, 5, C.stripe)
    .px1(16, 28, C.stripe)
    .eye(12, 16).eye(18, 16)
    .px1(4, 26, C.gold).px1(28, 22, C.gold).px1(27, 28, C.gold)
    .outline(INK),
  // 虹の鳥：むらさきの小鳥と、虹の色の尾羽
  nijidori: () => grid()
    .path([[18, 18], [28, 9]], 1.1, C.red).path([[18, 19], [29, 14]], 1.1, C.orange)
    .path([[18, 20], [29, 19]], 1.1, C.yellow).path([[18, 21], [28, 24]], 1.1, C.green)
    .path([[17, 22], [25, 28]], 1.1, C.blue)
    .ellipse(13, 18, 7, 6, C.rainbowBody).ellipse(11, 11, 4.5, 4, C.rainbowBody)
    .ellipse(14, 19, 4, 2.5, C.rainbowShade)
    .poly([[6, 10], [2, 11.5], [6, 13]], C.gold)
    .px1(10, 6, C.purple).px1(11, 5, C.purple).px1(12, 6, C.purple)
    .eye(9, 10).eye(13, 10)
    .rect(11, 24, 11, 26, C.goldShade).rect(15, 24, 15, 26, C.goldShade)
    .outline(INK),
  // 独りの砂狐：大きな耳の狐。ふさふさのしっぽ
  hitorisuna: () => grid()
    .poly([[9, 13], [6, 2], [13, 10]], C.fox).poly([[19, 10], [24, 2], [22, 13]], C.fox)
    .line(8, 5, 10, 10, C.foxInner).line(23, 5, 21, 10, C.foxInner)
    .ellipse(25, 24, 5, 3.5, C.fox).ellipse(28.5, 23, 2, 1.6, C.cream)
    .ellipse(16, 23, 7, 6, C.fox).ellipse(15, 14, 6.5, 5, C.fox)
    .ellipse(15, 17.5, 2.6, 1.6, C.cream).ellipse(16, 24, 3.5, 3.5, C.cream)
    .tint(9, 27, 23, 29, C.foxShade, C.fox)
    .px1(15, 17, INK)
    .eye(11, 13).eye(17, 13)
    .outline(INK),
  // 山並みの竜：背中に雪をかぶった山が連なる、寝そべった竜
  yamanami: () => grid()
    .poly([[5, 21], [8, 11], [11, 21]], C.ridge).poly([[10, 21], [15, 7], [20, 21]], C.ridge).poly([[18, 21], [22, 12], [26, 21]], C.ridge)
    .tint(4, 17, 27, 21, C.ridgeShade, C.ridge)
    .px1(8, 11, C.snow).rect(7, 12, 9, 12, C.snow).px1(15, 7, C.snow).rect(14, 8, 16, 9, C.snow).px1(22, 12, C.snow).rect(21, 13, 23, 13, C.snow)
    .ellipse(15, 24, 12, 4.5, C.mtDragon).poly([[4, 24], [1, 20], [5, 22]], C.mtDragon)
    .ellipse(27, 22, 4, 3.5, C.mtDragon).ellipse(30, 23.5, 1.8, 1.5, C.mtDragon)
    .tint(4, 27, 27, 28, C.mtDragonShade, C.mtDragon)
    .rect(8, 28, 9, 29, C.mtDragonShade).rect(20, 28, 21, 29, C.mtDragonShade)
    .eye(25, 21).eye(28, 21)
    .outline(INK),
  // つむじ風：上が広く下が細い、ぐるぐる回る風。上の帯に顔
  tsumuji: () => grid()
    .ellipse(16, 8, 11, 4.5, C.tornado).ellipse(16, 14, 9, 2.8, C.tornado).ellipse(15, 19, 7, 2.4, C.tornado)
    .ellipse(14, 23, 5, 2, C.tornado).ellipse(14, 27, 3, 1.6, C.tornado).ellipse(15, 30, 1.5, 1, C.tornado)
    .line(7, 10, 12, 11, C.tornadoLine).line(20, 15, 23, 14, C.tornadoLine).line(10, 19, 13, 20, C.tornadoLine).line(16, 23, 18, 23, C.tornadoLine)
    .eye(12, 6).eye(18, 6).rect(15, 9, 16, 9, C.tornadoLine)
    .px1(3, 15, C.leaf).px1(28, 19, C.leaf).px1(26, 25, C.leafLight)
    .outline(INK),
  // 蛍の灯：小さな黒い体と、まるく光るおしり
  hotarubi: () => grid()
    .ellipse(21, 19, 8, 7, C.glowHalo).ellipse(21, 19, 5, 4.5, C.glow)
    .ellipse(13, 9, 4, 2.5, C.bugWing).ellipse(18, 9, 3.5, 2.5, C.bugWing)
    .ellipse(14, 15, 5, 4, C.bug).ellipse(9, 14, 3.8, 3.3, C.bug)
    .line(7, 11, 5, 6, C.bug).line(10, 11, 10, 6, C.bug)
    .rect(12, 19, 12, 21, C.bug).rect(16, 19, 16, 21, C.bug)
    .eyeW(7, 13).eyeW(10, 13)
    .px1(4, 24, C.glow).px1(28, 8, C.glow).px1(27, 28, C.glow)
    .outline(INK),
  // 泥の子：横に広い、とろりとした泥のかたまり。頭に蒲の穂、まわりに泥がはねる
  doronko: () => grid()
    .ellipse(16, 29, 14, 2.5, C.puddle)
    .ellipse(16, 21, 12, 7, C.mud).ellipse(10, 15, 4, 3, C.mud)
    .rect(5, 24, 7, 28, C.mud).rect(15, 26, 17, 29, C.mud).rect(25, 23, 27, 28, C.mud)
    .line(21, 15, 22, 7, C.leaf).ellipse(22.5, 6, 1.2, 2.5, C.mudDark).line(20, 14, 18, 10, C.leaf)
    .ellipse(9, 14, 2, 1, C.mudLight).px1(23, 18, C.mudLight)
    .eye(11, 19).eye(19, 19)
    .line(12, 24, 19, 24, C.mudDark).px1(11, 23, C.mudDark).px1(20, 23, C.mudDark)
    .px1(2, 16, C.mud).px1(3, 15, C.mud).px1(29, 12, C.mud).px1(28, 16, C.mud)
    .outline(INK),
  // 始まりの竜：金の輪の前で丸くなる白い竜。金の角とたてがみ、小さな金の羽
  hajimari: () => {
    const g = grid();
    for (let i = 0; i < 72; i++) {
      const a = (Math.PI * 2 * i) / 72;
      g.px1(Math.round(16 + Math.cos(a) * 13.5), Math.round(15 + Math.sin(a) * 12.5), C.gold);
    }
    return g
      .path([[8, 25], [4, 21], [5, 16], [9, 14]], 1.8, C.dragonWhite)
      .ellipse(16, 21, 9, 6.5, C.dragonWhite).tint(7, 24, 25, 28, C.dragonShade, C.dragonWhite)
      .poly([[10, 16], [5, 9], [13, 14]], C.halo).line(6, 10, 11, 15, C.goldShade)
      .ellipse(20, 12, 5.5, 4.5, C.dragonWhite).ellipse(25, 13.5, 2.8, 2.2, C.dragonWhite)
      .poly([[17, 9], [14, 2], [19, 8]], C.gold).poly([[21, 8], [23, 1], [24, 9]], C.gold)
      .line(15, 11, 13, 19, C.gold).px1(14, 13, C.goldShade).px1(13, 17, C.goldShade)
      .ellipse(11, 27, 2.5, 1.6, C.dragonWhite).ellipse(21, 27.5, 2.5, 1.6, C.dragonWhite)
      .eye(18, 11).eye(22, 11).px1(27, 14, C.dragonShade)
      .outline(INK);
  },

};
