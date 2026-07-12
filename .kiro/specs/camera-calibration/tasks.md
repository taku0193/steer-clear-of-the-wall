# Implementation Plan

## 方針

- 実装は、純粋ロジック、UI表示、App接続、検証、ドキュメントの順で進める。
- キャリブレーション判定は元の `PoseFrame` から作る未縮尺身体領域を使い、ゲーム用に縮尺済みの `playerArea` は距離判定へ使わない。
- カメラ取得、MediaPipe初期化、姿勢検出ループ、プレイ中のCanvas描画、壁判定、スコア計算は変更しない。
- モック姿勢モードの導線を維持し、既存E2Eで回帰確認する。
- 実カメラ依存の挙動は、ユニットテストで判定ロジックを固めた上で手動確認する。

## Tasks

- [x] 1. キャリブレーション判定の型と閾値を追加する
  - 作業内容: `CalibrationStatus`, `CalibrationGuidance`, `CalibrationCheck`, `CalibrationResult`, `CalibrationInput`, `CALIBRATION_THRESHOLDS` を定義する。
  - 変更するファイル: `src/game/calibration.ts`
  - 依存関係: なし
  - 完了条件: UIやブラウザAPIに依存しない型と閾値が定義されている。
  - 確認方法: `npm run typecheck` を実行する。
  - _Requirements: 1.1, 1.2, 3.1, 6.1, 6.3_
  - _Boundary: Game Domain_

- [x] 2. 元PoseFrameから未縮尺身体領域を作る
  - 作業内容: 可視ランドマークからカメラ座標系の身体外接領域を作り、必須ランドマーク不足を判定できる純粋関数を追加する。
  - 変更するファイル: `src/game/calibration.ts`, `src/game/calibration.test.ts`
  - 依存関係: 1
  - 完了条件: 未検出、必須ランドマーク不足、全身検出良好を判定できる。
  - 確認方法: `npm test -- src/game/calibration.test.ts` を実行する。
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.2, 6.3_
  - _Boundary: Game Domain_

- [x] 3. 立ち位置と距離感の評価ロジックを追加する
  - 作業内容: 身体中心、身体高さ、身体幅から、左右寄り、近すぎる、遠すぎる、良好状態を判定する。
  - 変更するファイル: `src/game/calibration.ts`, `src/game/calibration.test.ts`
  - 依存関係: 2
  - 完了条件: 左寄り、右寄り、近すぎる、遠すぎる、良好の各ケースで期待する `guidance` と `canStart` が返る。
  - 確認方法: `npm test -- src/game/calibration.test.ts` を実行する。
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.2_
  - _Boundary: Game Domain_

- [x] 4. キャリブレーション結果の表示コンポーネントを追加する
  - 作業内容: `CalibrationPanel` を作り、状態見出し、主案内、全身・中央・距離・安定のチェック一覧を表示する。
  - 変更するファイル: `src/components/CalibrationPanel.tsx`, `src/style.css`
  - 依存関係: 1, 3
  - 完了条件: 結果オブジェクトをpropsで受け取り、色だけに依存せず状態テキストを表示する。
  - 確認方法: `npm run typecheck` とブラウザ表示確認を行う。
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 7.2_
  - _Boundary: UI Components_

- [x] 5. 準備画面へキャリブレーションを接続する
  - 作業内容: `App` で `evaluateCalibration()` を呼び、実カメラ接続後の準備画面に `CalibrationPanel` を表示する。
  - 変更するファイル: `src/App.tsx`
  - 依存関係: 3, 4
  - 完了条件: 実カメラ準備画面で位置合わせ状態が表示され、モック姿勢導線は従来どおり表示される。
  - 確認方法: `npm run typecheck` と実カメラ手動確認を行う。
  - _Requirements: 1.1, 1.2, 4.5, 5.1, 5.4, 7.2_
  - _Boundary: App Integration_

- [x] 6. 準備完了ボタンの有効条件を接続する
  - 作業内容: 実カメラ時の「準備完了」を `poseDetector` 初期化済みかつ `calibrationResult.canStart` の場合だけ有効化する。
  - 変更するファイル: `src/App.tsx`
  - 依存関係: 5
  - 完了条件: 初期化中、未検出、位置調整が必要な状態では準備完了できず、良好状態ではカウントダウンへ進める。
  - 確認方法: 実カメラ手動確認と `npm run typecheck` を実行する。
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.4_
  - _Boundary: App Integration_

- [x] 7. 表示の揺れを抑える最小処理を追加する
  - 作業内容: 検出状態が短時間だけ揺れたときに表示が過度に点滅しないよう、必要に応じてUI側で直近の良好表示を短時間保持する。
  - 変更するファイル: `src/App.tsx` または `src/components/CalibrationPanel.tsx`
  - 依存関係: 5
  - 完了条件: 純粋判定関数には履歴状態を持たせず、表示層だけで揺れを抑えられる。
  - 確認方法: 実カメラで一時的に手足を外して表示が過度に点滅しないことを確認する。
  - _Requirements: 7.2, 7.3, 7.4_
  - _Boundary: UI Components, App Integration_

- [x] 8. READMEと手動確認チェックリストを更新する
  - 作業内容: カメラ準備時の位置合わせ、準備完了条件、確認観点をREADMEへ追記する。
  - 変更するファイル: `README.md`
  - 依存関係: 5, 6
  - 完了条件: 実カメラ確認時に、良好、未検出、左右寄り、近すぎる、遠すぎる状態を確認できる手順が分かる。
  - 確認方法: READMEを読み、実装済みUIと矛盾がないことを確認する。
  - _Requirements: 8.4, 8.5_
  - _Boundary: Documentation_

- [x] 9. 自動検証とE2E回帰確認を行う
  - 作業内容: 型チェック、ビルド、ユニットテスト、モック姿勢E2Eを実行し、既存導線の回帰がないことを確認する。
  - 変更するファイル: なし
  - 依存関係: 1-8
  - 完了条件: `npm run typecheck`, `npm run build`, `npm test`, `npm run test:e2e` が成功する。
  - 確認方法: 各コマンドの実行結果を記録し、失敗があれば修正する。
  - 確認結果: 2026-07-10に `npm run typecheck`, `npm run build`, `npm test`, `npm run test:e2e` が成功。
  - _Requirements: 8.1, 8.2, 8.3_
  - _Boundary: Validation_

- [x] 10. 実カメラで主要状態を確認する
  - 作業内容: 実カメラで、良好、近すぎる、遠すぎる、左右寄り、未検出、準備完了、リトライ、タイトル復帰を確認する。
  - 変更するファイル: 必要に応じて `README.md` または `.kiro/specs/camera-calibration/tasks.md`
  - 依存関係: 9
  - 完了条件: 主要状態が意図どおり表示され、準備完了後に既存カウントダウンとプレイへ進む。
  - 確認方法: SSHポートフォワードまたはlocalhostで実ブラウザ確認を行い、未確認項目があれば明記する。
  - 確認結果: 2026-07-09に実カメラの主要導線を確認済み。READMEの手動確認チェックリストへ反映済み。
  - _Requirements: 1.1-1.4, 2.1-2.4, 3.1-3.5, 4.1-4.5, 5.1-5.4, 7.1-7.4, 8.4_
  - _Boundary: Manual Validation_

## Requirements Coverage

| Requirement | Covered by Tasks |
|-------------|------------------|
| 1.1 | 4, 5, 10 |
| 1.2 | 1, 4, 5, 10 |
| 1.3 | 4, 10 |
| 1.4 | 4, 10 |
| 2.1 | 2, 10 |
| 2.2 | 2, 10 |
| 2.3 | 2, 10 |
| 2.4 | 2, 10 |
| 3.1 | 1, 3, 10 |
| 3.2 | 3, 10 |
| 3.3 | 3, 10 |
| 3.4 | 3, 10 |
| 3.5 | 3, 10 |
| 4.1 | 6, 10 |
| 4.2 | 6, 10 |
| 4.3 | 6, 10 |
| 4.4 | 6, 10 |
| 4.5 | 5, 10 |
| 5.1 | 4, 5, 10 |
| 5.2 | 5, 10 |
| 5.3 | 5, 10 |
| 5.4 | 5, 10 |
| 6.1 | 1, 2, 3 |
| 6.2 | 2, 3 |
| 6.3 | 1, 2, 3 |
| 6.4 | 5 |
| 7.1 | 6, 10 |
| 7.2 | 4, 5, 7, 10 |
| 7.3 | 7, 10 |
| 7.4 | 6, 7, 10 |
| 8.1 | 2, 3, 9 |
| 8.2 | 9 |
| 8.3 | 9 |
| 8.4 | 8, 10 |
| 8.5 | 8 |
