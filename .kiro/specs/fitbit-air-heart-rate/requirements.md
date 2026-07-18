# Requirements Document

## Introduction

`fitbit-air-heart-rate`は、Google Fitbit Airが公開する標準Bluetooth Low Energy（BLE）の
Heart Rate Serviceから心拍数をライブ取得し、プレイ中のHUDへ表示するとともに、1回の
ゲームセッション内で時系列データを記録して結果画面でグラフ表示する機能です。

Google Health APIへ同期されたクラウド値ではなく、プレイヤー側ブラウザがFitbit Airへ
Web Bluetoothで直接接続し、Heart Rate Measurementの通知を受信する方式を対象とします。
このため、ゲームを表示する端末のBluetooth機能、Web Bluetooth対応ブラウザ、Fitbit Airの
心拍数共有設定を利用条件とします。

心拍数はゲーム演出と運動中の振り返りにだけ使用し、医療上の診断、異常検知、ゲームの
スコア、難易度、ランキング順位には使用しません。初期実装では心拍データをゲーム
セッション中のメモリだけに保持し、タイトルへ戻ると破棄します。

## 目的

- プレイヤーがゲーム中の現在心拍数を一目で確認できるようにする。
- ゲーム開始から終了までの心拍数の変化をセッション単位で記録する。
- 結果画面で時系列グラフと最小、平均、最大心拍数を確認できるようにする。
- Fitbit AirやBluetoothが利用できない場合も、ゲーム本体を最後まで継続できるようにする。
- 心拍データを必要以上に保存、送信せず、展示や共有端末で扱いやすい状態にする。

## 対象範囲

### 今回含める範囲

- Fitbit Airの標準BLE Heart Rate ServiceへのWeb Bluetooth接続
- Heart Rate Measurement通知の8bitおよび16bit心拍数解析
- 接続中、接続済み、切断、非対応、エラー状態の表示
- プレイ中HUDでの現在心拍数とライブ状態の表示
- カウントダウン開始から結果確定までの心拍サンプル記録
- 結果画面での心拍数時系列グラフ
- 最小、平均、最大心拍数と記録時間の表示
- データ欠落区間と接続切断の分かる表示
- 再接続、再プレイ、タイトル復帰時のライフサイクル管理
- 心拍データを使わずにゲームを継続するフォールバック
- 純粋な解析、検証、集計ロジックのユニットテスト
- 対応ブラウザとFitbit Air設定を含むREADMEおよび手動確認項目の更新

### 今回含めない範囲

- Google Health API、Fitbit Web API、OAuthによるクラウドデータ取得
- 心拍データのSQLite、localStorage、ファイル、外部サービスへの永続保存
- 心拍データのランキング登録または他プレイヤーとの比較
- 心拍数によるスコア、壁速度、難易度、ライフ、判定の変更
- 年齢や安静時心拍数に基づく心拍ゾーン、運動強度、消費カロリーの推定
- 高心拍、低心拍、不整脈などの医療的な警告または診断
- Fitbit Air以外の心拍計に対する動作保証
- Safari、Firefox、iOSブラウザなどWeb Bluetooth非対応環境への独自中継アプリ
- macOSネイティブアプリやスマートフォンアプリの新規開発

## Requirements

### Requirement 1: 利用条件と接続導線

**Objective:** As a プレイヤー, I want ゲーム開始前にFitbit Airを迷わず接続したい, so that プレイ中の心拍数をライブ表示できる

#### Acceptance Criteria

1. When ゲーム準備画面を表示する, the Heart Rate Feature shall Fitbit Airを接続する操作と現在の接続状態を表示する
2. When プレイヤーが接続操作を行う, the Heart Rate Feature shall そのユーザー操作から直接Web Bluetoothのデバイス選択を開始する
3. The Heart Rate Feature shall 標準Heart Rate Serviceを公開するデバイスだけを選択候補として要求する
4. The Heart Rate Feature shall 接続前にFitbit Air側で心拍数共有を有効にする必要があることを短く案内する
5. While 接続処理中である, the Heart Rate Feature shall 多重接続操作を受け付けず、接続中であることを表示する
6. When 接続が成功する, the Heart Rate Feature shall 接続済み状態と受信した現在心拍数を表示する
7. The Heart Rate Feature shall Google Healthアカウント、OAuth認証、クラウド同期をライブ表示の前提にしない

### Requirement 2: ブラウザと実行環境の互換性

**Objective:** As a 展示運営者, I want 利用可能な環境と不足条件を事前に判断したい, so that 会場で接続不能になる状況を減らせる

#### Acceptance Criteria

1. The Heart Rate Feature shall `navigator.bluetooth`の利用可否を接続操作前に判定する
2. If Web Bluetoothが利用できない, the Heart Rate Feature shall 対応するChrome系ブラウザを使用する必要があることを表示する
3. If ページがセキュアコンテキストでない, the Heart Rate Feature shall `localhost`またはHTTPSが必要であることを表示する
4. The Heart Rate Feature shall SSH先Ubuntuではなく、ゲームを表示するブラウザ端末のBluetoothへ接続する
5. The Heart Rate Feature shall Web Bluetooth非対応をカメラ、姿勢検出、ゲーム本体の非対応として扱わない
6. The Documentation shall 想定ブラウザ、OS、Bluetooth、`localhost`またはHTTPS、Fitbit Airの心拍数共有を利用条件として記載する

### Requirement 3: ライブ心拍数の受信と検証

**Objective:** As a プレイヤー, I want Fitbit Airから届く現在心拍数を正しく確認したい, so that プレイ中の身体反応を把握できる

#### Acceptance Criteria

1. When Fitbit Airへ接続する, the Heart Rate Feature shall Heart Rate Measurement characteristicの通知を購読する
2. When 8bit形式のHeart Rate Measurementを受信する, the Heart Rate Feature shall フラグに従って心拍数を解析する
3. When 16bit形式のHeart Rate Measurementを受信する, the Heart Rate Feature shall リトルエンディアンの値として心拍数を解析する
4. The Heart Rate Feature shall 有限の整数かつ設計で定める妥当範囲内の値だけを有効な心拍数として扱う
5. If 通知データが空、不完全、または妥当範囲外である, the Heart Rate Feature shall その通知を記録せず、ゲーム進行を継続する
6. When 有効な通知を受信する, the Heart Rate Feature shall BPM、受信時刻、セッション開始からの経過時間を心拍サンプルとして扱う
7. The Heart Rate Feature shall Fitbit Airの通知頻度を固定値と仮定しない

### Requirement 4: プレイ中HUD

**Objective:** As a プレイヤー, I want プレイ中に現在心拍数と接続状態を一目で確認したい, so that 壁避けを妨げず身体反応を把握できる

#### Acceptance Criteria

1. While ゲームがプレイ中である, the Game HUD shall 現在心拍数をBPM単位で表示する
2. While 最後の有効な通知が設計で定めるライブ判定時間内である, the Game HUD shall 心拍数がライブ値であることを視覚的に表示する
3. If ライブ判定時間を超えて通知が届かない, the Game HUD shall 最後の値を現在値として誤認させず、受信待ちまたは切断状態を表示する
4. If 心拍数をまだ受信していない, the Game HUD shall 数値の代わりにデータ待ちであることを表示する
5. The Game HUD shall 心拍表示をハート、スコア、ミス、速度、壁の合図、終了操作と重ならない位置へ配置する
6. The Game HUD shall 色だけに依存せず、数値、単位、状態文言または記号でライブ状態を伝える
7. The Game HUD shall 心拍表示の更新によってCanvas描画やゲームループを不必要に再初期化しない

### Requirement 5: セッション内記録

**Objective:** As a プレイヤー, I want 今回のプレイ中の心拍数が時系列で記録される, so that 終了後に変化を振り返れる

#### Acceptance Criteria

1. When カウントダウンを開始する, the Heart Rate Session shall 新しい空の心拍記録を開始する
2. While カウントダウンまたはプレイ中である, the Heart Rate Session shall 受信した有効な心拍サンプルを時系列順に保持する
3. When 結果画面へ遷移する, the Heart Rate Session shall 今回の記録を確定し、それ以降の通知を同じ結果へ追加しない
4. The Heart Rate Session shall 各サンプルにBPMとゲームセッション開始からの経過時間を保持する
5. If 同一時刻または順序が逆転した通知を受信する, the Heart Rate Session shall グラフの時系列順序を破綻させない
6. If 記録中に通知が途切れる, the Heart Rate Session shall 欠落時間を値の連続として補間しない
7. The Heart Rate Session shall 心拍記録をゲーム状態の判定、スコア計算、壁速度計算から分離する

### Requirement 6: 結果画面の心拍グラフと集計

**Objective:** As a プレイヤー, I want プレイ中の心拍変化を結果画面で確認したい, so that ゲームによる身体反応を振り返れる

#### Acceptance Criteria

1. When 1件以上の有効な心拍サンプルがある結果を表示する, the Result Screen shall 経過時間を横軸、BPMを縦軸とする時系列グラフを表示する
2. The Result Screen shall 今回の最小、平均、最大心拍数をBPM単位で表示する
3. The Result Screen shall 心拍記録の開始から終了までの記録時間を表示する
4. If 接続切断または通知欠落区間がある, the Result Screen shall 欠落区間を連続した実測値として描画しない
5. If 有効な心拍サンプルがない, the Result Screen shall グラフの代わりに心拍データを記録できなかったことを表示する
6. If 有効な心拍サンプルが少なく折れ線を構成できない, the Result Screen shall 取得できた点と集計可能な情報を表示する
7. The Result Screen shall グラフだけに情報を依存させず、テキストによる最小、平均、最大、記録状態を併記する
8. The Result Screen shall 既存の最終スコア、評価、クリア枚数、最高速度、ミス数、ランキング登録、再プレイ操作を維持する

### Requirement 7: 切断、再接続、フォールバック

**Objective:** As a プレイヤー, I want 心拍計が一時的に切断してもゲームを続けたい, so that Bluetooth障害でプレイ結果を失わない

#### Acceptance Criteria

1. If Fitbit Airとの接続が切断される, the Heart Rate Feature shall 切断状態を表示し、カメラ、姿勢検出、ゲームループを停止しない
2. If デバイス選択をキャンセルする, the Heart Rate Feature shall キャンセルをゲームエラーへ変換せず、再接続操作を表示する
3. If Bluetooth接続または通知購読に失敗する, the Heart Rate Feature shall 原因に応じた短い案内と再試行操作を表示する
4. The Game shall 心拍数を取得できない場合でも、心拍なしでカウントダウン、プレイ、判定、スコア、結果へ進める
5. When プレイヤーが明示的に再接続する, the Heart Rate Feature shall 既に許可済みのデバイスを利用できる場合は再利用し、新しい許可が必要な場合はユーザー操作から選択を開始する
6. When 再接続後に有効な通知を受信する, the Heart Rate Session shall 再接続後のサンプルを同じセッションへ追加し、切断区間を欠落として保持する
7. The Heart Rate Feature shall カメラまたは姿勢検出のエラーとBluetooth心拍のエラーを区別する

### Requirement 8: ライフサイクルと連続プレイ

**Objective:** As a 展示運営者, I want 複数人が連続して遊んでも前の心拍データが残らない, so that 安定性とプライバシーを維持できる

#### Acceptance Criteria

1. When 結果画面からもう一度プレイする, the Heart Rate Feature shall 新しい空の心拍記録を作成する
2. When タイトルへ戻るまたは自動復帰する, the Heart Rate Feature shall 前回の心拍サンプルと集計結果をメモリから破棄する
3. When 明示的にBluetoothを切断する, the Heart Rate Feature shall characteristicの通知購読とイベントリスナーを解除する
4. When アプリがアンマウントされる, the Heart Rate Feature shall 通知購読、イベントリスナー、接続監視、関連timerを解放する
5. The Heart Rate Feature shall 再接続、再プレイ、タイトル復帰を繰り返しても同一通知を重複記録しない
6. The Heart Rate Feature shall 結果画面の確定済みグラフを後続のBluetooth通知で変更しない
7. The Heart Rate Feature shall Bluetoothデバイスの接続継続範囲を設計で明示し、不要な画面で接続を残さない

### Requirement 9: プライバシーと安全な表示

**Objective:** As a プレイヤー, I want 心拍データが必要以上に保存・共有されないことを理解したい, so that 安心して展示ゲームを利用できる

#### Acceptance Criteria

1. The Heart Rate Feature shall 接続前に心拍数をプレイ中に表示し、今回の結果グラフのため一時記録することを明示する
2. The Heart Rate Feature shall 心拍サンプル、集計値、Bluetooth device IDをランキングAPIへ送信しない
3. The Heart Rate Feature shall 心拍サンプルと集計値をSQLite、localStorage、cookie、ログへ保存しない
4. The Heart Rate Feature shall タイトル復帰後に前プレイヤーの心拍数またはグラフを表示しない
5. The Heart Rate Feature shall 心拍表示がフィットネスおよびゲーム演出用であり、医療用途ではないことを結果画面または接続案内で示す
6. The Heart Rate Feature shall BPMに基づく診断、危険判定、健康助言、治療提案を表示しない
7. The Heart Rate Feature shall 心拍データをスコア、難易度、ランキング順位の決定に使用しない

### Requirement 10: アクセシビリティと表示品質

**Objective:** As a プレイヤー, I want 心拍情報を読み取りやすい形で確認したい, so that 接続状態や結果を誤解しにくい

#### Acceptance Criteria

1. The Heart Rate Feature shall 現在心拍数を支援技術から「心拍数、数値、BPM」と理解できるラベルで提供する
2. The Heart Rate Feature shall 接続中、接続済み、受信待ち、切断、非対応を色以外でも区別する
3. The Result Screen shall 心拍グラフへ内容を説明する見出しとアクセシブルなテキスト要約を提供する
4. The Heart Rate Feature shall 320px幅から想定展示画面まで、主要ゲーム情報と心拍表示をコンテナからはみ出させない
5. The Heart Rate Feature shall `prefers-reduced-motion`有効時に心拍同期アニメーションを停止または簡略化する
6. The Heart Rate Feature shall 心拍数更新のたびに支援技術へ過剰なライブ通知を行わない

### Requirement 11: テストと実機確認

**Objective:** As a 開発者, I want Bluetooth境界と集計表示を自動・実機の両方で確認したい, so that 展示中の接続やグラフの回帰を減らせる

#### Acceptance Criteria

1. The Heart Rate Feature shall 8bit、16bit、不完全、妥当範囲外のHeart Rate Measurement解析を純粋関数としてテストする
2. The Heart Rate Feature shall 心拍サンプルの時系列化、最小、平均、最大、欠落区間の扱いを純粋関数としてテストする
3. The Heart Rate Feature shall Web Bluetooth APIを薄いアダプターへ分離し、モックアダプターで接続、通知、切断、再接続をテストできるようにする
4. The Heart Rate Feature shall Web Bluetoothが存在しないテスト環境でも例外なくゲームを表示できるようにする
5. The Heart Rate Feature shall 心拍あり、心拍なし、途中切断の結果画面をコンポーネントまたはE2Eで確認できるようにする
6. The Heart Rate Feature shall 既存のカメラ、モック姿勢、ゲーム進行、ランキングE2Eを壊さない
7. The Heart Rate Feature shall 型チェック、ユニットテスト、ビルド、E2Eを成功させる
8. The Heart Rate Feature shall 実機のFitbit Airと対応ブラウザで接続、ライブ更新、切断、再接続、結果グラフを手動確認するまで実装完了扱いにしない

## 手動確認観点

- Google HealthアプリでFitbit Airの心拍数共有を有効にできる。
- Chrome系ブラウザの接続操作からFitbit Airを選択できる。
- 接続後、Fitbit Airの心拍変化がプレイ中HUDへライブ反映される。
- 接続操作なしにブラウザのデバイス選択画面が突然表示されない。
- Web Bluetooth非対応ブラウザでは対応環境の案内が表示され、ゲーム本体は遊べる。
- SSHポートフォワーディングの`localhost`表示でも、ブラウザ端末側のBluetoothへ接続できる。
- 心拍通知が5秒以上届かない場合に、古い数値をライブ値として表示し続けない。
- カウントダウン開始前の心拍値が今回の結果グラフへ混入しない。
- ゲーム途中でFitbit Airを切断しても、壁、判定、スコア、結果が継続する。
- 再接続後の心拍値が同じグラフへ追加され、切断区間が連続線で補間されない。
- 結果画面で心拍グラフと最小、平均、最大、記録時間を確認できる。
- 心拍データが0件または1件の場合も結果画面が破綻しない。
- 再プレイでは心拍記録が空から始まり、前回データが混ざらない。
- タイトル復帰後に前プレイヤーの心拍数と結果グラフが残らない。
- 心拍サンプルがランキングAPI、SQLite、localStorage、ログへ保存されない。
- 320px幅と想定展示画面で、心拍HUDと結果グラフが主要操作を隠さない。
- 実機の腕の動きによる一時的な読み取り停止を、ゲーム失敗や医療警告として扱わない。

## 参照情報

- `https://github.com/taku0193/fitbit-air-heart-rate`
- `https://support.google.com/product-documentation/answer/16923066`
- `https://support.google.com/googlehealth/answer/14236705`
- `https://developer.mozilla.org/docs/Web/API/Web_Bluetooth_API`

参照リポジトリはBLEサービス、Heart Rate Measurement解析、接続ライフサイクルの概念確認に
使用します。本プロジェクトでは既存のReact、ゲーム状態、HUD、結果画面の責務に合わせて
設計し、要求確認後に独自のモジュール構成を決定します。
