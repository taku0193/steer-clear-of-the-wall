# Requirements Document

## Introduction

`game-audio`は、`steer-clear-of-the-wall`へBGMと効果音を追加し、壁が迫る緊張感、
回避の成功感、失敗や速度上昇の分かりやすさを音でも伝える機能です。

今回の改訂では、カウントダウンの日本語読み上げを削除し、短い電子カウント音へ
一本化します。BGMは「近未来アーケード × 体感スポーツ」に合うリズム主体を維持します。

ブラウザの自動再生制限と展示運用を考慮し、ユーザー操作後にだけ音声を開始します。
カメラのマイク音声は取得せず、ゲーム音だけを再生します。

## 基本方針

- 外部の著作物を無断使用しない。
- 初期実装はWeb Audio APIによるオリジナルの合成音とループを基本とする。
- ゲーム状態と音声再生の責務を分離する。
- ミュート、音量、画面遷移、再試行で音が重複しないようにする。
- 音がなくても既存の視覚情報だけでゲームを遊べる状態を維持する。

## 対象範囲

### 今回含める範囲

- タイトル・準備用BGM
- プレイ中BGM
- 短い電子音によるカウントダウン
- 結果画面の短い音楽反応
- ボタン、カウントダウン、壁出現、成功、失敗、速度上昇、ゲーム終了の効果音
- 全体ミュート
- BGMと効果音の音量調整
- 設定のブラウザ内保存
- 自動再生制限、タブ非表示、画面遷移への対応
- モック姿勢と実カメラの両方への対応

### 今回含めない範囲

- マイク入力、音声認識、カメラ映像の音声取得
- 外部音楽配信サービス
- 市販楽曲や権利確認できない音源
- ユーザーによる音源アップロード
- 高度なDAW相当の作曲・編集機能
- サラウンド音響や端末別イコライザー

## Requirements

### Requirement 1: 音声開始とブラウザ制約

**Objective:** As a プレイヤー, I want 自分の操作後にゲーム音が始まる, so that ブラウザ制限に妨げられず予期しない音も鳴らない

#### Acceptance Criteria

1. The Game Audio shall ページ読み込み直後に音声を自動再生しない
2. When プレイヤーがゲーム開始または音声操作を行う, the Game Audio shall AudioContextを開始または再開する
3. If ブラウザが音声開始を拒否する, the Game Audio shall ゲーム進行を止めずミュート状態として継続する
4. The Game Audio shall 同じユーザー操作で複数のAudioContextを生成しない
5. The Game Audio shall カメラ取得時に音声トラックを要求しない

### Requirement 2: BGM

**Objective:** As a プレイヤー, I want 画面状態に合ったBGMを聞ける, so that ゲームの緊張感と進行を感じられる

#### Acceptance Criteria

1. While タイトルまたはカメラ準備中である, the Game Audio shall 控えめな待機BGMを再生できる
2. While カウントダウンまたはプレイ中である, the Game Audio shall テンポと緊張感のあるプレイBGMを再生する
3. When 結果画面へ移行する, the Game Audio shall プレイBGMを停止し短い結果反応へ切り替える
4. When エラー画面へ移行する, the Game Audio shall プレイBGMを停止する
5. The Game Audio shall BGMループ境界で大きな無音やクリックノイズを発生させない
6. The Game Audio shall タイトル復帰、再試行、再プレイでBGMを二重再生しない
7. The Game Audio shall 待機BGMとプレイBGMをテンポ、リズム密度、楽器構成で明確に区別する
8. The Game Audio shall プレイBGMにドラム、ベース、コード、短いリードを持たせる
9. The Game Audio shall 単純なsquare波の単音反復を主旋律として使用しない
10. The Game Audio shall 4小節以上の周期でリズムまたはフレーズに変化を設ける
11. The Game Audio shall 成功、失敗、未検出、速度上昇の効果音をBGMへ埋もれさせない
12. The Game Audio shall 実ブラウザ試聴で待機用とプレイ用の両方を確認するまでBGM刷新を完了扱いにしない

### Requirement 3: カウントダウン効果音

**Objective:** As a プレイヤー, I want 開始時刻を音でも把握できる, so that 画面から少し目を離していても構えられる

#### Acceptance Criteria

1. When `3`、`2`、`1`へ切り替わる, the Game Audio shall 各数字に短い電子カウント音を1回再生する
2. The Game Audio shall 表示中の数字と電子カウント音を同期させる
3. When プレイ開始へ移行する, the Game Audio shall カウント音と区別できる開始音を再生する
4. The Game Audio shall カウントダウン再試行で過去のカウント音を残さない
5. When ミュートが有効である, the Game Audio shall 電子カウント音を再生しない

### Requirement 4: プレイ効果音

**Objective:** As a プレイヤー, I want 壁と判定の状態を音で理解できる, so that 次の動作へ素早く移れる

#### Acceptance Criteria

1. When 新しい壁が出現する, the Game Audio shall 短い出現音を再生する
2. When 回避に成功する, the Game Audio shall 明るい成功音を1回再生する
3. When 回避に失敗する, the Game Audio shall 成功音と明確に異なる失敗音を1回再生する
4. When 姿勢未検出で判定不能になる, the Game Audio shall 失敗音より控えめな警告音を再生する
5. When 速度レベルが上がる, the Game Audio shall 通常成功より強い速度上昇音を再生する
6. The Game Audio shall 1回の壁判定に対して同じ効果音を複数回再生しない

### Requirement 5: UI効果音

**Objective:** As a プレイヤー, I want 操作への短い反応を聞ける, so that ボタン操作が受け付けられたと分かる

#### Acceptance Criteria

1. When 主操作または副操作を実行する, the Game Audio shall 控えめな決定音を再生できる
2. The Game Audio shall disabled状態のボタンで決定音を再生しない
3. The Game Audio shall hoverだけで繰り返し音を鳴らさない
4. The Game Audio shall タイトル復帰操作後に長い音を残さない

### Requirement 6: 音量とミュート

**Objective:** As a プレイヤーまたは展示運営者, I want 音量を調整または消音できる, so that 会場や端末に合わせて運用できる

#### Acceptance Criteria

1. The Game Audio shall 全画面でアクセス可能なミュート操作を表示する
2. The Game Audio shall BGM音量と効果音音量を個別に調整できる
3. When ミュートを有効にする, the Game Audio shall 再生位置を破綻させず即座に無音にする
4. When ミュートを解除する, the Game Audio shall 現在画面に適したBGMだけを再開する
5. The Game Audio shall 音量とミュート設定をlocalStorageへ保存する
6. If 保存値が壊れている, the Game Audio shall 安全な初期値へ戻す

### Requirement 7: 音声UI

**Objective:** As a プレイヤー, I want 現在の音声状態を画面で確認できる, so that 音が出ない理由を判断できる

#### Acceptance Criteria

1. The Game Audio shall ミュート状態をスピーカー記号とアクセシブルなラベルで表示する
2. The Game Audio shall 音量設定を必要なときだけ開くメニューとして表示する
3. The Game Audio shall 音量操作をキーボードで利用できる
4. The Game Audio shall モバイルでHUD、終了操作、主要ボタンと重ならない位置へ音声操作を配置する
5. The Game Audio shall 音声UI内の文字や数値をコンテナからはみ出さない

### Requirement 8: 音声ライフサイクル

**Objective:** As a 展示運営者, I want 連続プレイしても音が重ならない, so that 長時間安定して運用できる

#### Acceptance Criteria

1. When 画面状態が変わる, the Game Audio shall 不要になったBGMと予約済み音を停止する
2. When タイトルへ戻る, the Game Audio shall プレイ用効果音と結果音を停止する
3. When ブラウザタブが非表示になる, the Game Audio shall BGMを一時停止または無音化する
4. When ブラウザタブへ戻る, the Game Audio shall 現在画面に適したBGMだけを再開する
5. When アプリがアンマウントされる, the Game Audio shall timer、oscillator、gain接続を解放する
6. The Game Audio shall 再試行を繰り返しても再生ノード数を増加させ続けない

### Requirement 9: 音源と著作権

**Objective:** As a 開発者, I want 権利上安全な音を使用する, so that 展示と公開で問題なく利用できる

#### Acceptance Criteria

1. The Game Audio shall 初期実装でWeb Audio APIによるオリジナル合成音を使用する
2. If 音声ファイルを追加する, the Game Audio shall 出典、ライセンス、加工有無をリポジトリへ記録する
3. The Game Audio shall 外部CDNから権利不明な音源を読み込まない
4. The Game Audio shall BGMと効果音の生成・再生方法をREADMEへ記載する

### Requirement 10: アクセシビリティ

**Objective:** As a 音を利用できないプレイヤー, I want 音なしでも全情報を理解できる, so that 同じゲームを遊べる

#### Acceptance Criteria

1. The Game Audio shall 成功、失敗、警告、速度上昇を音だけで通知しない
2. The Game Audio shall 既存の視覚フィードバックと文言を維持する
3. The Game Audio shall 音量初期値を突然大音量にならない範囲へ設定する
4. The Game Audio shall ミュート操作へ明確なフォーカス表示を持たせる
5. The Game Audio shall OSの音量設定を上書きしない

### Requirement 11: テストとフォールバック

**Objective:** As a 開発者, I want 音声機能を自動検証できる, so that 画面変更で音声イベントが壊れない

#### Acceptance Criteria

1. The Game Audio shall AudioContext依存をアダプターへ分離する
2. The Game Audio shall ゲーム状態からBGM種別を選ぶ処理を純粋関数としてテストする
3. The Game Audio shall 判定イベントから効果音種別を選ぶ処理を純粋関数としてテストする
4. The Game Audio shall AudioContextが存在しない環境でも例外を発生させない
5. The Game Audio shall 型チェック、ユニットテスト、ビルド、E2Eを成功させる

## 想定する音の方向性

- 待機BGM: 柔らかいコード、丸いベース、軽いパーカッションによる低密度のグルーヴ。
- プレイBGM: キック、スネア、ハイハット、動くベース、コードスタブ、短いリードによる疾走感。
- カウント: `3`、`2`、`1`に同期する短く乾いた電子音。
- 成功: 上昇する明るい2音。
- 失敗: 低く短い下降音。
- 速度上昇: 成功音を拡張した上昇フレーズ。
- 警告: 控えめな単音。
- 決定音: 短いクリックと柔らかいシンセ音。

## 手動確認観点

- 初回ページ表示だけでは音が鳴らない。
- ゲーム開始操作後に待機またはプレイBGMが始まる。
- カウント`3`、`2`、`1`と電子音が一致する。
- カウントをやり直しても前の電子音が残らない。
- 待機BGMとプレイBGMをリズムと楽器構成で聞き分けられる。
- プレイBGMが単純な電子音の反復ではなく、体を動かしたくなるグルーヴを持つ。
- 成功、失敗、未検出、速度上昇の効果音がBGMに埋もれない。
- 成功、失敗、未検出、速度上昇を聞き分けられる。
- ミュートが全画面で機能する。
- BGMと効果音の音量を個別調整できる。
- 再プレイとタイトル復帰を繰り返しても音が重ならない。
- タブ切り替え後に複数BGMが同時再生されない。
- 音が出ない環境でもゲームが進行する。
