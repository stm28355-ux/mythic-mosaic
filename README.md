# Mythic Mosaic

六角の箱庭に地形を敷き、ある形ができると幻の生き物がすぐ現れる。現れた生き物が周りの土地を変え、次の形ができて連鎖する。一人用のパズル。

- 企画の正：Claude Docs「生息地づくりゲーム 企画まとめ（引き継ぎ用）」
- 計画のメモ：[docs/plan.md](docs/plan.md)

## 遊ぶ

https://stm28355-ux.github.io/mythic-mosaic/

いまは作り始めたところ（工程0）。

## 開発

```
npm test                      # テスト
node tools/serve.mjs 5193     # 手元で http://localhost:5193/
```

ビルドはない。静的な HTML と JavaScript（ES モジュール）だけで動く。
