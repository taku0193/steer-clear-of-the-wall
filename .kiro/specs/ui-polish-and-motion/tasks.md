# Implementation Plan

## 方針

- Canvas座標変換を最初に実装し、表示変更の土台を固定する。
- 壁通過とアバター動作は表示専用とし、実ゲームの判定時刻を変更しない。
- カメラUIは既存`CalibrationResult`を表示へ利用し、新しい開始判定を作らない。
- ゲームロジックへ追加するランクと判定詳細は純粋関数でテストする。
- CSS分割は画面実装後に行い、同時にレスポンシブ回帰を確認する。
- 実カメラ確認を自動検証と分け、未実施の場合は明記する。

## Tasks

- [x] 1. アスペクト比を維持するゲーム領域を追加する
  - 作業内容: 基準アスペクト比からCanvas内のゲーム矩形とscaleを計算する`calculateGameViewport`を追加する。
  - 作業内容: 正規化点、矩形、長さをCanvas座標へ変換する純粋関数を追加する。
  - 変更するファイル: `src/rendering/gameViewport.ts`, `src/rendering/gameViewport.test.ts`
  - 依存関係: なし
  - 完了条件: 横長、縦長、正方形、無効サイズで期待するゲーム矩形を返す。
  - 完了条件: 円や身体部位の太さへ共通scaleを使用できる。
  - 確認方法: ゲーム矩形、四隅、中央、無効値のユニットテスト。
  - _Requirements: 1.1-1.5_
  - _Boundary: Rendering Geometry_

- [x] 2. Canvas描画全体へゲーム領域変換を適用する
  - 作業内容: 背景、壁、安全領域、アバター、プレイヤー領域、未検出表示を同じ`GameViewport`で描画する。
  - 作業内容: ゲーム領域外を低コントラストの競技空間として描画する。
  - 変更するファイル: `src/rendering/canvasRenderer.ts`, `src/rendering/wallGeometry.ts`、関連テスト
  - 依存関係: 1
  - 完了条件: モバイルで人物と壁穴が横方向に不均等変形しない。
  - 完了条件: 正規化判定座標と画面上の壁・アバター位置関係を維持する。
  - 確認方法: 型チェック、壁ジオメトリテスト、390×844と1440×900のスクリーンショット比較。
  - _Requirements: 1.1-1.5, 13.2-13.4_
  - _Boundary: Canvas Renderer_

- [x] 3. 壁の通過後モーションを実装する
  - 作業内容: 表示専用`PreviewMotion`を追加し、判定位置後に壁を追加拡大・透明化する。
  - 作業内容: 安全領域、壁本体、輪郭へ同じ通過変換を適用する。
  - 作業内容: タイトルの1壁を接近、判定、通過、成功、復帰の5.2秒タイムラインへ変更する。
  - 変更するファイル: `src/rendering/canvasRenderer.ts`, `src/rendering/wallGeometry.ts`, `src/components/TitleGamePreview.tsx`、関連テスト
  - 依存関係: 2
  - 完了条件: 壁が判定位置で即時リセットされず、アバターの手前へ抜けてから次の壁へ変わる。
  - 完了条件: 実ゲームの`wallProgress`と判定タイミングを変更しない。
  - 確認方法: 通過矩形、alpha、タイムラインのユニットテストとタイトル動画確認。
  - _Requirements: 2.1-2.5, 13.2_
  - _Boundary: Preview Wall Motion_

- [x] 4. アバター動作を複数キーフレーム化する
  - 作業内容: 直立、予備動作、移行、完成、復帰のポーズキーフレーム型と補間関数を追加する。
  - 作業内容: 立位移動、しゃがみ、腕上げ、ジャンプ、座り、傾き、大股へ個別の関節経路を定義する。
  - 作業内容: 壁切り替え時に前の復帰姿勢から次の直立姿勢へ連続させる。
  - 変更するファイル: `src/rendering/wallPreviewPose.ts`, `src/rendering/wallPreviewPose.test.ts`, `src/components/TitleGamePreview.tsx`
  - 依存関係: 3
  - 完了条件: ジャンプに予備しゃがみ・上昇・着地があり、座り・傾き・大股が単純直線移動にならない。
  - 完了条件: reduced motionでは完成姿勢を静止表示する。
  - 確認方法: キーフレーム境界と中間関節位置のユニットテスト、タイトル動画確認。
  - _Requirements: 3.1-3.5, 2.2-2.4_
  - _Boundary: Preview Avatar Motion_

- [x] 5. モバイルHUDを2段構成へ変更する
  - 作業内容: ハートとスコアを上段、ミスと速度を下段へ配置するモバイルレイアウトを実装する。
  - 作業内容: 姿勢警告、壁名、終了操作、判定表示の配置領域を分離する。
  - 変更するファイル: `src/components/GameStatusHud.tsx`, `src/components/GameScreen.tsx`, ゲーム画面CSS
  - 依存関係: 2
  - 完了条件: 幅390px以下でハート5個と全数値を省略せず表示する。
  - 完了条件: HUD、警告、壁名、終了操作が重ならない。
  - 確認方法: 390×844、360px幅、960×540でbounding boxとスクリーンショット確認。
  - _Requirements: 4.1-4.5_
  - _Boundary: Game HUD_

- [x] 6. アバター選択へ実描画プレビューを追加する
  - 作業内容: 既存アバター描画を小Canvasへ再利用する`AvatarStylePreview`を追加する。
  - 作業内容: 男性風、女性風、ニュートラルの色、服装、髪型が選択前に分かる表示へ変更する。
  - 作業内容: 未接続準備画面の余白と操作階層を再構成する。
  - 変更するファイル: `src/components/AvatarStylePreview.tsx`, `src/components/AvatarStyleSelector.tsx`, `src/App.tsx`, 準備画面CSS
  - 依存関係: 2
  - 完了条件: 選択肢が安定寸法で描画され、カメラ開始が単一の主操作として認識できる。
  - 完了条件: Canvas取得失敗時も選択名と操作を利用できる。
  - 確認方法: 3種類のCanvasピクセル、選択状態、モバイル表示の確認。
  - _Requirements: 5.1-5.5, 13.3-13.5_
  - _Boundary: Pre-Camera Preparation_

- [x] 7. カメラ映像へ位置合わせガイドを追加する
  - 作業内容: 人物ガイド、中央線、足元線、距離状態を表示する`CameraAlignmentOverlay`を追加する。
  - 作業内容: 既存`CalibrationResult`から近い、適正、遠い、未検出を表示する変換関数を追加する。
  - 作業内容: 自動開始待機の表示用進捗を既存遅延に同期させる。
  - 変更するファイル: `src/components/CameraAlignmentOverlay.tsx`, `src/components/CalibrationPanel.tsx`, `src/App.tsx`, 準備画面CSS、関連テスト
  - 依存関係: 2
  - 完了条件: ガイドと状態表示が人物中心を過度に覆わず、条件が外れると進捗が0へ戻る。
  - 完了条件: 新しい開始判定を追加しない。
  - 確認方法: 状態変換テスト、表示状態別スクリーンショット、実カメラ確認。
  - _Requirements: 6.1-6.5, 12.1-12.4, 13.1-13.3_
  - _Boundary: Camera Alignment Presentation_

- [x] 8. 結果スコアのカウントアップと評価ランクを追加する
  - 作業内容: 900msで最終値へ到達する`AnimatedScore`を追加する。
  - 作業内容: クリア枚数、速度、ミスからS〜Cを返す`calculatePerformanceRank`を純粋関数で追加する。
  - 作業内容: 結果画面へ「今回の評価」としてランクを表示する。
  - 変更するファイル: `src/components/AnimatedScore.tsx`, `src/components/ResultScreen.tsx`, `src/game/performanceRank.ts`, `src/game/performanceRank.test.ts`, 結果画面CSS
  - 依存関係: なし
  - 完了条件: reduced motionでは最終スコアを即時表示し、評価を自己ベストと表現しない。
  - 完了条件: S、A、B、Cの境界をテストで固定する。
  - 確認方法: ランクテスト、0点・高得点・reduced motionの結果画面確認。
  - _Requirements: 7.1-7.5_
  - _Boundary: Result Presentation and Pure Ranking Logic_

- [x] 9. 新しい壁のパターン名を短時間表示する
  - 作業内容: 壁ID変化で日本語名を1000ms表示する`WallPatternCue`を追加する。
  - 作業内容: HUD、姿勢警告、安全領域と重ならない位置へ配置する。
  - 変更するファイル: `src/components/WallPatternCue.tsx`, `src/components/GameScreen.tsx`, ゲーム画面CSS
  - 依存関係: 5
  - 完了条件: 壁名が次の判定前に消え、IDではなく表示名を使う。
  - 完了条件: reduced motionでは移動せずopacityだけで表示する。
  - 確認方法: 壁切り替え時刻、連続壁、モバイル配置の確認。
  - _Requirements: 8.1-8.5_
  - _Boundary: Wall Pattern Presentation_

- [x] 10. 判定結果へ外れた代表点を追加する
  - 作業内容: 複合形状判定で安全領域外にある代表点を収集し、失敗結果へ表示用詳細として含める。
  - 作業内容: 成功・失敗の決定条件を変えず、既存判定テストを維持する。
  - 変更するファイル: `src/game/types.ts`, `src/game/safeShape.ts`, `src/game/collision.ts`, 関連テスト
  - 依存関係: なし
  - 完了条件: 失敗結果に代表点IDと正規化座標があり、成功結果には不要な詳細を持たせない。
  - 完了条件: 既存入力に対する判定種別が変更されない。
  - 確認方法: 外れ点1個、複数、矩形フォールバック、成功のユニットテスト。
  - _Requirements: 9.2, 9.4, 13.2, 13.4_
  - _Boundary: Collision Feedback Data_

- [x] 11. 成功通過と衝突地点のCanvas演出を追加する
  - 作業内容: 成功時に安全領域輪郭が前方へ抜ける短い反応を描画する。
  - 作業内容: 失敗時に外れた代表点を×記号と円で描画する。
  - 作業内容: 700ms以内で演出を解除し、reduced motionでは静的記号だけにする。
  - 変更するファイル: `src/rendering/canvasRenderer.ts`, `src/components/GameScreen.tsx`, 関連描画テスト
  - 依存関係: 2, 10
  - 完了条件: 判定を再計算せず`JudgmentResult`の表示用詳細だけを利用する。
  - 完了条件: 成功と失敗を色、記号、輪郭で区別できる。
  - 確認方法: Canvasピクセル、演出解除時刻、判定回帰テスト。
  - _Requirements: 9.1-9.5_
  - _Boundary: Collision Feedback Rendering_

- [x] 12. CSSを責務別ファイルへ分割する
  - 作業内容: tokens、base、title、preparation、countdown、game、result、responsiveへスタイルを移動する。
  - 作業内容: `src/style.css`をimport入口へ縮小し、tokens→base→画面別→responsiveの順を固定する。
  - 作業内容: 重複セレクタと競合するmedia queryを整理する。
  - 変更するファイル: `src/style.css`, `src/styles/*.css`
  - 依存関係: 5-9, 11
  - 完了条件: 画面ごとの責務が分離され、既存CSS読み込み入口を維持する。
  - 完了条件: 分割前後で主要画面の表示が維持される。
  - 確認方法: CSSセレクタ検索、ビルド、複数viewportスクリーンショット比較。
  - _Requirements: 10.1-10.5_
  - _Boundary: Styling Architecture_

- [x] 13. 複数viewportのビジュアル回帰検証を追加する
  - 作業内容: 画面状態とviewportを共通化するPlaywright helperを追加する。
  - 作業内容: タイトル、未接続準備、カウントダウン、プレイ、結果を1440×900、390×844、960×540で撮影する。
  - 作業内容: Canvas非単色、主要要素のviewport内配置、HUDと終了操作の非交差を検証する。
  - 変更するファイル: `tests/e2e/helpers/*`, `tests/e2e/ui-visual.spec.ts`, `playwright.config.ts`、必要な成果物設定
  - 依存関係: 12
  - 完了条件: Canvas空白、要素重なり、ハート省略を再現可能に検出できる。
  - 完了条件: ビジュアル確認手順がREADMEに記録される。
  - 確認方法: `npm run test:e2e`とスクリーンショット目視確認。
  - _Requirements: 11.1-11.5, 13.4_
  - _Boundary: Browser Visual Validation_

- [ ] 14. 実カメラ確認表と最終品質確認を行う
  - 作業内容: ブラウザ、OS、解像度、権限、初期化、ガイド、距離、自動開始、実アバター、未検出、停止を記録する表をREADMEへ追加する。
  - 作業内容: 型チェック、全ユニットテスト、ビルド、E2Eを実行する。
  - 作業内容: 実機で実施できなかった項目を未確認として残す。
  - 変更するファイル: `README.md`, 仕様メタデータ
  - 依存関係: 13
  - 完了条件: 全自動検証が成功し、実カメラ項目の実施状態が明確である。
  - 完了条件: 未実施の実カメラ項目を完了済みと記載しない。
  - 確認方法: 全コマンド結果と実機確認表を報告する。
  - 確認結果: 型チェック、104件のユニットテスト、ビルド、5件のE2E、1440×900・390×844・960×540のスクリーンショットを確認した。実カメラ項目は実機未確認のためREADMEの表へ未確認として残している。
  - _Requirements: 12.1-12.5, 13.1-13.5_
  - _Boundary: Documentation and Final Validation_

## Requirements Coverage

| Requirement | Covered by Tasks |
|---|---|
| 1 | 1, 2 |
| 2 | 3, 4 |
| 3 | 4 |
| 4 | 5 |
| 5 | 6 |
| 6 | 7 |
| 7 | 8 |
| 8 | 9 |
| 9 | 10, 11 |
| 10 | 12 |
| 11 | 13 |
| 12 | 7, 14 |
| 13 | 2-14 |
