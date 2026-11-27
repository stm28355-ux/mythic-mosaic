// 足りない所に足した8匹の絵（判定表 第22回。㊶㊷ははじまりの島の巣の生き物、㊸〜㊽は火の山の生き物）。
// ほかと同じく、32×32・太い縁取り・顔あり・形で見分ける。
import { grid } from './pixel.js';

const INK = '#1d1a33';
const X = {
  chick: '#ffd56b', chickLight: '#fff0b0', chickShade: '#e8b23c', beak: '#f0a03c', nest: '#9a6b3e', nestShade: '#6f4a2a',
  swallow: '#3f5fa8', swallowLight: '#6f8fd8', belly: '#f6f1e6', throat: '#e0603c', rock: '#a9a39a', rockShade: '#7d776f',
  hare: '#c98a5a', hareLight: '#f0c49a', hareShade: '#9a6238', ear: '#f4a07a', flame: '#ff8a3c', flameLight: '#ffd35c',
  cap: '#8a5a32', capLight: '#b07a46', capShade: '#5e3c22', body: '#7cc05a', bodyShade: '#4f8f31', skin: '#ffe5d8',
  leaf: '#6fc25a', leafLight: '#a8e08a', leafShade: '#3f8a3a', sprout: '#4f9a3f',
  gnaw: '#9a8a7a', gnawLight: '#c4b8aa', gnawShade: '#6f6052', tooth: '#fffbe8', crumb: '#7d776f',
  wind: '#bfe8d8', windLight: '#e8fff6', windShade: '#7fc4ac',
  mount: '#8a6a5a', mountLight: '#b08a74', mountShade: '#5e463a', ash: '#d2ccd0', smoke: '#e8e4ec', lava: '#ff7a3c',
};

export const EXTRA = {
  // 巣立ちの子：小さな羽を広げたひな。足もとに巣
  sudachi: () => grid()
    .ellipse(16, 27, 12, 3.5, X.nest).line(6, 27, 12, 28, X.nestShade).line(18, 28, 26, 26, X.nestShade)
    .poly([[4, 15], [10, 13], [10, 20]], X.chickShade).poly([[28, 15], [22, 13], [22, 20]], X.chickShade)
    .ellipse(16, 17, 8, 8, X.chick).ellipse(16, 21, 5, 3.5, X.chickLight)
    .px1(15, 8, X.chick).px1(16, 7, X.chick).px1(17, 8, X.chick)
    .poly([[14, 16], [18, 16], [16, 19]], X.beak)
    .eye(12, 13).eye(18, 13)
    .outline(INK),
  // 岩の燕：岩の上にとまる青い燕。二つに割れた尾と白いおなか
  iwatsubame: () => grid()
    .poly([[3, 31], [6, 24], [12, 22], [22, 23], [28, 26], [30, 31]], X.rock).tint(3, 29, 30, 31, X.rockShade, X.rock)
    .poly([[6, 20], [2, 26], [9, 21]], X.swallow).poly([[8, 21], [5, 27], [11, 21]], X.swallow)
    .ellipse(15, 16, 8, 5.5, X.swallow).ellipse(16, 18, 5, 3, X.belly)
    .ellipse(21, 11, 5, 4.5, X.swallow).ellipse(22, 14, 2.5, 1.5, X.throat)
    .poly([[25, 11], [30, 12], [25, 13]], INK)
    .line(9, 13, 18, 12, X.swallowLight)
    .line(14, 21, 13, 23, INK).line(18, 21, 19, 23, INK)
    .eye(21, 9)
    .outline(INK),
  // 野火の子：耳の先に小さな炎がともる野うさぎ
  nobi: () => grid()
    .ellipse(11, 7, 2.2, 6, X.hare).ellipse(21, 7, 2.2, 6, X.hare).line(11, 4, 11, 9, X.ear).line(21, 4, 21, 9, X.ear)
    .poly([[11, 0], [13, 2], [11, 3], [9, 2]], X.flame).poly([[21, 0], [23, 2], [21, 3], [19, 2]], X.flame).px1(11, 1, X.flameLight).px1(21, 1, X.flameLight)
    .ellipse(16, 16, 8, 6.5, X.hare).ellipse(16, 25, 9, 6, X.hare).ellipse(16, 26, 5, 4, X.hareLight)
    .tint(7, 29, 25, 31, X.hareShade, X.hare)
    .ellipse(26, 26, 2.5, 2, X.hareLight)
    .px1(16, 18, X.ear).eye(12, 14).eye(18, 14)
    .outline(INK),
  // 実りの子：種の帽子をかぶった小人
  minori: () => grid()
    .ellipse(16, 23, 7, 6, X.body).tint(9, 27, 23, 29, X.bodyShade, X.body)
    .ellipse(16, 15, 6, 5, X.skin)
    .ellipse(16, 9, 8.5, 5, X.cap).line(9, 11, 23, 11, X.capShade).ellipse(13, 7, 2.5, 1.2, X.capLight)
    .line(16, 4, 16, 2, X.sprout).px1(15, 1, X.leaf).px1(17, 1, X.leaf)
    .ellipse(8, 23, 1.8, 1.5, X.skin).ellipse(24, 23, 1.8, 1.5, X.skin)
    .ellipse(12, 30, 2.3, 1.3, X.capShade).ellipse(20, 30, 2.3, 1.3, X.capShade)
    .eye(13, 14).eye(18, 14).px1(16, 18, X.capShade)
    .outline(INK),
  // 芽吹きの子：葉っぱの耳の子。頭に双葉
  mebuki: () => grid()
    .poly([[9, 13], [2, 6], [3, 15]], X.leaf).poly([[23, 13], [30, 6], [29, 15]], X.leaf).line(4, 8, 8, 13, X.leafShade).line(28, 8, 24, 13, X.leafShade)
    .ellipse(16, 18, 9, 8.5, X.leafLight).ellipse(16, 22, 6, 4, X.windLight)
    .line(16, 9, 16, 6, X.sprout).ellipse(13, 5, 2.5, 1.3, X.leaf).ellipse(19, 4, 2.5, 1.3, X.leaf)
    .tint(7, 24, 25, 27, X.leaf, X.leafLight)
    .ellipse(11, 28, 2.5, 1.3, X.leafShade).ellipse(21, 28, 2.5, 1.3, X.leafShade)
    .eye(12, 16).eye(18, 16).px1(10, 19, X.ear).px1(22, 19, X.ear)
    .outline(INK),
  // 岩食いの子：大きな前歯のずんぐりした子。口もとに岩のかけら
  gankui: () => grid()
    .ellipse(16, 18, 11, 10, X.gnaw).ellipse(16, 22, 7, 5, X.gnawLight)
    .ellipse(8, 9, 3, 3, X.gnaw).ellipse(24, 9, 3, 3, X.gnaw).ellipse(8, 9, 1.5, 1.5, X.gnawLight).ellipse(24, 9, 1.5, 1.5, X.gnawLight)
    .ellipse(16, 17, 3, 2, X.gnawShade).rect(14, 19, 17, 22, X.tooth).line(15, 19, 15, 22, X.gnawLight)
    .tint(5, 26, 27, 28, X.gnawShade, X.gnaw)
    .px1(5, 24, X.crumb).px1(26, 23, X.crumb).px1(27, 25, X.crumb).px1(4, 27, X.crumb)
    .ellipse(10, 29, 2.5, 1.3, X.gnawShade).ellipse(22, 29, 2.5, 1.3, X.gnawShade)
    .eye(11, 13).eye(19, 13)
    .outline(INK),
  // 谷風の子：長い風の帯がくねる子。帯の先に顔
  tanikaze: () => grid()
    .path([[3, 26], [8, 20], [14, 22], [19, 16], [23, 11]], 2.2, X.wind)
    .path([[5, 26], [9, 22], [14, 24], [19, 18]], 0.6, X.windShade)
    .ellipse(24, 10, 6, 5.5, X.wind).ellipse(23, 8, 2, 1.3, X.windLight)
    .line(1, 14, 6, 14, X.windShade).line(26, 22, 31, 22, X.windShade).line(2, 8, 7, 8, X.windShade)
    .eye(21, 9).eye(26, 9).px1(24, 13, X.windShade)
    .outline(INK),
  // 火山の子：頭から煙を出す小さな山。すそに溶岩
  kazan: () => grid()
    .ellipse(13, 4, 3, 2, X.smoke).ellipse(18, 2, 2.5, 1.5, X.smoke).ellipse(20, 5, 2, 1.5, X.smoke)
    .poly([[2, 29], [12, 9], [20, 9], [30, 29]], X.mount)
    .poly([[12, 9], [20, 9], [19, 12], [13, 12]], X.ash)
    .line(6, 24, 10, 17, X.mountLight).line(22, 15, 26, 22, X.mountShade)
    .tint(2, 27, 30, 29, X.mountShade, X.mount)
    .poly([[14, 12], [16, 10], [18, 12], [17, 16], [15, 16]], X.lava)
    .eye(11, 18).eye(19, 18).line(14, 23, 17, 23, X.mountShade)
    .outline(INK),
};
