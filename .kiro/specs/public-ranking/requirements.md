# Requirements Document

## Introduction

`public-ranking`は、ゲーム結果をゲーム端末のSQLiteへ保存し、同じPCのゲーム内画面で
ランキングを確認できるようにする機能です。インターネット公開やスマートフォン閲覧は行わず、
展示運営を複雑にしないローカルランキングとして提供します。

## 前提と初期方針

- アカウント登録やログインは導入しない。
- プレイヤーはゲーム開始前にランキング表示用のニックネームを入力する。
- ランキングは会場の全参加者で共有する全期間ランキングとする。
- スコアデータはゲーム端末上のSQLiteへ永続化する。
- ランキングはゲームを実行するPCのゲーム内画面だけで確認する。
- カメラ画像、姿勢ランドマーク、端末情報、IPアドレスはランキングDBへ保存しない。

## 対象範囲

### 今回含める範囲

- ゲーム開始前のニックネーム設定とゲーム終了後のスコア自動登録
- 全期間Top 100ランキング
- ゲーム内ランキング画面
- 最新順位と自分の登録結果の強調表示
- SQLiteによる永続化
- 入力検証、重複登録防止、リクエストサイズ制限
- ゲーム端末上での起動、停止、バックアップ手順
- バックアップ、ヘルスチェック、障害時表示

### 今回含めない範囲

- ユーザーアカウント、パスワード、SNSログイン
- 個人別の過去履歴ページ
- 賞品発送、メール通知、課金
- 複数会場を分離する大会管理画面
- 運営者向けの削除・編集管理画面
- カメラ画像や姿勢データの保存
- QRコード表示
- スマートフォン向けランキングページと独立した`/ranking`ページ
- インターネット公開、公開ドメイン、HTTPS証明書、Nginx reverse proxy
- 会場LANを含む別端末からのランキング閲覧

## Requirements

### Requirement 1: ランキング登録

**Objective:** As a プレイヤー, I want ゲーム開始前に設定したニックネームで結果を自動登録したい, so that 結果画面の自動復帰を気にせず会場の参加者と順位を競える

#### Acceptance Criteria

1. When タイトル画面を表示する, the Ranking System shall ランキング表示用のニックネーム入力をゲーム開始操作より前に表示する
2. The Ranking System shall ニックネームを1〜12文字とし、日本語、英数字、一般的な空白を入力できる
3. The Ranking System shall 空文字、制御文字、HTMLタグ相当の不正入力、上限超過を拒否し、有効なニックネームが設定されるまでゲーム開始を受け付けない
4. When ゲーム結果が確定する, the Ranking System shall 開始前に設定したニックネーム、最終スコア、クリア枚数、最高速度レベル、ミス数、達成日時を自動登録する
5. The Ranking System shall カメラ画像、姿勢ランドマーク、IPアドレスをランキングレコードへ保存しない
6. When 登録が成功する, the Ranking System shall 順位と登録済み状態を結果画面へ表示する
7. If 登録に失敗する, the Ranking System shall ゲーム結果を失わず再試行可能なエラーを表示する
8. The Ranking System shall 1回のゲームセッションから同じ結果を複数登録できないようにする
9. When 結果画面からもう一度プレイする, the Ranking System shall 設定済みのニックネームを引き継ぐ
10. When 結果画面からタイトルへ戻る、または自動復帰する, the Ranking System shall 次のプレイヤーのため設定済みのニックネームを消去する

### Requirement 2: 順位決定

**Objective:** As a プレイヤー, I want 公平で分かりやすい順序を確認したい, so that 自分の成績を納得して比較できる

#### Acceptance Criteria

1. The Ranking System shall 最終スコアの降順で順位を決定する
2. If 最終スコアが同じである, the Ranking System shall クリア枚数の降順を優先する
3. If スコアとクリア枚数が同じである, the Ranking System shall ミス数の昇順を優先する
4. If それらも同じである, the Ranking System shall 達成日時が早い結果を優先する
5. The Ranking System shall 上位100件を返す
6. The Ranking System shall 順位、表示名、スコア、クリア枚数、最高速度、達成日時を表示する

### Requirement 3: ゲーム内ランキング画面

**Objective:** As a 会場のプレイヤー, I want ゲーム端末でランキングを確認したい, so that プレイ前後に上位記録を把握できる

#### Acceptance Criteria

1. The Game shall タイトル画面と結果画面からランキング画面を開ける
2. The Game shall ランキング画面からタイトルまたは直前の結果画面へ戻れる
3. The Game shall 1位から3位を強調し、4位以下を走査しやすい表形式で表示する
4. When 直前の登録結果が存在する, the Game shall 該当行と順位を強調表示する
5. While ランキング画面を表示する, the Game shall カメラ、姿勢検出、ゲームtimerを起動しない
6. If ランキングが空である, the Game shall 最初の記録を促す空状態を表示する
7. If 取得に失敗する, the Game shall 再読込操作とゲームへ戻る操作を表示する

### Requirement 4: ランキングAPI

**Objective:** As a システム, I want ゲーム端末内の安全なAPIで結果を保存・取得したい, so that ゲームUIとSQLiteの責務を分離できる

#### Acceptance Criteria

1. The Ranking API shall `GET /api/rankings`で上位100件をJSONとして返す
2. The Ranking API shall `POST /api/rankings`で検証済みのゲーム結果を登録する
3. The Ranking API shall クライアント送信値を信用せず、型、範囲、文字数、必須項目をサーバー側で検証する
4. The Ranking API shall ゲームごとの一意なsubmission IDで重複登録を拒否する
5. The Ranking API shall 不正入力、重複、内部障害を異なるHTTP statusで返す
6. The Ranking API shall JSON body sizeを制限する
7. The Ranking API shall ランキング応答へ`Cache-Control: no-store`を設定する
8. The Ranking API shall `GET /api/health`でprocessとDB接続状態を確認できる

### Requirement 5: 永続化

**Objective:** As a 展示運営者, I want 再起動後もランキングを保持したい, so that 会期中の記録を失わず運用できる

#### Acceptance Criteria

1. The Ranking System shall ゲーム端末上のSQLiteファイルへランキングを保存する
2. The Ranking System shall SQLiteファイルの保存先を環境変数で指定できる
3. The Ranking System shall schema versionとmigration手順を持つ
4. The Ranking System shall 短時間の連続登録でDB lockを常態化させない
5. The Ranking System shall DBディレクトリとファイルを公開静的ディレクトリへ置かない
6. The Ranking System shall バックアップと復元手順をREADMEへ記載する
7. If DBを利用できない, the Ranking System shall ゲーム本体を継続しランキングだけをエラー表示にする

### Requirement 6: ゲーム端末でのローカル運用

**Objective:** As a 展示運営者, I want 1台のゲーム端末だけでランキングを運用したい, so that 公開サーバーの準備なしで展示を開始できる

#### Acceptance Criteria

1. The Game shall ゲームを実行するPCのブラウザからゲーム内ランキングを確認できる
2. The Game shall QRコード、公開URL、スマートフォン向けランキング導線を表示しない
3. The Deployment shall 公開ドメイン、HTTPS証明書、Nginxをランキング利用の前提にしない
4. The Deployment shall `RANKING_DATABASE_PATH`をゲーム端末の環境へ設定できる
5. The Deployment shall production buildとローカルのproduction serverでゲームとランキングAPIを提供できる
6. The Deployment shall ゲーム端末での起動、停止、health確認、SQLite backup・restore手順をREADMEへ記載する
7. When Next.js processを再起動する, the Ranking System shall SQLite上のランキングを保持する

### Requirement 7: 入力安全性とプライバシー

**Objective:** As a 参加者, I want 会場のランキングを安心して利用したい, so that 不要な個人情報を渡さず登録できる

#### Acceptance Criteria

1. The Ranking System shall ニックネームがゲーム端末のランキングに表示されることと本名を入力しないことをゲーム開始前に明示する
2. The Ranking System shall 本名、メールアドレス、電話番号を要求しない
3. The Ranking System shall 表示名をHTMLとして解釈しない
4. The Ranking System shall 制御文字と不可視の危険な文字列を拒否または正規化する
5. The Ranking API shall SQLをparameter bindingで実行する
6. The Ranking System shall 秘密情報、DB path、内部エラー詳細をクライアントへ返さない
7. The Ranking Screen shall 音声なしでランキングを閲覧できる

### Requirement 8: テストと運用確認

**Objective:** As a 開発者, I want 保存・順位・ゲーム内導線を検証したい, so that 展示中にランキングが破綻しない

#### Acceptance Criteria

1. The Ranking System shall 入力検証と順位比較を純粋関数としてテストする
2. The Ranking System shall 一時DBを使って登録、取得、重複、同点順位をテストする
3. The Ranking System shall APIの正常系と主要な異常系をテストする
4. The Ranking System shall ゲーム結果登録からランキング表示までをE2Eで確認する
5. The Ranking Screen shall ゲーム端末の想定画面サイズでvisual確認する
6. The Deployment shall ゲーム端末のローカルURLからhealth、ゲーム内ランキング、APIを確認する
7. The Ranking System shall 型チェック、全ユニットテスト、ビルド、E2Eを成功させる

## ローカル運用で決定する情報

- ゲーム端末上のSQLite保存先
- バックアップ保存先と保存期間
- ローカルproduction serverの起動・停止方法

## 手動確認観点

- タイトル画面でニックネームを入力し、結果確定後に1回だけ自動登録される。
- もう一度プレイするとニックネームが引き継がれ、タイトルへの復帰時には消去される。
- 同点時にスコア、クリア枚数、ミス数、達成日時の順で順位が決まる。
- 直前の登録結果がゲーム端末のランキングで強調される。
- タイトル画面と結果画面からゲーム内ランキングを確認できる。
- QRコードやスマートフォン向けランキング導線が表示されない。
- Next.js再起動後もランキングが残る。
- DB障害時もゲーム本体をプレイできる。
