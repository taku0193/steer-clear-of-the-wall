# Implementation Plan

## 方針

- 実装は、心拍データの純粋ロジック、Web Bluetoothアダプター、Reactライフサイクル、
  準備・プレイ・結果UI、検証、実機確認の順で進める。
- Google Health API、OAuth、外部chart library、永続ストレージは追加しない。
- 心拍状態を既存`GameState`へ混在させず、カメラ、姿勢検出、判定、スコア、ランキングから
  独立した状態として扱う。
- Bluetooth接続失敗や切断でゲーム本体を停止せず、心拍なしのフォールバックを維持する。
- 心拍サンプルはカウントダウン開始から結果確定までのメモリ内だけに保持する。
- CIではfake Web Bluetoothを使用し、Fitbit Air実機の接続品質は最後に手動確認する。
- 参照リポジトリは標準BLEプロトコルと接続ライフサイクルの概念確認に留め、既存React構成へ
  合わせて独自実装する。

## Tasks

- [x] 1. 心拍型、定数、Heart Rate Measurement解析を実装する
  - 作業内容: connection status、error、reading、sample、statistics、session resultの型を定義する。
  - 作業内容: `1..300 BPM`と5秒freshnessの定数を定義する。
  - 作業内容: Heart Rate Measurement flagsから8bit・16bit little-endian値を解析する純粋関数を実装する。
  - 作業内容: 空、不完全、DataView以外、範囲外の値を拒否するtable-drivenテストを追加する。
  - 変更するファイル: `src/heart-rate/heartRateTypes.ts`, `src/heart-rate/heartRateMeasurement.ts`, `src/heart-rate/heartRateMeasurement.test.ts`
  - 依存関係: なし
  - 完了条件: BLEやReactへ依存せず、有効な8bit・16bit BPMだけを返せる。
  - 確認方法: `npm test -- src/heart-rate/heartRateMeasurement.test.ts`
  - _Requirements: 3.2-3.7, 11.1_
  - _Boundary: Heart Rate Domain_

- [x] 2. セッション記録、segment分割、統計ロジックを実装する
  - 作業内容: idle、recording、finishedを持つ心拍セッションの純粋状態遷移を実装する。
  - 作業内容: monotonic clockから経過時間を作り、開始前・終了後・逆順・同時刻重複を処理する。
  - 作業内容: 切断または5秒超の欠落でsegment IDを更新し、欠落区間を補間しない構造にする。
  - 作業内容: 0件、1件、複数件の最小・算術平均・最大と記録時間を算出する。
  - 作業内容: resetとfinished resultのimmutabilityをユニットテストする。
  - 変更するファイル: `src/heart-rate/heartRateSession.ts`, `src/heart-rate/heartRateSession.test.ts`
  - 依存関係: 1
  - 完了条件: 実測サンプルだけから結果を確定し、切断をまたぐ連続データを作らない。
  - 確認方法: `npm test -- src/heart-rate/heartRateSession.test.ts`
  - _Requirements: 5.1-5.7, 6.2-6.6, 8.1, 8.2, 8.5, 8.6, 11.2_
  - _Boundary: Heart Rate Session Domain_

- [x] 3. Web Bluetoothアダプターを実装する
  - 作業内容: `navigator.bluetooth`、secure context、標準Heart Rate Service filterを扱うアダプターを追加する。
  - 作業内容: device chooser、GATT接続、service・characteristic取得、notification購読を実装する。
  - 作業内容: 接続中の多重呼出し抑止、選択device再利用、切断、notification停止、listener cleanupを実装する。
  - 作業内容: DOMExceptionをunsupported、insecure、cancel、connection、service、notification errorへ正規化する。
  - 作業内容: fake Bluetooth APIで接続、通知、切断、再接続、cleanupをユニットテストする。
  - 変更するファイル: `src/heart-rate/webBluetoothHeartRate.ts`, `src/heart-rate/webBluetoothHeartRate.test.ts`
  - 依存関係: 1
  - 完了条件: Web Bluetooth固有処理がこのアダプターへ閉じ、ゲームerrorへ依存しない。
  - 確認方法: adapterユニットテストと`npm run typecheck`
  - _Requirements: 1.2, 1.3, 1.5-1.7, 2.1-2.5, 3.1, 3.5, 7.1-7.3, 7.5, 8.3, 8.4, 11.3, 11.4_
  - _Boundary: Web Bluetooth Adapter_

- [x] 4. 心拍monitor hookとライフサイクルを実装する
  - 作業内容: adapter、最新reading、connection state、freshness、session recorderを統合する`useHeartRateMonitor`を追加する。
  - 作業内容: 1秒timerで5秒freshnessを判定し、staleな値を現在値として返さないようにする。
  - 作業内容: connect、disconnect、start、finish、reset、title disposeの操作を提供する。
  - 作業内容: generation IDで遅延した接続完了と前セッションのnotificationを無視する。
  - 作業内容: unmount、再接続、Strict Mode相当の再mountでtimerとlistenerを重複させない。
  - 変更するファイル: `src/heart-rate/useHeartRateMonitor.ts`, 必要な関連テスト
  - 依存関係: 2, 3
  - 完了条件: 心拍状態を`GameState`へ追加せず、画面統合に必要なview stateと操作を提供できる。
  - 確認方法: fake timerとfake adapterのhook lifecycle確認、`npm run typecheck`
  - _Requirements: 3.6, 4.2-4.4, 5.1-5.7, 7.1, 7.5, 7.6, 8.1-8.7, 11.3, 11.4_
  - _Boundary: React Heart Rate Lifecycle_

- [x] 5. 準備画面へFitbit Air接続UIを追加する
  - 作業内容: 接続状態、現在BPM、エラー、共有設定案内、非永続化方針を表示する`HeartRateConnectionPanel`を追加する。
  - 作業内容: `Fitbit Airを接続`と`再接続`を実際のbutton clickから直接adapterへ接続する。
  - 作業内容: 通常準備画面と実カメラ位置合わせ画面の両方へ、画面密度に応じたfull・compact表示を用意する。
  - 作業内容: 非対応、insecure、chooser取消、接続失敗を局所表示し、カメラとモック姿勢buttonを無効にしない。
  - 変更するファイル: `src/components/HeartRateConnectionPanel.tsx`, `src/App.tsx`, `src/styles/heart-rate.css`, `src/style.css`
  - 依存関係: 4
  - 完了条件: ゲーム開始前に接続でき、接続しない選択でも既存導線を継続できる。
  - 確認方法: 対応・非対応のブラウザ状態をfake adapterで確認し、`npm run typecheck`
  - _Requirements: 1.1-1.7, 2.1-2.6, 7.2-7.4, 9.1, 9.5, 10.2_
  - _Boundary: Preparation Heart Rate UI_

- [x] 6. Appのゲームphaseへ心拍セッションを統合する
  - 作業内容: 実カメラとモック姿勢のカウントダウン開始前に同じsession reset・start処理を呼ぶ。
  - 作業内容: result遷移で一度だけsessionをfinishし、確定resultを`ResultScreen`へ渡す。
  - 作業内容: resultとerrorでGATTを切断し、再プレイでは新規session、title復帰ではdevice参照を含め全破棄する。
  - 作業内容: 自動タイトル復帰、明示終了、ranking overlay、camera resource cleanupとの競合を防ぐ。
  - 作業内容: 心拍処理を壁進行、判定、スコア、ランキングsubmissionへ渡さない。
  - 変更するファイル: `src/App.tsx`
  - 依存関係: 4, 5
  - 完了条件: camera・mockの両方で正しい記録境界になり、結果確定後にsampleが増えない。
  - 確認方法: phase遷移確認、`npm run typecheck`、既存モック姿勢E2E
  - _Requirements: 4.7, 5.1-5.7, 6.8, 7.1, 7.4-7.7, 8.1-8.7, 9.2-9.4, 9.7_
  - _Boundary: App Integration_

- [x] 7. プレイ中HUDと再接続導線を実装する
  - 作業内容: `GameStatusHud`へ現在心拍数、BPM、LIVE、受信待ち、切断状態を追加する。
  - 作業内容: staleまたは切断時は古い数値を現在値として残さず`-- BPM`を表示する。
  - 作業内容: 切断時だけ表示する小さな再接続buttonを追加し、ゲームを一時停止しない。
  - 作業内容: BPM更新でCanvasやgame loopを再初期化せず、支援技術への連続live通知を避ける。
  - 変更するファイル: `src/components/GameStatusHud.tsx`, `src/components/GameScreen.tsx`, `src/App.tsx`, `src/styles/game.css`, `src/styles/heart-rate.css`
  - 依存関係: 4, 6
  - 完了条件: live、waiting、stale、disconnectedを色以外でも判別でき、ゲーム進行へ影響しない。
  - 確認方法: fake notification、fake timer、ブラウザ表示確認
  - _Requirements: 4.1-4.7, 7.1, 7.4-7.7, 10.1, 10.2, 10.6_
  - _Boundary: Playing Heart Rate HUD_

- [x] 8. 結果画面の心拍統計とSVGグラフを実装する
  - 作業内容: 経過時間からx座標、BPM domainからy座標、segmentごとのpolylineを作る純粋なchart modelを実装する。
  - 作業内容: 0件、1件、複数件、同一BPM、5秒超gapを扱う`HeartRateChart`を追加する。
  - 作業内容: 最小、平均、最大、記録時間、欠落注記、非医療用途注記を持つ`HeartRateResultPanel`を追加する。
  - 作業内容: `ResultScreen`へpanelを統合し、既存結果、ランキング登録、再プレイ、自動復帰を維持する。
  - 作業内容: chart modelと特殊ケースのユニットテストを追加する。
  - 変更するファイル: `src/heart-rate/heartRateChart.ts`, 関連テスト, `src/components/HeartRateChart.tsx`, `src/components/HeartRateResultPanel.tsx`, `src/components/ResultScreen.tsx`, `src/styles/heart-rate.css`
  - 依存関係: 2, 6
  - 完了条件: 欠落区間を線で結ばず、グラフがなくてもtextだけで結果を理解できる。
  - 確認方法: chartユニットテスト、result画面表示確認
  - _Requirements: 6.1-6.8, 9.5, 9.6, 10.3, 11.2, 11.5_
  - _Boundary: Result Heart Rate Visualization_

- [x] 9. 心拍UIのresponsive表示とアクセシビリティを調整する
  - 作業内容: desktop HUDを5列、mobile HUDを3段gridへ調整する。
  - 作業内容: camera preparation、320px幅、390px幅、low-heightで接続UIと主要操作を収める。
  - 作業内容: result panelとgraphを通常scroll内に配置し、ランキング、再プレイ、タイトル操作を利用可能にする。
  - 作業内容: ARIA label、状態文言、focus表示、graph text要約、reduced motionを整備する。
  - 変更するファイル: `src/styles/heart-rate.css`, `src/styles/game.css`, `src/styles/result.css`, `src/styles/responsive.css`, 関連components
  - 依存関係: 5, 7, 8
  - 完了条件: 色だけに依存せず、主要viewportでHUD、cue、status、操作、graphが不当に重ならない。
  - 確認方法: Playwright viewport・intersection assertionとscreenshot
  - _Requirements: 4.5, 4.6, 6.7, 6.8, 10.1-10.6, 11.5_
  - _Boundary: Heart Rate Responsive UX_

- [x] 10. fake Web Bluetoothを使うE2Eを追加する
  - 作業内容: `page.addInitScript`でdevice、GATT、service、characteristic、notificationを再現するfakeを用意する。
  - 作業内容: 準備画面の接続、BPM受信、モック姿勢開始、HUD live、stale、途中切断を検証する。
  - 作業内容: 結果graphと統計、0件状態、再プレイreset、タイトル復帰破棄を検証する。
  - 作業内容: Bluetooth非対応でも既存ゲームが結果まで進むことを検証する。
  - 変更するファイル: `tests/e2e/heart-rate.spec.ts`, 必要なE2E helper
  - 依存関係: 6-9
  - 完了条件: 実機をCI条件にせず、主要な接続・切断・結果導線をChromiumで再現できる。
  - 確認方法: `npx playwright test tests/e2e/heart-rate.spec.ts`
  - _Requirements: 1.1-1.7, 2.1-2.5, 3.1-3.7, 4.1-4.7, 5.1-5.7, 6.1-6.8, 7.1-7.7, 8.1-8.6, 11.3-11.6_
  - _Boundary: Heart Rate E2E Validation_

- [x] 11. READMEへFitbit Airの利用手順とプライバシー方針を追加する
  - 作業内容: Google Healthアプリの心拍数共有、ブラウザchooser、Chrome系ブラウザ、Bluetooth、localhostまたはHTTPSを記載する。
  - 作業内容: SSH先ではなくブラウザ端末のBluetoothを使うこと、他アプリ接続時の競合、再接続手順を記載する。
  - 作業内容: カウントダウンから結果まで一時記録し、ランキング、DB、localStorage、APIへ保存しないことを明記する。
  - 作業内容: フィットネス・ゲーム表示用であり医療用途ではないことと、実機手動確認項目を追加する。
  - 変更するファイル: `README.md`
  - 依存関係: 5-9
  - 完了条件: 展示運営者が接続準備、対応条件、データ破棄、トラブル対応をREADMEだけで確認できる。
  - 確認方法: READMEと実装UI・要求仕様の内容を照合する。
  - _Requirements: 2.6, 9.1-9.7, 11.8_
  - _Boundary: Documentation_

- [x] 12. 全自動検証と既存機能の回帰確認を行う
  - 作業内容: 心拍domain、adapter、chart、E2Eのテストを完成させる。
  - 作業内容: 型チェック、全ユニットテスト、production build、全Chromium E2Eを実行する。
  - 作業内容: 既存camera、mock pose、audio、ranking、responsive visual導線の回帰を修正する。
  - 作業内容: 心拍、device ID、OAuth、Google Health API、永続保存の不要な参照がないことを`rg`で確認する。
  - 変更するファイル: 必要な実装・テスト・CSS、仕様メタデータ
  - 依存関係: 1-11
  - 完了条件: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`が成功する。
  - 確認方法: 全コマンド結果とテスト件数を記録する。
  - 確認結果: 2026-07-18に型チェック、35ファイル198件のユニットテスト、production build、14件のChromium E2Eが成功した。
  - _Requirements: 9.2-9.7, 11.1-11.7_
  - _Boundary: Automated Validation_

- [ ] 13. Fitbit Air実機で接続と結果グラフを確認する
  - 作業内容: 使用したFitbit Air firmware、Google Healthアプリ、OS、Chrome系ブラウザのversionを記録する。
  - 作業内容: 心拍数共有、device選択、ライブ更新、受信停止、切断、再接続を確認する。
  - 作業内容: 安静時と軽い運動時のHUD更新、欠落segment、最小・平均・最大、結果graphを確認する。
  - 作業内容: 実カメラとモック姿勢、SSHポートフォワーディングのlocalhost、連続プレイ、タイトル復帰を確認する。
  - 作業内容: 他アプリや運動機器との接続競合、装着ずれ、Bluetooth停止時の案内を確認する。
  - 変更するファイル: 必要な調整、`README.md`, `.kiro/specs/fitbit-air-heart-rate/tasks.md`, 仕様メタデータ
  - 依存関係: 12
  - 完了条件: 実機でライブ表示、切断フォールバック、再接続、結果graph、データ破棄を確認する。
  - 完了条件: 未確認項目または端末固有の制限があればREADMEと仕様状態へ明記する。
  - 確認方法: 要求仕様の手動確認観点に沿った実機チェックリスト。
  - 確認状態: 実機操作が必要なため未確認。自動テストではfake Web Bluetoothで同じ画面導線を確認済み。
  - _Requirements: 1.1-1.7, 2.1-2.6, 3.1-3.7, 4.1-4.7, 6.1-6.8, 7.1-7.7, 8.1-8.7, 9.1-9.7, 10.1-10.6, 11.8_
  - _Boundary: Manual Fitbit Air Validation_

## Requirements Coverage

| Requirement | Covered by Tasks |
|---|---|
| 1 | 3, 5, 10, 13 |
| 2 | 3, 5, 10, 11, 13 |
| 3 | 1, 3, 4, 10, 13 |
| 4 | 4, 7, 9, 10, 13 |
| 5 | 2, 4, 6, 10 |
| 6 | 2, 8-10, 13 |
| 7 | 3-7, 10, 13 |
| 8 | 2, 4, 6, 10, 12, 13 |
| 9 | 5, 6, 8, 11-13 |
| 10 | 5, 7-10, 13 |
| 11 | 1-4, 8-13 |
