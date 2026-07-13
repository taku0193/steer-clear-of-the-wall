# Implementation Plan

## 方針

- 順位、入力検証、DB、API、UI、配備を責務ごとに分離する。
- ゲーム本体はランキング障害時も継続可能にする。
- SQLiteとAPIを先にテストし、UIから未検証の永続化処理を直接呼ばない。
- ランキングはゲーム端末PCのゲーム内overlayだけで表示する。
- 公開ドメイン、HTTPS証明書、Nginxを運用前提にしない。
- 完了済みのタスク1〜9は初期ランキング実装の履歴として保持し、開始前ニックネーム入力への
  仕様変更はタスク10で差分実装した。
- 完了済みのタスク5、7、9に含まれる公開ページ、QR、スマートフォン、Nginx関連は実装履歴として
  保持し、現在のローカル運用方針に不要な成果物をタスク11で除去する。
- 完了済みタスク内の`Requirements`は実装当時の旧番号を履歴として残し、現行要求との対応は
  末尾の`Requirements Coverage`を正とする。

## Tasks

- [x] 1. ランキング型、入力検証、順位ロジックを実装する
  - 作業内容: submission、entry、snapshot、API errorの型を定義する。
  - 作業内容: 表示名のNFKC、空白正規化、grapheme数、危険文字検証を純粋関数で実装する。
  - 作業内容: 数値範囲、UUID、順位比較、同点順序を純粋関数として実装する。
  - 変更するファイル: `src/ranking/rankingTypes.ts`, `rankingValidation.ts`, `rankingOrder.ts`, 関連テスト
  - 依存関係: なし
  - 完了条件: 日本語、絵文字、結合文字を1〜12 graphemeとして正しく扱う。
  - 完了条件: スコア、クリア枚数、ミス数、日時、IDの順序が要求どおりになる。
  - 確認方法: table-drivenユニットテスト。
  - _Requirements: 1.2-1.5, 2.1-2.6, 6.3, 9.3, 9.4, 10.1_
  - _Boundary: Ranking Domain_

- [x] 2. SQLite repositoryとmigrationを実装する
  - 作業内容: `better-sqlite3`と型定義を追加し、server-only repositoryを作る。
  - 作業内容: schema migration、WAL、busy timeout、prepared statementを実装する。
  - 作業内容: insert、Top 100、総件数、登録順位、重複、health queryを実装する。
  - 作業内容: productionとtestでDB path・connectionを分離する。
  - 変更するファイル: `package.json`, lockfile, `src/ranking/rankingRepository.ts`, migration、関連テスト
  - 依存関係: 1
  - 完了条件: 再open後もデータを保持し、同点順序とUNIQUE constraintが一致する。
  - 完了条件: DB fileを`public/`へ作らず、未設定productionでは安全に失敗する。
  - 確認方法: 一時ディレクトリの実SQLite統合テスト。
  - _Requirements: 1.4, 1.8, 2.1-2.6, 6.4, 7.1-7.7, 9.5, 9.6, 10.2_
  - _Boundary: Ranking Persistence_

- [x] 3. ランキングAPIとhealth endpointを実装する
  - 作業内容: serviceで検証、repository、公開DTO、domain error変換を統合する。
  - 作業内容: `GET/POST /api/rankings`と`GET /api/health`をNode runtimeのRoute Handlerとして追加する。
  - 作業内容: 8KB body上限、no-store、400・409・413・500・503 responseを実装する。
  - 作業内容: server logへ内部例外を記録し、clientへ内部情報を返さない。
  - 変更するファイル: `src/ranking/rankingService.ts`, `rankingErrors.ts`, `app/api/rankings/route.ts`, `app/api/health/route.ts`, 関連テスト
  - 依存関係: 2
  - 完了条件: GET空状態、POST成功、重複、入力不正、DB障害をHTTP境界で区別する。
  - 完了条件: cameraやgame moduleをserver routeへimportしない。
  - 確認方法: Route Handlerテストと実SQLite APIテスト。
  - _Requirements: 1.4-1.8, 6.1-6.8, 7.7, 9.5, 9.6, 10.3_
  - _Boundary: Ranking HTTP API_

- [x] 4. ランキングclientと共通表示UIを実装する
  - 作業内容: GET・POST response parserとAbortController対応clientを追加する。
  - 作業内容: loading、success、empty、refreshing、errorを扱うranking hookを追加する。
  - 作業内容: Top 3、4位以下、最新entry強調、最終更新、手動更新を持つ`RankingPanel`を追加する。
  - 作業内容: 表示中だけ10秒pollingし、更新失敗時も既存データを保持する。
  - 変更するファイル: `src/ranking/rankingClient.ts`, hook, `src/components/ranking/RankingPanel.tsx`, `RankingTable.tsx`
  - 依存関係: 1, 3
  - 完了条件: game overlayと公開pageから同じpanelを利用できる。
  - 完了条件: API不正responseでも画面全体をcrashさせない。
  - 確認方法: parserユニットテスト、component状態確認。
  - _Requirements: 2.5, 2.6, 3.3, 3.4, 3.6, 3.7, 4.4-4.7, 7.7_
  - _Boundary: Shared Ranking Client UI_

- [x] 5. 公開ランキングページとQR endpointを実装する
  - 作業内容: game Appを読み込まない`/ranking`ページと専用metadataを追加する。
  - 作業内容: `qrcode`と型定義を追加し、公開URLだけからSVGを生成するendpointを追加する。
  - 作業内容: QR、文字URL、未設定状態を表示する`RankingQrCode`を追加する。
  - 作業内容: productionでHTTPSと`/ranking` pathnameを検証する。
  - 変更するファイル: `app/ranking/page.tsx`, `app/api/ranking-qr/route.ts`, `RankingQrCode.tsx`, `package.json`, lockfile
  - 依存関係: 3, 4
  - 完了条件: `/ranking`がcamera・MediaPipe・game Canvasを初期化しない。
  - 完了条件: QRに個人情報を含めず、未設定時はQRを隠す。
  - 確認方法: route responseテスト、QR SVG内容確認、ページE2E。
  - _Requirements: 4.1-4.7, 5.1-5.6, 9.7_
  - _Boundary: Public Ranking and QR_

- [x] 6. 結果登録とゲーム内ランキングoverlayを統合する
  - 作業内容: game sessionごとにUUIDを生成し、結果画面へsubmission IDを渡す。
  - 作業内容: 表示名、公開注意、validation、送信、成功順位、再試行を持つ登録フォームを追加する。
  - 作業内容: タイトル・結果画面へランキング導線を追加し、共通panelをfull viewport dialogで表示する。
  - 作業内容: 結果状態と直前entry IDを保持したままoverlayを開閉する。
  - 作業内容: 入力・送信・overlay利用後は結果画面の15秒自動復帰を停止する。
  - 変更するファイル: `src/App.tsx`, `TitleScreen.tsx`, `ResultScreen.tsx`, `ResultSubmissionForm.tsx`, `RankingOverlay.tsx`
  - 依存関係: 4, 5
  - 完了条件: 1結果を1回だけ登録し、再プレイ時は新しいsubmission IDになる。
  - 完了条件: overlay中にcamera、pose detector、game timerを起動しない。
  - 確認方法: 状態遷移テスト、登録からhighlightまでのE2E。
  - _Requirements: 1.1-1.8, 3.1-3.7, 5.1, 9.1, 9.2_
  - _Boundary: Game Ranking Integration_

- [x] 7. ランキングUIをデスクトップ・スマートフォンへ最適化する
  - 作業内容: podium、順位表、登録フォーム、QR、dialogのCSSを追加する。
  - 作業内容: 320px・390pxでは補助情報を行内へ折り返し、横スクロールをなくす。
  - 作業内容: focus trap、Escape、ARIA、固定寸法、長い表示名の折返しを実装する。
  - 作業内容: ゲームHUD、音声操作、既存結果UIと重ならない配置を確認する。
  - 変更するファイル: `src/styles/ranking.css`, `src/style.css`, ranking components
  - 依存関係: 5, 6
  - 完了条件: desktop、390px、320pxで文字・QR・操作が画面外へ出ない。
  - 完了条件: keyboardだけで開閉、更新、登録、戻るを操作できる。
  - 確認方法: Playwright screenshot、viewport・intersection assertion、keyboard E2E。
  - _Requirements: 3.3-3.7, 4.2-4.6, 5.4-5.6, 9.3, 9.7, 10.5_
  - _Boundary: Ranking Responsive UX_

- [x] 8. ランキングの全自動検証を整備する
  - 作業内容: domain、repository、API、client parserのテストを完成させる。
  - 作業内容: 結果登録、重複防止、overlay、公開page、polling、QRをE2Eへ追加する。
  - 作業内容: 一時DBをテストごとに分離し、production DBへ触れないようにする。
  - 作業内容: 型チェック、全ユニットテスト、ビルド、E2Eを実行する。
  - 変更するファイル: rankingテスト、`tests/e2e/ranking.spec.ts`, Playwright設定
  - 依存関係: 1-7
  - 完了条件: 既存ゲーム、音声、ビジュアルE2Eを含む全検証が成功する。
  - 完了条件: テスト終了後にtimer、DB connection、一時ファイルを残さない。
  - 確認方法: 全品質コマンドとテスト結果報告。
  - _Requirements: 10.1-10.5, 10.8_
  - _Boundary: Ranking Automated Validation_

- [x] 9. production・Nginx・systemd・バックアップ設定を作成する
  - 作業内容: production env、Nginx、systemdの設定テンプレートを追加する。
  - 作業内容: Next.jsを`127.0.0.1`だけでlistenさせるproduction commandを整える。
  - 作業内容: HTTPS redirect、8KB body、rate limit、security header、proxy headerを定義する。
  - 作業内容: install、反映、health確認、log確認、rollback、SQLite backup・restore手順を記載する。
  - 作業内容: anti-cheatの制限と個人情報を保存しないことをREADMEへ記載する。
  - 変更するファイル: `deploy/`, `package.json`, `README.md`, production env example
  - 依存関係: 2, 3, 5, 8
  - 完了条件: placeholderのドメイン以外は再現可能な設定例になる。
  - 完了条件: secret、実DB、証明書private keyをrepositoryへ追加しない。
  - 確認方法: Nginx config構文の静的確認、production build・start、手順レビュー。
  - _Requirements: 7.2, 7.5, 7.6, 8.1-8.9, 9.6, 10.6_
  - _Boundary: Production Deployment Assets_

- [x] 10. 開始前ニックネーム入力と結果の自動登録へ移行する
  - 作業内容: タイトル画面へニックネーム入力、公開注意、validation feedbackを追加し、有効な入力後だけゲームを開始する。
  - 作業内容: 確定したニックネームを`App`のメモリ上で保持し、再プレイでは引き継ぎ、明示・自動のタイトル復帰では消去する。
  - 作業内容: 新しいゲームセッションごとにsubmission IDを生成し、結果確定時にニックネームと結果を一度だけ自動送信する。
  - 作業内容: 結果画面の登録フォームを`submitting`、`success`、`error`と再試行操作を示す登録状態表示へ置き換える。
  - 作業内容: React Strict Modeのeffect再実行と再送で二重登録せず、失敗時は同じsubmission IDと結果を保持する。
  - 作業内容: 結果画面の15秒自動復帰を登録成功後に開始し、送信中・失敗中は明示的なタイトル復帰だけを提供する。
  - 作業内容: ニックネーム入力と登録状態表示を既存のデスクトップ・モバイルUIへ合わせて調整する。
  - 変更するファイル: `src/App.tsx`, `TitleScreen.tsx`, `ResultScreen.tsx`, `src/components/ranking/`, ranking CSS、関連テスト、`README.md`
  - 依存関係: 1, 3, 4, 6-8
  - 完了条件: 結果画面で文字入力せず、開始前のニックネームで1結果を1回だけ自動登録できる。
  - 完了条件: API障害時もゲームを開始でき、結果と再試行操作を失わない。
  - 完了条件: 再プレイ時はニックネームを引き継ぎ、タイトルへ戻ると共有端末に残らない。
  - 確認方法: validationユニットテスト、状態遷移テスト、ランキングE2E、型チェック、全ユニットテスト、ビルド。
  - 確認結果: 型チェック、29ファイル154件のユニットテスト、production build、9件のChromium E2Eが成功した。
  - _Requirements: 1.1-1.10, 3.4, 7.7, 9.1-9.4, 10.1, 10.3-10.5, 10.8_
  - _Boundary: Game Ranking Integration Change_

- [x] 11. 公開機能を除去してゲーム端末のローカルランキングへ整理する
  - 作業内容: タイトル画面とランキングdialogからQRコード、公開URL、スマートフォン案内を削除する。
  - 作業内容: `app/ranking/`、`app/api/ranking-qr/`、`PublicRankingPage`、`RankingQrCode`を削除する。
  - 作業内容: `qrcode`、`@types/qrcode`、`NEXT_PUBLIC_RANKING_URL`、公開ページ用の10秒pollingを削除する。
  - 作業内容: Nginx、公開用systemd、証明書、公開URL用の設定テンプレートとREADME記述を削除する。
  - 作業内容: ゲーム内ランキング、ランキングAPI、SQLite、backup script、ローカルproduction起動手順を維持する。
  - 作業内容: READMEへ同じPCの`localhost`でゲーム内ランキングを確認する手順、health、backup・restoreを記載する。
  - 作業内容: 公開ページ・QRのE2Eを削除し、ゲーム内overlay、自動登録、QR非表示、削除routeの404を検証する。
  - 変更するファイル: `src/App.tsx`, `TitleScreen.tsx`, `src/components/ranking/`, `src/ranking/useRanking.ts`, `app/`, `deploy/`, `package.json`, lockfile, `playwright.config.ts`, `README.md`, ranking E2E
  - 依存関係: 1-10
  - 完了条件: タイトルとランキングdialogにQRや公開URLが表示されず、`/ranking`と`/api/ranking-qr`が提供されない。
  - 完了条件: 同じPCでニックネーム入力、結果自動登録、Top 100表示、再起動後保持、backupを利用できる。
  - 完了条件: `qrcode`、公開URL環境変数、Nginx・公開用systemd成果物が残らない。
  - 確認方法: `rg`による残存参照確認、型チェック、全ユニットテスト、production build、Chromium E2E、ローカルhealth確認。
  - 確認結果: 残存参照なし、型チェック、29ファイル154件のユニットテスト、公開routeを含まないproduction build、11件のChromium E2E、ローカルhealth、SQLite backupが成功した。
  - _Requirements: 3.1-3.7, 4.1-4.8, 5.1-5.7, 6.1-6.7, 7.1-7.7, 8.3-8.7_
  - _Boundary: Local Ranking Simplification_

## Requirements Coverage

| Requirement | Covered by Tasks |
|---|---|
| 1 | 1-3, 6, 8, 10 |
| 2 | 1-4, 8 |
| 3 | 4, 6-8, 10, 11 |
| 4 | 1-4, 8, 11 |
| 5 | 2, 3, 8, 9, 11 |
| 6 | 9, 11 |
| 7 | 1-3, 6, 10, 11 |
| 8 | 1-11 |
