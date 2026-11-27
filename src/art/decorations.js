// 島の飾り（実績のごほうび。2026-11-27 1.0.0 のあと、人の頼みで作った）。32×32 のドット絵。物なので顔は描かない。
// キーは実績の id。island＝飾る島（1＝はじまりの島、2＝火の山の島）
import { grid, toSvg } from './pixel.js';

const INK = '#1d1a33';
const D = {
  water: '#4f86b8', waterLight: '#9fd0f0', pad: '#4f9a4f', padLight: '#7cc26a', padDark: '#2f6b38', bud: '#f3a6c8', budLight: '#ffd6e6',
  leaf: '#3f9a4f', leafLight: '#7cc96a', leafDark: '#2a6b38', trunk: '#7a5232', trunkDark: '#553820', fruit: '#ff8f6b',
  petal: '#ff8fb4', petal2: '#fff0f6', petal3: '#ffe07a', post: '#c08e5c', postDark: '#8a6238',
  wall: '#efe4c8', wallShade: '#c9bb98', roof: '#c0507a', blade: '#f6f1e6', bladeShade: '#c9c2b4', door: '#7a5232',
  stone: '#9a958e', stoneLight: '#c4bfb7', stoneDark: '#6d6862', moss: '#7cc96a',
  lantern: '#8e8a84', lanternDark: '#5f5b56', glow: '#fff3b0', glowMid: '#ffe07a', fly: '#e6f58a',
  egg: '#ffffff', eggShade: '#e2e2f0', gold: '#ffd35c', goldShade: '#e0a91c', straw: '#e8c47a', strawDark: '#b8924a',
  tower: '#f6f1e6', red: '#e0503c', redDark: '#a8341f', light: '#fff3b0', beam: '#fff8d0',
  bird: '#ff6b4a', birdShade: '#d0452e', flame: '#ff8a3c', flameLight: '#ffd35c', base: '#6d6862', baseLight: '#9a958e',
  iron: '#4f4a56', ironLight: '#76707e', lava: '#ff7a3c', lavaLight: '#ffc04a', smoke: '#d2ccd0', smokeLight: '#eeeaf2',
};

export const DECO_DRAW = {
  // 蓮の葉：水に浮かぶ大きな葉と、桃色のつぼみ
  'g-water': () => grid()
    .ellipse(16, 25, 15, 5, D.water).line(3, 25, 7, 25, D.waterLight).line(24, 27, 29, 27, D.waterLight)
    .ellipse(15, 20, 12, 6, D.pad).poly([[15, 20], [27, 16], [27, 22]], D.water).ellipse(12, 18, 5, 2, D.padLight)
    .line(15, 20, 6, 17, D.padDark).line(15, 20, 8, 24, D.padDark).line(15, 20, 20, 25, D.padDark)
    .line(21, 18, 21, 10, D.padDark).ellipse(21, 8, 3, 4, D.bud).poly([[19, 6], [21, 1], [23, 6]], D.budLight)
    .outline(INK),
  // 大きな木：何段にも重なる葉と、太い幹と根。赤い実
  'g-forest': () => grid()
    .rect(13, 20, 18, 29, D.trunk).rect(16, 20, 18, 29, D.trunkDark).poly([[9, 30], [13, 26], [13, 30]], D.trunk).poly([[22, 30], [18, 26], [18, 30]], D.trunk)
    .ellipse(16, 15, 13, 8, D.leafDark).ellipse(16, 11, 11, 7, D.leaf).ellipse(16, 6, 7, 4.5, D.leafLight)
    .px1(9, 13, D.fruit).px1(22, 12, D.fruit).px1(14, 17, D.fruit).px1(19, 6, D.fruit)
    .outline(INK),
  // 花のアーチ：木の柱2本と、花でできた半円
  'g-flower': () => {
    const g = grid().rect(5, 14, 7, 30, D.post).rect(25, 14, 27, 30, D.post).line(7, 14, 7, 30, D.postDark).line(27, 14, 27, 30, D.postDark);
    const cs = [D.petal, D.petal2, D.petal3];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (i / 10);
      g.ellipse(16 - Math.cos(a) * 10, 15 - Math.sin(a) * 10, 2.2, 2.2, cs[i % 3]);
    }
    return g.ellipse(4, 29, 3, 1.5, D.leaf).ellipse(28, 29, 3, 1.5, D.leaf).outline(INK);
  },
  // 風車：白い塔に4枚の羽、小さな扉
  'g-dune': () => grid()
    .poly([[11, 30], [13, 12], [19, 12], [21, 30]], D.wall).tint(17, 12, 21, 30, D.wallShade, D.wall)
    .poly([[11, 13], [16, 6], [21, 13]], D.roof).rect(15, 24, 17, 30, D.door)
    .poly([[16, 10], [4, 3], [2, 6]], D.blade).poly([[16, 10], [29, 3], [30, 6]], D.blade)
    .poly([[16, 10], [5, 19], [3, 16]], D.bladeShade).poly([[16, 10], [27, 19], [29, 16]], D.bladeShade)
    .ellipse(16, 10, 1.5, 1.5, D.postDark)
    .outline(INK),
  // 立ち石：苔のついた背の高い石と、小さな石
  'g-mountain': () => grid()
    .poly([[9, 30], [10, 8], [14, 2], [19, 4], [21, 30]], D.stone).tint(17, 2, 21, 30, D.stoneDark, D.stone)
    .line(12, 8, 12, 24, D.stoneLight).px1(15, 5, D.stoneLight)
    .ellipse(12, 26, 3, 2, D.moss).ellipse(19, 14, 1.5, 2, D.moss)
    .ellipse(26, 28, 4, 2.5, D.stone).px1(25, 27, D.stoneLight)
    .outline(INK),
  // 蛍の灯り：石の灯籠に黄色い灯り。まわりを蛍が飛ぶ
  'g-marsh': () => grid()
    .rect(10, 27, 22, 30, D.lantern).rect(14, 20, 18, 27, D.lantern).rect(9, 17, 23, 19, D.lanternDark)
    .rect(11, 11, 21, 17, D.lantern).rect(13, 12, 19, 16, D.glowMid).rect(14, 13, 18, 15, D.glow)
    .poly([[8, 11], [16, 4], [24, 11]], D.lanternDark).rect(15, 2, 17, 4, D.lanternDark)
    .px1(4, 8, D.fly).px1(27, 6, D.fly).px1(26, 21, D.fly).px1(5, 22, D.fly).px1(29, 14, D.fly)
    .outline(INK),
  // 竜の卵：わらの巣の中の白い卵。金の模様
  hajimari: () => grid()
    .ellipse(16, 27, 13, 4, D.straw).line(4, 27, 10, 29, D.strawDark).line(20, 29, 28, 26, D.strawDark)
    .ellipse(16, 16, 8, 11, D.egg).tint(19, 6, 24, 26, D.eggShade, D.egg)
    .line(9, 14, 23, 14, D.gold).px1(12, 10, D.gold).px1(20, 9, D.gold).px1(16, 19, D.goldShade).px1(13, 21, D.gold).px1(19, 22, D.gold)
    .ellipse(13, 9, 1.5, 2, '#ffffff')
    .ellipse(16, 26, 11, 2, D.straw)
    .outline(INK),
  // 灯台：赤と白のしまの塔と、光
  scoreAll: () => grid()
    .poly([[0, 6], [11, 8], [0, 11]], D.beam).poly([[32, 6], [21, 8], [32, 11]], D.beam)
    .poly([[10, 30], [12, 11], [20, 11], [22, 30]], D.tower)
    .tint(10, 15, 22, 18, D.red, D.tower).tint(10, 23, 22, 26, D.red, D.tower)
    .rect(12, 6, 20, 10, D.light).rect(11, 10, 21, 11, D.redDark).poly([[11, 6], [16, 1], [21, 6]], D.red)
    .rect(15, 27, 17, 30, D.door)
    .outline(INK),
  // 炎の鳥の像：石の台に赤い鳥。頭と尾に炎
  'g-fire': () => grid()
    .rect(8, 25, 24, 30, D.base).rect(6, 24, 26, 25, D.baseLight).rect(8, 28, 24, 28, D.stoneDark)
    .poly([[4, 13], [11, 16], [12, 21], [6, 20]], D.bird).poly([[28, 13], [21, 16], [20, 21], [26, 20]], D.bird)
    .ellipse(16, 18, 5, 5.5, D.bird).ellipse(16, 10, 3.5, 3.5, D.bird)
    .poly([[14, 7], [15, 2], [16, 6], [18, 1], [18, 7]], D.flame).px1(16, 4, D.flameLight)
    .poly([[15, 12], [17, 12], [16, 14]], D.flameLight)
    .tint(11, 20, 21, 23, D.birdShade, D.bird)
    .outline(INK),
  // 溶岩の灯り：鉄の灯りの中で溶岩が光る
  hinoyamanushi: () => grid()
    .rect(15, 1, 17, 4, D.iron).ellipse(16, 5, 3, 1.5, D.iron)
    .poly([[9, 8], [23, 8], [21, 24], [11, 24]], D.iron)
    .poly([[11, 10], [21, 10], [19, 22], [13, 22]], D.lava).poly([[13, 12], [19, 12], [18, 20], [14, 20]], D.lavaLight)
    .line(16, 10, 16, 22, D.ironLight)
    .rect(10, 24, 22, 26, D.ironLight).rect(13, 26, 19, 30, D.iron)
    .outline(INK),
  // のろし：石を積んだ台の上で燃える火と、立ちのぼる煙
  fireScore: () => grid()
    .ellipse(14, 4, 4, 3, D.smoke).ellipse(18, 9, 4, 3, D.smokeLight).ellipse(14, 13, 3.5, 2.5, D.smoke)
    .poly([[10, 22], [13, 15], [16, 18], [19, 13], [22, 22]], D.flame).poly([[13, 22], [16, 18], [19, 22]], D.flameLight)
    .rect(6, 22, 26, 30, D.stone).line(6, 26, 26, 26, D.stoneDark).line(12, 22, 12, 26, D.stoneDark).line(20, 26, 20, 30, D.stoneDark)
    .px1(9, 24, D.stoneLight).px1(23, 28, D.stoneLight)
    .outline(INK),
};

// 飾る島（火の山の島の物は火の山の島に、ほかははじまりの島に）
export const DECO_ISLAND = { 'g-fire': 2, hinoyamanushi: 2, fireScore: 2 };

const cache = {};
export function decoSvg(id, size = 32) {
  if (!DECO_DRAW[id]) return null;
  const k = `${id}:${size}`;
  cache[k] ??= toSvg(DECO_DRAW[id](), size, 'px');
  return cache[k];
}
