# Requirements Document

## Introduction

`fullscreen-game-ui` は、プレイ中のCanvasゲーム画面をビューポート全体へ広げ、
迫る壁、アバター、判定に必要な情報を大きく見やすく表示するUI再設計です。

カメラ映像そのものをプレイ中の主表示にはしません。カメラは姿勢入力として利用し、
プレイヤーが見る中心は、検出した姿勢を反映したアバターと壁を描画するCanvasとします。

## 目的

- プレイヤーが壁とアバターを離れた位置からでも認識しやすくする。
- 固定された小さいゲーム領域をなくし、利用可能な画面をゲーム体験へ活用する。
- スコアや残り時間を確認できる状態を保ちながら、Canvasの表示面積を優先する。
- 現在のゲームロジック、姿勢検出、当たり判定、スコア計算を変更せずにUIを改善する。

## 対象範囲

### 今回含める範囲

- プレイ画面のフルビューポート化
- Canvasサイズと描画解像度のビューポート追従
- HUDと判定フィードバックのオーバーレイ化
- プレイ画面にある開発者向け詳細表示の整理
- 画面サイズ変更時のレイアウト追従
- デスクトップと狭い画面での最低限のレスポンシブ対応

### 今回含めない範囲

- カメラ映像をプレイ画面の全画面背景にする変更
- 姿勢検出方式やMediaPipe設定の変更
- 壁パターン、当たり判定、スコア、制限時間の仕様変更
- 新しいゲームモード、演出、サウンド、ランキングの追加
- タイトル、準備、結果、エラー画面の全面的な再設計

## Requirements

### Requirement 1: プレイ画面のフルビューポート化

**Objective:** As a プレイヤー, I want ゲーム画面が表示領域全体を使う, so that 壁とアバターを大きく見ながら体を動かせる

#### Acceptance Criteria

1. When プレイ状態へ移行する, the Fullscreen Game UI shall プレイ画面をビューポートの幅と高さ全体へ広げる
2. While プレイ中である, the Fullscreen Game UI shall 固定された最大幅によってCanvas表示を小さく制限しない
3. While プレイ中である, the Fullscreen Game UI shall ゲーム操作に不要なページスクロールを発生させない
4. When ブラウザ表示領域のサイズが変わる, the Fullscreen Game UI shall 新しい表示領域に合わせてゲーム画面を更新する

### Requirement 2: Canvasの表示サイズと描画品質

**Objective:** As a プレイヤー, I want 大きなCanvasでも壁とアバターが明瞭に見える, so that 自分の位置を判断しやすい

#### Acceptance Criteria

1. The Fullscreen Game UI shall CanvasのCSS表示サイズを利用可能なプレイ領域へ合わせる
2. The Fullscreen Game UI shall Canvasの内部描画解像度を表示サイズと端末のピクセル密度に応じて調整する
3. When Canvasサイズが変わる, the Fullscreen Game UI shall 壁、安全領域、アバターの正規化座標関係を維持する
4. The Fullscreen Game UI shall 壁、安全領域、アバターをCanvas領域から意図せず切り落とさない

### Requirement 3: ゲーム表現を主役にする表示

**Objective:** As a プレイヤー, I want 壁とアバターへ集中できる, so that 迫る壁を直感的に避けられる

#### Acceptance Criteria

1. While プレイ中である, the Fullscreen Game UI shall Canvasを画面の主表示として扱う
2. While 実カメラモードでプレイ中である, the Fullscreen Game UI shall カメラ映像そのものを主表示にしない
3. While 姿勢を検出できている, the Fullscreen Game UI shall アバターと判定領域を壁に対して識別できる状態で表示する
4. If 姿勢を検出できない, the Fullscreen Game UI shall Canvas上またはHUD上に未検出状態を表示する

### Requirement 4: HUDとフィードバック

**Objective:** As a プレイヤー, I want プレイを妨げずに残り時間と結果を確認できる, so that 画面へ集中したまま状況を把握できる

#### Acceptance Criteria

1. While プレイ中である, the Fullscreen Game UI shall 残り時間、スコア、ミス数をCanvas上のオーバーレイとして表示する
2. The Fullscreen Game UI shall HUDによってCanvasの主要な表示領域を恒常的に縮小しない
3. When 壁の判定が行われる, the Fullscreen Game UI shall 成功、失敗、判定不能のフィードバックを短く明確に表示する
4. The Fullscreen Game UI shall HUDとフィードバックを壁の安全領域やアバターの確認を妨げにくい位置へ配置する
5. The Fullscreen Game UI shall 背景の描画内容にかかわらずHUDの文字を読めるコントラストで表示する

### Requirement 5: プレイ中の情報整理

**Objective:** As a プレイヤー, I want 必要な情報だけが表示される, so that 開発用の数値に気を取られずゲームを理解できる

#### Acceptance Criteria

1. While プレイ中である, the Fullscreen Game UI shall 姿勢領域の座標値などの開発者向け詳細を通常表示しない
2. While プレイ中である, the Fullscreen Game UI shall 現在の入力モードと姿勢検出状態を簡潔に確認できる
3. The Fullscreen Game UI shall ゲーム名、長い説明文、重複する状態表示によってプレイ領域を圧迫しない

### Requirement 6: レスポンシブ表示

**Objective:** As a 展示運営者, I want 異なる画面サイズでもゲームを表示できる, so that 使用するディスプレイに合わせて運用できる

#### Acceptance Criteria

1. When 横長の画面で表示する, the Fullscreen Game UI shall Canvasの表示面積を最大限利用する
2. When 画面幅が狭い, the Fullscreen Game UI shall HUDを縮小または再配置し、主要情報を画面内に保つ
3. When 画面の縦横比が変わる, the Fullscreen Game UI shall 壁とアバターの位置関係を維持する
4. The Fullscreen Game UI shall 少なくとも一般的なデスクトップブラウザの表示領域で操作不能な重なりを発生させない

### Requirement 7: 既存ゲーム動作の維持

**Objective:** As a 開発者, I want UI変更後も既存ゲームが同じ規則で動く, so that 表示改善によるゲームロジックの回帰を防げる

#### Acceptance Criteria

1. The Fullscreen Game UI shall 実カメラモードとモック姿勢モードの両方を維持する
2. The Fullscreen Game UI shall 既存の壁進行、当たり判定、スコア、ミス、制限時間の規則を変更しない
3. The Fullscreen Game UI shall 結果、エラー、再試行、タイトル復帰の画面遷移を維持する
4. The Fullscreen Game UI shall 既存の型チェック、ビルド、ユニットテストが成功する状態を維持する

### Requirement 8: ゲーム領域とアバター縮尺

**Objective:** As a プレイヤー, I want 広いゲーム領域に適切な大きさのアバターが表示される, so that カメラとの距離を細かく調整せずに壁を避けられる

#### Acceptance Criteria

1. While プレイ中である, the Fullscreen Game UI shall 壁を画面内で大きく表示し、HUDが覆う領域を抑える
2. While 姿勢を検出できている, the Fullscreen Game UI shall 身体中心を維持したままアバターをカメラ入力より小さい縮尺で表示する
3. If プレイヤーがカメラへ近く大きく検出される, the Fullscreen Game UI shall アバターの最大幅と最大高さを制限する
4. The Fullscreen Game UI shall アバター表示と当たり判定領域へ同じ縮尺変換を適用する
5. While モック姿勢モードである, the Fullscreen Game UI shall 実カメラ用の縮尺に近い大きさでアバターを表示する

### Requirement 9: 滑らかな壁進行

**Objective:** As a プレイヤー, I want 壁が連続的に迫って見える, so that 壁との距離と回避タイミングを直感的に判断できる

#### Acceptance Criteria

1. While 壁が進行中である, the Fullscreen Game UI shall ブラウザの描画フレームに合わせて壁位置を補間する
2. While 論理的な壁進行が600ミリ秒間隔で更新される, the Fullscreen Game UI shall 更新間の表示を連続的に変化させる
3. When 新しい壁へ切り替わる, the Fullscreen Game UI shall 表示進行率を新しい壁の開始位置へ戻す
4. The Fullscreen Game UI shall 表示補間によって壁の判定タイミング、スコア、ミス数を変更しない
5. The Fullscreen Game UI shall 1枚の壁が約2.4秒で判定位置へ到達する速度で進行する

### Requirement 10: 本人選択式アバター

**Objective:** As a プレイヤー, I want 自分で好みのアバター外見を選べる, so that カメラ画像から属性を推定されずに自分らしい見た目で遊べる

#### Acceptance Criteria

1. While カメラ準備中である, the Fullscreen Game UI shall 男性風、女性風、ニュートラルのアバター選択肢を表示する
2. When プレイヤーが外見を選ぶ, the Fullscreen Game UI shall 選択状態を明確に表示する
3. When プレイ状態へ移行する, the Fullscreen Game UI shall 選択した配色、服装、髪型をアバターへ反映する
4. The Fullscreen Game UI shall カメラ画像から性別または性自認を推定しない
5. The Fullscreen Game UI shall 未選択時にニュートラルを使用する

### Requirement 11: 判定の許容幅

**Objective:** As a プレイヤー, I want 穴の境界付近でも過度に失敗にならない, so that 姿勢検出の揺れを気にせず体を動かせる

#### Acceptance Criteria

1. When 壁との当たり判定を行う, the Fullscreen Game UI shall 安全領域の各辺へ正規化座標`0.05`の許容幅を適用する
2. If プレイヤー領域が許容幅内にはみ出す, the Fullscreen Game UI shall 回避成功として扱う
3. If プレイヤー領域が許容幅を超えてはみ出す, the Fullscreen Game UI shall 回避失敗として扱う
4. The Fullscreen Game UI shall 姿勢未検出時の判定不能を維持する

## 手動確認観点

- プレイ開始後、Canvasがブラウザ表示領域全体へ広がる。
- HUDがCanvas上へ重なり、プレイ領域を大きく縮小しない。
- ブラウザをリサイズしても、Canvas、壁、アバター、HUDが追従する。
- 高DPIディスプレイでCanvasが過度にぼやけない。
- 実カメラとモック姿勢の両方で表示と判定が動作する。
- カメラとの距離を変えてもアバターが画面を過度に占有しない。
- 壁が段階的に飛ばず、連続的に手前へ迫って見える。
- 準備画面で選んだアバター外見がプレイ画面へ反映される。
- 安全領域の境界付近では許容幅内の姿勢が成功になる。
- 姿勢未検出、成功、失敗の表示がプレイ中に読み取れる。
- プレイ中に不要な縦スクロールや横スクロールが発生しない。
