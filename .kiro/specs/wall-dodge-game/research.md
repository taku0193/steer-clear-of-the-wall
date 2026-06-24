# Research & Design Decisions

## Summary

- **Feature**: `wall-dodge-game`
- **Discovery Scope**: New Feature
- **Key Findings**:
  - 現在のリポジトリには `package.json` と `src/` が存在しないため、初期実装は小さなVite + React + TypeScript構成から開始する。
  - カメラ入力はブラウザの安全なコンテキストとユーザー許可が前提であり、拒否、未搭載、未選択を明確なエラー状態として扱う必要がある。
  - 姿勢検出はMediaPipe Tasks VisionのPose Landmarkerを候補としつつ、初期化失敗や検出不能をゲーム状態として扱う。

## Research Log

### 既存コードベース

- **Context**: 要件から設計へ進む前に、既存の実装や設定があるか確認した。
- **Sources Consulted**: ローカルの `README.md`, `docs/feature-memo.md`, `.kiro/steering/*.md`, `.kiro/specs/wall-dodge-game/requirements.md`
- **Findings**:
  - `README.md` はプロジェクト名のみ。
  - `package.json` と `src/` は未作成。
  - steeringでは、カメラ、姿勢検出、描画、ゲーム進行、判定、スコアの責務分離が求められている。
- **Implications**:
  - 既存コードとの統合ではなく、初期スキャフォールドと最小ゲーム実装が主作業になる。
  - 設計は小さな単一ページ構成から始め、将来の拡張点だけを型と責務で残す。

### カメラ入力

- **Context**: Camera Inputをブラウザで扱うための前提と失敗ケースを確認した。
- **Sources Consulted**: MDN `MediaDevices.getUserMedia()`
- **Findings**:
  - `getUserMedia()` は安全なコンテキストで利用され、ユーザー許可を要求する。
  - 許可拒否、該当デバイスなし、ハードウェアまたはブラウザ側の読み取り不能、制約不一致などで失敗する。
  - ユーザーが許可ダイアログに反応しない場合、Promiseがすぐに解決または拒否されない可能性がある。
- **Implications**:
  - カメラ準備中、拒否、未検出、読み取り不能を状態として分ける。
  - 初期実装では音声を要求せず、映像だけを要求する。
  - 停止時はMediaStreamのtrackを明示的に停止する設計にする。

### 姿勢検出

- **Context**: Pose Detectionの候補としてMediaPipe Tasks Visionを確認した。
- **Sources Consulted**: Google AI Edge MediaPipe Pose Landmarker Web guide
- **Findings**:
  - Pose Landmarkerは画像または動画から人体ランドマークを検出し、画像座標と3D world座標を出力できる。
  - Web/JavaScript向けには `@mediapipe/tasks-vision` パッケージが提供されている。
  - 動画ではフレームごとに処理し、タイムスタンプを使って推論する方式が示されている。
  - MediaPipe Solutions Previewは早期リリース扱いである。
- **Implications**:
  - 姿勢検出はアダプター境界に閉じ込め、アプリ全体に外部ライブラリ固有の型を広げない。
  - 初期実装では必要なランドマークだけを正規化した独自型に変換する。
  - ライブラリ読み込み失敗をユーザーに見えるエラーとして扱う。

### フロントエンド初期構成

- **Context**: 初期実装の開発体験と最小構成を確認した。
- **Sources Consulted**: Vite Getting Started
- **Findings**:
  - Viteの現行ドキュメントではNode.js 20.19+または22.12+が必要。
  - Viteはテンプレート指定でReactなどの初期構成を作成できる。
- **Implications**:
  - 初期実装ではVite + React + TypeScriptを候補とする。
  - Ubuntuサーバー上ではNode.jsバージョン確認を最初の実装タスクに含める。

### 参考リポジトリ

- **Context**: 参考リポジトリの扱いを設計に反映する。
- **Sources Consulted**: `https://github.com/taku0193/ai-wall` のREADME相当表示
- **Findings**:
  - Camera InputからScore / Resultまでの体験フローは本仕様と一致する。
  - 具体コード、ファイル構成、壁パターン、判定値、スコア式はコピー禁止。
- **Implications**:
  - 設計はシステムの流れだけを参考にし、ファイル構成とデータ設計はこのプロジェクト用に新規定義する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 単一巨大コンポーネント | 画面、カメラ、判定、描画を1ファイルにまとめる | 初期作成は速い | 状態と副作用が混ざり、判定やスコアのテストが難しい | 不採用 |
| 責務分離したクライアント単一ページ | UI、カメラ、姿勢検出、ゲームロジック、描画を小さく分ける | 最小構成でも境界が明確でテストしやすい | 初期ファイル数は少し増える | 採用 |
| 高度なゲームエンジン導入 | ゲームエンジンで描画と状態を管理する | 大規模ゲームには強い | 今回の最小構成には過剰 | 不採用 |
| バックエンド連携あり | スコア保存やランキングをサーバーで扱う | 展示後の分析に使える | 要件の今回範囲外 | 不採用 |

## Design Decisions

### Decision: 最小のクライアント単一ページ構成を採用する

- **Context**: 初期実装は短時間で動作確認できる最小構成にする必要がある。
- **Alternatives Considered**:
  1. すべてを1コンポーネントに集約する。
  2. UI、入力、検出、ゲームロジック、描画を分ける。
- **Selected Approach**: Vite + React + TypeScriptを候補に、単一ページアプリ内で責務を分離する。
- **Rationale**: 展示向けの体験を素早く作りつつ、判定やスコアをテスト可能にできる。
- **Trade-offs**: 初期ファイル数は増えるが、後続の壁パターンや判定調整がしやすい。
- **Follow-up**: 実装開始時にNode.jsバージョンとブラウザのカメラ利用条件を確認する。

### Decision: 外部ライブラリ固有の姿勢データをアダプターで正規化する

- **Context**: 姿勢検出ライブラリの型や出力形式をゲームロジックに漏らすと変更に弱くなる。
- **Alternatives Considered**:
  1. MediaPipeの出力型をそのままアプリ全体で使う。
  2. ゲーム用の `PoseFrame` 型に変換して扱う。
- **Selected Approach**: 姿勢検出アダプターでゲーム用の正規化ランドマークに変換する。
- **Rationale**: 壁判定、アバター描画、スコア処理を外部ライブラリから分離できる。
- **Trade-offs**: 変換処理が必要になる。
- **Follow-up**: 初期実装では必要最小限のランドマークだけを変換する。

### Decision: 壁パターンは少数のデータ定義から始める

- **Context**: 要件では1種類または数種類の壁パターンが範囲であり、複雑なレベル管理は範囲外。
- **Alternatives Considered**:
  1. 多数の壁パターンとレベル管理を同時に作る。
  2. 1から3種類のシンプルな安全領域を定義する。
- **Selected Approach**: 初期は少数の矩形または単純形状の安全領域で判定する。
- **Rationale**: 当たり判定の妥当性を先に検証できる。
- **Trade-offs**: ゲームの多様性は低い。
- **Follow-up**: 成功/失敗が分かりやすい壁から追加する。

## Risks & Mitigations

- カメラがSSH先サーバーではなくブラウザ端末側で必要になる — READMEとUIでブラウザ側の権限が必要であることを明記する。
- `getUserMedia()` がHTTP環境で使えない可能性がある — `localhost` またはHTTPS前提を実装前に確認する。
- 姿勢検出モデルの読み込みに時間がかかる — カメラ準備中、モデル準備中、エラーを明確に表示する。
- MediaPipe Tasks Visionが早期リリース扱いで変更リスクがある — 外部ライブラリ境界をアダプターに閉じ込める。
- 当たり判定が厳しすぎるまたは甘すぎる — 初期実装では判定パラメータをデータとして調整できるようにする。

## References

- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — カメラ入力、許可、安全なコンテキスト、失敗ケース。
- [Google AI Edge: Pose Landmarker Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js) — Web向け姿勢検出の候補。
- [Vite Getting Started](https://vite.dev/guide/) — 初期フロントエンド構成とNode.js要件。
- [taku0193/ai-wall](https://github.com/taku0193/ai-wall) — システムフローのみ参考。
