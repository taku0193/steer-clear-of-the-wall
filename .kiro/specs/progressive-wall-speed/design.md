# Design Document

## Overview

`progressive-wall-speed` は、壁回避の成功枚数に応じて壁の進行速度を段階的に上げる機能である。

現行実装では `WALL_TICK_INTERVAL_MS = 600`、`WALL_PROGRESS_STEP = 0.25` により、壁1枚が約2.4秒で判定位置へ到達する。これを固定値のまま使い続けると、慣れたプレイヤーにとって後半の緊張感が弱い。本設計では、成功枚数をゲーム状態として保持し、成功枚数から速度段階と進行量を導出する。

速度上昇は、ミスや未検出ではなく成功時だけ発生する。リトライ時は初期状態へ戻る。ゲームの状態遷移、ハート、ミス、スコア、壁順序は既存の挙動を維持する。

## Goals

- 壁を何枚か成功するごとに、迫る速度を段階的に上げる。
- 初回プレイヤーが急に失敗しないよう、速度上昇に上限を設ける。
- 成功数、速度段階、進行量を純粋ロジックとしてテストできる形にする。
- プレイヤーに現在の速度段階と速度アップを分かりやすく表示する。

## Non-Goals

- 壁パターンの出現確率や順序の調整。
- プレイヤーの能力に応じた自動難易度調整。
- ランキング、スコア保存、バックエンド連携。
- 姿勢検出精度や安全領域形状の変更。

## Current Behavior

現在の壁進行は `src/game/gameLoop.ts` の固定値で決まっている。

```typescript
export const WALL_PROGRESS_STEP = 0.25;
export const WALL_TICK_INTERVAL_MS = 600;
export const WALL_CYCLE_DURATION_MS =
  WALL_TICK_INTERVAL_MS / WALL_PROGRESS_STEP;
```

`App.tsx` は `WALL_TICK_INTERVAL_MS` ごとに `advanceWallProgress` を呼び、`advanceWallProgress` が `wallProgress` に `WALL_PROGRESS_STEP` を加算する。`wallProgress` が `1` に到達すると判定を行い、次の壁へ進む。

この構造を大きく変えず、進行ステップを現在の速度段階から導出する。

## Data Model

### GameState Extension

`GameState` に成功枚数と速度アップ通知用の状態を追加する。

```typescript
type GameState = {
  // existing fields...
  successfulWalls: number;
  wallSpeedLevel: number;
  lastSpeedLevelUp: boolean;
};
```

`successfulWalls` は、判定結果が `success` のときだけ増える。

`wallSpeedLevel` は現在の速度段階を表す。初期値は `1` とする。成功枚数から毎回導出する案もあるが、速度アップ通知やテストの読みやすさを優先してゲーム状態に保持する。

`lastSpeedLevelUp` は直近の壁判定で速度段階が上がったかを表す。HUDや判定フィードバックで「速度アップ」を出すために使う。判定が発生していない進行中のtickでは維持し、次の判定で更新する。

### Initial State

`createGameState` では次の値を設定する。

```typescript
successfulWalls: 0,
wallSpeedLevel: 1,
lastSpeedLevelUp: false,
```

リトライやタイトル復帰で `createGameState` が呼ばれる既存の流れに乗せることで、速度関連状態も初期化する。

## Speed Rules

速度段階は定数データで管理する。

```typescript
type WallSpeedTier = {
  level: number;
  minSuccessfulWalls: number;
  progressStep: number;
  label: string;
};

const WALL_SPEED_TIERS: readonly WallSpeedTier[] = [
  { level: 1, minSuccessfulWalls: 0, progressStep: 0.25, label: "通常" },
  { level: 2, minSuccessfulWalls: 3, progressStep: 0.3, label: "少し速い" },
  { level: 3, minSuccessfulWalls: 6, progressStep: 0.36, label: "速い" },
  { level: 4, minSuccessfulWalls: 10, progressStep: 0.45, label: "かなり速い" },
];
```

この設定では、壁1枚あたりの到達目安は次の通りになる。

| Level | Required Successes | Step | Approx Duration |
|-------|--------------------|------|-----------------|
| 1 | 0 | 0.25 | 2.4秒 |
| 2 | 3 | 0.30 | 2.0秒 |
| 3 | 6 | 0.36 | 1.8秒 |
| 4 | 10 | 0.45 | 1.2秒から1.8秒程度 |

`setInterval` は既存の `600ms` を維持する。速度は interval を短くするのではなく、1tickあたりの `wallProgress` 増加量を変える。これにより、タイマーの再作成やReact effectの依存増加を避け、ゲームループを単純に保てる。

`progressStep` が `1` を割り切らない場合でも、`nextProgress >= 1` で判定する。判定後は `wallProgress` を `0` に戻すため、オーバー分は持ち越さない。

## Pure Functions

速度計算を `src/game/gameLoop.ts` または新規 `src/game/wallSpeed.ts` に分離する。

推奨は `wallSpeed.ts` の新設である。理由は、速度段階のテストをゲームループ全体の判定テストから切り離せるため。

```typescript
export function getWallSpeedTier(successfulWalls: number): WallSpeedTier;

export function getWallProgressStep(speedLevel: number): number;

export function calculateNextSpeedState(input: {
  successfulWalls: number;
  currentSpeedLevel: number;
  judgmentType: JudgmentResult["type"];
}): {
  successfulWalls: number;
  wallSpeedLevel: number;
  speedLevelUp: boolean;
};
```

`calculateNextSpeedState` は `success` のときだけ `successfulWalls` を増やし、その成功数に対応する速度段階を返す。`miss` と `notDetected` では成功数も速度段階も変えない。

## Game Loop Integration

`advanceWallProgress` の流れを次のように変更する。

1. `gameState.phase !== "playing"` または壁パターンが空なら現状維持。
2. 現在の `gameState.wallSpeedLevel` から `progressStep` を取得する。
3. `wallProgress + progressStep < 1` なら `wallProgress` だけ更新する。
4. 判定位置に到達したら既存どおり `judgeCollision` を実行する。
5. 判定結果から `successfulWalls`、`wallSpeedLevel`、`lastSpeedLevelUp` を更新する。
6. スコア、ミス、ハート、次の壁、結果遷移は既存の流れを維持する。

判定直後に速度段階が上がった場合、その次に迫る壁から新しい速度を適用する。判定済みの壁の途中で速度が変わることはない。

## UI Design

### GameScreen

`GameScreenProps` に次を追加する。

```typescript
successfulWalls: number;
wallSpeedLevel: number;
wallSpeedLabel: string;
lastSpeedLevelUp: boolean;
```

HUDは現在 `ハート`, `スコア`, `ミス` の3項目である。速度表示は4項目目として追加する。

- ラベル: `速度`
- 値: `Lv.1`, `Lv.2` など
- 補助表示が必要な場合は `wallSpeedLabel` を `aria-label` に含める

成功枚数はHUDに常時追加すると密度が上がるため、初期実装では判定フィードバックまたは速度表示の `aria-label` に含める。必要なら結果画面に表示する。

`lastSpeedLevelUp` が true の場合、判定フィードバックは成功表示に速度アップを含める。

例:

- 通常成功: `成功`
- 速度上昇成功: `成功 / 速度アップ`

### ResultScreen

`ResultScreenProps` に `successfulWalls` と `wallSpeedLevel` を追加する。

結果画面の統計は現在3項目である。速度機能後は次の4項目にする。

- 最終スコア
- クリア枚数
- 最高速度
- ミス数

`残りハート` はハートがなくなって結果へ進む現状では常に `0` になりやすく、結果の情報価値が低い。速度機能の実装時に `残りハート` を残すか、`クリア枚数` と差し替えるかをタスクで判断する。基本方針は `クリア枚数` を優先する。

## App Integration

`App.tsx` は、`WALL_TICK_INTERVAL_MS` の interval を維持する。

```typescript
const timerId = window.setInterval(() => {
  setGameState((currentState) =>
    advanceWallProgress(currentState, WALL_PATTERNS),
  );
}, WALL_TICK_INTERVAL_MS);
```

`advanceWallProgress` が内部で現在速度に応じた `progressStep` を選ぶため、`useEffect` の依存配列に速度段階を追加しない。これにより速度が上がるたびに interval を作り直す必要がない。

`GameScreen` と `ResultScreen` へは `gameState.successfulWalls`、`gameState.wallSpeedLevel`、速度ラベルを渡す。

## Testing Strategy

### Unit Tests

新規または既存テストで次を確認する。

- `createGameState` が `successfulWalls = 0`、`wallSpeedLevel = 1`、`lastSpeedLevelUp = false` を返す。
- 成功判定時だけ `successfulWalls` が増える。
- ミス判定、未検出判定では `successfulWalls` が増えない。
- 成功数が閾値に達すると `wallSpeedLevel` が上がる。
- 最大段階を超えても `wallSpeedLevel` が最大値を超えない。
- 速度段階に応じて `wallProgress` の増加量が変わる。
- ハートがなくなった場合でも、直前までの成功枚数と速度段階が保持される。

### Existing Tests To Update

- `src/game/state.test.ts`
- `src/game/gameLoop.test.ts`
- 必要なら新規 `src/game/wallSpeed.test.ts`

## Documentation

`README.md` の遊び方と手動確認チェックリストを更新する。

- 壁を何枚か避けると速度が上がることを書く。
- モック姿勢モードでも速度上昇を確認できることを書く。
- 手動確認に「成功枚数に応じて速度表示が上がる」「リトライで速度が初期化される」を追加する。

## Risks and Mitigations

### 速度が急に上がりすぎる

初期速度を既存相当に保ち、成功3枚目までは速度を変えない。最大速度も段階定数で制限する。

### HUDが詰まりすぎる

速度は短い `Lv.N` 表記にし、詳細ラベルは `aria-label` または結果画面に寄せる。CSSは既存の `.game-hud` レイアウトを崩さないように調整する。

### interval再作成でゲームループが不安定になる

intervalは固定し、進行量だけを変える。React effectの依存に速度段階を入れない。

### テストが判定と速度を混ぜすぎる

速度段階の純粋関数を分け、ゲームループテストでは統合挙動だけを確認する。
