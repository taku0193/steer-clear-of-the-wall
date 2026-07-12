# Requirements Document

## Introduction

`exhibition-mode` は、オープンキャンパスや展示会場で複数の来場者が短時間ずつ遊ぶ前提に合わせて、ゲームを放置後に自動で初期状態へ戻し、次のプレイヤーが迷わず開始できるようにする運用改善です。

現状でも結果画面から再プレイできますが、展示では前のプレイヤーが結果画面やエラー画面を残したまま離れることがあります。また、カメラや姿勢検出が接続されたまま放置されると、次の来場者の開始導線が分かりづらくなり、端末負荷やカメラ利用状態も残りやすくなります。

この機能では、ゲーム体験そのものは変えずに、放置時の自動復帰、展示向けの手動リセット、カメラリソース解放、モック姿勢導線の維持を扱います。

## Boundary Context

- **今回含める範囲**: 結果画面やエラー画面の放置時自動タイトル復帰、プレイ前画面での手動リセット導線、リセット時のカメラと姿勢検出の停止、展示運用向けREADME更新、モック姿勢E2E回帰確認。
- **今回含めない範囲**: ランキング、スコア保存、ユーザー登録、バックエンド連携、音声や効果音、難易度変更、壁パターン追加、実カメラ判定ロジックの改善。
- **隣接する期待**: 展示モードは既存ゲームの標準導線を壊さず、1人で遊ぶ通常利用でも不自然に感じない控えめな挙動にする。

## Requirements

### Requirement 1: 放置後の自動タイトル復帰

**Objective:** As a 展示運営者, I want 前のプレイヤーが離れてもゲームが自動で初期画面へ戻る, so that 次の来場者がすぐ遊び始められる

#### Acceptance Criteria

1. When 結果画面が一定時間操作されない, the Exhibition Mode shall タイトル画面へ自動で戻す
2. When エラー画面が一定時間操作されない, the Exhibition Mode shall タイトル画面へ自動で戻す
3. When 自動復帰が発生する, the Exhibition Mode shall スコア、ミス、速度段階、入力モードを新規プレイ前の状態へ戻す
4. If プレイヤーが結果画面で「もう一度プレイ」を選ぶ, the Exhibition Mode shall 自動復帰を待たずに既存の再プレイ準備へ進める
5. The Exhibition Mode shall 自動復帰までの待機秒数をテスト可能な定数として管理する

### Requirement 2: 手動リセット導線

**Objective:** As a 展示運営者, I want 画面が途中状態でもすぐ最初に戻せる, so that 会場で次の体験者へ切り替えやすい

#### Acceptance Criteria

1. While カメラ準備画面である, the Exhibition Mode shall タイトルへ戻る操作を提供する
2. While カウントダウン画面である, the Exhibition Mode shall タイトルへ戻る操作を提供する
3. While プレイ画面である, the Exhibition Mode shall 誤操作しにくい形でタイトルへ戻る操作を提供する
4. When 手動リセットが実行される, the Exhibition Mode shall 既存のタイトル画面へ戻す
5. The Exhibition Mode shall 手動リセット操作がHUD、壁、安全領域、判定フィードバックの視認性を妨げないようにする

### Requirement 3: カメラと姿勢検出リソースの解放

**Objective:** As a 開発者, I want 自動復帰や手動リセットでリソースが確実に止まる, so that 長時間展示しても二重ループやカメラ残留を起こしにくくする

#### Acceptance Criteria

1. When 自動タイトル復帰が発生する, the Exhibition Mode shall 取得済みカメラストリームを停止する
2. When 手動リセットが実行される, the Exhibition Mode shall 取得済みカメラストリームを停止する
3. When 自動タイトル復帰または手動リセットが発生する, the Exhibition Mode shall 姿勢検出ループと描画補間ループを残さない
4. The Exhibition Mode shall 既存の結果、エラー、タイトル復帰時のリソース解放方針を再利用する
5. The Exhibition Mode shall 複数回連続で開始、リセット、再開始してもカメラやタイマーが二重起動しない

### Requirement 4: 展示中の通常導線維持

**Objective:** As a プレイヤー, I want 展示向けの自動制御があっても普通に遊べる, so that プレイ中に不意に中断されない

#### Acceptance Criteria

1. While プレイ中にプレイヤー操作またはゲーム進行が続いている, the Exhibition Mode shall 放置扱いで自動タイトル復帰しない
2. While カメラ準備で位置合わせ中である, the Exhibition Mode shall 必要以上に短い時間で自動復帰しない
3. If カメラ準備画面を長時間放置する場合, the Exhibition Mode shall タイトル復帰するか、リソース解放できる状態へ戻す
4. The Exhibition Mode shall モック姿勢モードの開始、カウントダウン、プレイ、結果、再プレイ準備の既存導線を維持する
5. The Exhibition Mode shall 実カメラモードのカメラ許可、キャリブレーション、準備完了、プレイ開始の既存導線を維持する

### Requirement 5: 表示と操作の分かりやすさ

**Objective:** As a 初回プレイヤー, I want 画面上の操作が少なく分かりやすい, so that 展示会場でも迷わず遊べる

#### Acceptance Criteria

1. The Exhibition Mode shall タイトル、準備、結果、エラーの主要操作文言を初回ユーザー向けに維持する
2. The Exhibition Mode shall 自動復帰までの表示を必要以上に強調せず、結果やエラー内容の確認を妨げない
3. The Exhibition Mode shall 手動リセット導線を表示する場合、主要な開始操作や再プレイ操作より目立ちすぎないようにする
4. The Exhibition Mode shall 小さい画面でもリセット導線が他のボタンやHUDと重ならないようにする
5. The Exhibition Mode shall カメラ映像をプレイ画面の主表示にしない既存方針を維持する

### Requirement 6: 検証

**Objective:** As a 開発者, I want 展示運用のリセット挙動を自動確認できる, so that 放置や再開始の回帰を見落としにくくする

#### Acceptance Criteria

1. The Exhibition Mode shall 自動タイトル復帰の状態遷移をユニットテストまたはコンポーネントに近いテストで確認できるようにする
2. The Exhibition Mode shall 手動リセット時にゲーム状態が初期化されることをテストできるようにする
3. The Exhibition Mode shall モック姿勢E2Eでタイトル、準備、プレイ、結果、再プレイ準備の既存導線が壊れていないことを確認する
4. The Exhibition Mode shall 型チェック、ビルド、ユニットテストが成功する状態を維持する
5. The Exhibition Mode shall READMEまたは手動確認チェックリストへ展示運用時の確認観点を反映する

## 手動確認観点

- 結果画面を放置すると、一定時間後にタイトルへ戻る。
- エラー画面を放置すると、一定時間後にタイトルへ戻る。
- カメラ準備画面から手動でタイトルへ戻れる。
- プレイ中に手動リセットでき、カメラとゲーム状態が初期化される。
- リセット後にもう一度カメラ開始またはモック姿勢開始ができる。
- 複数回リセットしてもカメラ、姿勢検出、タイマー、描画ループが二重起動しない。
- モック姿勢E2Eの既存導線が維持される。
