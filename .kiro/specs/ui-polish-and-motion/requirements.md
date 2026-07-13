# Requirements Document

## Introduction

`ui-polish-and-motion`は、アーケードUI刷新後のゲームを完成品質へ近づけるための
表示、動作、レスポンシブ、保守性、検証の追加改善です。

特に縦長画面でのCanvas変形、壁通過の見え方、アバター動作の自然さを優先し、
準備画面、HUD、結果、判定演出まで一貫して改善します。

## 対象範囲

### 今回含める範囲

- Canvasのアスペクト比補正
- タイトルとカウントダウンの壁通過演出
- プレビューアバターの段階的な関節動作
- モバイルHUDの情報階層
- カメラ未接続・接続後の準備画面
- 結果評価とカウントアップ
- 壁パターン名の短時間表示
- 成功・失敗時のCanvas演出
- CSSの画面単位分割
- 複数viewportのビジュアル回帰確認
- 実カメラ確認項目の整備

### 今回含めない範囲

- スコアの永続保存、ユーザー別ベストスコア
- 効果音、BGM、音量設定
- 壁パターン、衝突判定、スコア計算、速度計算の規則変更
- 姿勢検出モデルやMediaPipe設定の変更
- バックエンド、ランキング、ユーザー登録

## Requirements

### Requirement 1: アスペクト比を維持するゲーム座標

**Objective:** As a プレイヤー, I want 画面の縦横比が変わっても壁とアバターが自然な比率で見える, so that モバイルでも姿勢を正しく理解できる

#### Acceptance Criteria

1. The UI Polish shall Canvas内にアスペクト比を維持するゲーム描画領域を定義する
2. When 横長、縦長、正方形に近い画面で描画する, the UI Polish shall アバターの頭、胴体、腕、脚を不均等に引き伸ばさない
3. The UI Polish shall 壁、安全領域、アバター、判定領域へ同じ座標変換を適用する
4. The UI Polish shall ゲーム描画領域外の余白を競技空間の背景として自然に処理する
5. The UI Polish shall 座標変換を純粋関数としてテスト可能にする

### Requirement 2: 壁が通過するプレビュー演出

**Objective:** As a 初回プレイヤー, I want 壁を避けて通過する一連の動きを見られる, so that ゲーム内容を開始前に理解できる

#### Acceptance Criteria

1. While タイトルプレビュー中である, the UI Polish shall 壁を遠方、接近、判定位置、通過後の順に表示する
2. When アバターが安全領域へ収まる, the UI Polish shall 成功反応を表示してから次の壁へ切り替える
3. The UI Polish shall 21種類の壁をランダム順に巡回し、同じ壁の連続を避ける
4. While カウントダウン中である, the UI Polish shall 最初の実壁へ合わせる動作を表示する
5. The UI Polish shall プレビュー演出によって実ゲームの状態、スコア、壁順序を変更しない

### Requirement 3: 自然なアバター動作

**Objective:** As a 観察者, I want アバターが人間らしい順序で姿勢を変える, so that 壁を避けているように見える

#### Acceptance Criteria

1. The UI Polish shall 位置移動、重心移動、肘または膝の屈曲、完成姿勢を段階的に補間する
2. When ジャンプ姿勢へ移る, the UI Polish shall 膝を曲げる予備動作、上昇、着地を表現する
3. When しゃがみ、座り、傾き、大股の姿勢へ移る, the UI Polish shall 対象動作に応じた関節経路を使用する
4. The UI Polish shall 壁切り替え時に関節位置を不自然に瞬間移動させない
5. If reduced motionが有効である, the UI Polish shall 完成姿勢の静止表示へ切り替える

### Requirement 4: モバイルHUDの情報階層

**Objective:** As a モバイル利用者, I want 狭い画面でも主要情報を読み取れる, so that 壁へ集中したままプレイできる

#### Acceptance Criteria

1. The UI Polish shall ハート5個とスコアをモバイルHUDの主要情報として表示する
2. The UI Polish shall ミスと速度を主要情報より小さい副情報として表示する
3. The UI Polish shall 幅390px以下でもハート、数値、ラベルを省略しない
4. The UI Polish shall HUD、姿勢警告、壁名、終了操作を互いに重ねない
5. The UI Polish shall 数値の桁数変化でHUDの寸法を変えない

### Requirement 5: カメラ未接続の準備画面

**Objective:** As a 初回プレイヤー, I want カメラ開始前にもゲームらしい準備画面を見られる, so that 次の操作とアバター選択を理解できる

#### Acceptance Criteria

1. The UI Polish shall アバター選択肢を色、服装、髪型が分かる視覚プレビューとして表示する
2. The UI Polish shall カメラ開始を単一の主操作として強調する
3. The UI Polish shall モック開始とタイトル復帰を副操作として区別する
4. The UI Polish shall 大きな空白を減らし、準備状態と操作を一つの流れとして配置する
5. The UI Polish shall モバイルで選択肢と操作を画面内に保つ

### Requirement 6: カメラ接続後の位置合わせ

**Objective:** As a プレイヤー, I want カメラ映像上で目標位置と距離を判断できる, so that 短時間で開始条件を満たせる

#### Acceptance Criteria

1. While カメラ接続中である, the UI Polish shall 人物を収める目標ガイドを映像上へ表示する
2. The UI Polish shall 距離状態を近い、適正、遠いの段階またはゲージで表示する
3. The UI Polish shall 中央位置と全身検出の状態を映像上で確認できる
4. When 自動開始待機中である, the UI Polish shall 開始までの進捗を連続表示する
5. The UI Polish shall ガイドと状態UIが人物の主要部分を過度に覆わないようにする

### Requirement 7: 結果画面の達成感

**Objective:** As a プレイヤー, I want プレイ結果に応じた達成感を得られる, so that 再プレイへの意欲を持てる

#### Acceptance Criteria

1. When 結果画面を表示する, the UI Polish shall 最終スコアを0から実値まで短時間でカウントアップする
2. The UI Polish shall クリア枚数、速度、ミスからプレイ評価ランクを算出して表示する
3. The UI Polish shall ランクを保存済み自己ベストとして表現しない
4. The UI Polish shall reduced motionでカウントアップを省略して最終値を即時表示する
5. The UI Polish shall 自動復帰、再プレイ、タイトル復帰を維持する

### Requirement 8: 壁パターン名の表示

**Objective:** As a 初回プレイヤー, I want 次に必要な動作を短く確認できる, so that 壁の意図を理解できる

#### Acceptance Criteria

1. When 新しい壁が出現する, the UI Polish shall 壁パターン名を短時間表示する
2. The UI Polish shall 壁名を安全領域やアバターと重ならない位置へ表示する
3. The UI Polish shall 壁名を次の判定前に消し、プレイ画面を圧迫し続けない
4. The UI Polish shall 壁IDではなく日本語表示名を使用する
5. If reduced motionが有効である, the UI Polish shall 移動演出を使わず壁名を表示する

### Requirement 9: 衝突地点を示す判定演出

**Objective:** As a プレイヤー, I want 成功または失敗の理由を視覚的に理解できる, so that 次の姿勢を修正できる

#### Acceptance Criteria

1. When 成功する, the UI Polish shall 安全領域から前方へ抜ける短い光または輪郭反応を表示する
2. When 失敗する, the UI Polish shall 安全領域外へ出た代表点または近い輪郭位置を危険色で示す
3. The UI Polish shall 判定演出を700ミリ秒以内に終了する
4. The UI Polish shall 判定演出のために衝突判定結果を再計算しない
5. The UI Polish shall 色だけでなく記号または輪郭でも成功と失敗を区別する

### Requirement 10: CSS責務分割

**Objective:** As a 開発者, I want 画面ごとのスタイル責務が分かれている, so that UI調整による別画面の回帰を減らせる

#### Acceptance Criteria

1. The UI Polish shall 共通トークンと基本要素をグローバルスタイルへ置く
2. The UI Polish shall タイトル、準備、プレイ、結果のスタイルを責務別ファイルへ分割する
3. The UI Polish shall 同じセレクタの競合する重複定義を避ける
4. The UI Polish shall Next.jsの既存CSS読み込み順で全スタイルを適用できる
5. The UI Polish shall 分割後もデスクトップとモバイルの表示を維持する

### Requirement 11: ビジュアル回帰検証

**Objective:** As a 開発者, I want 主要画面の崩れを自動または再現可能に確認できる, so that UI改善を継続できる

#### Acceptance Criteria

1. The UI Polish shall 1440×900、390×844、960×540で主要画面を撮影できる
2. The UI Polish shall タイトル、未接続準備、カウントダウン、プレイ、結果を確認対象にする
3. The UI Polish shall Canvasが単色または空白でないことをピクセルで検証する
4. The UI Polish shall HUD、ボタン、見出しの重なりと画面外はみ出しを確認する
5. The UI Polish shall ビジュアル確認手順をリポジトリ内へ記録する

### Requirement 12: 実カメラ検証

**Objective:** As a 展示運営者, I want 実カメラでもUIが正しく機能することを確認できる, so that 会場で安定して運用できる

#### Acceptance Criteria

1. The UI Polish shall カメラ許可、モデル初期化、位置合わせ、自動開始を実機確認項目として持つ
2. The UI Polish shall 人物ガイド、距離表示、状態パネルが実映像と重ならないことを確認する
3. The UI Polish shall 実姿勢アバターの比率と判定領域が画面比率にかかわらず一致することを確認する
4. The UI Polish shall 未検出、カメラ拒否、モデル読込失敗の表示を確認する
5. The UI Polish shall 実機未確認項目を完了扱いにせず明記する

### Requirement 13: 既存ゲーム動作の維持

**Objective:** As a 開発者, I want 表示改善後もゲーム規則が変わらない, so that UI変更による回帰を防げる

#### Acceptance Criteria

1. The UI Polish shall 既存の画面遷移、カメラ停止、自動開始、自動復帰を維持する
2. The UI Polish shall 壁パターン、衝突判定、スコア、ハート、速度の規則を変更しない
3. The UI Polish shall 実カメラとモック姿勢の両方を維持する
4. The UI Polish shall 型チェック、ユニットテスト、ビルド、E2Eを成功させる
5. The UI Polish shall reduced motionとキーボード操作を維持する

## 手動確認観点

- 縦長画面でアバターと壁穴が不自然に細くならない。
- タイトルでアバターが姿勢を作り、壁が通過して成功反応が出る。
- ジャンプ、座り、傾きで関節が自然な経路を通る。
- 幅390pxでハート5個、スコア、ミス、速度が読める。
- カメラ未接続画面でアバター外見と主操作が分かる。
- 実カメラ映像上のガイドで中央、距離、全身を調整できる。
- 結果画面でスコアとランクが表示される。
- 新しい壁の名前が短時間表示される。
- 失敗時に、はみ出した位置を理解できる。
- CSS分割後も全画面の見た目が維持される。
