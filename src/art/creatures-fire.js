// 第2の島「火の山の島」の生き物の絵（工程8 試作6匹 ㉕〜㉚。判定表 第16回）。
// ほかの24匹と同じく、32×32・太い縁取り・顔あり・形で見分ける：
//   ㉕ヒノコ＝炎の形、㉖ハイモグラ＝灰の山から顔を出す、㉗ツキスス＝突進するすすの子いのしし、
//   ㉘タネボウズ＝芽の出た種、㉙フイゴ＝ほっぺをふくらませて吹く風の袋、㉚ホムラドリ＝炎の尾の鳥
import { grid } from './pixel.js';

const INK = '#1d1a33';
const F = {
  flame: '#ff8a3c', flameLight: '#ffd35c', flameCore: '#fff3b0', flameDeep: '#e0502c',
  ash: '#a7a1a6', ashLight: '#d2ccd0', ashShade: '#7e787e',
  mole: '#6f6470', moleLight: '#928794', nose: '#ff9fb4', claw: '#f3e6d6',
  soot: '#4f4a56', sootLight: '#76707e', ember: '#ff7a3c', tusk: '#fff3d6', speed: '#c9c2cc',
  seed: '#b07a46', seedLight: '#d8a56c', seedShade: '#84552c', sprout: '#6fc25a', sproutLight: '#a8e08a',
  bag: '#d9925a', bagLight: '#f2bf8a', bagShade: '#a86a3a', cheek: '#ff9f9f', puff: '#e3ecf8', puffLine: '#b8c8e4',
  bird: '#ff6b4a', birdLight: '#ffb08a', birdShade: '#d0452e', beak: '#ffd35c',
};

export const FIRE = {
  // 火の子：上にとがった炎の体。中は明るく、小さな手を広げる
  hinoko: () => grid()
    .poly([[16, 1], [22, 9], [26, 18], [24, 26], [8, 26], [6, 18], [10, 9]], F.flame)
    .poly([[9, 6], [11, 12], [7, 14]], F.flame).poly([[24, 5], [25, 13], [21, 11]], F.flame)
    .ellipse(16, 20, 7, 6.5, F.flameLight).ellipse(16, 23, 4, 3, F.flameCore)
    .tint(6, 25, 26, 27, F.flameDeep)
    .ellipse(4, 19, 2, 1.4, F.flame).ellipse(28, 19, 2, 1.4, F.flame)
    .ellipse(11, 28, 2.5, 1.4, F.flameDeep).ellipse(21, 28, 2.5, 1.4, F.flameDeep)
    .eye(12, 17).eye(18, 17).rect(15, 21, 16, 21, F.flameDeep)
    .px1(3, 6, F.flameLight).px1(29, 9, F.flameLight)
    .outline(INK),
  // 灰の子：灰の山から上半身を出すもぐら。桃色の鼻と白い爪
  haimogura: () => grid()
    .ellipse(16, 27, 15, 5, F.ash).ellipse(9, 25, 4, 1.5, F.ashLight).ellipse(23, 26, 3, 1, F.ashLight)
    .ellipse(16, 15, 8.5, 9, F.mole).ellipse(16, 19, 5, 3.5, F.moleLight)
    .tint(4, 26, 28, 31, F.ashShade, F.ash)
    .ellipse(16, 27, 15, 2.5, F.ash)
    .ellipse(16, 16, 2.2, 1.6, F.nose)
    .ellipse(7, 23, 3, 2, F.claw).ellipse(25, 23, 3, 2, F.claw).line(5, 24, 9, 24, F.ashShade).line(23, 24, 27, 24, F.ashShade)
    .eyeW(11, 12).eyeW(19, 12)
    .px1(3, 20, F.ash).px1(28, 19, F.ash).px1(29, 21, F.ashLight)
    .outline(INK),
  // 突進の子：すすの色の小さないのしし。背に火の粉、白い牙、うしろに走った線
  tsukisusu: () => grid()
    .line(1, 13, 6, 13, F.speed).line(0, 18, 5, 18, F.speed).line(2, 23, 6, 23, F.speed)
    .ellipse(16, 18, 10, 7.5, F.soot).ellipse(24, 18, 5.5, 5, F.soot)
    .ellipse(28, 19, 2.5, 2.2, F.sootLight).px1(28, 19, INK).px1(29, 20, INK)
    .poly([[19, 11], [21, 7], [23, 12]], F.soot)
    .poly([[9, 11], [11, 6], [13, 11]], F.ember).poly([[13, 10], [16, 5], [18, 10]], F.ember).px1(16, 7, F.flameLight).px1(11, 8, F.flameLight)
    .tint(7, 22, 28, 25, F.sootLight, F.soot)
    .rect(9, 25, 11, 28, F.soot).rect(20, 25, 22, 28, F.soot)
    .line(26, 22, 28, 24, F.tusk).px1(25, 22, F.tusk)
    .eyeW(22, 15)
    .outline(INK),
  // 種の子：芽の出た大きな種。頭に双葉、すじのある殻
  tanebouzu: () => grid()
    .line(16, 4, 16, 9, F.sprout)
    .ellipse(12, 5, 3.5, 1.8, F.sprout).ellipse(20, 4, 3.5, 1.8, F.sprout).px1(11, 4, F.sproutLight).px1(21, 3, F.sproutLight)
    .poly([[16, 8], [24, 15], [25, 22], [21, 28], [11, 28], [7, 22], [8, 15]], F.seed)
    .line(16, 10, 16, 13, F.seedShade)
    .ellipse(11, 15, 1.5, 2.5, F.seedLight)
    .tint(7, 25, 25, 28, F.seedShade, F.seed)
    .ellipse(11, 29, 2.5, 1.3, F.seedShade).ellipse(21, 29, 2.5, 1.3, F.seedShade)
    .eye(12, 18).eye(18, 18).line(14, 22, 17, 22, F.seedShade)
    .outline(INK),
  // ふいごの風：ふくらんだ革袋の体。ほっぺをふくらませて、前へ風を吹く
  fuigo: () => grid()
    .ellipse(13, 16, 10, 9.5, F.bag)
    .line(6, 10, 6, 22, F.bagShade).line(10, 8, 10, 24, F.bagShade)
    .ellipse(13, 11, 4, 2, F.bagLight)
    .rect(22, 14, 25, 18, F.bagShade)
    .ellipse(15, 19, 2.5, 1.6, F.cheek).ellipse(21, 19, 2, 1.6, F.cheek)
    .ellipse(10, 27, 2.5, 1.5, F.bagShade).ellipse(18, 27, 2.5, 1.5, F.bagShade)
    .eye(14, 14).eye(19, 14)
    .path([[27, 14], [30, 12]], 0.6, F.puff).path([[27, 16], [31, 16]], 0.6, F.puff).path([[27, 18], [30, 20]], 0.6, F.puff)
    .outline(INK),
  // 炎の鳥：翼を広げた赤い鳥。頭の冠と長い尾が炎
  homuradori: () => grid()
    .poly([[3, 27], [9, 22], [13, 25], [12, 30], [7, 30]], F.flame).poly([[5, 26], [9, 24], [10, 28]], F.flameLight)
    .poly([[1, 9], [9, 13], [12, 19], [5, 18]], F.bird).poly([[31, 9], [23, 13], [20, 19], [27, 18]], F.bird)
    .line(3, 11, 9, 15, F.birdShade).line(29, 11, 23, 15, F.birdShade)
    .ellipse(16, 18, 6.5, 7, F.bird).ellipse(16, 21, 4, 4, F.birdLight)
    .ellipse(16, 9, 5, 4.5, F.bird)
    .poly([[13, 6], [14, 1], [16, 5], [18, 0], [19, 6]], F.flame).px1(16, 3, F.flameLight).px1(14, 3, F.flameLight)
    .poly([[15, 11], [17, 11], [16, 14]], F.beak)
    .tint(10, 24, 22, 26, F.birdShade, F.bird)
    .eye(13, 8).eye(18, 8)
    .outline(INK),
};
