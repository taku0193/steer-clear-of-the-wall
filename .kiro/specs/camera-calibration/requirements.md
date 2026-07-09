# Requirements Document

## Introduction

`camera-calibration` は、実カメラモードでゲームを始める前に、プレイヤーが
カメラ内で適切な位置に立てているかを確認し、必要な調整を短く案内する準備体験です。

現状でもカメラプレビューと姿勢検出状態は表示されますが、プレイヤーは「全身が映って
いるか」「中央に立てているか」「近すぎるか遠すぎるか」「ゲーム開始してよい状態か」を
判断しづらい場合があります。この機能では、姿勢検出結果を使って開始前の位置合わせを
明確にし、プレイ開始直後の未検出や不自然な判定を減らします。

## 目的

- 初回ユーザーが、ゲーム開始前にどこへ立てばよいか分かるようにする。
- 肩、腰、足首など、判定に必要な部位が検出されているかを開始前に伝える。
- 近すぎる、遠すぎる、左右に寄りすぎている状態を簡潔に案内する。
- 実カメラモードの準備完了条件を、単なるモデル初期化ではなくプレイ可能な姿勢状態に近づける。
- カメラ映像をゲーム本編の主表示にせず、準備用の確認表示として扱う方針を維持する。

## 対象範囲

### 今回含める範囲

- カメラ準備画面での位置合わせ状態表示
- 全身検出、中央位置、距離感、検出品質の簡潔な判定
- 姿勢検出ランドマークから準備状態を評価する純粋ロジック
- 準備完了ボタンの有効条件、または注意付き開始の扱い
- モック姿勢モードを妨げない導線
- 実カメラ確認時の手動確認項目とREADME更新

### 今回含めない範囲

- MediaPipe以外の姿勢検出ライブラリへの変更
- カメラ解像度、フレームレート、モデル種類の大きな変更
- プレイ中の衝突判定、スコア、壁速度、壁パターンの変更
- カメラ映像をプレイ中の主表示にする変更
- 複数人検出、ユーザー登録、個人設定保存
- 音声案内、サウンド、ランキング、バックエンド連携

## Requirements

### Requirement 1: キャリブレーション状態の表示

**Objective:** As a プレイヤー, I want 開始前に自分の立ち位置が適切か分かる, so that ゲーム開始直後から壁避けに集中できる

#### Acceptance Criteria

1. When 実カメラの姿勢検出が初期化される, the Camera Calibration shall カメラ準備画面に位置合わせ状態を表示する
2. While 姿勢検出中である, the Camera Calibration shall 全身検出、中央位置、距離感、検出品質の状態を確認できるようにする
3. If 位置合わせ状態が十分である, the Camera Calibration shall プレイヤーに開始可能であることを明確に表示する
4. If 位置合わせ状態が不十分である, the Camera Calibration shall 次に取るべき調整を1つ以上短く表示する

### Requirement 2: 全身検出の確認

**Objective:** As a プレイヤー, I want 判定に必要な体の部位が映っているか分かる, so that 未検出による失敗を減らせる

#### Acceptance Criteria

1. When 姿勢ランドマークを評価する, the Camera Calibration shall 肩、腰、足首を含む主要部位の検出状態を確認する
2. If 主要部位の一部が十分な信頼度で検出されない, the Camera Calibration shall 全身が映るように促す
3. If 肩、腰、足首が十分な信頼度で検出される, the Camera Calibration shall 全身検出を良好として扱う
4. The Camera Calibration shall 姿勢未検出状態をゲーム開始不能または注意が必要な状態として表示する

### Requirement 3: 立ち位置と距離感の案内

**Objective:** As a プレイヤー, I want カメラに対して近すぎるか遠すぎるか分かる, so that アバターが適切な大きさで表示される

#### Acceptance Criteria

1. When 判定用のプレイヤー領域を評価する, the Camera Calibration shall 画面内での身体領域の中心位置を算出する
2. If 身体中心が左右どちらかに寄りすぎている, the Camera Calibration shall 中央へ移動する案内を表示する
3. If 身体領域が大きすぎる, the Camera Calibration shall カメラから少し離れる案内を表示する
4. If 身体領域が小さすぎる, the Camera Calibration shall カメラへ少し近づく案内を表示する
5. If 身体中心と身体領域の大きさが許容範囲内である, the Camera Calibration shall 立ち位置と距離感を良好として扱う

### Requirement 4: 準備完了導線

**Objective:** As a プレイヤー, I want 準備できた状態でゲーム開始できる, so that 開始直後に位置調整で迷わない

#### Acceptance Criteria

1. While 姿勢検出モデルの初期化中である, the Camera Calibration shall 準備完了操作を有効にしない
2. While キャリブレーション状態が良好である, the Camera Calibration shall 準備完了操作を有効にする
3. If キャリブレーション状態が不十分である, the Camera Calibration shall 準備完了操作を無効にする、または注意付きで開始することが分かる表示にする
4. When 準備完了操作を行う, the Camera Calibration shall 既存と同じカウントダウンへ遷移する
5. The Camera Calibration shall モック姿勢で試す導線を維持する

### Requirement 5: ゲーム表現方針の維持

**Objective:** As a 開発者, I want カメラ確認を準備画面に閉じる, so that プレイ中はアバターと壁を主役にできる

#### Acceptance Criteria

1. The Camera Calibration shall カメラ映像を実カメラ準備の確認用途として扱う
2. When プレイ状態へ移行する, the Camera Calibration shall カメラ映像をプレイ画面の主表示にしない
3. The Camera Calibration shall プレイ中のCanvasアバター描画、壁描画、HUD表示を変更しない
4. The Camera Calibration shall 実カメラとモック姿勢の既存画面遷移を維持する

### Requirement 6: 純粋ロジックとテスト容易性

**Objective:** As a 開発者, I want キャリブレーション判定をテスト可能にしたい, so that 閾値調整や回帰確認を安全に行える

#### Acceptance Criteria

1. The Camera Calibration shall 姿勢ランドマークまたは判定用プレイヤー領域から準備状態を評価するロジックをUIから分離する
2. The Camera Calibration shall 全身検出、左右寄り、近すぎる、遠すぎる、良好状態をユニットテストできるようにする
3. The Camera Calibration shall ブラウザAPI、MediaStream、Canvasに依存しない純粋関数として主要判定を表現する
4. The Camera Calibration shall 既存の姿勢検出アダプターとゲーム状態の責務を不必要に広げない

### Requirement 7: エラーと不安定状態の扱い

**Objective:** As a プレイヤー, I want カメラや姿勢検出が不安定なときに理由が分かる, so that 何を直せばよいか判断できる

#### Acceptance Criteria

1. If カメラ権限、カメラ取得、姿勢検出初期化に失敗する, the Camera Calibration shall 既存のエラー画面導線を維持する
2. If 姿勢が一時的に検出できない, the Camera Calibration shall エラー画面へ即時遷移せず、位置調整の案内として扱う
3. If 検出状態が短時間で揺れる, the Camera Calibration shall 表示が過度に点滅しないようにする
4. The Camera Calibration shall リトライ、タイトル復帰、結果遷移でカメラストリームや検出ループを残さない既存方針を維持する

### Requirement 8: 検証

**Objective:** As a 開発者, I want 自動確認と実機確認の両方で品質を確認したい, so that カメラ依存の回帰を見落としにくくする

#### Acceptance Criteria

1. The Camera Calibration shall キャリブレーション判定ロジックのユニットテストを追加する
2. The Camera Calibration shall モック姿勢E2Eの既存導線を壊さない
3. The Camera Calibration shall 型チェック、ビルド、ユニットテストが成功する状態を維持する
4. The Camera Calibration shall 実カメラで、良好、近すぎる、遠すぎる、左右寄り、未検出の主要状態を手動確認できるようにする
5. The Camera Calibration shall READMEまたは手動確認チェックリストへ確認観点を反映する

## 手動確認観点

- カメラ許可後、準備画面にキャリブレーション状態が表示される。
- 全身が映っているとき、開始可能または良好状態になる。
- 足首や肩が画面外に出ると、全身を映す案内が出る。
- 左右に寄ると、中央へ移動する案内が出る。
- カメラに近すぎると、少し離れる案内が出る。
- カメラから遠すぎると、少し近づく案内が出る。
- 準備完了後は既存どおりカウントダウンへ進む。
- プレイ中はカメラ映像ではなくCanvas上のアバターと壁が主表示になる。
- モック姿勢モードの開始導線が維持される。
- リトライやタイトル復帰でカメラが停止し、二重検出ループが起きない。
