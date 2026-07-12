# Design Document

## Overview

`exhibition-mode` は、展示会場で前のプレイヤーが画面を残したまま離れても、次の来場者が
迷わず始められる状態へ戻す運用改善です。

既存のゲーム進行、壁、判定、スコア、カメラ取得、姿勢検出の基本挙動は変更しません。
設計の中心は次の3点です。

- 自動タイトル復帰の待機時間と対象フェーズを純粋ロジックとして定義する。
- `App` の既存 `resetGameSession("title")` と `releaseMediaResources()` を再利用する。
- 手動リセットUIを各画面へ最小限追加し、主要操作やプレイ表示を妨げない。

## Goals

- 結果画面とエラー画面を放置したとき、一定時間後にタイトルへ戻る。
- カメラ準備、カウントダウン、プレイ中に展示運営者が手動でタイトルへ戻せる。
- 自動復帰または手動リセット時に、カメラ、姿勢検出、タイマー、描画ループが残らない。
- モック姿勢E2Eの既存導線を維持する。
- 実装後に型チェック、ビルド、ユニットテスト、E2Eで回帰確認できる。

## Non-Goals

- ランキング、スコア保存、バックエンド連携を追加すること。
- 効果音や音声案内を追加すること。
- 壁速度、壁パターン、衝突判定、スコア計算を変更すること。
- ブラウザのFullscreen APIを使うこと。
- 展示モードのON/OFF設定画面を作ること。

初期実装では、展示向け挙動を標準導線へ組み込みます。将来、通常利用と展示利用を
分ける必要が出た場合は、設定値を `src/game/exhibitionMode.ts` へ集約しているため
分岐を追加しやすくします。

## Architecture

### Data Flow: Auto Return

1. `App` が現在の `gameState.phase` を監視する。
2. `getAutoReturnDelayMs(gameState.phase)` で自動復帰対象か判定する。
3. 対象フェーズなら `window.setTimeout()` を開始する。
4. タイマー満了時に、現在も同じ対象フェーズなら `resetGameSession("title")` を呼ぶ。
5. `resetGameSession("title")` が既存どおり `releaseMediaResources()` と初期状態作成を行う。
6. フェーズ変更やアンマウント時にタイマーを解除する。

### Data Flow: Manual Reset

1. 準備、カウントダウン、プレイ画面に「タイトルへ戻る」操作を表示する。
2. 操作時に `handleReturnToTitle()` を呼ぶ。
3. `handleReturnToTitle()` は既存どおり `resetGameSession("title")` を呼ぶ。
4. `releaseMediaResources()` によりカメラと姿勢検出器を停止する。
5. 各 `useEffect` のクリーンアップにより、カウントダウン、壁進行、Canvas補間のタイマーや
   `requestAnimationFrame` を停止する。

### Responsibility Boundaries

- `src/game/exhibitionMode.ts`
  - 展示運用の定数と純粋関数を持つ。
  - React、DOM、MediaStream、Canvasに依存しない。

- `src/game/exhibitionMode.test.ts`
  - 自動復帰対象フェーズ、待機時間、手動リセット可能フェーズを検証する。

- `src/App.tsx`
  - 自動復帰タイマーを管理する。
  - 既存の `handleReturnToTitle()` を手動リセットへ接続する。
  - 必要な画面コンポーネントへ `onBackToTitle` または `onResetToTitle` を渡す。

- `src/components/ResultScreen.tsx`
  - 自動復帰までの控えめな表示を追加する。
  - 主要操作である「もう一度プレイ」を維持する。

- `src/components/ErrorScreen.tsx`
  - 既存の「再試行」「タイトルへ戻る」を維持する。
  - 自動復帰までの控えめな表示を追加する。

- `src/components/GameScreen.tsx`
  - プレイ中の手動リセット操作をオーバーレイとして表示する。
  - Canvas描画、壁補間、HUD、判定フィードバックの責務は維持する。

- `src/style.css`
  - 展示リセット操作と自動復帰表示のスタイルを追加する。
  - フルビューポートのゲーム画面で重なりが破綻しないよう配置する。

## Data Model

### Constants

```ts
export const RESULT_AUTO_RETURN_DELAY_MS = 15_000;
export const ERROR_AUTO_RETURN_DELAY_MS = 20_000;
export const PREPARING_IDLE_RETURN_DELAY_MS = 90_000;
```

初期値の考え方:

- 結果画面は、スコア確認と写真撮影の余地を残すため15秒程度にする。
- エラー画面は、内容確認とスタッフ対応の余地を残すため結果より少し長くする。
- カメラ準備画面は、位置合わせに時間がかかるため短時間では戻さない。

### AutoReturnConfig

```ts
export type AutoReturnConfig = {
  phase: GamePhase;
  delayMs: number;
};
```

初期実装では、`result`、`error`、必要に応じて実カメラ接続中の `preparing` を対象にします。
`playing` は自動復帰対象にしません。

### Pure Functions

```ts
export function getAutoReturnDelayMs(phase: GamePhase): number | null;
export function canManuallyResetToTitle(phase: GamePhase): boolean;
```

- `getAutoReturnDelayMs()` は自動復帰対象でなければ `null` を返す。
- `canManuallyResetToTitle()` は `preparing`、`countdown`、`playing`、`result`、`error` で
  `true` を返し、`title` では `false` を返す。

## App Integration

### Auto Return Timer

`App` に次の `useEffect` を追加します。

```ts
useEffect(() => {
  const delayMs = getAutoReturnDelayMs(gameState.phase);

  if (delayMs === null) {
    return;
  }

  const targetPhase = gameState.phase;
  const timerId = window.setTimeout(() => {
    setGameState((currentState) => {
      if (currentState.phase !== targetPhase) {
        return currentState;
      }

      releaseMediaResources();
      return createInitialGameState();
    });
  }, delayMs);

  return () => window.clearTimeout(timerId);
}, [gameState.phase, releaseMediaResources]);
```

実装時は、既存の `resetGameSession("title")` を使える形へ整理します。`setTimeout` 内で
古いフェーズを確認し、結果画面から「もう一度プレイ」を押した直後に遅延タイマーが
タイトルへ戻してしまう競合を避けます。

### Resource Release

既存の `resetGameSession("title")` は `releaseMediaResources()` を呼ぶため、
自動復帰と手動リセットは原則としてこの経路へ統一します。

`gameState.phase === "result" || gameState.phase === "error"` でリソース解放する既存
`useEffect` は維持します。自動復帰は追加の保険として同じ解放経路を通ります。

### Preparing Idle Return

要求では「カメラ準備画面の長時間放置」を扱いますが、初期実装では次のどちらかを
タスクで選びます。

- シンプル案: `preparing` も90秒でタイトルへ戻す。
- 慎重案: `cameraStream` が存在する実カメラ準備中だけ90秒でタイトルへ戻し、カメラ未接続の
  準備画面は自動復帰対象外にする。

設計上は慎重案を推奨します。理由は、カメラ未接続の準備画面はリソースを保持しておらず、
来場者が説明を読んでいる間にタイトルへ戻る利点が小さいためです。

## UI Design

### Result Screen

追加 props:

```ts
type ResultScreenProps = {
  // existing props
  autoReturnSeconds?: number;
};
```

表示:

- 結果統計と「もう一度プレイ」を維持する。
- ボタン下に小さく `しばらく操作しないとタイトルへ戻ります` を表示する。
- カウントダウン秒数をリアルタイム表示するかは実装タスクで判断する。

初期実装では、秒数のライブカウントは必須にしません。自動復帰があることを控えめに
示すだけにすると、状態管理が単純で、結果確認の邪魔になりにくいです。

### Error Screen

追加 props:

```ts
type ErrorScreenProps = {
  // existing props
  autoReturnSeconds?: number;
};
```

表示:

- 既存の「再試行」「タイトルへ戻る」を維持する。
- エラー本文の確認を妨げない位置に自動復帰の補足を表示する。

### Preparing Screen

カメラ未接続、カメラ接続済みの両方で「タイトルへ戻る」操作を追加します。

- カメラ未接続: `preparation-actions` の下へ控えめな secondary ボタンを置く。
- カメラ接続済み: `camera-prep-panel` 内の準備完了ボタン近くへ secondary ボタンを置く。

主要操作は「カメラを開始」「モック姿勢で試す」「準備完了」なので、タイトル復帰は
secondary扱いにします。

### Countdown Screen

カウントダウン表示の下に小さな secondary ボタンとして「タイトルへ戻る」を追加します。
カウントダウンの数字より目立たせません。

### Playing Screen

`GameScreen` に `onResetToTitle?: () => void` を追加します。

配置:

- 画面右下または左下に小さな `終了` / `タイトルへ戻る` ボタンを置く。
- HUD、姿勢状態、判定フィードバックと重ならないよう、既存オーバーレイの空き領域に配置する。
- ボタンは `secondary` または専用の控えめなスタイルにする。

誤操作対策:

- 初期実装では確認ダイアログを追加しません。
- 代わりに、プレイ中ボタンは小さく控えめに配置し、主要HUDから離します。
- 展示運用ではスタッフが素早く戻せることを優先します。

将来、一般公開用途で誤操作が問題になった場合は、長押しまたは確認モーダルを別 spec で
検討します。

## Styling Design

### Auto Return Note

```css
.auto-return-note {
  margin: 12px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}
```

既存の `summary` より弱く、結果やエラーの主内容を邪魔しない表示にします。

### Reset Controls

```css
.exhibition-reset-action {
  margin-top: 12px;
}

.game-reset-action {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 3;
}
```

狭い画面では `bottom` を判定フィードバックと競合しない位置へ調整します。
実装時は既存の `.judgment-feedback` と `.pose-status` の配置を確認し、重なりがあれば
CSSメディアクエリで下端からの距離を変えます。

## State and Lifecycle

### Timers

追加されるタイマー:

- 自動タイトル復帰用 `setTimeout`

既存タイマー:

- カウントダウン用 `setTimeout`
- 壁進行用 `setInterval`
- 姿勢検出用 `requestAnimationFrame`
- 壁表示補間用 `requestAnimationFrame`

フェーズ変更時に各コンポーネントと `useEffect` のクリーンアップが走る設計を維持します。
自動復帰タイマーは `App` で管理し、フェーズ変更時に必ず解除します。

### Reset Semantics

タイトル復帰時は、次の状態へ戻します。

- `gameState`: `createInitialGameState()`
- `countdownValue`: `COUNTDOWN_START`
- `cameraStream`: `null`
- `poseDetector`: `null`
- `poseFrame`: `null`
- `calibrationPoseFrame`: `null`
- `poseVideoElement`: `null`
- `isCameraStarting`: `false`

これは既存の `resetGameSession("title")` と `releaseMediaResources()` の責務と一致します。

### In-Flight Camera Start

`handleStartCamera()` は `resourceSessionRef` によって、古い非同期結果を破棄する設計です。
手動リセットまたは自動復帰時に `releaseMediaResources()` が `resourceSessionRef` を進めるため、
カメラ開始中にタイトルへ戻っても、後から返った `MediaStream` や検出器は停止・破棄されます。

この既存設計を維持し、展示モード独自のキャンセルフラグは追加しません。

## Accessibility

- 自動復帰の補足は通常テキストとして表示し、頻繁な `aria-live` 更新は避ける。
- 手動リセットボタンには具体的なラベルを付ける。
  - 準備、結果、エラー: `タイトルへ戻る`
  - プレイ中: `プレイを終了してタイトルへ戻る`
- プレイ中のリセットボタンはキーボードでフォーカス可能にする。
- 自動復帰でタイトルへ戻った後は、既存タイトル画面の見出しが読み上げ対象になる。

## Testing Strategy

### Unit Tests

`src/game/exhibitionMode.test.ts` を追加します。

検証項目:

- `result` は結果用の自動復帰待機時間を返す。
- `error` はエラー用の自動復帰待機時間を返す。
- `playing` は自動復帰対象外である。
- `title` は手動リセット対象外である。
- `preparing`、`countdown`、`playing` は手動リセット対象である。

必要に応じて、`resetGameSession` そのものではなく `createInitialGameState()` の初期化済み状態を
既存 `state.test.ts` で確認します。

### E2E Tests

既存 `tests/e2e/mock-pose-flow.spec.ts` を維持し、必要なら次を追加します。

- 結果画面の「もう一度プレイ」が自動復帰タイマーより優先される。
- 準備画面の「タイトルへ戻る」でタイトル画面へ戻れる。
- モック姿勢でプレイ開始後、プレイ中リセットでタイトルへ戻れる。

自動復帰の実時間待機をE2Eで長時間待つのは避けます。E2Eで確認する場合は、テスト用に
短い待機時間を注入する仕組みが必要になるため、初期実装ではユニットテスト中心にします。

### Validation Commands

実装後に次を実行します。

```bash
npm run typecheck
npm run build
npm test
npm run test:e2e
```

E2EはNext.jsサーバー起動が必要なため、サンドボックスで `listen EPERM` が出る場合は
権限付きで再実行します。

## Risks and Mitigations

### 自動復帰が早すぎる

結果確認や写真撮影を邪魔する可能性があります。初期値は短くしすぎず、定数として
テスト可能にして調整しやすくします。

### プレイ中リセットの誤操作

プレイ中は自動復帰せず、手動リセットは控えめな位置に置きます。確認ダイアログは
展示運用での素早い復旧を妨げるため初期実装では入れません。

### タイマー競合

自動復帰タイマーはフェーズを閉じ込めて確認し、別フェーズへ進んだ後に古いタイマーが
タイトルへ戻さないようにします。

### リソース残留

新しい停止処理を増やさず、既存の `releaseMediaResources()` と `resetGameSession("title")`
に統一します。既存の `resourceSessionRef` により、カメラ開始中リセットも扱えます。

## Requirements Traceability

| Requirement | Design Coverage |
|-------------|-----------------|
| 1.1 | Auto Return Timer, Result Screen |
| 1.2 | Auto Return Timer, Error Screen |
| 1.3 | Reset Semantics |
| 1.4 | Result Screen, Timer競合対策 |
| 1.5 | Data Model, Unit Tests |
| 2.1 | Preparing Screen |
| 2.2 | Countdown Screen |
| 2.3 | Playing Screen |
| 2.4 | Manual Reset Data Flow |
| 2.5 | Styling Design |
| 3.1 | Resource Release |
| 3.2 | Resource Release |
| 3.3 | State and Lifecycle |
| 3.4 | App Integration |
| 3.5 | Testing Strategy |
| 4.1 | Auto Return対象外フェーズ |
| 4.2 | Preparing Idle Return |
| 4.3 | Preparing Idle Return |
| 4.4 | E2E Tests |
| 4.5 | App Integration |
| 5.1 | UI Design |
| 5.2 | Auto Return Note |
| 5.3 | Reset Controls |
| 5.4 | Styling Design |
| 5.5 | Non-Goals, UI Design |
| 6.1 | Unit Tests |
| 6.2 | Unit Tests |
| 6.3 | E2E Tests |
| 6.4 | Validation Commands |
| 6.5 | README更新方針 |
