# Design Document

## Overview

`fullscreen-game-ui` は、プレイ中のCanvasをブラウザのビューポート全体へ広げ、
HUDと判定フィードバックをCanvas上へ重ねる表示変更です。

ブラウザのFullscreen APIは使用しません。プレイ画面のルート要素をビューポートへ
固定し、通常のブラウザ表示内で利用可能な幅と高さをすべて使います。

カメラ映像は姿勢検出の入力として維持しますが、プレイ中の主表示にはしません。
既存の`PoseFrame`、正規化座標、壁進行、判定、スコア、タイマーは変更せず、
表示層だけを再構成します。

## Goals

- プレイ中のCanvasをビューポート全体へ広げる。
- CSS表示サイズとCanvas内部解像度を一致させ、拡大時のぼやけを抑える。
- HUDをオーバーレイ化し、ゲーム描画面積を縮小しない。
- プレイヤー向け情報だけを残し、座標などの開発用詳細を通常表示から外す。
- リサイズや狭い画面でも主要情報とゲーム描画を維持する。

## Non-Goals

- カメラ映像を全画面背景として表示すること。
- ブラウザのFullscreen APIを起動すること。
- 壁、姿勢検出、当たり判定、スコア、制限時間を変更すること。
- タイトル、準備、結果、エラー画面を全面的に作り直すこと。
- 新しいアニメーションエンジンやUIライブラリを追加すること。

## Current State

現在のプレイ画面には次の制約があります。

- `.app-shell`に`32px`の余白がある。
- `.game-screen`の幅が最大`960px`に制限されている。
- `.game-canvas`の幅が最大`720px`、縦横比が`12 / 7`に固定されている。
- HUDがCanvasとは別の行を占有している。
- Canvasの内部解像度が`720 × 420`で固定されている。
- 壁進行率、姿勢座標などの詳細情報がプレイ領域の下に常時表示される。

この構造を、ビューポート固定のゲームレイヤーとオーバーレイUIへ変更します。

## Layout Design

### Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ [残り時間] [スコア] [ミス]              [カメラ・検出状態] │
│                                                              │
│                                                              │
│                   Canvas: 壁とアバター                       │
│                                                              │
│                                                              │
│                 [成功 / 失敗 / 判定不能]                     │
└──────────────────────────────────────────────────────────────┘
```

### Narrow Viewport

```text
┌──────────────────────────────┐
│ [時間] [スコア] [ミス]       │
│ [入力・検出状態]             │
│                              │
│       Canvasゲーム面         │
│                              │
│ [判定フィードバック]         │
└──────────────────────────────┘
```

### Layer Order

1. Canvas背景、壁、安全領域、アバター
2. HUD
3. 入力・検出状態
4. 判定フィードバック
5. アクセシビリティ用の非表示見出し

HUDはDOM要素としてCanvasより前面へ置きます。Canvas内へ文字を描かないため、
読み上げ、レスポンシブ配置、コントラスト調整をCSSで扱えます。

## Component Design

### `GameScreen`

#### Responsibilities

- プレイ画面のビューポート固定レイアウトを構成する。
- Canvasコンテナの表示サイズを監視する。
- Canvas表示サイズ、端末ピクセル比、ゲーム描画入力を描画層へ渡す。
- HUD、姿勢状態、判定フィードバックをCanvas上へ重ねる。
- プレイヤーに不要な座標値や壁進行率の詳細表示を通常UIから除外する。

#### DOM Structure

```tsx
<section className="game-screen">
  <h1 className="visually-hidden">プレイ中</h1>
  <canvas className="game-canvas" />
  <header className="game-hud">...</header>
  <p className="pose-status">...</p>
  <p className="judgment-feedback">...</p>
</section>
```

現在の`playfield-placeholder`、長い説明文、詳細な`dl`はプレイ中のDOMから外します。
入力モードと姿勢検出状態は、短いステータスチップとして残します。

#### Resize Observation

`GameScreen`は`ResizeObserver`で`.game-screen`のcontent boxを監視します。
`window.resize`だけに依存しないため、ブラウザUI、埋め込み領域、将来の親レイアウト変更
にも追従できます。

監視結果が`0 × 0`の場合は描画サイズを更新しません。監視はコンポーネントの
アンマウント時に解除します。

### Canvas Viewport Calculation

Canvasの表示サイズと内部解像度の計算を純粋関数として分離します。

配置候補:

- `src/rendering/canvasViewport.ts`

契約:

```typescript
type CanvasViewport = {
  cssWidth: number;
  cssHeight: number;
  pixelRatio: number;
  bitmapWidth: number;
  bitmapHeight: number;
};

function calculateCanvasViewport(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): CanvasViewport | null;
```

計算規則:

- CSS幅と高さは正の整数へ丸める。
- `devicePixelRatio`は最低`1`、最大`2`へ制限する。
- bitmap幅は`cssWidth × pixelRatio`、高さは`cssHeight × pixelRatio`とする。
- 幅または高さが`0`以下なら`null`を返す。

ピクセル比を最大`2`へ制限し、高DPI対応とCanvasメモリ使用量のバランスを取ります。

### `canvasRenderer`

#### Responsibilities

- Canvas bitmapを`CanvasViewport`に合わせる。
- 描画座標をCSSピクセル単位へ統一する。
- 現在の壁、アバター、未検出表示をビューポートサイズに合わせて描画する。

描画開始時に次を行います。

1. 必要な場合だけ`canvas.width`と`canvas.height`をbitmapサイズへ更新する。
2. `context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)`を設定する。
3. `cssWidth × cssHeight`を論理描画領域としてクリアする。
4. 既存の正規化座標を論理幅・高さへ変換して描画する。

これにより、正規化座標と判定ロジックを変更せず、線幅や文字サイズをCSSピクセル単位で
維持できます。

描画入力:

```typescript
type CanvasRenderInput = {
  viewport: CanvasViewport;
  mockPose: MockPose;
  poseFrame: PoseFrame | null;
  poseInputMode: PoseInputMode;
  playerArea: SafeArea | null;
  wallPattern: WallPattern;
  wallProgress: number;
};
```

### Application Shell

プレイ中だけ`.app-shell-game`をビューポートへ固定します。

```css
.app-shell-game {
  position: fixed;
  inset: 0;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0;
  overflow: hidden;
}
```

タイトル、準備、結果、エラー画面は現在の中央パネル配置を維持します。

## Styling Design

### Canvas

- `position: absolute`
- `inset: 0`
- `width: 100%`
- `height: 100%`
- `max-width: none`
- 固定`aspect-ratio`を削除
- 枠線と角丸を削除

### HUD

- 画面上端へ絶対配置する。
- 3項目を横並びのコンパクトなカードとして表示する。
- `clamp()`で数値と余白を調整する。
- 半透明の暗い背景、境界線、必要に応じた`backdrop-filter`で可読性を保つ。
- `env(safe-area-inset-*)`を余白計算へ含める。

### Pose Status

- 画面右上へ小さいステータスチップとして配置する。
- 実カメラ／モックと検出可否を短い文言で表示する。
- 狭い画面ではHUDの下へ移動する。

### Judgment Feedback

- 画面下部中央へ配置する。
- 成功、失敗、判定不能で既存の色分けを維持する。
- 背景を半透明にし、Canvas背景から独立して読めるようにする。
- `aria-live="polite"`を維持する。

### Responsive Rules

- 幅`640px`以下ではHUDのカード幅、数値、余白を縮小する。
- 3項目は1列へ縦積みせず、画面幅内の3列を維持する。
- 高さが低い画面ではHUDとフィードバックの上下余白を縮小する。
- 主要オーバーレイへ最大幅を設定し、超横長画面でも散らばりすぎないようにする。

## Data Flow

```text
App / GameState
  ├─ score, misses, remainingSeconds ───────────────┐
  ├─ pose status, judgment feedback ───────────────┤
  └─ wall, pose, playerArea ────────────────┐      │
                                             ▼      ▼
ResizeObserver ──> CanvasViewport ──> canvasRenderer  GameScreen overlays
                                             │
                                             ▼
                                  Full-viewport Canvas
```

Canvasサイズは表示層だけの状態です。`GameState`へ保存せず、当たり判定やスコアへ
渡しません。

## Accessibility

- 「プレイ中」の見出しは視覚的に隠し、読み上げ構造には残す。
- HUDは`aria-label="プレイ状況"`を維持する。
- 判定フィードバックは`aria-live="polite"`を維持する。
- Canvasにはゲーム描画であることを示す`aria-label`を維持する。
- 色だけに依存せず、成功、失敗、判定不能の文字を表示する。

## Error and Edge Cases

### ResizeObserverが利用できない

対象ブラウザはモダンブラウザを前提とします。初回描画ではCanvas要素の
`getBoundingClientRect()`からサイズを取得し、`ResizeObserver`が利用可能な場合に
継続監視します。

### 一時的な0サイズ

画面遷移やレイアウト計算中に`0 × 0`が通知された場合、直前の有効サイズを維持します。

### 高DPI・大画面

`devicePixelRatio`を最大`2`に制限し、bitmapの過剰な拡大を防ぎます。

### 姿勢未検出

既存の未検出描画とステータス表示を維持します。Canvas拡大によって判定方法は
変更しません。

## File Change Plan

- `src/components/GameScreen.tsx`
  - Canvasサイズ監視、DOM再構成、HUDオーバーレイ化。
- `src/rendering/canvasViewport.ts`
  - Canvas表示サイズとbitmapサイズを計算する純粋関数。
- `src/rendering/canvasViewport.test.ts`
  - ピクセル比、丸め、無効サイズのユニットテスト。
- `src/rendering/canvasRenderer.ts`
  - 論理サイズと端末ピクセル比を使う描画へ変更。
- `src/style.css`
  - プレイ画面のビューポート固定、Canvas全面表示、HUD配置、レスポンシブ対応。

`App.tsx`、ゲーム状態、姿勢検出、壁、判定、スコアは原則変更しません。

## Testing Strategy

### Automated

- `calculateCanvasViewport`がCSSサイズとbitmapサイズを正しく返す。
- ピクセル比が`1`未満の場合は`1`、`2`を超える場合は`2`になる。
- 無効な幅または高さでは`null`を返す。
- 既存の型チェック、ビルド、23件のゲームロジックテストが成功する。

### Manual

- 1920×1080程度の横長画面でCanvasがビューポート全体へ広がる。
- ブラウザの幅と高さを変更すると、Canvasが追従する。
- 高DPI画面で壁とアバターが過度にぼやけない。
- HUD、姿勢状態、判定結果がCanvas上で読める。
- モック姿勢と実カメラ姿勢の両方が従来どおり描画・判定される。
- プレイ中に不要なスクロールが発生しない。
- 結果、エラー、再試行、タイトル復帰が従来どおり動く。

## Requirement Traceability

| Requirement | Design Element |
|-------------|----------------|
| 1 | Application Shell, Layout Design |
| 2 | Canvas Viewport Calculation, canvasRenderer |
| 3 | Layer Order, Canvas |
| 4 | HUD, Judgment Feedback |
| 5 | GameScreen DOM Structure, Pose Status |
| 6 | Responsive Rules |
| 7 | Data Flow, Testing Strategy |
