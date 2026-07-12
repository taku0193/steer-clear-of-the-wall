# Requirements Document

## Introduction

`arcade-sports-ui-refresh`は、`steer-clear-of-the-wall`の全画面を
「近未来アーケード × 体感スポーツ」の方向へ刷新するUI改善です。

迫る壁、安全領域、アバターを主役にしながら、展示会場で離れた位置から見ても
ゲームの状態と次の操作が分かる表示を目指します。装飾だけを増やすのではなく、
色、情報階層、動き、画面遷移をゲーム体験として一貫させます。

## 目的

- 初めて見る人にも、体を動かして壁を避けるゲームだと伝わるようにする。
- タイトルから結果まで、同じゲーム世界として感じられる見た目に統一する。
- プレイ中は壁、安全領域、アバター、判定情報へ集中できるようにする。
- 展示向けの視認性、操作性、連続利用のしやすさを維持する。

## 対象範囲

### 今回含める範囲

- タイトル、カメラ準備、カウントダウン、プレイ、結果、エラー画面の再設計
- 色、タイポグラフィ、余白、ボタン、HUD、状態表示の共通ルール
- Canvas背景、壁、安全領域、アバター周辺の表示調整
- 成功、失敗、速度上昇、カウントダウン、自動復帰の視覚演出
- デスクトップ、タブレット、モバイル、低い画面へのレスポンシブ対応
- 動きを抑えるOS設定とキーボード操作への対応

### 今回含めない範囲

- 壁パターン、衝突判定、スコア計算、速度計算のルール変更
- 姿勢検出モデル、カメラ取得、キャリブレーション判定の変更
- 効果音、BGM、ランキング、ユーザー登録、バックエンドの追加
- 3D化、動画素材、大容量の外部アセット導入
- アバター外見の種類追加

## Requirements

### Requirement 1: 一貫したゲームビジュアル

**Objective:** As a プレイヤー, I want すべての画面が同じゲーム世界に見える, so that 迷わず体験へ入り込める

#### Acceptance Criteria

1. The Arcade Sports UI shall 全画面で共通の背景色、文字色、アクセント色、境界線ルールを使用する
2. The Arcade Sports UI shall 安全、成功、危険、失敗、通常情報を異なる色の役割として定義する
3. The Arcade Sports UI shall 単一色だけに依存せず、シアンまたはライム、コーラル、イエロー、白、チャコールを役割に応じて使い分ける
4. The Arcade Sports UI shall 壁、安全領域、アバターを周辺UIより強い第一視覚要素として表示する
5. The Arcade Sports UI shall パネルの多重配置や過剰な装飾によって主要操作を埋もれさせない

### Requirement 2: タイトル画面

**Objective:** As a 初回プレイヤー, I want 最初の画面で遊び方と開始操作が分かる, so that 説明を読まなくてもゲームを始められる

#### Acceptance Criteria

1. When タイトル画面を表示する, the Arcade Sports UI shall ゲーム名を第一ビューポートの主要要素として表示する
2. The Arcade Sports UI shall 壁と安全領域が迫る体験を、既存Canvas表現を利用した短いデモまたは静的ゲーム場面で示す
3. The Arcade Sports UI shall 「ゲーム開始」を最も目立つ単一の主操作として表示する
4. The Arcade Sports UI shall ゲーム開始に不要な長文や複数の同等な操作を表示しない
5. The Arcade Sports UI shall モバイルとデスクトップの両方で次の画面要素が一部見える高さに収める

### Requirement 3: カメラ準備画面

**Objective:** As a プレイヤー, I want 自分の準備状態をすぐ判断できる, so that 正しい位置へ短時間で移動できる

#### Acceptance Criteria

1. While カメラ準備中である, the Arcade Sports UI shall カメラ映像を位置合わせの主表示として維持する
2. The Arcade Sports UI shall 全身、中央、距離、安定の状態を色、記号、短い文言で区別する
3. When 位置合わせ条件を満たす, the Arcade Sports UI shall 開始可能状態を画面全体で認識できる強さで表示する
4. The Arcade Sports UI shall アバター選択、カメラ開始、モック開始、タイトル復帰の優先順位を視覚的に区別する
5. The Arcade Sports UI shall 状態パネルがカメラ映像の人物全身を恒常的に覆わないように配置する

### Requirement 4: カウントダウンと開始演出

**Objective:** As a プレイヤー, I want ゲーム開始の瞬間を正確に把握できる, so that 準備した姿勢から安全に動き始められる

#### Acceptance Criteria

1. When カウントダウン中である, the Arcade Sports UI shall 現在の数字を画面中央へ大きく表示する
2. When 数字が切り替わる, the Arcade Sports UI shall 拡大、色、または短い動きで切り替わりを示す
3. The Arcade Sports UI shall カウントダウン中にプレイ開始後の壁または空間を予告できる
4. The Arcade Sports UI shall カウントダウン演出によって開始時刻を遅延させたりゲーム状態を変更したりしない

### Requirement 5: プレイHUD

**Objective:** As a プレイヤー, I want 体を動かしながら重要情報を瞬時に読める, so that 壁から視線を大きく外さずプレイできる

#### Acceptance Criteria

1. While プレイ中である, the Arcade Sports UI shall ハート5個、スコア、ミス、速度レベルを常に省略せず表示する
2. The Arcade Sports UI shall HUD項目の寸法を固定し、数値変化による位置ずれを発生させない
3. The Arcade Sports UI shall HUDを画面端へ配置し、壁の安全領域とアバターを覆う面積を抑える
4. If 姿勢を検出できない, the Arcade Sports UI shall 通常HUDと区別できる警告を表示する
5. The Arcade Sports UI shall 終了操作を誤操作しにくい位置と視覚優先度で表示する

### Requirement 6: 判定と進行のフィードバック

**Objective:** As a プレイヤー, I want 成功や失敗がすぐ分かる, so that 次の壁へ向けて動きを修正できる

#### Acceptance Criteria

1. When 回避に成功する, the Arcade Sports UI shall 安全領域の発光、成功色、スコア加算のうち複数で結果を短く示す
2. When 回避に失敗する, the Arcade Sports UI shall 危険色、短い画面反応、ハート減少で結果を示す
3. When 速度レベルが上がる, the Arcade Sports UI shall 通常成功と区別できる表示を行う
4. The Arcade Sports UI shall 判定演出を短時間で終了し、次の壁やアバターを長く隠さない
5. The Arcade Sports UI shall 色だけでなく文言または形状変化でも結果を区別できる

### Requirement 7: 結果・エラー・自動復帰

**Objective:** As a 展示利用者, I want プレイ後の結果と次の操作が明確に分かる, so that 続けるか次の人へ交代できる

#### Acceptance Criteria

1. When 結果画面を表示する, the Arcade Sports UI shall 最終スコアを最も大きく表示する
2. The Arcade Sports UI shall クリア枚数、最高速度、ミス数を比較しやすい配置で表示する
3. The Arcade Sports UI shall 再プレイとタイトル復帰を異なる優先度で表示する
4. While 自動復帰を待っている, the Arcade Sports UI shall 残り秒数と滑らかに減少する進捗を表示する
5. When エラー画面を表示する, the Arcade Sports UI shall 問題、対処、再試行、タイトル復帰を簡潔に提示する

### Requirement 8: レスポンシブと展示視認性

**Objective:** As a 展示運営者, I want 異なる画面でも情報が崩れない, so that 会場設備に合わせて運用できる

#### Acceptance Criteria

1. The Arcade Sports UI shall 1920×1080、一般的なノートPC、幅390px程度のモバイルで主要操作を画面内に保つ
2. When 画面幅または高さが不足する, the Arcade Sports UI shall 情報を縮小、再配置、改行し、重なりを発生させない
3. The Arcade Sports UI shall 主要見出し、ボタン、HUDを離れた位置から判別できるコントラストで表示する
4. The Arcade Sports UI shall 動的な文字列がボタン、HUD、パネルからはみ出さないようにする
5. The Arcade Sports UI shall 固定形式のHUDやカウントダウンに安定した寸法制約を設ける

### Requirement 9: モーションとアクセシビリティ

**Objective:** As a プレイヤー, I want 分かりやすく負担の少ない演出で遊べる, so that 動きの好みや操作方法にかかわらず利用できる

#### Acceptance Criteria

1. The Arcade Sports UI shall 状態変化を伝える目的のあるモーションだけを使用する
2. If `prefers-reduced-motion: reduce`が有効である, the Arcade Sports UI shall 拡大、点滅、移動演出を停止または短縮する
3. The Arcade Sports UI shall フォーカス状態を背景から識別できる輪郭で表示する
4. The Arcade Sports UI shall 主操作をキーボードで実行できる状態を維持する
5. The Arcade Sports UI shall 重要情報に十分な文字色と背景色のコントラストを持たせる

### Requirement 10: 既存動作と品質の維持

**Objective:** As a 開発者, I want UI刷新でゲーム規則を壊さない, so that 表示改善を安全に導入できる

#### Acceptance Criteria

1. The Arcade Sports UI shall 既存の画面遷移、カメラ停止、リトライ、自動開始、自動復帰を維持する
2. The Arcade Sports UI shall 壁パターン、衝突判定、スコア、ハート、速度の計算規則を変更しない
3. The Arcade Sports UI shall 実カメラとモック姿勢の両方で利用できる
4. The Arcade Sports UI shall 実装後に型チェック、ビルド、ユニットテスト、モック姿勢E2Eを成功させる
5. The Arcade Sports UI shall デスクトップとモバイルのスクリーンショットで重なり、空白画面、Canvas欠落がないことを確認する

## 手動確認観点

- タイトル画面だけでゲーム名、壁、安全領域、開始操作が理解できる。
- カメラ準備中に人物と状態表示が重ならず、次に直す項目が分かる。
- カウントダウンの切り替わりと開始時刻が一致する。
- プレイ中にハート5個と主要数値が省略されない。
- 成功、失敗、速度上昇を色だけに依存せず区別できる。
- 結果画面で最終スコアと次の操作が最初に目へ入る。
- 自動復帰バーが残り時間に合わせて滑らかに減る。
- 幅390px程度、1920×1080程度、低い画面で操作不能な重なりがない。
- 動きを抑える設定で不要なアニメーションが停止する。
