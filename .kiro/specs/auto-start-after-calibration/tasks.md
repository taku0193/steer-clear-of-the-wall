# Implementation Plan

## 方針

- 実装は、純粋ロジック、App接続、UI表示、ドキュメント、検証、実カメラ確認の順で進める。
- 自動開始の判定は `src/game/` に分離し、React、DOM、MediaStream、Canvasへ依存させない。
- カメラ取得、MediaPipe初期化、姿勢検出ループ、プレイ中Canvas描画、壁判定、スコア計算は変更しない。
- 実カメラ準備画面ではクリック不要の自動開始を主導線にし、モック姿勢モードは従来どおり手動開始にする。
- タイトル復帰や展示向けリセット時に、遅延タイマーが後からカウントダウンへ進めないようにする。

## Tasks

- [x] 1. 自動開始判定の純粋ロジックを追加する
  - 作業内容: `AUTO_START_READY_DELAY_MS`, `AutoStartInput`, `AutoStartState`, `getAutoStartState()` を定義する。
  - 変更するファイル: `src/game/autoStart.ts`
  - 依存関係: なし
  - 完了条件: `preparing`、実カメラ接続済み、検出器準備済み、キャリブレーション良好のときだけ `waiting` を返し、それ以外は `inactive` を返す。
  - 確認方法: `npm run typecheck` を実行する。
  - _Requirements: 1.1, 1.3, 1.4, 2.2, 2.3, 5.1, 5.2_
  - _Boundary: Game Domain_

- [x] 2. 自動開始判定のユニットテストを追加する
  - 作業内容: 自動開始対象、非対象フェーズ、カメラなし、検出器なし、キャリブレーション不可、待機時間をテストする。
  - 変更するファイル: `src/game/autoStart.test.ts`
  - 依存関係: 1
  - 完了条件: 自動開始条件と待機時間がテストで固定されている。
  - 確認方法: `npm test -- src/game/autoStart.test.ts` を実行する。
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 6.1_
  - _Boundary: Game Domain Tests_

- [x] 3. カウントダウン開始処理を再利用しやすく整理する
  - 作業内容: `App` 内の準備完了処理を、自動開始と必要に応じた手動開始の両方から呼べる小さな関数へ整理する。
  - 変更するファイル: `src/App.tsx`
  - 依存関係: なし
  - 完了条件: 既存のカウントダウン開始挙動が変わらず、`COUNTDOWN_START` 初期化と `phase: "countdown"` 遷移が1か所に集約される。
  - 確認方法: `npm run typecheck` を実行する。
  - _Requirements: 1.2, 4.4, 5.4_
  - _Boundary: App Integration_

- [x] 4. 実カメラ準備画面へ自動開始タイマーを接続する
  - 作業内容: `App` で `getAutoStartState()` を呼び、`waiting` の間だけタイマーを開始し、満了時にカウントダウンへ進める。
  - 変更するファイル: `src/App.tsx`
  - 依存関係: 1, 3
  - 完了条件: 良好状態が待機時間継続すると自動で `countdown` へ進み、良好状態解除、タイトル復帰、エラー遷移、フェーズ変更ではタイマーが解除される。
  - 確認方法: `npm run typecheck` と実カメラ手動確認を行う。
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 4.2, 5.4_
  - _Boundary: App Integration_

- [x] 5. 実カメラ準備画面の手動準備完了ボタンを自動開始表示へ置き換える
  - 作業内容: 実カメラ接続後の「準備完了」ボタンを主要導線から外し、未準備時と自動開始待機中の状態表示に置き換える。
  - 変更するファイル: `src/App.tsx`, `src/style.css`
  - 依存関係: 4
  - 完了条件: 準備画面に「全身が映ると自動で始まります」または開始待機中の表示が出て、`タイトルへ戻る` は維持される。
  - 確認方法: ブラウザ表示確認と `npm run typecheck` を実行する。
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_
  - _Boundary: App Integration, Styling_

- [x] 6. CalibrationPanelへ自動開始待機表示を追加する
  - 作業内容: `CalibrationPanel` に任意の `autoStartStatus` props を追加し、待機中に短い開始予告を表示する。
  - 変更するファイル: `src/components/CalibrationPanel.tsx`, `src/App.tsx`, `src/style.css`
  - 依存関係: 4
  - 完了条件: 自動開始待機中であることが色だけでなくテキストで分かり、既存チェック一覧と位置合わせ案内を妨げない。
  - 確認方法: `npm run typecheck` とブラウザ表示確認を行う。
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - _Boundary: UI Components, App Integration, Styling_

- [x] 7. モック姿勢E2Eと表示文言の回帰を調整する
  - 作業内容: 実カメラ準備画面の文言変更で既存E2Eが影響を受ける場合、モック姿勢導線を確認するテストを必要最小限で更新する。
  - 変更するファイル: `tests/e2e/mock-pose-flow.spec.ts`
  - 依存関係: 5, 6
  - 完了条件: モック姿勢モードが自動開始対象外のまま、タイトル、準備、モック開始、プレイ、結果、再プレイ準備の導線を確認できる。
  - 確認方法: `npm run test:e2e` を実行する。
  - _Requirements: 1.4, 4.3, 6.3_
  - _Boundary: E2E Tests_

- [x] 8. READMEと手動確認チェックリストを更新する
  - 作業内容: 実カメラモードの説明を「準備完了を押す」から「良好状態が続くと自動開始」へ更新し、確認観点を追加する。
  - 変更するファイル: `README.md`
  - 依存関係: 5, 6
  - 完了条件: 遊び方、実カメラモード、手動確認チェックリストが自動開始の実装と一致する。
  - 確認方法: READMEを読み、実装済みUIと矛盾がないことを確認する。
  - _Requirements: 6.5_
  - _Boundary: Documentation_

- [x] 9. 自動検証を実行する
  - 作業内容: 型チェック、ビルド、ユニットテスト、モック姿勢E2Eを実行し、自動開始機能の影響範囲を確認する。
  - 変更するファイル: なし
  - 依存関係: 1-8
  - 完了条件: `npm run typecheck`, `npm run build`, `npm test`, `npm run test:e2e` が成功する。
  - 完了条件: E2E実行時にサンドボックスの `listen EPERM` が出る場合は、権限付きで再実行し結果を記録する。
  - 確認方法: 各コマンドの実行結果を確認し、失敗があれば修正する。
  - 確認結果: 2026-07-10に `npm run typecheck`, `npm run build`, `npm test`, `npm run test:e2e` が成功。E2Eは通常実行でwebServer起動に失敗したため、権限付きで再実行して成功。
  - _Requirements: 6.2, 6.3_
  - _Boundary: Validation_

- [ ] 10. 実カメラで自動開始の主要状態を確認する
  - 作業内容: 実カメラで、未検出時に自動開始しない、良好状態で待機表示が出る、良好状態継続で自動開始する、待機中に外れると解除される、タイトル復帰後に遅延開始しないことを確認する。
  - 変更するファイル: 必要に応じて `README.md` または `.kiro/specs/auto-start-after-calibration/tasks.md`
  - 依存関係: 9
  - 完了条件: クリックなしでカウントダウンへ進み、誤開始防止とリセット導線が意図どおり動作する。
  - 確認方法: SSHポートフォワードまたはlocalhostで実ブラウザ確認を行い、未確認項目があれば明記する。
  - _Requirements: 6.4, 6.5_
  - _Boundary: Manual Validation_

## Requirements Coverage

| Requirement | Covered by Tasks |
|-------------|------------------|
| 1.1 | 1, 4 |
| 1.2 | 3, 4, 10 |
| 1.3 | 1, 4, 10 |
| 1.4 | 1, 7 |
| 2.1 | 2, 4, 10 |
| 2.2 | 1, 2 |
| 2.3 | 1, 2 |
| 2.4 | 4, 10 |
| 3.1 | 5, 6 |
| 3.2 | 5, 6, 10 |
| 3.3 | 5, 6 |
| 3.4 | 5, 6 |
| 4.1 | 5 |
| 4.2 | 4, 5, 10 |
| 4.3 | 7, 9 |
| 4.4 | 3, 5 |
| 5.1 | 1, 2 |
| 5.2 | 1, 2 |
| 5.3 | 1, 4 |
| 5.4 | 3, 4 |
| 6.1 | 2 |
| 6.2 | 9 |
| 6.3 | 7, 9 |
| 6.4 | 10 |
| 6.5 | 8, 10 |
