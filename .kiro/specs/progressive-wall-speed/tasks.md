# Implementation Plan

## 方針

- 速度上昇は、成功枚数から速度段階を決める純粋ロジックとして先に実装する。
- 既存の `setInterval` 間隔は維持し、速度段階ごとの `wallProgress` 増加量だけを変える。
- ミス、未検出、ハート、スコア、壁順序の既存挙動を壊さない。
- UI変更はHUDと結果画面に限定し、ゲーム画面の視認性を保つ。
- 各段階でテスト可能な単位を作り、最後に型チェック、ビルド、ユニットテストを実行する。

## Tasks

- [x] 1. 壁速度段階の純粋ロジックを追加する
  - 作業内容: 成功枚数から速度段階、表示ラベル、進行ステップを取得するロジックを作る。
  - 変更するファイル: `src/game/wallSpeed.ts`, `src/game/wallSpeed.test.ts`
  - 依存関係: なし
  - 完了条件: 初期速度、閾値到達時の速度段階、最大速度段階、未知レベル時のフォールバックを純粋関数で扱える。
  - 確認方法: `npm test -- src/game/wallSpeed.test.ts` または全ユニットテストを実行する。
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.5, 5.2, 5.3_
  - _Boundary: Game Domain_

- [x] 2. ゲーム状態に成功枚数と速度段階を追加する
  - 作業内容: `GameState` に `successfulWalls`, `wallSpeedLevel`, `lastSpeedLevelUp` を追加し、初期化する。
  - 変更するファイル: `src/game/types.ts`, `src/game/state.ts`, `src/game/state.test.ts`
  - 依存関係: 1
  - 完了条件: 新規プレイ開始時に成功枚数が0、速度段階が1、速度アップ通知がfalseになる。
  - 確認方法: `npm test -- src/game/state.test.ts` または全ユニットテストを実行する。
  - _Requirements: 3.1, 3.2, 3.3, 5.4_
  - _Boundary: Game State_

- [x] 3. 壁進行に速度段階を接続する
  - 作業内容: `advanceWallProgress` が現在の速度段階から進行ステップを取得し、固定の `WALL_PROGRESS_STEP` ではなく段階別ステップで壁を進めるようにする。
  - 変更するファイル: `src/game/gameLoop.ts`, `src/game/gameLoop.test.ts`
  - 依存関係: 1, 2
  - 完了条件: 速度段階が上がると次の壁から進行量が増え、判定は壁1枚につき1回だけ発生する。
  - 確認方法: `npm test -- src/game/gameLoop.test.ts` または全ユニットテストを実行する。
  - _Requirements: 1.4, 2.4, 3.5, 5.2_
  - _Boundary: Game Loop_

- [x] 4. 成功時だけ成功枚数と速度段階を更新する
  - 作業内容: 壁判定後に、成功時だけ `successfulWalls` を増やし、閾値到達時に `wallSpeedLevel` と `lastSpeedLevelUp` を更新する。
  - 変更するファイル: `src/game/gameLoop.ts`, `src/game/gameLoop.test.ts`
  - 依存関係: 3
  - 完了条件: 成功では成功枚数が増え、ミスと未検出では成功枚数と速度段階が変わらない。
  - 確認方法: 成功、ミス、未検出、最大速度段階のユニットテストを実行する。
  - _Requirements: 1.1, 1.2, 1.3, 3.4, 5.1, 5.3_
  - _Boundary: Game Loop, Game State_

- [x] 5. プレイ画面に速度段階を表示する
  - 作業内容: `GameScreen` に速度段階、速度ラベル、成功枚数、速度アップ通知を渡し、HUDに短い速度表示を追加する。
  - 変更するファイル: `src/App.tsx`, `src/components/GameScreen.tsx`, `src/style.css`
  - 依存関係: 2, 4
  - 完了条件: プレイ中に現在の速度段階が確認でき、HUDのハート、スコア、ミス表示を妨げない。
  - 確認方法: モック姿勢モードでプレイ画面を表示し、速度表示が崩れないことを確認する。
  - _Requirements: 4.2, 4.3, 4.4_
  - _Boundary: GameScreen, App_

- [x] 6. 速度アップ時のフィードバックを追加する
  - 作業内容: `lastSpeedLevelUp` がtrueのとき、直前判定の表示に「速度アップ」を含める。
  - 変更するファイル: `src/components/GameScreen.tsx`, `src/style.css`
  - 依存関係: 5
  - 完了条件: 成功により速度段階が上がった判定直後に、プレイヤーへ速度上昇が短く伝わる。
  - 確認方法: 閾値直前の成功枚数を使った状態でモック確認、またはユニットテストとブラウザ確認を行う。
  - _Requirements: 4.1, 4.4_
  - _Boundary: GameScreen_

- [x] 7. 結果画面にクリア枚数と最高速度を表示する
  - 作業内容: `ResultScreen` に成功枚数と速度段階を渡し、結果統計にクリア枚数と最高速度を表示する。
  - 変更するファイル: `src/App.tsx`, `src/components/ResultScreen.tsx`, `src/style.css`
  - 依存関係: 2, 4
  - 完了条件: 結果画面で最終スコア、クリア枚数、最高速度、ミス数を確認できる。
  - 確認方法: 結果画面を表示し、値がゲーム状態と一致することを確認する。
  - _Requirements: 3.4, 4.2_
  - _Boundary: ResultScreen, App_

- [x] 8. READMEと手動確認チェックリストを更新する
  - 作業内容: 壁を何枚か避けると速度が上がること、速度表示、リトライ時の初期化確認をREADMEへ追記する。
  - 変更するファイル: `README.md`
  - 依存関係: 5, 6, 7
  - 完了条件: 遊び方、既知の仕様、手動確認チェックリストが速度上昇後の挙動と一致する。
  - 確認方法: READMEの記述を読み、実装済みUIと矛盾がないことを確認する。
  - _Requirements: 4.2, 4.4, 5.5_
  - _Boundary: Documentation_

- [x] 9. 全体検証を実行する
  - 作業内容: 型チェック、ビルド、ユニットテストを実行し、速度上昇機能の影響範囲を確認する。
  - 変更するファイル: なし
  - 依存関係: 1, 2, 3, 4, 5, 6, 7, 8
  - 完了条件: `npm run typecheck`, `npm run build`, `npm test` が成功する。
  - 確認方法: 各コマンドの実行結果を記録し、失敗があれば修正する。
  - _Requirements: 5.5_
  - _Boundary: Validation_

## Requirements Coverage

| Requirement | Covered by Tasks |
|-------------|------------------|
| 1.1 | 4 |
| 1.2 | 1, 4 |
| 1.3 | 4 |
| 1.4 | 3 |
| 2.1 | 1 |
| 2.2 | 1 |
| 2.3 | 1, 4 |
| 2.4 | 3 |
| 2.5 | 1 |
| 3.1 | 2 |
| 3.2 | 2 |
| 3.3 | 2 |
| 3.4 | 4, 7 |
| 3.5 | 3, 4 |
| 4.1 | 6 |
| 4.2 | 5, 7, 8 |
| 4.3 | 5 |
| 4.4 | 5, 6, 8 |
| 5.1 | 4 |
| 5.2 | 1, 3 |
| 5.3 | 1, 4 |
| 5.4 | 2 |
| 5.5 | 8, 9 |
