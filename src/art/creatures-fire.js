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
  // 第18回の5匹
  lake: '#4f86b8', lakeLight: '#9fd0f0', lakeShade: '#36648f', steam: '#eef4fb', spirit: '#bfe6ff', spiritShade: '#8cc6ec', pink: '#ffb3c6',
  obsid: '#463f60', obsidLight: '#8d7fc4', obsidShine: '#d6ccff',
  squirrel: '#c9773a', squirrelLight: '#f0b27a', squirrelShade: '#9a5626', handle: '#8a5a32', blade: '#cfd6de', bladeShade: '#9aa3ad',
  coal: '#57505e', coalLight: '#7d7488', crack: '#ff6a3c', crackLight: '#ffd35c',
  magma: '#ff7a3c', magmaLight: '#ffc04a', magmaDeep: '#d0452e', crust: '#5a3a36',
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
  // 火口の湖：湖から上半身を出す、湯けむりの精
  kakouko: () => grid()
    .px1(9, 7, F.steam).px1(8, 6, F.steam).px1(9, 5, F.steam).px1(23, 7, F.steam).px1(24, 6, F.steam).px1(23, 5, F.steam).px1(16, 5, F.steam).px1(17, 4, F.steam)
    .ellipse(16, 17, 8, 7.5, F.spirit).tint(8, 20, 24, 24, F.spiritShade, F.spirit)
    .ellipse(13, 13, 2, 1.2, F.steam)
    .ellipse(16, 26, 15, 5, F.lake).line(4, 25, 9, 25, F.lakeLight).line(22, 27, 27, 27, F.lakeLight).tint(2, 29, 30, 31, F.lakeShade, F.lake)
    .ellipse(6, 23, 2, 1.4, F.spirit).ellipse(26, 23, 2, 1.4, F.spirit)
    .eye(12, 16).eye(18, 16).px1(11, 19, F.pink).px1(21, 19, F.pink).rect(15, 20, 16, 20, F.spiritShade)
    .outline(INK),
  // 黒曜の子：角ばった黒い石の体。面に紫の光
  kuroishi: () => grid()
    .poly([[16, 3], [25, 9], [28, 19], [23, 28], [9, 28], [4, 19], [7, 9]], F.obsid)
    .poly([[16, 3], [25, 9], [16, 12]], F.obsidLight).poly([[7, 9], [16, 3], [16, 12]], F.obsidLight)
    .line(16, 12, 16, 15, F.obsidLight).line(4, 19, 9, 17, F.obsidLight).line(28, 19, 23, 17, F.obsidLight)
    .px1(20, 6, F.obsidShine).px1(21, 7, F.obsidShine).px1(11, 7, F.obsidShine)
    .ellipse(11, 29, 2.5, 1.3, F.obsid).ellipse(21, 29, 2.5, 1.3, F.obsid)
    .eyeW(11, 18).eyeW(19, 18).line(14, 23, 17, 23, F.obsidLight)
    .outline(INK),
  // 木こりのりす：大きなしっぽのりす。小さな斧を抱える
  kikorisu: () => grid()
    .path([[8, 26], [4, 20], [4, 12], [8, 7], [12, 9]], 3.2, F.squirrel).path([[5, 18], [5, 12], [8, 9]], 1.2, F.squirrelLight)
    .ellipse(17, 21, 6.5, 7, F.squirrel).ellipse(18, 22, 3.5, 4.5, F.squirrelLight)
    .ellipse(19, 11, 6, 5.5, F.squirrel).poly([[14, 7], [15, 2], [17, 6]], F.squirrel).poly([[21, 6], [23, 2], [24, 7]], F.squirrel)
    .ellipse(23, 13, 2.5, 2, F.squirrelLight)
    .line(25, 27, 28, 14, F.handle).poly([[26, 13], [31, 11], [31, 18], [27, 17]], F.blade).line(30, 12, 30, 17, F.bladeShade)
    .ellipse(24, 21, 2, 1.5, F.squirrel)
    .ellipse(14, 29, 2.5, 1.3, F.squirrelShade).ellipse(21, 29, 2.5, 1.3, F.squirrelShade)
    .eye(17, 10).eye(22, 10).px1(25, 13, INK)
    .outline(INK),
  // 炭の子：まるい炭のかたまり。ひびに赤い光
  suminoko: () => grid()
    .ellipse(16, 18, 11, 10, F.coal).ellipse(12, 12, 4, 2.5, F.coalLight)
    .line(7, 14, 10, 18, F.crack).line(10, 18, 9, 22, F.crack).line(23, 11, 21, 15, F.crack).line(21, 15, 24, 19, F.crack).line(14, 25, 19, 26, F.crack)
    .px1(10, 18, F.crackLight).px1(21, 15, F.crackLight)
    .ellipse(11, 29, 2.5, 1.3, F.coal).ellipse(21, 29, 2.5, 1.3, F.coal)
    .px1(7, 5, F.crack).px1(25, 4, F.crackLight).px1(27, 7, F.crack)
    .eyeW(12, 17).eyeW(18, 17).line(15, 21, 16, 21, F.coalLight)
    .outline(INK),
  // 溶岩の子：どろりと垂れる溶岩の体。ところどころ黒い殻
  magumaru: () => grid()
    .ellipse(16, 16, 10, 9, F.magma).ellipse(16, 25, 13, 4, F.magma)
    .rect(6, 22, 8, 28, F.magma).rect(24, 21, 26, 29, F.magma).rect(13, 26, 15, 30, F.magma)
    .ellipse(13, 11, 3, 2, F.magmaLight).ellipse(19, 21, 4, 2.5, F.magmaLight)
    .tint(3, 27, 29, 31, F.magmaDeep, F.magma)
    .ellipse(23, 10, 3, 2, F.crust).ellipse(8, 18, 2, 1.5, F.crust).ellipse(21, 26, 2.5, 1, F.crust)
    .eye(12, 15).eye(18, 15).rect(15, 19, 16, 19, F.magmaDeep)
    .outline(INK),
};
