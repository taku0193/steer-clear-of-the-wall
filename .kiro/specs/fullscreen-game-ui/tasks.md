# Implementation Plan

## 方針

- Canvasサイズ計算、描画解像度、コンポーネント構造、CSS、検証の順で進める。
- プレイ画面の表示層だけを変更し、ゲーム状態、姿勢検出、壁、判定、スコアは変更しない。
- ブラウザのFullscreen APIは導入せず、通常のビューポート内で全画面表示する。
- 各タスクは個別に型チェックまたはテスト可能な小さい変更単位とする。

## Tasks

- [x] 1. Canvasビューポート計算を純粋関数として追加する
  - 作業内容: CSS表示サイズと端末ピクセル比から、Canvasの論理サイズとbitmapサイズを計算する。
  - 変更するファイル: `src/rendering/canvasViewport.ts`, `src/rendering/canvasViewport.test.ts`
  - 依存関係: なし
  - 完了条件: 有効な幅、高さ、端末ピクセル比から`CanvasViewport`を返し、ピクセル比を1から2へ制限し、0以下のサイズでは`null`を返す。
  - 確認方法: 通常DPI、高DPI、上限超過、無効サイズのユニットテストが成功する。
  - _Requirements: 1.4, 2.1, 2.2, 6.3_
  - _Boundary: Rendering Utilities_

- [x] 2. Canvas描画を論理サイズと高DPI表示へ対応させる
  - 作業内容: `canvasRenderer`が`CanvasViewport`を受け取り、bitmapサイズ、context transform、論理描画領域を設定して描画するように変更する。
  - 変更するファイル: `src/rendering/canvasRenderer.ts`
  - 依存関係: 1
  - 完了条件: CSSピクセル単位の論理座標で壁、安全領域、アバター、未検出表示を描画し、高DPIでも正規化座標関係を維持する。
  - 確認方法: 型チェックとビルドが成功し、既存のゲームロジックに変更がないことを差分で確認する。
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 3.4_
  - _Boundary: Canvas Renderer_

- [x] 3. GameScreenをフルビューポート用のオーバーレイ構造へ変更する
  - 作業内容: `ResizeObserver`でプレイ領域を監視し、Canvasへ`CanvasViewport`を渡す。HUD、姿勢状態、判定フィードバックを独立したオーバーレイ要素へ再構成する。
  - 変更するファイル: `src/components/GameScreen.tsx`
  - 依存関係: 1, 2
  - 完了条件: 固定Canvasサイズを使わず、初回表示とリサイズ時に有効な描画サイズを更新し、アンマウント時に監視を解除する。
  - 完了条件: プレイ中の長い説明、壁進行率、姿勢座標を通常表示から外し、入力モードと検出状態だけを簡潔に残す。
  - 確認方法: 型チェックとビルドが成功し、HUD、姿勢状態、判定フィードバックのアクセシビリティ属性が維持されていることを確認する。
  - _Requirements: 1.4, 3.1, 3.2, 3.4, 4.1, 4.3, 5.1, 5.2, 5.3_
  - _Boundary: GameScreen_

- [x] 4. プレイ画面とHUDをフルビューポート表示にする
  - 作業内容: プレイ中のアプリシェル、GameScreen、Canvasをビューポート全面へ配置し、HUD、姿勢状態、判定フィードバックをCanvas上へ重ねる。
  - 変更するファイル: `src/style.css`
  - 依存関係: 3
  - 完了条件: プレイ画面で固定最大幅、外側余白、固定aspect-ratio、枠線を使用せず、不要な縦横スクロールが発生しない。
  - 完了条件: HUDは3項目をコンパクトに表示し、背景から読めるコントラストを持ち、狭い画面でも主要情報を画面内に維持する。
  - 確認方法: デスクトップ幅、640px以下、低い画面高でレイアウトを確認し、タイトル、準備、結果、エラー画面の既存配置が維持されていることを確認する。
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 4.1, 4.2, 4.4, 4.5, 6.1, 6.2, 6.4_
  - _Boundary: Application Styling_

- [ ] 5. 自動検証と実機ブラウザ確認を行う
  - 作業内容: 型チェック、ビルド、全ユニットテストを実行し、フルビューポート表示と既存ゲーム動作を手動確認する。
  - 変更するファイル: なし
  - 依存関係: 4
  - 完了条件: `npm run typecheck`、`npm run build`、`npm test`が成功する。
  - 完了条件: モック姿勢と実カメラの両方でCanvas、HUD、判定、結果、再試行が動作し、リサイズ時にも不要なスクロールや操作不能な重なりがない。
  - 確認方法: 1920×1080程度、640px以下、高DPI環境で設計書の手動確認項目を実施し、未実施項目がある場合は明記する。
  - _Requirements: 1.1-1.4, 2.1-2.4, 3.1-3.4, 4.1-4.5, 5.1-5.3, 6.1-6.4, 7.1-7.4_
  - _Boundary: Validation_

- [x] 6. ゲーム領域を広く見せ、アバター縮尺を調整する
  - 作業内容: 壁の初期表示を拡大してHUDを小型化し、カメラ姿勢を身体中心基準で縮小する。近距離では最大サイズを制限する。
  - 変更するファイル: `src/game/state.ts`, `src/game/state.test.ts`, `src/game/mockPose.ts`, `src/App.tsx`, `src/rendering/canvasRenderer.ts`, `src/style.css`
  - 依存関係: 4
  - 完了条件: アバターと判定領域に同じ縮尺変換が適用され、身体中心を維持し、近距離でも最大幅と最大高さを超えない。
  - 完了条件: 壁が出現直後から従来より大きく表示され、HUDの占有面積が減る。
  - 確認方法: 姿勢縮尺のユニットテスト、型チェック、ビルド、全ユニットテストを実行する。
  - _Requirements: 8.1-8.5_
  - _Boundary: Game Pose Normalization, Canvas Renderer, Application Styling_

- [x] 7. 壁進行表示を描画フレーム単位で補間する
  - 作業内容: 壁の論理進行率を基準に、`requestAnimationFrame`でCanvasへ渡す表示進行率を連続更新する。
  - 変更するファイル: `src/game/gameLoop.ts`, `src/App.tsx`, `src/rendering/wallMotion.ts`, `src/rendering/wallMotion.test.ts`, `src/components/GameScreen.tsx`
  - 依存関係: 3
  - 完了条件: 壁が設定された周期で連続的に拡大し、新しい壁では開始位置へ戻る。
  - 完了条件: 論理進行率、判定タイミング、スコア、ミス数は既存規則を維持する。
  - 確認方法: 補間関数のユニットテスト、型チェック、ビルド、全ユニットテストを実行する。
  - _Requirements: 9.1-9.4_
  - _Boundary: Rendering Motion, GameScreen_

- [x] 8. 本人選択式アバターを追加する
  - 作業内容: 準備画面へ男性風、女性風、ニュートラルの選択肢を追加し、選択した配色、服装、髪型をCanvasアバターへ反映する。
  - 変更するファイル: `src/game/types.ts`, `src/game/state.ts`, `src/components/AvatarStyleSelector.tsx`, `src/App.tsx`, `src/components/GameScreen.tsx`, `src/rendering/canvasRenderer.ts`, `src/style.css`
  - 依存関係: 7
  - 完了条件: 初期値はニュートラルで、本人の選択だけを表示へ反映し、カメラ画像から属性を推定しない。
  - 確認方法: 型チェック、ビルド、初期状態テストを実行する。
  - _Requirements: 10.1-10.5_
  - _Boundary: Game State, Screen Components, Canvas Renderer_

- [x] 9. 壁を高速化して判定を緩和する
  - 作業内容: 壁進行を残り時間時計から分離して2.4秒周期にし、安全領域の各辺へ`0.05`の許容幅を追加する。
  - 変更するファイル: `src/game/gameLoop.ts`, `src/App.tsx`, `src/rendering/wallMotion.ts`, `src/game/collision.ts`, `src/game/collision.test.ts`
  - 依存関係: 7
  - 完了条件: 残り時間は実時間の秒単位を維持し、壁は2.4秒で判定位置へ到達する。
  - 完了条件: 許容幅内は成功、許容幅外は失敗、未検出は判定不能になる。
  - 確認方法: 壁進行、補間、衝突判定のユニットテスト、型チェック、ビルドを実行する。
  - _Requirements: 9.5, 11.1-11.4_
  - _Boundary: Game Loop, Rendering Motion, Collision Logic_

## Requirements Coverage

| Requirement | Covered by Tasks |
|-------------|------------------|
| 1.1 | 4, 5 |
| 1.2 | 4, 5 |
| 1.3 | 4, 5 |
| 1.4 | 1, 3, 5 |
| 2.1 | 1, 2, 5 |
| 2.2 | 1, 2, 5 |
| 2.3 | 2, 5 |
| 2.4 | 2, 5 |
| 3.1 | 3, 4, 5 |
| 3.2 | 3, 5 |
| 3.3 | 2, 5 |
| 3.4 | 2, 3, 5 |
| 4.1 | 3, 4, 5 |
| 4.2 | 4, 5 |
| 4.3 | 3, 5 |
| 4.4 | 4, 5 |
| 4.5 | 4, 5 |
| 5.1 | 3, 5 |
| 5.2 | 3, 5 |
| 5.3 | 3, 5 |
| 6.1 | 4, 5 |
| 6.2 | 4, 5 |
| 6.3 | 1, 5 |
| 6.4 | 4, 5 |
| 7.1 | 5 |
| 7.2 | 5 |
| 7.3 | 5 |
| 7.4 | 5 |
| 8.1 | 6 |
| 8.2 | 6 |
| 8.3 | 6 |
| 8.4 | 6 |
| 8.5 | 6 |
| 9.1 | 7 |
| 9.2 | 7 |
| 9.3 | 7 |
| 9.4 | 7 |
| 9.5 | 9 |
| 10.1 | 8 |
| 10.2 | 8 |
| 10.3 | 8 |
| 10.4 | 8 |
| 10.5 | 8 |
| 11.1 | 9 |
| 11.2 | 9 |
| 11.3 | 9 |
| 11.4 | 9 |
