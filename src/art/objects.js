// 上に乗る物（木・花・岩・巣）の絵（32×32 のドット絵）。判定表 第11回 W4：生き物と同じドット絵にそろえる。顔は描かない。
import { grid, toSvg } from './pixel.js';

const INK = '#1d1a33';
const O = {
  leaf: '#3f9a4f', leafLight: '#7cc96a', leafDark: '#2a6b38', trunk: '#7a5232', trunkDark: '#553820',
  petal: '#ff8fb4', petalLight: '#ffc6da', center: '#ffe07a', stem: '#3f9a4f', petal2: '#fff0f6', petal3: '#c9a7ff',
  rock: '#9a958e', rockLight: '#c4bfb7', rockDark: '#6d6862',
  nest: '#9a6b3e', nestLight: '#c08e5c', nestDark: '#6f4a2a', egg: '#f5efe0', eggSpot: '#b9ad94',
};

const flower = (g, x, y, c) => g
  .ellipse(x, y - 2, 1.6, 1.6, c).ellipse(x - 2, y, 1.6, 1.6, c).ellipse(x + 2, y, 1.6, 1.6, c).ellipse(x, y + 2, 1.6, 1.6, c)
  .px1(x, y, O.center);

export const OBJECT_DRAW = {
  // 木：まるい葉のかたまりと太い幹
  tree: () => grid()
    .rect(14, 19, 17, 28, O.trunk).rect(16, 19, 17, 28, O.trunkDark).rect(12, 28, 19, 28, O.trunk)
    .ellipse(16, 12, 10, 8.5, O.leaf).ellipse(10, 15, 5, 4, O.leaf).ellipse(22, 15, 5, 4, O.leaf)
    .tint(5, 17, 27, 20, O.leafDark, O.leaf)
    .ellipse(13, 8, 3, 2, O.leafLight).ellipse(20, 10, 2, 1.5, O.leafLight).px1(9, 13, O.leafLight)
    .outline(INK),
  // 花：3つの花と葉
  flower: () => {
    const g = grid()
      .line(10, 14, 12, 27, O.stem).line(21, 12, 19, 27, O.stem).line(16, 21, 16, 27, O.stem)
      .ellipse(9, 23, 2.5, 1.2, O.leaf).ellipse(23, 22, 2.5, 1.2, O.leaf);
    flower(g, 10, 12, O.petal);
    flower(g, 21, 10, O.petal2);
    flower(g, 16, 19, O.petal3);
    return g.outline(INK);
  },
  // 岩：まるい岩。上が明るく、ひびが1本
  rock: () => grid()
    .ellipse(16, 20, 12, 8, O.rock).ellipse(11, 14, 5, 4, O.rock)
    .tint(4, 24, 28, 28, O.rockDark, O.rock)
    .ellipse(12, 13, 2.5, 1.5, O.rockLight).ellipse(19, 15, 3, 1.2, O.rockLight)
    .line(17, 18, 20, 23, O.rockDark).line(20, 23, 19, 26, O.rockDark)
    .outline(INK),
  // 巣：小枝で編んだお椀と、卵2つ
  nest: () => grid()
    .ellipse(13, 17, 3.5, 4, O.egg).ellipse(19, 16, 3.5, 4.2, O.egg).px1(12, 16, O.eggSpot).px1(20, 15, O.eggSpot)
    .ellipse(16, 23, 13, 6, O.nest).ellipse(16, 20, 10, 2, O.nestDark)
    .line(5, 22, 12, 25, O.nestLight).line(13, 26, 22, 23, O.nestLight).line(19, 27, 27, 24, O.nestLight).line(8, 27, 14, 28, O.nestDark)
    .ellipse(13, 18, 3, 2.5, O.egg).ellipse(19, 17.5, 3, 3, O.egg)
    .outline(INK),
};

const cache = {};
export function objectSvg(kind, size = 32) {
  if (!OBJECT_DRAW[kind]) return null;
  const k = `${kind}:${size}`;
  cache[k] ??= toSvg(OBJECT_DRAW[kind](), size, 'px');
  return cache[k];
}
