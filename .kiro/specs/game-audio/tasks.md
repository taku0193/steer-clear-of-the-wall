# Implementation Plan

## 方針

- 音声設定と選択ロジックを純粋関数として先に実装する。
- Web Audio API依存はengineへ閉じ込める。
- BGM schedulerとone-shot効果音を分け、停止責務を明確にする。
- React統合はApp全体で1つのengineだけを保持する。
- 音声失敗をゲーム状態遷移の失敗条件にしない。
- 既存の視覚フィードバックとE2Eを維持する。

## Tasks

- [x] 1. 音声型と設定保存ロジックを追加する
  - 作業内容: `BgmTrack`、`SoundEffect`、`AudioPreferences`、`AudioEngineStatus`、engine interfaceを定義する。
  - 作業内容: 初期設定、音量clamp、localStorage parse・serializeを純粋関数として追加する。
  - 変更するファイル: `src/audio/audioTypes.ts`, `src/audio/audioPreferences.ts`, `src/audio/audioPreferences.test.ts`
  - 依存関係: なし
  - 完了条件: 不正JSON、不正型、範囲外音量で安全な設定へ戻る。
  - 完了条件: 初期音量がBGM28%、効果音55%である。
  - 確認方法: 設定の正常・異常・clampテスト。
  - _Requirements: 6.1-6.6, 11.1-11.4_
  - _Boundary: Audio Domain Types and Preferences_

- [x] 2. ゲーム状態から音を選ぶ純粋ロジックを追加する
  - 作業内容: phaseからBGMを選ぶ`selectBgmTrack`を追加する。
  - 作業内容: 判定と速度上昇から効果音を選ぶ`selectJudgmentEffect`を追加する。
  - 作業内容: countdown値、phase遷移、壁indexに必要なイベントキー生成を追加する。
  - 変更するファイル: `src/audio/audioSelection.ts`, `src/audio/audioSelection.test.ts`
  - 依存関係: 1
  - 完了条件: 全GamePhase、全JudgmentResult、速度上昇を網羅する。
  - 完了条件: 同じ判定キーを重複再生防止へ利用できる。
  - 確認方法: table-drivenユニットテスト。
  - _Requirements: 2.1-2.6, 3.1-3.4, 4.1-4.6, 11.2, 11.3_
  - _Boundary: Audio Selection Logic_

- [x] 3. Web Audio engineとno-opフォールバックを実装する
  - 作業内容: AudioContextを初回unlock時だけ作る`createGameAudioEngine`を追加する。
  - 作業内容: master、BGM、SFX gainを構成し、短いrampで音量を変更する。
  - 作業内容: unsupported・生成失敗時に同じinterfaceのno-op engineを返す。
  - 変更するファイル: `src/audio/webAudioEngine.ts`, `src/audio/noopAudioEngine.ts`、関連テスト
  - 依存関係: 1
  - 完了条件: unlockを繰り返してもAudioContextを1つだけ保持する。
  - 完了条件: AudioContextなしで全methodを呼んでも例外を投げない。
  - 確認方法: mock AudioContextとno-op engineのユニットテスト。
  - _Requirements: 1.1-1.5, 6.3, 6.4, 8.5, 8.6, 11.1, 11.4_
  - _Boundary: Web Audio Adapter_

- [x] 4. one-shot効果音を実装する
  - 作業内容: confirm、count、start、wallSpawn、success、miss、notDetected、speedUp、resultをoscillator・gain・filter・noiseで合成する。
  - 作業内容: 共通envelopeと終了時disconnectを実装する。
  - 作業内容: wallSpawn用noise bufferをengine初期化ごとに1回生成する。
  - 変更するファイル: `src/audio/soundEffects.ts`, `src/audio/webAudioEngine.ts`、関連テスト
  - 依存関係: 3
  - 完了条件: 各効果音が指定時間内に終了し、停止ノードを残さない。
  - 完了条件: 成功、失敗、未検出、速度上昇を異なる音程・方向で区別できる。
  - 確認方法: mock nodeの開始・停止時刻・gain envelope確認、実ブラウザ試聴。
  - _Requirements: 3.1-3.4, 4.1-4.6, 5.1-5.4, 9.1, 10.1-10.3_
  - _Boundary: Sound Effect Synthesis_

- [x] 5. 待機BGMとプレイBGMのschedulerを実装する
  - 作業内容: lobby 8step、play 16stepの音程・音価パターンを定義する。
  - 作業内容: 100ms周期で500ms先までAudioContext時刻へ予約するschedulerを追加する。
  - 作業内容: track変更時のfade、timer停止、予約oscillator停止、step初期化を実装する。
  - 変更するファイル: `src/audio/musicPatterns.ts`, `src/audio/webAudioEngine.ts`、関連テスト
  - 依存関係: 3
  - 完了条件: BGMループ境界に大きな無音を作らず、track変更で二重再生しない。
  - 完了条件: stopAllとdisposeでschedulerと予約ノードを解放する。
  - 確認方法: scheduler step・予約時刻の純粋テスト、mock timer・node停止テスト、実ブラウザ試聴。
  - _Requirements: 2.1-2.6, 8.1-8.6, 9.1, 10.3_
  - _Boundary: BGM Synthesis and Scheduling_

- [x] 6. React Audio ProviderとControllerを実装する
  - 作業内容: engineをrefへ1つだけ保持する`AudioProvider`を追加する。
  - 作業内容: preferences読込・保存、unlock、ミュート、音量変更、confirm再生をContextで提供する。
  - 作業内容: phase、countdown、wall index、judgment、速度上昇をBGMと効果音へ同期する`AudioController`を追加する。
  - 作業内容: visibilitychange、unmount、画面遷移でsuspend・resume・disposeする。
  - 変更するファイル: `src/components/AudioProvider.tsx`, `src/components/AudioController.tsx`, `src/audio/useGameAudio.ts`
  - 依存関係: 2, 4, 5
  - 完了条件: App全体でengineが1つだけ存在し、同じ判定・countdown・壁イベントを重複再生しない。
  - 完了条件: AudioContext失敗時もchildrenとゲームを通常表示する。
  - 確認方法: mock engineを使ったProvider・Controllerテスト、Strict Mode相当の再mount確認。
  - _Requirements: 1.2-1.4, 2.1-2.6, 3.1-3.4, 4.1-4.6, 8.1-8.6, 11.1-11.4_
  - _Boundary: React Audio Lifecycle_

- [x] 7. Appの状態とユーザー操作へ音声を統合する
  - 作業内容: AppをAudioProviderで包み、AudioControllerへゲーム状態を渡す。
  - 作業内容: ゲーム開始、モック開始、再試行、再プレイ、タイトル復帰でunlock・confirm・停止を適切に呼ぶ。
  - 作業内容: disabledボタンや自動遷移で不要なconfirm音を鳴らさない。
  - 変更するファイル: `src/App.tsx`、必要なApp入口
  - 依存関係: 6
  - 完了条件: 初回ページ表示は無音で、最初の操作後にだけAudioContextが有効化される。
  - 完了条件: モック・実カメラ、自動開始、自動復帰の状態遷移を維持する。
  - 確認方法: 状態遷移E2E、mock AudioContextのunlock回数確認。
  - _Requirements: 1.1-1.5, 3.1-3.4, 5.1-5.4, 8.1-8.6, 10.1, 10.2_
  - _Boundary: Application Integration_

- [x] 8. 全画面共通の音声操作UIを追加する
  - 作業内容: ミュートボタンと音量menuを持つ`AudioControls`を追加する。
  - 作業内容: BGM・効果音のrange、百分率、ARIAラベル、Escape・外側クリックによる閉じる操作を実装する。
  - 作業内容: デスクトップ、モバイル、プレイ、結果、エラーで既存UIと重ならない配置を追加する。
  - 変更するファイル: `src/components/AudioControls.tsx`, 音声UI用CSS, `src/App.tsx`
  - 依存関係: 6, 7
  - 完了条件: ミュートを即時切替でき、menuをキーボードで操作できる。
  - 完了条件: 幅390pxでHUD、終了、判定表示と重ならない。
  - 確認方法: UI操作テスト、ARIA確認、3viewportのスクリーンショット。
  - _Requirements: 6.1-6.6, 7.1-7.5, 10.3-10.5_
  - _Boundary: Audio Controls UI_

- [x] 9. 音声ライフサイクルと重複防止を検証する
  - 作業内容: 再プレイ、タイトル復帰、結果自動復帰、エラー、タブ非表示・復帰のテストを追加する。
  - 作業内容: BGM track、scheduler、effect key、engine生成数をmockで検証する。
  - 変更するファイル: 音声Controllerテスト、必要なE2E
  - 依存関係: 7, 8
  - 完了条件: 再試行10回相当でもengineとBGM schedulerが増加しない。
  - 完了条件: タブ復帰時に現在phaseのBGMだけを再開する。
  - 確認方法: fake timer、mock engine、ブラウザvisibilityテスト。
  - _Requirements: 2.6, 3.3, 4.6, 8.1-8.6, 11.2-11.5_
  - _Boundary: Audio Lifecycle Validation_

- [x] 10. Speech Synthesis実装を完全に削除する
  - 作業内容: 読み仮名選択、Speech Adapter、関連ユニットテストを削除する。
  - 作業内容: `AudioProvider`からadapter ref、生成、cancel、dispose処理を削除する。
  - 作業内容: 音声Contextから発話用APIを削除し、ブラウザのSpeech Synthesisへ依存しない状態に戻す。
  - 変更するファイル: `src/audio/countdownSpeech.ts`, `src/audio/speechSynthesisAdapter.ts`, 関連テスト, `src/components/AudioProvider.tsx`, `src/audio/useGameAudio.ts`
  - 依存関係: 1, 6
  - 完了条件: `SpeechSynthesis`、`SpeechSynthesisUtterance`、読み仮名データへの参照がコードベースに残らない。
  - 完了条件: ミュート、SFX音量、Web Audio engineの既存機能を維持する。
  - 確認方法: `rg`による参照確認、型チェック、ユニットテスト。
  - _Requirements: 3.1-3.5, 8.1-8.6, 9.1-9.4_
  - _Boundary: Speech Dependency Removal_

- [x] 11. 電子カウント音へ復元して回帰検証する
  - 作業内容: countdown値変更ごとに`count`効果音を1回だけ再生するControllerへ戻す。
  - 作業内容: Speech mockを使うE2Eを削除し、カウントダウンからplayingへ進む既存導線を維持する。
  - 作業内容: READMEの日本語発話説明を削除し、電子カウント音へ更新する。
  - 変更するファイル: `src/components/AudioController.tsx`, `tests/e2e/audio-controls.spec.ts`, `README.md`, 仕様メタデータ
  - 依存関係: 10
  - 完了条件: `3`、`2`、`1`ごとにcountイベントが重複なく1回選ばれる。
  - 完了条件: 型チェック、全ユニットテスト、ビルド、E2Eが成功する。
  - 確認方法: Audio Controllerロジック確認、全品質コマンド。
  - _Requirements: 3.1-3.5, 6.3-6.5, 8.1-8.6, 11.1-11.5_
  - _Boundary: Electronic Countdown Restoration_

- [x] 12. 4小節BGMパターンを定義する
  - 作業内容: `MusicPattern`をkick、snare、hat、bass、chord、leadを持つ64step構造へ変更する。
  - 作業内容: lobby 94 BPMとplay 128 BPMの4小節パターンを独立データとして定義する。
  - 作業内容: raw square波の単音反復を主旋律から除く。
  - 変更するファイル: `src/audio/musicPatterns.ts`, `src/audio/musicPatterns.test.ts`
  - 依存関係: 5
  - 完了条件: 両trackが64stepで、全楽器配置と4小節目のvariationを持つ。
  - 完了条件: 音価、step時刻、ループ境界を純粋関数で検証できる。
  - 確認方法: pattern構造と楽器密度のtable-drivenテスト。
  - _Requirements: 2.1, 2.2, 2.7-2.10, 11.2_
  - _Boundary: Music Composition Data_

- [x] 13. BGM用の楽器合成とschedulerを刷新する
  - 作業内容: kick、snare、closed/open hat、bass、chord、leadのschedulerを`musicSynth`へ実装する。
  - 作業内容: oscillator、noise、filter、gain envelopeを楽器ごとに構成する。
  - 作業内容: engineを新しい64step patternへ接続し、track変更とdisposeで全ノードを停止する。
  - 変更するファイル: `src/audio/musicSynth.ts`, `src/audio/webAudioEngine.ts`, 関連テスト
  - 依存関係: 12
  - 完了条件: 500ms先行予約と100ms timerを維持し、4小節境界で大きな無音を作らない。
  - 完了条件: 各sourceが有限時間で停止し、再プレイでschedulerを増やさない。
  - 確認方法: mock AudioContext、fake timer、source停止・filter接続テスト。
  - _Requirements: 2.1-2.10, 8.1, 8.5, 8.6, 11.1_
  - _Boundary: Music Instrument Synthesis and Scheduling_

- [x] 14. 判定音のduckingとミックスバランスを実装する
  - 作業内容: 成功、失敗、未検出、速度上昇、結果音でBGMを短時間55%へ下げて戻す。
  - 作業内容: duckingがミュート、BGM音量、track crossfadeの設定値を破壊しないようautomationを管理する。
  - 作業内容: 多数の楽器が同時発音してもmasterへ過大入力しない初期gainへ調整する。
  - 変更するファイル: `src/audio/webAudioEngine.ts`, `src/audio/musicSynth.ts`, 関連テスト
  - 依存関係: 13
  - 完了条件: 判定効果音の期間だけBGMが下がり、設定音量へ復帰する。
  - 完了条件: 効果音の連続発生でも不正なgain値や永続的な音量低下を起こさない。
  - 確認方法: AudioParam automationテスト、実ブラウザ試聴。
  - _Requirements: 2.5, 2.11, 6.3, 6.4, 10.3_
  - _Boundary: Audio Mixing and Ducking_

- [x] 15. 音声刷新の自動検証とドキュメント更新を行う
  - 作業内容: Speech Synthesis mock、BGM pattern、instrument、scheduler、duckingのテストを追加する。
  - 作業内容: カウント導線、ミュート、設定保存、再プレイをE2Eで確認する。
  - 作業内容: 日本語システム音声と新しいBGM生成方式、fallback、確認手順をREADMEへ記載する。
  - 作業内容: 型チェック、全ユニットテスト、ビルド、E2Eを実行する。
  - 変更するファイル: 音声テスト、`tests/e2e/`, `README.md`, 仕様メタデータ
  - 依存関係: 11, 14
  - 完了条件: 自動検証がすべて成功し、外部音声ファイルを追加していないことを記録する。
  - 完了条件: 音声非対応環境でもゲーム導線を維持する。
  - 確認方法: 全確認コマンドとE2E結果を報告する。
  - _Requirements: 3.6, 9.1-9.5, 10.1-10.5, 11.1-11.7_
  - _Boundary: Automated Audio Validation and Documentation_

- [ ] 16. 実ブラウザで電子カウント音とBGMを試聴して完成判定する
  - 作業内容: `3`、`2`、`1`と電子カウント音の同期、重複、ミュートを実ブラウザで確認する。
  - 作業内容: lobby・play BGMの4小節を通して試聴し、単純な電子音反復に聞こえないか確認する。
  - 作業内容: 効果音の聞き分け、ducking、クリックノイズ、音割れ、タブ切替、再プレイを確認する。
  - 変更するファイル: 必要な音量・音色調整、`README.md`, 仕様メタデータ
  - 依存関係: 15
  - 完了条件: ユーザーが電子カウント音とBGMの方向性を確認する。
  - 完了条件: 未確認項目を残す場合は仕様状態とREADMEへ明記する。
  - 確認方法: 実機試聴チェックリストとユーザーフィードバック。
  - _Requirements: 2.12, 3.1-3.5, 8.1-8.6, 10.3_
  - _Boundary: Manual Countdown and Music Acceptance_

## Requirements Coverage

| Requirement | Covered by Tasks |
|---|---|
| 1 | 3, 6, 7 |
| 2 | 2, 5, 6, 9, 12-16 |
| 3 | 2, 4, 6, 7, 10, 11, 15, 16 |
| 4 | 2, 4, 6 |
| 5 | 4, 7 |
| 6 | 1, 3, 6, 8, 11, 14 |
| 7 | 8 |
| 8 | 3, 5, 6, 7, 9-11, 13, 16 |
| 9 | 4, 5, 10, 15 |
| 10 | 4, 8, 14-16 |
| 11 | 1-16 |
