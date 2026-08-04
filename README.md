# つまみ食いOS

空中で親指と人差し指をpinchしてアイコンをつまみ、口へ運んで食べるインタラクティブ作品です。

- 作品番号: Daily Product #54
- 制作日: 2026-08-03
- リポジトリ名: `tsumamigui-os`

## 作品概要

- タイトル: つまみ食いOS
- キャッチコピー: 空中でつまんで、ぱくっ。
- コンセプト: Webカメラ越しに表示された架空OSのアイコンを、pinch ジェスチャーで保持・移動し、口元へ運んで消費する。

## 遊び方

1. 画面上部の「Start camera」でカメラを許可してカメラモードを開始。
2. 親指先と人差し指先を閉じてpinch判定し、アイコンに近づける。
3. アイコンをpinch状態でドラッグし、口元へ運ぶ。
4. 口を開いた状態でアイコンを口の領域に220ms以上入れ続けると消費される。
5. 全アイコンを消費すると完了演出が表示される。
6. 「Reset」で最初から再スタート。
7. 「Start pointer mode」を使うとカメラなしでpointerデモが操作できる。

## 技術構成

- Vite
- Vanilla TypeScript
- p5.js
- @mediapipe/tasks-vision
- ESLint / Prettier
- Vitest
- Playwright

## pinch判定

- Hand Landmarkerから手首・親指先端・人差し指先端・人差し指MCP・中指MCP・小指MCPを取得。
- 画面座標はMediaPipe正規化座標からcover変換して反転描画。
- `pinchRatio = distance(thumbTip, indexTip) / max(palmLength, palmWidth)` を利用。
- 閾値: `0.25`（閉じる）, `0.38`（開く）を基準にヒステリシス。
- hand lostは250msでLOST扱い。

## 口開閉判定

- Face Landmarkerの `jawOpen` が利用可能なら優先、なければ上下内唇間隔/口角距離から代替。
- 口領域は楕円で管理。
- 口開状態のヒステリシスで瞬間開きによる誤判定を防止。

## プライバシー

- 取得した映像は端末内で推論され、外部送信しません。
- サーバー送信・保存、ユーザー登録、認証、音声権限要求は行いません。
- カメラ映像に関わる外部ネットワーク送信はありません。

## ローカル起動方法

```bash
npm install
npm run assets
npm run dev
```

## テスト方法

```bash
npm run test:run
npm run test:e2e
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run check
```

## ビルド方法

```bash
npm run build
```

## GitHub Pages公開URL

- 現在は未公開（ローカル検証状態）。

## 対応ブラウザー

- Chrome / Chromium / Edge / Safari

## 既知の制約

- カメラモードは実機ブラウザーでの確認が必要。
- モデル初回読み込みはネットワーク帯域に依存する。

## ライセンス

MIT License

## 第三者

- p5.js
- MediaPipe
- MediaPipe Tasks Vision
- Google が公開する hand_landmarker / face_landmarker モデル
