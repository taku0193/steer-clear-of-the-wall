# Design Document

## Overview

`auto-start-after-calibration` は、実カメラ準備画面でキャリブレーションが良好になった後、
プレイヤーのクリックなしで既存のカウントダウンへ進める機能です。

既存のカメラ取得、MediaPipe初期化、姿勢検出、キャリブレーション判定、ゲーム開始後の
Canvas描画、壁判定、スコア計算は変更しません。追加する責務は、実カメラ準備中に
「自動開始してよい状態か」を判定し、短い安定待ち時間を経て `countdown` へ遷移する
ことに限定します。

設計の中心は次の3点です。

- 自動開始の条件と待機時間を `src/game/` の純粋ロジックに分離する。
- `App` ではタイマー管理と既存の `handlePreparationComplete()` 呼び出しだけを行う。
- 準備画面では、突然遷移しないように自動開始待機中であることを短く表示する。

## Goals

- 実カメラモードで、位置合わせが良好になったらクリックなしでカウントダウンへ進む。
- 一瞬の検出や調整中の揺れでは自動開始しない。
- 自動開始待機中であることをプレイヤーに伝える。
- モック姿勢、タイトル復帰、展示運用の既存導線を維持する。
- 自動開始条件をユニットテストできる形にする。

## Non-Goals

- モック姿勢モードを自動開始にすること。
- カメラ、MediaPipe、姿勢ランドマーク変換の仕様を変えること。
- 壁パターン、当たり判定、スコア、速度上昇を変えること。
- 準備画面に複雑な設定UIを追加すること。
- 音声や効果音で開始を知らせること。

## Architecture

### Data Flow

1. ユーザーが実カメラモードで「カメラを開始」を押す。
2. 既存処理が `MediaStream` と `PoseDetectorAdapter` を準備する。
3. 既存の姿勢検出ループが `calibrationPoseFrame` を更新する。
4. 既存の `evaluateCalibration()` が `CalibrationResult` を返す。
5. 新規 `getAutoStartState()` が、現在フェーズ、カメラ有無、検出器有無、キャリブレーション結果から自動開始可能か判定する。
6. `App` が自動開始可能になった時点でタイマーを開始する。
7. タイマー満了時点でも同じ準備状態かつ自動開始可能なら、既存の `handlePreparationComplete()` と同じ処理で `countdown` へ進む。
8. 自動開始可能でなくなった場合、タイマーを解除し、準備画面の案内表示へ戻す。

### Responsibility Boundaries

- `src/game/autoStart.ts`
  - 自動開始の定数、入力型、純粋判定関数を持つ。
  - React、DOM、MediaStream、Canvasに依存しない。

- `src/game/autoStart.test.ts`
  - 自動開始対象、非対象、待機解除条件を検証する。

- `src/App.tsx`
  - 自動開始タイマーを管理する。
  - タイマー満了時に既存のカウントダウン開始処理を再利用する。
  - 自動開始待機中かどうかを準備画面へ渡す。

- `src/components/CalibrationPanel.tsx`
  - 必要に応じて自動開始待機中の補足表示を受け取って表示する。
  - キャリブレーション判定やタイマー管理は持たない。

- `src/style.css`
  - 自動開始待機表示のスタイルを追加する。
  - 既存の準備画面、アバター選択、タイトル復帰ボタンと重ならないようにする。

- `README.md`
  - 実カメラモードの遊び方と手動確認チェックリストを更新する。

## Data Model

### Constants

```ts
export const AUTO_START_READY_DELAY_MS = 1_000;
```

初期値は1秒にします。理由は、良好状態になった直後にプレイヤーが画面を認識できる余地を
残しつつ、展示体験の流れを止めにくい長さだからです。

既存の `CALIBRATION_READY_HOLD_MS` は、ready 表示の点滅を抑えるためのUI保持です。
自動開始は別責務なので、待機時間は `autoStart.ts` に分けます。

### AutoStartInput

```ts
export type AutoStartInput = {
  phase: GamePhase;
  hasActiveCamera: boolean;
  detectorReady: boolean;
  calibrationCanStart: boolean;
};
```

`MediaStream` や `PoseDetectorAdapter` 自体は純粋関数へ渡しません。`App` 側で boolean に
変換し、自動開始判定をUIやブラウザAPIから切り離します。

### AutoStartState

```ts
export type AutoStartState =
  | {
      status: "inactive";
      delayMs: null;
    }
  | {
      status: "waiting";
      delayMs: number;
    };
```

初期実装では、`waiting` か `inactive` の2状態に留めます。秒数のライブカウントは必須に
しません。必要になった場合は `remainingMs` をUI側で算出します。

### Pure Function

```ts
export function getAutoStartState(input: AutoStartInput): AutoStartState;
```

`waiting` になる条件:

- `phase === "preparing"`
- `hasActiveCamera === true`
- `detectorReady === true`
- `calibrationCanStart === true`

上記のどれかが満たされない場合は `inactive` を返します。

## App Integration

### Timer Behavior

`App` に次の方針で `useEffect` を追加します。

```ts
useEffect(() => {
  const autoStartState = getAutoStartState({
    phase: gameState.phase,
    hasActiveCamera: Boolean(cameraStream),
    detectorReady: Boolean(poseDetector),
    calibrationCanStart: calibrationResult.canStart,
  });

  if (autoStartState.status !== "waiting") {
    return;
  }

  const timerId = window.setTimeout(() => {
    setGameState((currentState) => {
      if (currentState.phase !== "preparing") {
        return currentState;
      }

      setCountdownValue(COUNTDOWN_START);
      return {
        ...currentState,
        phase: "countdown",
      };
    });
  }, autoStartState.delayMs);

  return () => window.clearTimeout(timerId);
}, [cameraStream, calibrationResult.canStart, gameState.phase, poseDetector]);
```

実装時は既存の `handlePreparationComplete()` と重複しないよう、小さな
`startCountdownFromPreparation()` のような関数へ切り出すことを推奨します。

### Race Conditions

次の条件ではタイマーを解除します。

- `calibrationResult.canStart` が `false` になる。
- `gameState.phase` が `preparing` 以外になる。
- `cameraStream` または `poseDetector` が失われる。
- タイトル復帰やエラー遷移でリソース解放が走る。

タイマー満了時にも `currentState.phase === "preparing"` を確認します。これにより、
自動開始待機中に「タイトルへ戻る」を押した後、遅れて `countdown` へ進む競合を避けます。

### Manual Preparation Button

初期実装では、実カメラ接続後の「準備完了」ボタンは次のどちらかにします。

- 推奨案: ボタンを主要導線から外し、自動開始待機表示に置き換える。
- 互換案: ボタンを残し、良好状態では手動でもすぐ開始できる補助導線にする。

要求の意図はクリック不要にすることなので、推奨案を採用します。カメラ準備画面には
「全身が映ると自動で始まります」という説明と、待機中の表示を出します。

`タイトルへ戻る` は維持します。

## UI Design

### Preparing Screen

実カメラ接続後の準備画面は次の要素を維持します。

- カメラプレビュー
- アバター外見選択
- 姿勢検出状態
- キャリブレーションパネル
- タイトルへ戻る

変更点:

- 「準備完了」ボタンを、状態表示ブロックへ置き換える。
- 未準備時は `全身が映ると自動で始まります` と表示する。
- 自動開始待機中は `そのままお待ちください。まもなく始まります` と表示する。

### CalibrationPanel

`CalibrationPanel` に任意 props を追加します。

```ts
type CalibrationPanelProps = {
  result: CalibrationResult;
  autoStartStatus?: "inactive" | "waiting";
};
```

表示方針:

- `autoStartStatus === "waiting"` のとき、チェック一覧の上または下に短い開始予告を表示する。
- `inactive` のときは既存の `result.summary` とチェック一覧を優先する。
- 色だけに依存せず、開始待機中であることをテキストで表示する。

### Accessibility

- 自動開始待機表示は `aria-live="polite"` の既存キャリブレーション領域内で伝える。
- カウントダウンへ進む前に短い待機時間を置き、画面遷移を突然にしない。
- 自動開始中も `タイトルへ戻る` はフォーカス可能な通常ボタンとして維持する。

## Testing Strategy

### Unit Tests

`src/game/autoStart.test.ts` で確認します。

- `preparing`、カメラあり、検出器あり、キャリブレーション可なら `waiting`
- `title`、`countdown`、`playing`、`result`、`error` では `inactive`
- カメラなしなら `inactive`
- 検出器なしなら `inactive`
- キャリブレーション不可なら `inactive`
- `waiting` の `delayMs` が定数と一致する

### Existing Tests

既存ユニットテストは、カメラ、姿勢検出、壁判定、スコアへ変更を入れないため、全体で
回帰確認します。

### E2E

モック姿勢モードは自動開始対象外なので、既存E2Eの主要フローを維持します。
必要なら文言変更で壊れたセレクタだけ調整します。

### Manual Validation

実カメラで次を確認します。

- 全身が映っていない状態では自動開始しない。
- 良好状態になると開始待機表示が出る。
- 良好状態を維持するとクリックなしでカウントダウンへ進む。
- 待機中に体を外すと自動開始が解除される。
- 待機中にタイトルへ戻っても、後からカウントダウンへ進まない。

## Risks and Mitigations

- **誤開始が早すぎる**
  - `AUTO_START_READY_DELAY_MS` を定数化し、実機確認後に調整できるようにする。

- **検出状態の揺れで待機表示がちらつく**
  - 既存の `displayedCalibrationResult` の短時間保持を維持しつつ、自動開始判定は現在の `calibrationResult.canStart` を使う。

- **タイトル復帰後に遅延タイマーが発火する**
  - `useEffect` のクリーンアップと、満了時のフェーズ確認で防ぐ。

- **モック姿勢E2Eが文言変更で壊れる**
  - モック姿勢導線のボタン名は変更しない。

## Requirements Traceability

| Requirement | Design Sections |
|-------------|-----------------|
| 1.1 | Data Flow, Pure Function |
| 1.2 | Timer Behavior |
| 1.3 | Pure Function, Timer Behavior |
| 1.4 | Pure Function, E2E |
| 2.1 | Timer Behavior, Race Conditions |
| 2.2 | Pure Function |
| 2.3 | Pure Function |
| 2.4 | Race Conditions |
| 3.1 | UI Design |
| 3.2 | UI Design |
| 3.3 | Preparing Screen |
| 3.4 | UI Design |
| 4.1 | Preparing Screen |
| 4.2 | Race Conditions |
| 4.3 | Non-Goals, App Integration |
| 4.4 | Manual Preparation Button |
| 5.1 | Constants |
| 5.2 | Pure Function |
| 5.3 | Responsibility Boundaries, Non-Goals |
| 5.4 | App Integration |
| 6.1 | Unit Tests |
| 6.2 | Existing Tests |
| 6.3 | E2E |
| 6.4 | Manual Validation |
| 6.5 | README.md |
