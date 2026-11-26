// スコアアタックの地図（工程6 の試作。判定表 第10回で決める）。
// rows は (0,0) 中心・半径4の六角の行（上から r = -4 … 4。文字数は 5・6・7・8・9・8・7・6・5）。
//   . 地図の外　o 荒れ地　w 水　g 草　s 砂　m 湿地　1・2 高さ1・2の荒れ地　r 岩（荒れ地）　t 木（草）　S 高さ1の砂
// stock＝置ける物の数（この数を全部置いたら終わり）、unlockAt＝開くのに要る図鑑の数、
// stars＝★1・★2・★3 に要る点（点の付け方 a・b ごと。tools/measure-score.mjs で測った：★1＝欲ばりの真ん中、★2＝欲ばりの一番、★3＝先読みの7割。人の記録で直す）
export const MAPS = Object.freeze([
  {
    id: 'irie', title: '入り江の浜', unlockAt: 12,
    rows: [
      '..oo.',
      '.ooo1.',
      'oowoooo',
      'ooooosoo',
      '.woooro1o',
      'ooooosso',
      'oowoooo',
      '.oooo.',
      '..oo.',
    ],
    stock: { grass: 4, water: 4, sand: 3, hill: 2 },
    stars: { a: [10, 49, 95], b: [14, 74, 125] },
  },
  {
    id: 'futago', title: '双子の丘', unlockAt: 18,
    rows: [
      'o1oo.',
      'o12ooo',
      'oo1oooo',
      'oooogooo',
      'ooowrwooo',
      'ooogoo1o',
      'oooo12o',
      'ooo1o.',
      '.oo..',
    ],
    stock: { grass: 5, water: 5, sand: 4, hill: 2, rock: 2 },
    stars: { a: [33, 73, 103], b: [61, 85, 127] },
  },
]);
