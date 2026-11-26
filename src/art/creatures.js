// 生き物の絵（32×32 のドット絵）。工程7 の見本：6匹（組ごとに1匹）。判定表 第11回で見てから24匹に広げる。
// 企画まとめ：可愛いドット絵32×32、生き物は顔あり。形で見分ける（丸に統一しない）。上に乗る物（木・岩…）には顔を描かない。
import { grid, toSvg } from './pixel.js';

const INK = '#1d1a33';
const P = {
  // ① ポチャ（しずくの精）
  drop: '#5fb3e8', dropLight: '#bfe6ff', dropShade: '#3a86c4', dropMouth: '#24507a',
  // ② コケダマ（苔の毛玉）
  moss: '#7cbf4a', mossLight: '#b4e07a', mossShade: '#4f8f31', mossFoot: '#3f6f2a',
  // ⑤ スナモグリ（砂の竜の子）
  sand: '#ecc982', sandShade: '#c9a25c', sandDot: '#b88d46', dragon: '#e0a458', dragonShade: '#b97c36', belly: '#f6dca6', horn: '#fff3d6',
  // ⑭ ハナビラ（花びらの妖精）
  petal: '#f7a8c2', wing: '#ffe3ec', petalShade: '#f08bab', petalDeep: '#d9507f', skin: '#ffe5d8', dress: '#ff6f9a',
  // ⑱ イワオ（岩の巨人の子）
  rock: '#a9a39a', rockLight: '#cfc9bf', rockShade: '#7d776f', rockCrack: '#5f5a53', sprout: '#79c25a',
  // ㉒ キリノヌシ（霧の主）
  fog: '#d5e0db', fogLight: '#f2f7f4', fogShade: '#a9bbb3', fogEye: '#4b5d57',
};

export const DRAW = {
  // しずくの精：とがった頭の水のしずく。まわりに小さなしずくが跳ねる
  pocha: () => grid()
    .poly([[16, 2], [7, 16], [25, 16]], P.drop).ellipse(16, 20, 9, 8, P.drop)
    .tint(7, 24, 25, 28, P.dropShade)
    .ellipse(11, 14, 1.2, 2.5, P.dropLight).px1(12, 10, P.dropLight)
    .eye(12, 18).eye(18, 18).rect(15, 22, 16, 22, P.dropMouth)
    .ellipse(4, 10, 1, 1.6, P.drop).ellipse(28, 13, 1, 1.4, P.drop).px1(4, 9, P.dropLight)
    .outline(INK),
  // 苔の毛玉：ふさふさの縁の丸い体と、小さな足
  kokedama: () => {
    const g = grid().ellipse(16, 17, 10, 9, P.moss);
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      g.ellipse(16 + Math.cos(a) * 10, 17 + Math.sin(a) * 9, 2.2, 2.2, i % 2 ? P.mossLight : P.moss);
    }
    return g.tint(5, 23, 27, 29, P.mossShade)
      .ellipse(11, 11, 2, 1.2, P.mossLight).ellipse(20, 9, 1.5, 1, P.mossLight)
      .ellipse(11, 29, 2.5, 1.5, P.mossFoot).ellipse(21, 29, 2.5, 1.5, P.mossFoot)
      .eye(12, 16).eye(18, 16).rect(15, 20, 16, 20, P.mossFoot)
      .outline(INK);
  },
  // 砂の竜の子：砂山から横向きの顔と前足を出した小さな竜。後ろへ伸びる角、背中のとげ、砂から出たしっぽの先
  sunamoguri: () => grid()
    .ellipse(16, 27, 14, 5, P.sand).tint(2, 29, 30, 31, P.sandShade)
    .poly([[4, 23], [2, 16], [7, 22]], P.dragon)
    .ellipse(14, 17, 6, 6, P.dragon).ellipse(21, 18, 5, 3, P.dragon)
    .poly([[10, 12], [4, 7], [12, 10]], P.horn).poly([[14, 11], [10, 5], [16, 10]], P.horn)
    .px1(8, 15, P.dragonShade).px1(8, 18, P.dragonShade).px1(9, 21, P.dragonShade)
    .tint(9, 20, 26, 22, P.dragonShade).ellipse(16, 21, 3, 1.3, P.belly)
    .ellipse(11, 23, 2.2, 1.6, P.dragon).ellipse(21, 23, 2.2, 1.6, P.dragon)
    .eye(13, 15).eye(17, 15).px1(24, 17, P.dragonShade).rect(20, 20, 23, 20, P.dragonShade)
    .px1(5, 27, P.sandDot).px1(26, 25, P.sandDot).px1(19, 28, P.sandDot).px1(8, 29, P.sandDot)
    .outline(INK),
  // 花びらの妖精：4枚の花びらの羽と、花の帽子。まわりに花びらが舞う
  hanabira: () => grid()
    .ellipse(8, 12, 5, 6.5, P.wing).ellipse(24, 12, 5, 6.5, P.wing)
    .ellipse(9, 22, 4, 3.5, P.wing).ellipse(23, 22, 4, 3.5, P.wing)
    .line(6, 8, 10, 16, P.petal).line(26, 8, 22, 16, P.petal).line(7, 23, 11, 21, P.petal).line(25, 23, 21, 21, P.petal)
    .poly([[16, 14], [10, 28], [22, 28]], P.dress).tint(10, 26, 22, 28, P.petalDeep, P.dress)
    .ellipse(16, 11, 4.5, 4, P.skin)
    .ellipse(16, 6, 6, 2.5, P.petalShade).ellipse(11, 8, 1.8, 1.8, P.petalShade).ellipse(21, 8, 1.8, 1.8, P.petalShade).px1(16, 3, P.petalDeep)
    .eye(13, 11).eye(18, 11).px1(16, 14, P.petalShade)
    .px1(3, 28, P.petal).px1(4, 29, P.petal).px1(28, 27, P.petal).px1(27, 30, P.petal)
    .outline(INK),
  // 岩の巨人の子：ごつごつした四角い体に太い腕。頭に小さな芽
  iwao: () => grid()
    .poly([[7, 10], [25, 9], [27, 27], [5, 28]], P.rock)
    .ellipse(4, 19, 3, 4.5, P.rock).ellipse(28, 19, 3, 4.5, P.rock)
    .tint(4, 23, 28, 28, P.rockShade).rect(8, 11, 13, 12, P.rockLight).px1(22, 12, P.rockLight)
    .line(20, 21, 23, 25, P.rockCrack).line(8, 23, 10, 21, P.rockCrack)
    .rect(9, 28, 13, 29, P.rockShade).rect(19, 28, 23, 29, P.rockShade)
    .line(16, 9, 16, 6, P.sprout).ellipse(14, 5, 1.6, 1, P.sprout).ellipse(18, 5, 1.6, 1, P.sprout)
    .eye(11, 16).eye(19, 16).rect(14, 20, 17, 20, P.rockCrack)
    .outline(INK),
  // 霧の主：ふんわり重なった霧のかたまり。眠たげに閉じた目、すそから霧がたなびく
  kirinonushi: () => grid()
    .ellipse(10, 18, 7, 6, P.fog).ellipse(18, 13, 9, 8, P.fog).ellipse(24, 19, 6, 5.5, P.fog)
    .ellipse(16, 21, 10, 4, P.fog).tint(4, 22, 30, 25, P.fogShade)
    .ellipse(14, 9, 3, 1.5, P.fogLight).ellipse(8, 15, 1.5, 1, P.fogLight)
    .rect(11, 16, 13, 16, P.fogEye).px1(10, 15, P.fogEye).rect(19, 16, 21, 16, P.fogEye).px1(22, 15, P.fogEye)
    .rect(15, 19, 16, 19, P.fogShade)
    .line(1, 27, 7, 27, P.fogLight).line(22, 28, 30, 28, P.fogLight).line(10, 29, 15, 29, P.fog)
    .outline(INK),
};

// 絵のある生き物の SVG（なければ null。絵のない生き物は丸と番号のまま）
const cache = {};
export function creatureSvg(id, size = 96) {
  if (!DRAW[id]) return null;
  const k = `${id}:${size}`;
  cache[k] ??= toSvg(DRAW[id](), size, 'px');
  return cache[k];
}
export const hasArt = (id) => Boolean(DRAW[id]);
