# Design Document

## Overview

`ui-polish-and-motion`は、現在のアーケードUIを維持しながら、Canvas座標、壁通過、
アバター動作、準備画面、HUD、結果、判定演出、スタイル構造、検証を完成品質へ近づける。

最も重要な設計判断は、Canvas全体の幅と高さへ直接正規化座標を掛ける方式をやめ、
アスペクト比を維持した論理ゲーム領域を導入することである。壁、アバター、判定領域、
背景ガイド、プレビュー姿勢は同じ変換を共有する。

## Architecture Boundaries

- `src/game/`: ゲーム状態と純粋ロジック。結果ランクと表示用判定情報だけを追加できる。
- `src/rendering/`: 論理ゲーム領域、Canvas座標変換、アバターポーズ、描画。
- `src/components/`: 画面表示、演出ライフサイクル、操作イベント。
- `src/styles/`: 画面単位のスタイル。ゲームロジックへ依存しない。
- `tests/e2e/`: 画面遷移、Canvasピクセル、複数viewportの確認。

## 1. Aspect-Preserving Game Space

### Logical Space

ゲーム座標は`width = 1`、`height = 1`の正規化空間を維持する。Canvas上には、
基準アスペクト比`16 / 10`を維持する最大矩形を配置する。

```typescript
type GameViewport = {
  canvasWidth: number;
  canvasHeight: number;
  gameX: number;
  gameY: number;
  gameWidth: number;
  gameHeight: number;
  scale: number;
};
```

計算規則:

1. Canvasが基準より横長なら、高さをCanvas高へ合わせて左右に余白を置く。
2. Canvasが基準より縦長なら、幅をCanvas幅へ合わせて上下に余白を置く。
3. 正規化座標は`gameX + x * gameWidth`、`gameY + y * gameHeight`で変換する。
4. 円、線幅、頭、手足の太さは`scale = min(gameWidth, gameHeight)`を基準にする。

### Rendering Integration

`calculateGameViewport`を`src/rendering/gameViewport.ts`へ純粋関数として追加する。

`canvasRenderer`は以下を同じ`GameViewport`で描画する。

- 壁矩形
- 安全領域
- カメラ姿勢とモック姿勢
- プレイヤー判定領域
- 背景の消失点と床線
- 判定演出

Canvas全体は暗い競技空間で塗り、ゲーム領域外は側壁または観客席相当の低コントラスト背景にする。

### Collision Boundary

衝突判定は正規化ゲーム座標で実行済みのため変更しない。今回の変換は表示だけへ適用する。

## 2. Preview Timeline

タイトルの1壁あたりの演出を5.2秒とする。

| Phase | Normalized Time | Behavior |
|---|---:|---|
| Approach | 0.00-0.18 | アバターは中央直立、壁は遠方 |
| Anticipation | 0.18-0.32 | 重心移動または膝を軽く曲げる |
| Pose | 0.32-0.62 | 安全領域へ移動し対象姿勢を作る |
| Contact | 0.62-0.78 | 壁が判定位置へ到達、姿勢を保持 |
| Pass | 0.78-0.92 | 壁輪郭を拡大・薄化し手前へ通過させる |
| Recover | 0.92-1.00 | 成功反応後、次の壁へ切り替える |

### Wall Motion Model

現在の`wallProgress 0..1`へ表示専用の`passProgress 0..1`を追加する。

- `wallProgress < 1`: 既存`calculateWallRect`で接近。
- `passProgress > 0`: 判定位置の矩形を中心から追加拡大し、壁alphaを減らす。
- 通過中も安全領域の穴と壁の輪郭は同じ追加変換を受ける。
- 実ゲームの壁進行と判定タイミングには適用しない。

`CanvasRenderInput`へ表示専用の任意値を追加する。

```typescript
type PreviewMotion = {
  passProgress: number;
  successPulse: number;
};
```

### Pattern Order

Fisher-Yatesで全壁を並べ替え、配列を一巡する。次周の先頭が直前の末尾と同じ場合は
先頭と別要素を交換する。

## 3. Staged Avatar Motion

### Pose Keyframes

単純な開始・終了の2点補間から、次の4キーフレームへ変更する。

```typescript
type PreviewPoseKeyframe = {
  at: number;
  pose: NormalizedAvatarPose;
};
```

- `neutral`: 中央直立。
- `anticipation`: 動作前の重心・関節変化。
- `transition`: 安全領域へ移動中。
- `target`: 壁に一致する完成姿勢。
- `recovery`: 必要な壁だけ着地または直立復帰。

### Motion by Pose

- 立位移動: 腰と肩を先に横移動し、足を追従させる。
- しゃがみ: 腰を下げる前に膝を外へ曲げる。
- 腕上げ: 肘を外へ開いてから手首を上げる。
- ジャンプ: 予備しゃがみ、上昇、滞空、着地の4段階。
- 座り: 腰を後ろへ引き、膝を曲げ、足を前へ出す。
- 傾き: 足を接地したまま腰、肩、頭の順で傾ける。
- 大股: 重心を中央に残し、左右の足を段階的に広げる。

キーフレーム間はsmoothstepを使い、関節ごとの開始時刻をわずかにずらす。

### Continuity

壁切り替え時は、通過後の`recovery`姿勢から次の`neutral`へ短く補間する。
Canvasを再マウントせず、同じ描画ループ内で壁IDとキーフレーム時刻を切り替える。

## 4. Mobile HUD

### Desktop

既存の4領域一列を維持する。

### Mobile

HUDを2階層にする。

```text
┌ ハート5個 ───────── スコア ┐
└ ミス                 速度 ┘
```

- 上段: ハートとスコア。高さ58px。
- 下段: ミスと速度。高さ30px。
- 全体幅は画面左右8pxを除く固定幅。
- 数値はtabular nums、最大桁用のmin-widthを持つ。
- 姿勢警告はHUD下、壁名はその下へ置く。
- 終了操作と判定表示は下部で左右に分離する。

## 5. Pre-Camera Avatar Preview

`AvatarStyleSelector`の文字ボタンを、CanvasまたはCSS装飾ではなく、既存アバター描画を
小さいCanvasへ再利用した選択肢へ変更する。

新規`AvatarStylePreview`:

- 固定直立姿勢を描画する。
- 背景は透明または無彩色。
- 各選択肢は安定したaspect-ratioを持つ。
- 選択中は`--action`の輪郭と下線で示す。

未接続準備画面は、上部に見出し、中央に3つのアバター、下部に操作を置く。
主操作はカメラ開始、副操作はモック、最下部にタイトル復帰とする。

## 6. Camera Alignment Overlay

### Components

`CameraAlignmentOverlay`をカメラ映像上へ追加する。

- 中央の人物ガイド: 頭から足元までの角丸ではない人型ガイド線。
- 中央線: 画面中心の短い線。
- 地面線: 足首目標位置。
- 距離表示: `近い / 適正 / 遠い / 未検出`。
- 自動開始進捗: ready維持時間を0..1で表示。

### Data

既存`CalibrationResult`と`AutoStartState`を表示入力に使う。新しい判定は追加しない。

自動開始進捗は待機開始時刻と既存遅延から表示用に計算する。条件が外れたら0へ戻す。

## 7. Result Score and Rank

### Score Count-Up

`AnimatedScore`コンポーネントを追加する。

- 900msで0から最終値へease-outする。
- `requestAnimationFrame`で実時間から計算する。
- 読み上げは最終値だけをARIAラベルで提供する。
- reduced motionでは最終値を即時表示する。

### Rank

保存を必要としない今回プレイ評価として`calculatePerformanceRank`を純粋関数で追加する。

入力:

- `successfulWalls`
- `wallSpeedLevel`
- `misses`

出力:

```typescript
type PerformanceRank = "S" | "A" | "B" | "C";
```

評価点の例:

```text
successfulWalls * 2 + wallSpeedLevel * 3 - misses
```

境界値は設計実装時にテストで固定し、「今回の評価」と表示する。

## 8. Wall Name Cue

`WallPatternCue`を`GameScreen`へ追加する。

- `activeWallPattern.id`の変化で再表示する。
- 表示時間は1000ms。
- 画面上部中央、HUDと姿勢状態の下へ配置する。
- 日本語の`name`だけを表示する。
- opacityと小さい上方向移動を使い、reduced motionではopacityだけにする。

## 9. Collision Feedback Detail

### Data Limitation

現在の`JudgmentResult`は失敗理由のみで、外れた代表点を持たない。
判定を再計算せず表示するため、判定関数が表示用詳細を結果へ含める。

```typescript
type CollisionFeedbackPoint = {
  anchorId: PlayerAnchorPoint["id"];
  x: number;
  y: number;
};
```

失敗時の`JudgmentResult`へ`outsidePoints`を追加する。成功・失敗の決定規則は変更しない。

### Rendering

- 成功: 安全領域の輪郭を外側へ拡散しながらalphaを下げる。
- 失敗: `outsidePoints`をCanvas座標へ変換し、×記号と短い円反応を描く。
- 700ms後に表示状態を解除する。

## 10. CSS Structure

`src/style.css`は共通ファイルだけに縮小し、次へ分割する。

```text
src/styles/
├── tokens.css
├── base.css
├── title.css
├── preparation.css
├── countdown.css
├── game.css
├── result.css
└── responsive.css
```

`src/style.css`から上記を`@import`する。Next.jsのグローバルCSS入口は変更しない。

責務:

- `tokens.css`: 色、寸法、時間。
- `base.css`: reset、共通文字、共通ボタン、共通画面骨格。
- 各画面CSS: その画面でのみ使うクラス。
- `responsive.css`: 画面横断のviewport調整とreduced motion。

## 11. Visual Regression

### Playwright Helper

`tests/e2e/helpers/captureGameScreen.ts`を追加し、viewport、画面状態、保存名を共通化する。

対象:

- 1440×900
- 390×844
- 960×540

画面:

- タイトル
- 未接続準備
- カウントダウン
- プレイ
- 結果

Canvas検証:

- bitmap幅と高さが0より大きい。
- 複数地点のpixelが単一色ではない。
- ゲーム領域の中央に壁またはアバター由来の非背景色がある。

レイアウト検証:

- 主要要素のbounding boxがviewport内。
- HUDと終了操作のboxが交差しない。
- ハート表示にellipsisがない。

スクリーンショットはテスト成果物として保持し、Git管理へ含めるかは実装タスクで決定する。

## 12. Real Camera Verification

READMEへ実機確認表を追加する。

記録項目:

- ブラウザ、OS、カメラ解像度
- 権限許可
- モデル初期化
- 人物ガイドとの重なり
- 近い、適正、遠い
- 自動開始進捗
- 実姿勢アバター比率
- 未検出
- タイトル復帰後のカメラ停止

自動環境で実カメラを確認できない場合、仕様メタデータを実装済みにしても、
実機確認項目は未確認として残す。

## Error Handling

- ResizeObserverがない場合はwindow resizeで再計算する。
- 無効なCanvasサイズでは描画せず、次回resizeを待つ。
- アバタープレビューCanvas取得失敗時は選択名を残す。
- reduced motionのmatchMedia取得に失敗した場合は通常演出を使う。
- カメラガイドは姿勢未検出でも描画を継続し、未検出状態を表示する。

## Testing Strategy

### Unit Tests

- `calculateGameViewport`: 横長、縦長、正方形、無効値。
- 座標変換: 四隅、中央、ゲーム領域外余白。
- ポーズキーフレーム: ジャンプ予備動作、座り、傾き、大股。
- 壁通過: 接近、判定、通過後の矩形とalpha。
- ランク計算: S、A、B、C境界。
- 外れ点: 判定結果を変えず代表点詳細を返す。

### Integration and E2E

- 既存96件以上のユニットテストを維持する。
- 既存モック姿勢E2Eを維持する。
- 複数viewportでCanvasと主要UIを検証する。
- reduced motionでタイトルと結果を確認する。

### Manual

- 実カメラ検証表を実行する。
- 低性能端末でタイトル描画負荷を確認する。
- 展示距離からHUD、壁名、結果ランクを確認する。

## Requirement Traceability

| Requirement | Design Section |
|---|---|
| 1 | Aspect-Preserving Game Space |
| 2 | Preview Timeline |
| 3 | Staged Avatar Motion |
| 4 | Mobile HUD |
| 5 | Pre-Camera Avatar Preview |
| 6 | Camera Alignment Overlay |
| 7 | Result Score and Rank |
| 8 | Wall Name Cue |
| 9 | Collision Feedback Detail |
| 10 | CSS Structure |
| 11 | Visual Regression |
| 12 | Real Camera Verification |
| 13 | Architecture Boundaries, Testing Strategy |

## Risks

### 表示変換と判定表示のずれ

対策: 壁、アバター、判定点に同じ`GameViewport`変換を必須とし、四隅と中央をテストする。

### タイトル描画負荷

対策: Canvasを1枚に限定し、非表示タブとreduced motionで更新を止める。

### CSS import順による回帰

対策: tokens、base、画面別、responsiveの順を固定し、重複セレクタを検索する。

### 判定結果型の変更による回帰

対策: `outsidePoints`は失敗結果の表示用追加情報とし、既存の成功・失敗条件をテストで固定する。
