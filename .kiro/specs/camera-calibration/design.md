# Design Document

## Overview

`camera-calibration` は、実カメラ準備画面に「今の立ち位置で開始してよいか」を
表示する機能です。既存のカメラ取得、MediaPipe初期化、姿勢検出ループは維持し、
検出済みの元 `PoseFrame` から、準備状態を評価します。

設計の中心は次の3点です。

- キャリブレーション判定を `src/game/` の純粋ロジックにする。
- 準備画面の表示は新しいUIコンポーネントへ分ける。
- 実カメラモードの準備完了条件を、姿勢検出器の初期化だけでなくキャリブレーション結果へ接続する。

プレイ中のCanvas、壁進行、当たり判定、スコア、結果画面は変更しません。

## Architecture

### Data Flow

1. ユーザーが「カメラを開始」を押す。
2. 既存の `startCamera()` が `MediaStream` を取得する。
3. 既存の `initializePoseDetector()` がMediaPipeを初期化する。
4. 既存の検出ループが `PoseFrame` を取得する。
5. 新規 `evaluateCalibration()` が元 `PoseFrame` から未縮尺の身体領域を作り、準備状態を評価する。
6. `fitPoseFrameToGame()` と `createPlayerAreaFromPoseFrame()` が既存どおりゲーム用姿勢へ変換する。
7. 新規 `CalibrationPanel` が準備画面に状態と案内を表示する。
8. `App` は良好状態の場合に「準備完了」を有効化する。
9. 準備完了後は既存どおり `countdown` へ遷移する。

### Responsibility Boundaries

- `src/game/calibration.ts`
  - キャリブレーションの型、閾値、評価関数を持つ。
  - React、DOM、MediaStream、Canvasに依存しない。
  - 元 `PoseFrame` を入力として受け取る。

- `src/game/calibration.test.ts`
  - 全身検出、未検出、左右寄り、近すぎる、遠すぎる、良好状態を検証する。

- `src/components/CalibrationPanel.tsx`
  - キャリブレーション結果を表示する。
  - 判定ロジックを持たず、propsとして受け取った結果を表示する。

- `src/App.tsx`
  - `poseFrame` から `evaluateCalibration()` を呼ぶ。
  - 準備画面で `CalibrationPanel` を表示する。
  - 実カメラ時の「準備完了」ボタンの有効条件へキャリブレーション結果を接続する。

- `src/style.css`
  - 準備画面内のキャリブレーション表示を追加する。

## Data Model

### CalibrationStatus

```ts
export type CalibrationStatus =
  | "initializing"
  | "notDetected"
  | "needsAdjustment"
  | "ready";
```

- `initializing`: カメラまたは姿勢検出器の準備中。
- `notDetected`: 姿勢フレームが未検出、または主要ランドマーク不足。
- `needsAdjustment`: 姿勢は検出できているが、位置や距離が許容範囲外。
- `ready`: 全身、中央位置、距離感が良好。

### CalibrationCheck

```ts
export type CalibrationCheck = {
  id: "fullBody" | "centered" | "distance" | "stability";
  status: "pass" | "warn" | "fail";
  label: string;
  message: string;
};
```

表示用のチェック項目です。初期実装では `stability` は検出品質の簡易表示として扱い、
時間方向の平滑化は `App` またはUI表示での最小限の保持に留めます。

### CalibrationGuidance

```ts
export type CalibrationGuidance =
  | "standInFrame"
  | "moveLeft"
  | "moveRight"
  | "stepBack"
  | "stepForward"
  | "holdStill"
  | "ready";
```

主案内を表すIDです。UI文言はコンポーネント側ではなく、判定結果または小さな表示用
マッピングとして集約します。

### CalibrationResult

```ts
export type CalibrationResult = {
  status: CalibrationStatus;
  canStart: boolean;
  guidance: CalibrationGuidance;
  summary: string;
  checks: readonly CalibrationCheck[];
};
```

`canStart` は実カメラの「準備完了」を有効化するために使います。

## Calibration Evaluation

### Inputs

```ts
export type CalibrationInput = {
  poseFrame: PoseFrame | null;
  detectorReady: boolean;
};
```

`poseFrame` は主要ランドマーク不足の理由を判定するために使います。
また、可視ランドマークから未縮尺の身体領域を作り、カメラ内での中心位置と大きさを評価します。

### Thresholds

初期値は正規化座標で定義します。

```ts
export const CALIBRATION_THRESHOLDS = {
  minVisibility: 0.5,
  centerMinX: 0.32,
  centerMaxX: 0.68,
  minBodyHeight: 0.34,
  maxBodyHeight: 0.68,
  minBodyWidth: 0.08,
  maxBodyWidth: 0.38,
};
```

考え方:

- `minVisibility` は既存の `MIN_POSE_VISIBILITY` と同じ基準にそろえる。
- 中央判定は厳しすぎない範囲にし、左右移動の案内を出しすぎない。
- 距離判定は元 `PoseFrame` から作る未縮尺身体領域の高さを主に使い、幅は補助的に見る。
- 近すぎる場合は最大高さまたは最大幅を超えた状態として扱う。
- 遠すぎる場合は最小高さまたは最小幅を下回った状態として扱う。

実装では、実際のカメラ内の立ち位置を案内するため、元の `PoseFrame` から
キャリブレーション専用の未縮尺領域を作って評価します。既存の `playerArea` はゲーム用に
縮尺調整された値なので、キャリブレーションの距離判定には直接使いません。
`playerArea` はキャリブレーション判定には使いません。

### Required Landmarks

全身検出では既存の必須ランドマークにそろえます。

- `leftShoulder`
- `rightShoulder`
- `leftHip`
- `rightHip`
- `leftAnkle`
- `rightAnkle`

この一覧は `calibration.ts` 内に持つか、`state.ts` の既存定義を公開して共有します。
重複を避けるため、実装時は `REQUIRED_BODY_LANDMARKS` と `MIN_POSE_VISIBILITY` の公開を
検討します。

### Guidance Priority

複数の問題がある場合は、次の順で主案内を決めます。

1. 姿勢未検出または主要ランドマーク不足: `standInFrame`
2. 近すぎる: `stepBack`
3. 遠すぎる: `stepForward`
4. 左に寄りすぎ: `moveRight`
5. 右に寄りすぎ: `moveLeft`
6. 検出はあるが信頼度が低い: `holdStill`
7. 良好: `ready`

距離の問題を左右位置より優先するのは、近すぎる・遠すぎる状態では身体中心の評価も
不安定になりやすいためです。

## UI Design

### Preparing Screen Layout

実カメラ接続後の準備画面を次の順にします。

1. タイトルと短い説明
2. アバター選択
3. カメラプレビュー
4. キャリブレーションパネル
5. 準備完了ボタン

モック姿勢モードの導線は、カメラ未接続時のまま維持します。

### CalibrationPanel

表示内容:

- 状態見出し
  - 例: `位置合わせOK`、`全身が映る位置へ移動してください`
- 主案内
  - 例: `少し後ろへ下がってください`
- チェック一覧
  - `全身`
  - `中央`
  - `距離`
  - `安定`

表示は準備画面内のコンパクトなパネルにします。カードの入れ子を避け、既存の
`.screen-panel` 内に直接配置するブロックとして扱います。

### Button Behavior

初期設計では、安全側に倒して、実カメラ時は `canStart === true` かつ `poseDetector`
が存在する場合だけ「準備完了」を有効化します。

理由:

- この機能の目的は開始前の未検出や位置ズレを減らすこと。
- 既存のモック姿勢モードは別導線として残るため、カメラ位置合わせを強めても逃げ道がある。

ただし、実機確認で厳しすぎる場合は、タスク実装時に「注意付きで開始」へ変更できるよう、
`CalibrationResult.canStart` と `status` を分けておきます。

### Accessibility

- キャリブレーションパネルは `aria-live="polite"` を使う。
- チェック状態は色だけに依存せず、テキストで `OK`、`調整`、`未検出` を表示する。
- 準備完了ボタンが無効な場合、近くに理由となる案内を表示する。

## State and Lifecycle

### App Integration

`App` では次を導入します。

```ts
const calibrationResult = evaluateCalibration({
  poseFrame,
  detectorReady: Boolean(poseDetector),
});
```

実カメラ準備画面でのみ表示し、モック姿勢やタイトル、プレイ中には表示しません。

`handlePreparationComplete()` は既存のまま使います。ボタンの `disabled` 条件を
次のように変更します。

```ts
disabled={!poseDetector || !calibrationResult.canStart}
```

プレイ中の姿勢検出ループや `poseDetectionStatus` 更新は変更しません。

### Flicker Control

短時間の検出揺れに対して、初期実装では次のどちらかを採用します。

- UI側で直近の `ready` 表示を短時間保持する。
- `evaluateCalibration()` は純粋関数のままにし、平滑化は `App` のstateまたは
  `CalibrationPanel` の表示だけで扱う。

設計上は純粋ロジックを保つため、評価関数に時間履歴は持たせません。必要な場合でも
履歴管理は別関数として追加します。

## Error Handling

- カメラ権限拒否、カメラ取得失敗、MediaPipe初期化失敗は既存の `error` フェーズへ進める。
- 姿勢未検出や主要ランドマーク不足はエラーではなく、キャリブレーション上の
  `notDetected` として表示する。
- リトライ、タイトル復帰、結果遷移時の `releaseMediaResources()` は既存のまま利用する。
- モック姿勢モードではキャリブレーションを要求しない。

## Testing Strategy

### Unit Tests

`src/game/calibration.test.ts` を追加します。

テスト観点:

- detector未準備では `initializing` になる。
- `poseFrame` がない場合は `notDetected` になる。
- 必須ランドマーク不足では全身チェックが失敗する。
- 身体中心が左に寄ると、右へ移動する案内になる。
- 身体中心が右に寄ると、左へ移動する案内になる。
- 身体領域が大きすぎると、後ろへ下がる案内になる。
- 身体領域が小さすぎると、近づく案内になる。
- 範囲内では `ready` かつ `canStart: true` になる。

### Existing Tests

- `src/game/state.test.ts` は必要に応じて、公開したランドマーク定義や閾値の影響を確認する。
- 既存の衝突判定、ゲームループ、スコア、壁描画系テストは変更しない想定。
- `tests/e2e/mock-pose-flow.spec.ts` はモック導線が壊れていないことを確認する。

### Manual Verification

- 実カメラで、全身が映っている状態が `ready` になる。
- 足首を画面外に出すと全身検出の案内が出る。
- 左右に寄ると中央への案内が出る。
- 近づきすぎると後ろへ下がる案内が出る。
- 遠すぎると近づく案内が出る。
- 準備完了後はカウントダウンへ進む。
- プレイ中はカメラ映像ではなくCanvasが主表示になる。

## Files

想定する変更ファイル:

- `src/game/calibration.ts`
- `src/game/calibration.test.ts`
- `src/components/CalibrationPanel.tsx`
- `src/App.tsx`
- `src/style.css`
- `README.md`
- `.kiro/specs/camera-calibration/tasks.md`
- `.kiro/specs/camera-calibration/spec.json`

必要に応じて変更する可能性があるファイル:

- `src/game/state.ts`
  - 必須ランドマーク一覧や視認性閾値を共有する場合。
- `src/game/state.test.ts`
  - 共有定義化で既存テスト調整が必要な場合。

## Requirement Mapping

| Requirement | Design Coverage |
|-------------|-----------------|
| 1.1 | `CalibrationPanel` を準備画面へ追加 |
| 1.2 | `CalibrationCheck` に全身、中央、距離、安定を定義 |
| 1.3 | `ready` / `canStart` / 主案内 |
| 1.4 | `guidance` とチェック一覧 |
| 2.1 | 必須ランドマーク評価 |
| 2.2 | `standInFrame` 案内 |
| 2.3 | 全身チェックのpass条件 |
| 2.4 | `notDetected` 状態 |
| 3.1 | 未縮尺身体領域の中心位置評価 |
| 3.2 | `moveLeft` / `moveRight` 案内 |
| 3.3 | `stepBack` 案内 |
| 3.4 | `stepForward` 案内 |
| 3.5 | `ready` 判定 |
| 4.1 | `detectorReady` とボタンdisabled条件 |
| 4.2 | `canStart` |
| 4.3 | `canStart` と表示文言の分離 |
| 4.4 | 既存 `handlePreparationComplete()` |
| 4.5 | モック姿勢導線維持 |
| 5.1 | 準備画面内のカメラプレビュー |
| 5.2 | プレイ画面の既存構成維持 |
| 5.3 | Canvas / HUD 非変更 |
| 5.4 | 既存フェーズ維持 |
| 6.1 | `evaluateCalibration()` |
| 6.2 | `calibration.test.ts` |
| 6.3 | DOM非依存の純粋関数 |
| 6.4 | 既存adapter非変更 |
| 7.1 | 既存エラー導線維持 |
| 7.2 | 未検出を案内として扱う |
| 7.3 | 表示側の点滅抑制方針 |
| 7.4 | 既存 `releaseMediaResources()` 維持 |
| 8.1 | ユニットテスト追加 |
| 8.2 | 既存E2E維持 |
| 8.3 | typecheck / build / test |
| 8.4 | 実カメラ手動確認 |
| 8.5 | README更新 |
