# つまみ食いOS｜空中でアイコンをつまんで食べる

あなたの指がマウス、口がごみ箱。  
「つまみ食いOS」は、親指と人差し指のピンチ操作でアイコンをつまみ、口元へ運んで消す体験型インタラクションです。

- 作品番号: Daily Product #54
- 制作日: 2026-08-03

## URL

- GitHub Pages: （公開後に更新）

## 特徴

- Webカメラ映像を入力として利用
- MediaPipe Hand Landmarker / Face Landmarker によるランドマーク推論
- p5.js + TypeScript のブラウザ実装
- 指の `pinch` 状態でアイコンを掴む
- 口の開閉判定で「食べられる」演出を再現
- `?mode=pointer` で疑似トラック（E2Eテスト向け）

## 遊び方

1. トップの「カメラで遊ぶ」を押して実行
2. 指を画面内へ見せ、親指と人差し指を近づける
3. アイコンをつかんで口元へ移動
4. 口が開いている状態で口領域へ一定時間保持すると削除
5. すべて消すと完了表示
6. 「もう一皿」で再開

## 技術構成

- Vite
- Vanilla TypeScript
- p5.js
- @mediapipe/tasks-vision
- ESLint / Prettier
- Vitest
- Playwright

## pinch 判定

親指先端・人差し指先端の距離を、手の大きさ（手首→中指MCP距離または人差し指MCP→小指MCP距離）で正規化した `pinchRatio` で安定化し、
ヒステリシス付き有限状態機械で OPEN/CLOSING/PINCHED/OPENING/LOST を判定します。

## 口開閉判定

Face Landmarker の唇関連ランドマークから口幅・口開き高さを取得し、`jawOpen` があれば最優先で採用。
ヒステリシス付き状態機械で CLOSED/OPENING/OPEN/CLOSING/LOST を更新します。

## プライバシー

映像や解析結果はブラウザ外へ送信されません。カメラは `getUserMedia` でローカルのみ使用し、保存・外部送信は行いません。

## ローカル起動

```bash
npm install
npm run assets
npm run dev
```

## テスト

```bash
npm run test:run
npm run test:e2e
```

## ビルド

```bash
npm run build
```

## データベース・認証

本体はサーバーやDBを持たず、完全クライアントサイドです。

## ライセンス

- 本体: MIT
- 第三者情報: `THIRD_PARTY_NOTICES.md` を参照

## 対応ブラウザー

- Chrome/Chromium系、Safari、Edge（最新2系）

## 既知の制約

- 実カメラ環境が前提
- 指の向きと照明条件により認識が不安定になる場合あり
- モバイル環境でカメラ権限の初回取得が必要
