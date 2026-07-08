# Design Document

## Overview

`human-shaped-safe-areas` は、現在の矩形安全領域を、人間が体で作るポーズに近い複合形状へ拡張する機能である。

現行実装は `WallPattern.safeArea` を1つの矩形として扱い、Canvas描画も衝突判定も矩形前提になっている。このため、壁の穴が単調で、体験型ゲームとして「体の形を合わせる」面白さが弱い。

本設計では、既存の `safeArea` を互換用の外接矩形として残しつつ、新たに `safeShape` を追加する。`safeShape` は複数の基本形状を組み合わせた安全領域であり、描画と判定の両方で同じデータを使う。

## Goals

- 立つ、しゃがむ、腕を広げる、左右に寄るなど、人間のポーズを想起できる壁穴にする。
- 表示される穴と判定に使う穴を同じ形状定義から生成する。
- 既存のゲーム状態、壁進行、ハート、スコア、速度上昇機能を壊さずに移行する。
- 衝突判定をCanvasに依存しない純粋ロジックとして維持する。

## Non-Goals

- 画像マスクやピクセル単位の完全判定。
- 3Dモデル、外部画像素材、物理シミュレーション。
- 体格キャリブレーションやプレイヤー別の穴生成。
- 危険なジャンプ、過度な反り、床に倒れ込む姿勢を要求する壁。

## Data Model

### Existing Model

現在は次の矩形のみを使っている。

```typescript
export type SafeArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WallPattern = {
  id: string;
  name: string;
  safeArea: SafeArea;
  verticalAnchor: WallVerticalAnchor;
  scoreValue: number;
};
```

### Proposed Model

`safeArea` は外接矩形として残し、複合形状は `safeShape` に追加する。

```typescript
export type SafeZone =
  | {
      type: "rect";
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "ellipse";
      id: string;
      cx: number;
      cy: number;
      rx: number;
      ry: number;
    }
  | {
      type: "capsule";
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      radius: number;
    }
  | {
      type: "polygon";
      id: string;
      points: readonly { x: number; y: number }[];
    };

export type SafeShape = {
  zones: readonly SafeZone[];
};

export type WallPattern = {
  id: string;
  name: string;
  safeArea: SafeArea;
  safeShape?: SafeShape;
  verticalAnchor: WallVerticalAnchor;
  scoreValue: number;
};
```

座標はすべて壁矩形内の正規化座標 `0..1` とする。`safeShape` がない場合は、従来どおり `safeArea` の矩形として描画・判定する。

### Why These Primitives

- `ellipse`: 頭や胴体上部の余白を自然に表現できる。
- `capsule`: 腕や脚の通り道を丸みのある線として表現できる。
- `rect`: 胴体や低姿勢の大きな余白を簡単に表現できる。
- `polygon`: 部品ごとの輪郭ではなく、連続した1つの人型シルエットを表現できる。

これらはCanvas 2Dで描きやすく、数学的な内外判定も純粋関数で実装できる。

## Shape Examples

初期実装では、既存の全パターンを一気に高度化するのではなく、主要パターンから人型化する。

### Center Stand

- 頭: 上部の楕円
- 胴体: 縦長の角丸に近いカプセル
- 脚: 左右2本の下向きカプセル

### Crouch

- 胴体: 低い横長楕円または矩形
- 頭: 低い位置の楕円
- 脚: 下部に広めの横長カプセル

### Arms Wide

- 胴体: 中央カプセル
- 腕: 左右へ伸びる斜めカプセル
- 頭: 上部楕円

### Side Lean

- 頭と胴体を左右どちらかへずらす
- 片側の腕または脚の余白を大きくする

### One-Side Low

- 片側へ寄った低姿勢
- 展示環境で危なくない範囲の横移動としゃがみを要求する

## Collision Design

### Current Collision

現在はプレイヤーの外接矩形全体が `safeArea` に入っているかだけを見る。

```typescript
playerArea.x >= safeArea.x - tolerance
playerArea.y >= safeArea.y - tolerance
playerRight <= safeRight + tolerance
playerBottom <= safeBottom + tolerance
```

複合形状では、外接矩形全体を入れると穴が不自然に大きくなり、逆に小さくすると実姿勢の揺れで失敗しやすい。

### Proposed Collision

複合形状では、`playerArea` から代表点を作り、それらが `safeShape` のいずれかのゾーンに入っているかを判定する。

```typescript
type PlayerAnchorPoint = {
  id:
    | "head"
    | "upperTorso"
    | "center"
    | "leftShoulder"
    | "rightShoulder"
    | "leftFoot"
    | "rightFoot";
  x: number;
  y: number;
};
```

初期実装では `PoseFrame` を直接衝突判定へ渡さず、既存の `playerArea` から代表点を作る。これにより既存のカメラ・モック姿勢のデータフローを大きく変えない。

代表点の例:

```typescript
head:         { x: centerX, y: top + height * 0.08 }
upperTorso:   { x: centerX, y: top + height * 0.28 }
center:       { x: centerX, y: top + height * 0.5 }
leftShoulder: { x: left + width * 0.18, y: top + height * 0.28 }
rightShoulder:{ x: left + width * 0.82, y: top + height * 0.28 }
leftFoot:     { x: left + width * 0.28, y: bottom }
rightFoot:    { x: left + width * 0.72, y: bottom }
```

判定は次の順に行う。

1. `playerArea` が `null` なら `notDetected`。
2. `wallPattern.safeShape` がなければ、既存の矩形判定を使う。
3. `safeShape` があれば、代表点を生成する。
4. 各代表点が複合形状のいずれかのゾーン内に入っていれば成功。
5. 1つでも外れていれば `miss`。

### Tolerance

既存の `COLLISION_TOLERANCE = 0.05` を複合形状にも適用する。

- rect: 矩形の上下左右を tolerance だけ広げる
- ellipse: 半径を tolerance だけ広げる
- capsule: 半径を tolerance だけ広げる

これにより姿勢検出の揺れに対して、従来と近い寛容さを維持する。

## Rendering Design

### Shape Path Builder

描画層に、壁矩形と `SafeShape` からCanvasパスを作るヘルパーを追加する。

```typescript
function createSafeShapePath(wallRect: Rect, safeShape: SafeShape): Path2D;
```

`safeShape` がない場合は、既存の `safeArea` から矩形パスを作る。

### Wall Rendering

描画は次の順にする。

1. 壁矩形全体を赤系で塗る。
2. 安全領域パスを `destination-out` でくり抜く。
3. 安全領域パスに緑の半透明フィルと輪郭線を描く。
4. 壁外枠を描く。

これにより、穴の形が四角ではなく、人型に近い輪郭として見える。

### Visual Clarity

- 安全領域の塗りは現行の緑を維持する。
- 輪郭線は現行よりやや太めにし、壁が迫っている途中でも見えるようにする。
- 複合形状が重なる部分は1つの安全領域として扱い、境界線が過剰に分断されないようにする。

## Wall Pattern Migration

移行は段階的に行う。

1. `center-gap`, `left-gap`, `right-gap` を人型の基本形状へ移行する。
2. `crouch-low`, `deep-crouch`, `left-low`, `right-low` を低姿勢の複合形状へ移行する。
3. 高難易度パターンは、テストと視認性確認後に順次移行する。

全パターンを最初から細かくしすぎると調整が難しいため、初期実装では代表的なパターンを人型化し、残りは矩形フォールバックでも動作するようにする。

## Module Changes

### Game Domain

- `src/game/types.ts`
  - `SafeZone`, `SafeShape` を追加
  - `WallPattern.safeShape?` を追加

- `src/game/safeShape.ts`
  - 代表点生成
  - `isPointInsideSafeZone`
  - `isPointInsideSafeShape`
  - `getSafeAreaShape` フォールバック

- `src/game/collision.ts`
  - `safeShape` がある場合は代表点判定
  - ない場合は既存矩形判定

- `src/game/wallPatterns.ts`
  - 主要パターンに `safeShape` を追加

### Rendering

- `src/rendering/canvasRenderer.ts`
  - `drawWall` を矩形専用から形状対応へ変更
  - `safeArea` 外接矩形ではなく `safeShape` パスを描画に使う

- `src/rendering/safeShapePath.ts`
  - Canvas依存のPath2D生成を分離する候補

### Tests

- `src/game/safeShape.test.ts`
  - 点がrect、ellipse、capsuleに入ること
  - toleranceが効くこと
  - playerAreaから代表点を作ること

- `src/game/collision.test.ts`
  - 複合形状内なら成功
  - 代表点が1つでも外れたら失敗
  - `safeShape` がない壁は既存矩形判定を維持

- `src/game/wallPatterns.test.ts`
  - `safeShape` の座標が正規化範囲内であること
  - shape idがパターン内で重複しないこと

## Compatibility

- `safeShape` はoptionalにするため、既存の矩形パターンは壊れない。
- `safeArea` は外接矩形として残すため、既存テストや補助計算を段階的に移行できる。
- ゲーム状態、速度上昇、スコア、ハートは変更しない。

## Risks and Mitigations

### 見た目と判定がズレる

描画と判定で同じ `safeShape` を使う。Canvas用Path生成とゲーム用内外判定は別実装になるが、入力データは同じにする。

### 判定が厳しすぎる

初期実装ではプレイヤー矩形全体ではなく代表点を使い、既存の tolerance を適用する。細かい穴にしすぎず、展示で遊べる余白を残す。

### 複合形状が見づらい

輪郭線を太くし、緑の半透明領域を重ねる。最初は基本パターンだけを人型化し、極端に細い高難易度パターンは後で調整する。

### 実装範囲が大きくなる

`safeShape` optionalで段階移行する。まず主要パターンを人型化し、矩形フォールバックを残す。
