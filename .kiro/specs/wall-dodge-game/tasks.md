# Implementation Plan

## 方針

- 1タスクの変更範囲を小さくし、Foundation、画面構成、ゲーム状態、モック動作、判定、スコア、カメラ、姿勢検出、統合、検証の順に進める。
- 最初はカメラやMediaPipeに入らず、Reactアプリの土台と画面状態を作る。
- 参考リポジトリのコード、型、CSS、壁データ、判定式、スコア式はコピーしない。参考にするのは Camera Input → Pose Detection → Avatar Display → Wall Pattern → Collision Judgment → Score / Result の流れだけにする。
- 各タスクの「変更するファイル」は実装時の予定であり、既存差分や設計変更がある場合は着手前に確認する。

## Tasks

- [x] 1. 開発基盤を最小構成で作成する
  - 作業内容: Vite + React + TypeScriptの最小アプリとして起動できる基盤を作る。
  - 変更するファイル: `package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/style.css`
  - 依存関係: なし
  - 完了条件: ブラウザで空に近いアプリ画面が表示され、開発サーバー、ビルド、型チェック用のnpm scriptsが定義されている。
  - 確認方法: `npm install` 後に開発サーバー起動、型チェック、ビルドを実行できることを確認する。
  - _Requirements: 1.1, 9.4, 9.5_
  - _Boundary: Frontend Foundation_

- [x] 2. 画面状態の型と初期状態を定義する
  - 作業内容: `title`, `preparing`, `countdown`, `playing`, `result`, `error` の状態を扱う土台を作る。
  - 変更するファイル: `src/game/types.ts`, `src/game/state.ts`, `src/App.tsx`
  - 依存関係: 1
  - 完了条件: アプリ内部で現在のゲーム状態を保持でき、初期表示が `title` 状態になる。
  - 確認方法: ブラウザ表示または開発者向け一時表示で、初期状態がタイトルであることを確認する。
  - _Requirements: 1.1, 1.4, 4.4_
  - _Boundary: Game State_

- [x] 3. タイトル画面と開始導線を作成する
  - 作業内容: 初回ユーザーがゲーム内容を短く理解し、開始操作できる画面を作る。
  - 変更するファイル: `src/components/TitleScreen.tsx`, `src/App.tsx`, `src/style.css`
  - 依存関係: 2
  - 完了条件: タイトル、短い説明、開始ボタンが表示され、開始操作で準備状態へ遷移する。
  - 確認方法: ブラウザで開始ボタンを押し、表示が準備中に変わることを確認する。
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - _Boundary: Screen Components, App_

- [x] 4. 結果画面とエラー画面の最小UIを作成する
  - 作業内容: ゲーム終了時とエラー時に、次に取る行動が分かる画面を作る。
  - 変更するファイル: `src/components/ResultScreen.tsx`, `src/components/ErrorScreen.tsx`, `src/App.tsx`, `src/style.css`
  - 依存関係: 2
  - 完了条件: 結果画面に最終スコアと再試行ボタンが表示され、エラー画面に理由と再試行導線が表示される。
  - 確認方法: 一時的な状態切替で `result` と `error` を表示し、再試行で準備状態へ戻ることを確認する。
  - _Requirements: 8.3, 8.4, 8.5, 9.1, 9.2, 9.3_
  - _Boundary: Screen Components, App_

- [x] 5. カウントダウンからプレイ開始までの状態遷移を作成する
  - 作業内容: 準備完了後にカウントダウンを表示し、終了後にプレイ状態へ進める。
  - 変更するファイル: `src/game/state.ts`, `src/App.tsx`, `src/components/GameScreen.tsx`, `src/style.css`
  - 依存関係: 3
  - 完了条件: 準備状態からカウントダウンを経由してプレイ状態に遷移し、カウントダウン中は判定処理が発生しない。
  - 確認方法: 開始操作後にカウントダウン表示が出て、終了後にプレイ画面へ変わることを確認する。
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - _Boundary: Game State, GameScreen_

- [x] 6. プレイ画面のHUDと制限時間表示を作成する
  - 作業内容: プレイ中にスコア、残り時間、検出状態、フィードバックを表示できるHUDを作る。
  - 変更するファイル: `src/components/GameScreen.tsx`, `src/App.tsx`, `src/style.css`
  - 依存関係: 5
  - 完了条件: プレイ画面で現在スコア、残り時間、ゲーム状態が確認できる。
  - 確認方法: プレイ状態に入ったとき、残り時間が減り、時間終了で結果画面へ遷移することを確認する。
  - _Requirements: 7.1, 7.4, 8.1, 8.2, 8.3_
  - _Boundary: GameScreen, Game State_

- [x] 7. 壁パターンの最小データを作成する
  - 作業内容: 中央、左、右など少数の壁パターンを、表示用と判定用の安全領域として定義する。
  - 変更するファイル: `src/game/types.ts`, `src/game/wallPatterns.ts`
  - 依存関係: 2
  - 完了条件: 1から3種類の壁パターンがデータとして参照でき、複雑な壁や高度なレベル管理を含まない。
  - 確認方法: 型チェックで壁パターンデータが有効であることを確認し、各パターンにID、表示名、安全領域、スコア値があることを確認する。
  - _Requirements: 5.3, 5.4, 5.5_
  - _Boundary: Wall Pattern Data_

- [ ] 8. モック姿勢と壁進行でゲームループの土台を作成する
  - 作業内容: カメラなしで固定または簡易操作の姿勢データを使い、壁が迫る進行を表現する。
  - 変更するファイル: `src/game/types.ts`, `src/game/state.ts`, `src/App.tsx`, `src/components/GameScreen.tsx`
  - 依存関係: 6, 7
  - 完了条件: プレイ状態で壁が進行し、判定位置に到達するイベントをアプリ内で扱える。
  - 確認方法: カメラなしでプレイを開始し、壁の進行状態が変化して結果または次の壁へ進むことを確認する。
  - _Requirements: 2.2, 5.1, 5.2, 6.1_
  - _Boundary: Game State_

- [ ] 9. 簡易Canvas描画でアバターと壁を表示する
  - 作業内容: モック姿勢と壁パターンをCanvas上に描画し、カメラ映像ではなくゲーム表現を主表示にする。
  - 変更するファイル: `src/rendering/canvasRenderer.ts`, `src/components/GameScreen.tsx`, `src/style.css`
  - 依存関係: 8
  - 完了条件: プレイ画面にアバター、安全領域、迫る壁が表示され、検出不能時の表示も用意されている。
  - 確認方法: ブラウザでプレイ画面を開き、カメラ映像ではなくCanvas上のアバターと壁が見えることを確認する。
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.4_
  - _Boundary: Canvas Renderer, GameScreen_

- [ ] 10. 簡易当たり判定を作成する
  - 作業内容: 姿勢データと壁の安全領域を比較し、成功、失敗、検出不能を判定する。
  - 変更するファイル: `src/game/types.ts`, `src/game/collision.ts`, `src/game/state.ts`
  - 依存関係: 7, 8
  - 完了条件: 壁が判定位置に到達したとき、1つの壁につき1回だけ成功、失敗、検出不能のいずれかが返る。
  - 確認方法: モック姿勢を安全領域内外に切り替え、成功と失敗が分かれることを確認する。
  - _Requirements: 4.2, 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Boundary: Collision Logic, Game State_

- [ ] 11. スコア計算と判定フィードバックを接続する
  - 作業内容: 成功時にスコアを加算し、失敗や検出不能の表示をプレイ画面へ反映する。
  - 変更するファイル: `src/game/types.ts`, `src/game/scoring.ts`, `src/game/state.ts`, `src/components/GameScreen.tsx`, `src/components/ResultScreen.tsx`
  - 依存関係: 10
  - 完了条件: 成功時にスコアが増え、失敗時は失敗表示が出て、結果画面に最終スコアが表示される。
  - 確認方法: モック姿勢で成功と失敗を発生させ、プレイ中スコアと結果画面の最終スコアを確認する。
  - _Requirements: 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 8.4_
  - _Boundary: Scoring Logic, Game State, Screen Components_

- [ ] 12. カメラ入力アダプターを作成する
  - 作業内容: ユーザー操作後に映像のみを要求し、取得、停止、エラー分類を行うカメラ境界を作る。
  - 変更するファイル: `src/camera/camera.ts`, `src/game/types.ts`, `src/App.tsx`, `src/components/ErrorScreen.tsx`
  - 依存関係: 3, 4
  - 完了条件: カメラ許可成功時にMediaStreamを取得でき、拒否、未検出、安全でないコンテキストなどがエラー画面に表示される。
  - 確認方法: ブラウザでカメラ許可、拒否、再試行を確認し、再試行や終了時にストリームが停止することを確認する。
  - _Requirements: 2.1, 2.3, 2.4, 9.3_
  - _Boundary: Camera Adapter, ErrorScreen_

- [ ] 13. 姿勢検出アダプターを作成する
  - 作業内容: 姿勢検出ライブラリを初期化し、外部ライブラリの出力をゲーム用の姿勢データに変換する。
  - 変更するファイル: `package.json`, `src/pose/poseTypes.ts`, `src/pose/poseDetector.ts`, `src/game/types.ts`, `src/components/ErrorScreen.tsx`
  - 依存関係: 12
  - 完了条件: カメラ映像から1人分の姿勢データを取得し、検出失敗や初期化失敗をゲーム用エラーとして扱える。
  - 確認方法: カメラ許可後に姿勢検出が開始され、検出中と検出不能の状態が画面に反映されることを確認する。
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.3_
  - _Boundary: Pose Adapter, ErrorScreen_

- [ ] 14. 実カメラ姿勢データをゲームループへ統合する
  - 作業内容: 姿勢検出結果をアバター表示、壁判定、スコア更新へ接続し、モック姿勢から実入力へ切り替える。
  - 変更するファイル: `src/App.tsx`, `src/components/GameScreen.tsx`, `src/game/state.ts`, `src/rendering/canvasRenderer.ts`
  - 依存関係: 11, 13
  - 完了条件: カメラ許可後、姿勢検出、アバター表示、カウントダウン、プレイ、判定、スコア、結果まで一連の流れが動く。
  - 確認方法: 実際に体を動かし、アバターが更新され、壁判定とスコアが発生し、制限時間後に結果画面へ進むことを確認する。
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.3, 5.1, 5.2, 6.1, 7.1, 8.1, 8.3_
  - _Boundary: App, Pose Adapter, Game State, Canvas Renderer_

- [ ] 15. 再試行とリソース解放を仕上げる
  - 作業内容: 結果画面やエラー画面から再試行したときに、状態、カメラ、姿勢検出、描画ループが破綻しないようにする。
  - 変更するファイル: `src/App.tsx`, `src/camera/camera.ts`, `src/pose/poseDetector.ts`, `src/game/state.ts`, `src/components/ResultScreen.tsx`, `src/components/ErrorScreen.tsx`
  - 依存関係: 14
  - 完了条件: 結果後とエラー後に再試行でき、古いMediaStream、姿勢検出インスタンス、アニメーションループが残らない。
  - 確認方法: 複数回連続でプレイ、結果、再試行、エラー再試行を行い、二重ループやカメラの残留がないことを確認する。
  - _Requirements: 9.1, 9.2, 9.3_
  - _Boundary: App, Camera Adapter, Pose Adapter, Game State_

- [ ] 16. 要件に対応したユニットテストを追加する
  - 作業内容: 当たり判定、スコア計算、状態遷移の主要ロジックをテストする。
  - 変更するファイル: `package.json`, `src/game/collision.test.ts`, `src/game/scoring.test.ts`, `src/game/state.test.ts`
  - 依存関係: 11
  - 完了条件: 成功、失敗、検出不能、スコア加算、時間終了、カウントダウン中の非判定を自動テストで確認できる。
  - 確認方法: テストコマンドを実行し、対象テストが成功することを確認する。
  - _Requirements: 4.2, 6.1, 6.4, 6.5, 7.2, 8.1, 8.3_
  - _Boundary: Game Domain Tests_

- [ ] 17. 最小E2E相当の手動確認とREADME更新を行う
  - 作業内容: 開発サーバー起動、ブラウザ確認、カメラ利用条件、基本操作をREADMEに反映する。
  - 変更するファイル: `README.md`
  - 依存関係: 15, 16
  - 完了条件: READMEにセットアップ、起動、型チェック、テスト、カメラ利用条件、参考リポジトリの非コピー方針が記載されている。
  - 確認方法: READMEの手順だけで開発サーバー起動と基本確認の流れを追えることを確認する。
  - _Requirements: 1.1, 2.3, 2.4, 9.3, 9.4, 9.5_
  - _Boundary: Project Documentation, Validation_

## Requirements Coverage

| Requirement | Covered by Tasks |
|-------------|------------------|
| 1.1 | 1, 2, 3, 17 |
| 1.2 | 3 |
| 1.3 | 3 |
| 1.4 | 2, 3 |
| 2.1 | 12, 13, 14 |
| 2.2 | 8, 13, 14 |
| 2.3 | 12, 17 |
| 2.4 | 12, 17 |
| 2.5 | 13 |
| 3.1 | 9, 13, 14 |
| 3.2 | 9, 13, 14 |
| 3.3 | 9, 13 |
| 3.4 | 9 |
| 4.1 | 5, 14 |
| 4.2 | 5, 10, 16 |
| 4.3 | 5, 14 |
| 4.4 | 2, 5 |
| 5.1 | 8, 9, 14 |
| 5.2 | 8, 9, 14 |
| 5.3 | 7 |
| 5.4 | 7, 9 |
| 5.5 | 7 |
| 6.1 | 8, 10, 14, 16 |
| 6.2 | 10, 11 |
| 6.3 | 10, 11 |
| 6.4 | 10, 11, 16 |
| 6.5 | 10, 16 |
| 7.1 | 6, 11, 14 |
| 7.2 | 11, 16 |
| 7.3 | 11 |
| 7.4 | 6, 11 |
| 7.5 | 11 |
| 8.1 | 6, 14, 16 |
| 8.2 | 6 |
| 8.3 | 4, 6, 14, 16 |
| 8.4 | 4, 11 |
| 8.5 | 4 |
| 9.1 | 4, 15 |
| 9.2 | 4, 15 |
| 9.3 | 4, 12, 15, 17 |
| 9.4 | 1, 17 |
| 9.5 | 1, 17 |
