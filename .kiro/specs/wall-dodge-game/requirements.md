# Requirements Document

## Introduction

`wall-dodge-game` は、カメラの前で体を動かし、迫ってくる壁の穴にアバターを合わせて避ける体験型ブラウザゲームです。

この機能の目的は、オープンキャンパスなどの短時間の展示体験で、高校生や来場者がAIや骨格推定を直感的に体験できるゲームを提供することです。プレイヤーはキーボードやゲームパッドではなく自分の体を使い、カメラ入力、姿勢検出、アバター表示、壁パターン、衝突判定、スコアと結果表示の流れでゲームを体験します。

## 想定ユーザー

- 高校生
- オープンキャンパスの来場者
- 研究室展示を見る人
- AIや画像認識を初めて体験する人

## ゲーム全体の流れ

1. タイトル画面を表示する。
2. プレイヤーが開始ボタンを押す。
3. プレイヤーがカメラ使用を許可する。
4. システムが姿勢検出を開始する。
5. システムが画面上にアバターを表示する。
6. システムがカウントダウンを表示する。
7. システムが奥から迫る壁を表示する。
8. プレイヤーが体を動かして壁の穴に合わせる。
9. システムが成功または失敗を判定する。
10. システムがプレイ中のスコアを表示する。
11. 制限時間が終わったら、システムが結果画面を表示する。

## Boundary Context

- **今回実装する範囲**: タイトル画面、カメラ開始、姿勢検出、簡単なアバター表示、1種類または数種類の壁パターン、簡易的な当たり判定、プレイ中のスコア表示、結果画面。
- **今回実装しない範囲**: 参考リポジトリのコード移植、複雑な壁パターン、詳細な運動タイプ診断、高度なレベル管理、ランキング、ユーザー登録、データベース保存、音楽連動、WebSocket、バックエンド。
- **隣接する期待**: 実装方式、使用ライブラリ、描画方式、内部ディレクトリ構成は設計フェーズで決める。要件段階では、ユーザーから見える動作と範囲を定義する。

## 参考リポジトリの扱い

参考リポジトリ:

- `https://github.com/taku0193/ai-wall`

参考にしてよいこと:

- Camera InputからScore / Resultまでのシステムの流れ。
- 体を動かして迫る壁を避ける体験の考え方。
- カメラ開始後に姿勢検出、アバター表示、ゲーム開始へ進む順序。
- 壁パターン、衝突判定、スコア、結果表示という機能責務の分け方。

コピーしてはいけないこと:

- ソースコード、型定義、関数、コンポーネント、CSS、設定ファイル。
- ファイル構成やモジュール分割のそのままの移植。
- 壁パターン定義、判定ロジック、スコア計算式、UI文言、README文章。
- 参考リポジトリ固有のデザイン、数値、レベル設計、診断ロジック。

## 正常時の動作

- プレイヤーはタイトル画面からゲームを開始できる。
- カメラ許可後、プレイヤーの姿勢が検出され、アバターとして画面に表示される。
- カウントダウン後、壁が迫り、プレイヤーは体を動かして壁の穴に合わせる。
- システムは成功または失敗を判定し、スコアを更新する。
- 制限時間が終わると、システムは結果画面を表示する。

## エラー時の動作

- カメラ使用が拒否された場合、システムはゲームを開始せず、理由と再試行できる導線を表示する。
- カメラが利用できない場合、システムはゲーム不能状態を表示する。
- 姿勢検出を開始できない場合、システムはエラー状態を表示し、プレイヤーが再試行できるようにする。
- プレイ中に姿勢が検出できない場合、システムは判定できない状態をプレイヤーに伝える。

## Requirements

### Requirement 1: タイトルと開始導線

**Objective:** As a 初めて体験する来場者, I want 何をするゲームか分かるタイトル画面から開始できる, so that 迷わず短時間で体験を始められる

#### Acceptance Criteria

1. When プレイヤーがゲームページを開く, the Wall Dodge Game shall タイトル画面を表示する
2. The Wall Dodge Game shall タイトル画面にゲーム開始のための操作を表示する
3. When プレイヤーが開始操作を行う, the Wall Dodge Game shall カメラ使用の準備へ進む
4. While カメラ使用の準備が完了していない, the Wall Dodge Game shall プレイヤーに準備中であることを表示する

### Requirement 2: カメラ入力と姿勢検出

**Objective:** As a プレイヤー, I want カメラの前で体を動かすだけで操作できる, so that キーボードやゲームパッドなしでゲームを体験できる

#### Acceptance Criteria

1. When プレイヤーがカメラ使用を許可する, the Wall Dodge Game shall カメラ入力を使って姿勢検出を開始する
2. While 姿勢検出が有効である, the Wall Dodge Game shall プレイヤーの姿勢をゲーム内操作として扱う
3. If プレイヤーがカメラ使用を拒否する, the Wall Dodge Game shall ゲームを開始せずにエラー内容と再試行導線を表示する
4. If カメラが利用できない, the Wall Dodge Game shall ゲーム不能状態と理由を表示する
5. If 姿勢検出を開始できない, the Wall Dodge Game shall エラー内容と再試行導線を表示する

### Requirement 3: アバター表示

**Objective:** As a プレイヤー, I want 自分の姿勢がアバターとして表示される, so that 自分の動きがゲームに反映されていることを理解できる

#### Acceptance Criteria

1. When 姿勢検出が開始される, the Wall Dodge Game shall 検出した姿勢に基づくアバターを表示する
2. While プレイヤーの姿勢が検出されている, the Wall Dodge Game shall アバター表示をプレイヤーの動きに合わせて更新する
3. If プレイヤーの姿勢が一時的に検出できない, the Wall Dodge Game shall 姿勢が検出できない状態をプレイヤーに示す
4. The Wall Dodge Game shall カメラ映像そのものではなく、ゲーム内表現としてのアバターを主表示にする
5. While プレイ中である, the Wall Dodge Game shall アバターを迫ってくる壁の方向へ向いた後ろ姿として表示する

### Requirement 4: カウントダウンとゲーム開始

**Objective:** As a プレイヤー, I want 開始前に準備時間が分かる, so that 体の位置を整えてからプレイできる

#### Acceptance Criteria

1. When カメラ入力と姿勢検出の準備が完了する, the Wall Dodge Game shall カウントダウンを表示する
2. While カウントダウン中である, the Wall Dodge Game shall まだ壁との判定を開始しない
3. When カウントダウンが終了する, the Wall Dodge Game shall プレイ状態へ移行する
4. The Wall Dodge Game shall プレイヤーが現在の状態を理解できる表示を行う

### Requirement 5: 壁パターンと回避体験

**Objective:** As a プレイヤー, I want 迫ってくる壁の穴に体を合わせる, so that 体を使った回避ゲームとして遊べる

#### Acceptance Criteria

1. When プレイ状態が開始される, the Wall Dodge Game shall 壁パターンを表示する
2. While プレイ中である, the Wall Dodge Game shall 壁がプレイヤーへ迫っているように見える表示を行う
3. The Wall Dodge Game shall 最小構成として1種類または数種類の壁パターンを提供する
4. The Wall Dodge Game shall 壁パターンごとに、プレイヤーが合わせるべき穴または安全領域を表示する
5. The Wall Dodge Game shall 複雑な壁パターンや高度なレベル管理を今回の範囲に含めない
6. While 現行の壁がプレイヤーへ迫っている, the Wall Dodge Game shall 壁の上端をゲーム画面の上端へ固定する
7. The Wall Dodge Game shall 将来の壁種類ごとに配置基準をデータで指定できる
8. The Wall Dodge Game shall 現行壁の安全領域を壁の下端まで開き、地面に接した穴として表示する

### Requirement 6: 衝突判定とフィードバック

**Objective:** As a プレイヤー, I want 壁を避けられたかすぐ分かる, so that 体の動かし方を調整しながら遊べる

#### Acceptance Criteria

1. When 壁が判定位置に到達する, the Wall Dodge Game shall プレイヤーの姿勢と壁パターンを比較して成功または失敗を判定する
2. When 判定結果が成功である, the Wall Dodge Game shall 成功したことをプレイヤーに表示する
3. When 判定結果が失敗である, the Wall Dodge Game shall 失敗したことをプレイヤーに表示する
4. If 判定時に姿勢が検出できない, the Wall Dodge Game shall 判定不能または失敗として扱うことをプレイヤーに分かる形で表示する
5. The Wall Dodge Game shall 今回の範囲では簡易的な当たり判定を提供する

### Requirement 7: スコア表示

**Objective:** As a プレイヤー, I want プレイ中にスコアが分かる, so that 自分の成果を確認しながら遊べる

#### Acceptance Criteria

1. When ゲームがプレイ状態になる, the Wall Dodge Game shall プレイ中のスコアを表示する
2. When プレイヤーが壁回避に成功する, the Wall Dodge Game shall スコアを加算する
3. When プレイヤーが壁回避に失敗する, the Wall Dodge Game shall 失敗が分かる表示を行う
4. While プレイ中である, the Wall Dodge Game shall 現在のスコアを確認できる状態にする
5. The Wall Dodge Game shall ランキング、ユーザー登録、データベース保存を今回の範囲に含めない

### Requirement 8: 制限時間と結果画面

**Objective:** As a 展示で体験する来場者, I want 短時間で結果まで見られる, so that 待ち時間の少ない展示体験になる

#### Acceptance Criteria

1. When プレイ状態が開始される, the Wall Dodge Game shall 制限時間のあるゲームとして進行する
2. While プレイ中である, the Wall Dodge Game shall 残り時間または終了が近いことをプレイヤーが理解できる表示を行う
3. When 制限時間が終了する, the Wall Dodge Game shall プレイを終了して結果画面を表示する
4. The Wall Dodge Game shall 結果画面に最終スコアを表示する
5. The Wall Dodge Game shall 詳細な運動タイプ診断を今回の範囲に含めない

### Requirement 9: 再試行と展示運用

**Objective:** As a 展示運営者, I want 失敗後や終了後に次の来場者がすぐ遊べる, so that 展示の回転率を保てる

#### Acceptance Criteria

1. When 結果画面が表示される, the Wall Dodge Game shall もう一度遊べる導線を表示する
2. When プレイヤーが再試行を選ぶ, the Wall Dodge Game shall 新しいプレイを開始できる状態へ戻る
3. If エラーが発生する, the Wall Dodge Game shall プレイヤーまたは運営者が次に取る行動を理解できる表示を行う
4. The Wall Dodge Game shall バックエンド通信を必要としない体験として成立する
5. The Wall Dodge Game shall 音楽連動やWebSocket連携を今回の範囲に含めない
