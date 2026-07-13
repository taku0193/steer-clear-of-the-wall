# Design Document

## Overview

`game-audio`は、Web Audio APIで生成するオリジナルのBGMと効果音をゲームへ追加する。
音声ファイルや外部CDNは使わず、oscillator、gain、filterを組み合わせて軽量な音を生成する。

今回の改訂では、カウントダウンのSpeech Synthesisを削除し、Web Audio APIの
電子カウント音へ一本化する。4小節BGMと楽器構成は維持する。

音声機能は次の4層へ分離する。

1. Audio Adapter: Web Audio APIの生成、接続、停止。
2. Audio Domain: 画面状態・ゲームイベントから再生種別を決定する純粋ロジック。
3. Audio Controller: Reactライフサイクルとゲーム状態を音声エンジンへ同期する。
4. Audio UI: ミュート、BGM音量、効果音音量を操作する。

## Goals

- 壁の接近、判定、速度上昇を音でも理解できるようにする。
- ブラウザのユーザー操作制約を守る。
- 再プレイや画面遷移でBGMとtimerを重複させない。
- 音が出ない環境でもゲームを完全に進行できる。
- 外部音源と著作権リスクを持ち込まない。
- 数字表示と短い電子カウント音を同期させる。
- 単純な電子音反復ではなく、体を動かしたくなるリズムを作る。

## Non-Goals

- マイク入力、音声認識、カメラ音声。
- 音声ファイルのダウンロードやストリーミング。
- 市販楽曲、外部BGM、ユーザー音源。
- 複雑な作曲UI、サラウンド、イコライザー。

## Architecture

```text
src/audio/
├── audioTypes.ts
├── audioPreferences.ts
├── audioPreferences.test.ts
├── audioSelection.ts
├── audioSelection.test.ts
├── webAudioEngine.ts
├── musicPatterns.ts
├── musicSynth.ts
└── soundEffects.ts

src/components/
├── AudioController.tsx
└── AudioControls.tsx
```

依存方向:

- `App`は`AudioController`へ現在のゲーム状態と直前イベントを渡す。
- `AudioController`は純粋な選択関数から必要なBGM・効果音を決める。
- `webAudioEngine`だけが`AudioContext`、oscillator、gain、timerを扱う。
- ゲームロジックは音声モジュールへ依存しない。

## Data Model

```typescript
export type BgmTrack = "none" | "lobby" | "play";

export type SoundEffect =
  | "confirm"
  | "count"
  | "start"
  | "wallSpawn"
  | "success"
  | "miss"
  | "notDetected"
  | "speedUp"
  | "result";

export type AudioPreferences = {
  muted: boolean;
  bgmVolume: number;
  sfxVolume: number;
};

export type AudioEngineStatus =
  | "locked"
  | "ready"
  | "suspended"
  | "unsupported";
```

音量は`0..1`で保持する。UIは百分率へ変換する。

初期値:

```typescript
{
  muted: false,
  bgmVolume: 0.28,
  sfxVolume: 0.55,
}
```

## Audio Preferences

localStorage key:

```text
steer-clear.audio.v1
```

読込時に次を検証する。

- objectである。
- `muted`がbooleanである。
- 音量が有限数である。
- 音量を`0..1`へclampする。

不正値、JSON parse失敗、localStorage利用不可では初期値を使う。

## Web Audio Engine

### Interface

```typescript
export interface GameAudioEngine {
  unlock(): Promise<boolean>;
  setPreferences(preferences: AudioPreferences): void;
  setBgm(track: BgmTrack): void;
  playEffect(effect: SoundEffect): void;
  suspend(): void;
  resume(): void;
  stopAll(): void;
  dispose(): void;
  getStatus(): AudioEngineStatus;
}
```

### Audio Graph

```text
Oscillators / Noise
        │
   per-sound Gain
        │
 ┌──────┴──────┐
 BGM Gain    SFX Gain
 └──────┬──────┘
      Master Gain
        │
   AudioContext.destination
```

- `masterGain`: mutedなら0、通常は1。
- `bgmGain`: BGM音量。
- `sfxGain`: 効果音音量。
- 音量変更は10〜30msの短いrampでクリックノイズを避ける。
- AudioContextは初回`unlock`時に1つだけ作る。

### Unsupported Fallback

`window.AudioContext`がない場合は、同じinterfaceを持つno-op engineを返す。
呼び出し側は分岐せず、ゲーム進行を維持する。

## BGM Design

### Pattern Model

従来の`lead[]`と`bass[]`だけの8・16stepパターンは廃止する。1stepを16分音符とし、
4小節64stepを最小ループ単位にする。

```typescript
type MusicStep = {
  kick?: boolean;
  snare?: boolean;
  closedHat?: boolean;
  openHat?: boolean;
  bass?: number;
  chord?: readonly number[];
  lead?: number;
};

type MusicPattern = {
  bpm: number;
  steps: readonly MusicStep[];
};
```

楽器の発音は`musicSynth.ts`へ分ける。patternは演奏データだけを持ち、Web Audioノードの
生成方法を持たない。

### Scheduler

AudioContextの`currentTime`を基準に、100msごとのschedulerで次の500ms分を予約する。
`setInterval`の時刻そのものを音の開始時刻にしない。

状態:

- 現在track。
- 次のstep index。
- 次のAudioContext時刻。
- scheduler timer ID。
- 予約済みoscillatorの集合。

track変更時:

1. 現在のBGM gainを80msで0へ下げる。
2. 予約済みoscillatorを停止する。
3. step indexと予約時刻を初期化する。
4. 新trackを80msで設定音量へ上げる。

### Lobby Track

- Tempo: 約94 BPM。
- 64step、4小節ループ。
- 1・3拍目を中心とした柔らかいkick、2・4拍目の軽いrim相当音。
- sineとfiltered sawを重ねた丸いbass。
- triangle主体の3音コードを2小節ごとに変化させる。
- 4小節目だけ短いlead fillを入れ、同じ1小節の反復感を減らす。
- タイトル、準備、結果後のタイトル復帰で使用する。

### Play Track

- Tempo: 約128 BPM。
- 64step、4小節ループ。
- 4つ打ちkick、2・4拍目のsnare、裏拍closed hat、4小節目のopen hat fill。
- filtered sawとsine subを重ねた16分・8分混在のbass groove。
- 2・4拍目の裏へ短いminor系code stabを配置する。
- triangleとsineを重ねた短いlead motifを2小節目と4小節目だけ鳴らす。
- raw square波を主旋律に使用しない。
- カウントダウン開始時に導入し、プレイへ連続させる。
- 速度レベルに応じたテンポ変更は初期実装では行わない。ゲーム速度ロジックと音楽schedulerを分離する。

### Instrument Synthesis

- Kick: sine oscillatorを約120Hzから48Hzへ短く下降させる。
- Snare: band-pass noiseと低いtriangle bodyを重ねる。
- Hi-hat: high-pass noiseを20〜70msで閉じる。
- Bass: sine subとlow-pass filtered sawを重ね、短いreleaseを付ける。
- Chord: triangleを中心に3voiceを鳴らし、low-pass filterで高域を抑える。
- Lead: triangleとsineを小音量で重ね、主旋律を前面へ出しすぎない。

すべての音へattack・release envelopeを付ける。各instrumentの出力をBGM gainへ接続し、
ループ境界とtrack変更時のクリックノイズを防ぐ。

### SFX Ducking

成功、失敗、未検出、速度上昇、結果音の開始時に、BGM gainを約120〜450msだけ
設定値の55%へ下げて戻す。ミュート状態やBGM音量設定値は変更せず、AudioParamの
automationだけで実現する。

### First Visit Behavior

初回タイトルはユーザー操作前のため無音とする。

- 「ゲーム開始」または音声操作で`unlock`する。
- ゲーム開始なら準備画面へ移動後にlobby BGMを開始する。
- 一度unlock済みでタイトルへ戻った場合はlobby BGMを再開する。

## Sound Effect Synthesis

全効果音は短いone-shotノードとして作成し、終了時にdisconnectする。

| Effect | Synthesis | Duration |
|---|---|---:|
| confirm | sine + short gain envelope | 70ms |
| count | square single tone | 90ms |
| start | rising two-tone | 180ms |
| wallSpawn | filtered noise + low pulse | 120ms |
| success | rising major-like two-tone | 240ms |
| miss | descending saw/triangle | 260ms |
| notDetected | soft repeated sine | 180ms |
| speedUp | rising three-tone | 420ms |
| result | short resolved chord/arpeggio | 600ms |

### Envelope

各音はgainを0から立ち上げ、終了前に0へ戻す。oscillator停止時刻より少し前にgainを0にし、
クリックノイズを防ぐ。

### Noise

wallSpawn用noiseはAudioBufferをengine初期化時に1回だけ生成し、再利用する。

`count`は通常のカウントダウン音として使用する。`3`、`2`、`1`の表示変更ごとに
同じ短い電子音を1回だけ再生し、`playing`遷移時は別の`start`音へ切り替える。

## Audio Selection Logic

### BGM by Phase

```typescript
function selectBgmTrack(phase: GamePhase): BgmTrack {
  switch (phase) {
    case "title":
    case "preparing":
      return "lobby";
    case "countdown":
    case "playing":
      return "play";
    case "result":
    case "error":
      return "none";
  }
}
```

### Judgment Effect

```typescript
function selectJudgmentEffect(
  judgment: JudgmentResult,
  speedLevelUp: boolean,
): SoundEffect {
  if (judgment.type === "success") {
    return speedLevelUp ? "speedUp" : "success";
  }
  if (judgment.type === "miss") return "miss";
  return "notDetected";
}
```

## React Audio Controller

`AudioController`はApp直下へ1つだけ配置する。

Props:

```typescript
type AudioControllerProps = {
  phase: GamePhase;
  countdownValue: number;
  wallSequenceIndex: number;
  lastJudgment: JudgmentResult | null;
  lastSpeedLevelUp: boolean;
};
```

内部責務:

- engineをrefへ1つだけ保持する。
- preferencesをstateへ保持しlocalStorageと同期する。
- phase変更でBGMを切り替える。
- countdownValue変更でcount音を1回だけ鳴らす。
- countdown→playingでstart音を鳴らす。
- wallSequenceIndex変更でwallSpawn音を鳴らす。
- judgmentの`patternId`と壁indexを組み合わせ、1判定1回だけ再生する。
- result遷移でresult音を鳴らす。
- `visibilitychange`でsuspend/resumeする。
- unmountでWeb Audio engineをdisposeする。

### Unlock API

音声開始はユーザー操作内で行う必要があるため、`AudioController`はContextまたはhookで
`unlockAudio()`と`playConfirm()`をAppのボタンhandlerへ提供する。

```typescript
type AudioControlsContextValue = {
  preferences: AudioPreferences;
  status: AudioEngineStatus;
  unlockAudio(): Promise<void>;
  playConfirm(): void;
  setMuted(muted: boolean): void;
  setBgmVolume(value: number): void;
  setSfxVolume(value: number): void;
};
```

`handleStartGame`、再試行、再プレイなどの主操作は、状態遷移前に`unlockAudio`とconfirmを呼ぶ。

## Audio UI

### Placement

`AudioControls`をAppの全画面共通オーバーレイとして配置する。

- デスクトップ: 右上。ただしプレイ中は姿勢状態と重ならない右下寄りまたは終了ボタン上。
- モバイル: 右下の終了操作と横並びにならない左下。
- エラー・結果: 画面右上。

### Controls

- スピーカーアイコン相当の文字記号または既存アイコンライブラリを使う。
- クリックでミュート切替。
- 隣の設定操作でpopoverを開く。
- BGM、効果音を`input type="range"`で0〜100表示する。
- メニュー外クリック、Escape、画面遷移で閉じる。
- ボタンのARIAラベルは「音声をミュート」「音声を有効化」のように状態を含める。

## App Integration

`App`のゲーム状態とイベントhandlerは維持する。音声は副作用として追加する。

```tsx
<AudioProvider audioState={...}>
  <AppScreens />
  <AudioControls />
</AudioProvider>
```

既存Appを大規模分割しない場合は、`App`内で`AudioController`hookを呼び、各screen returnへ
共通`AudioControls`を含める`AppFrame`を追加する。

## Lifecycle Sequences

### Start

1. 初回タイトルはsilent/locked。
2. ゲーム開始クリック。
3. `unlockAudio`。
4. confirm音。
5. preparingへ遷移。
6. lobby BGM開始。

### Mock Play

1. モック開始クリック、confirm音。
2. countdownへ遷移、play BGMへcrossfade。
3. 数字変更ごとに短いcount音。
4. playing遷移でstart音。
5. 壁index変更でwallSpawn。

### Judgment

1. 新しいJudgmentResultを検出。
2. 一意キーを確認。
3. success/miss/notDetected/speedUpのいずれかを1回再生。

### Result and Reset

1. result遷移でplay BGM停止。
2. result effect再生。
3. 自動復帰またはタイトル操作でone-shotを停止。
4. titleでlobby BGMを再開。

## Error Handling

- AudioContext生成例外: unsupported扱い、no-opへ切替。
- resume拒否: locked維持、ゲーム継続。
- localStorage例外: メモリ内設定のみ使用。
- oscillator生成中の例外: 該当音だけ中止。
- visibility復帰時のresume失敗: 次のユーザー操作まで無音。

## Accessibility

- 既存視覚フィードバックを削除しない。
- ミュートボタンは44px以上。
- rangeへ明示ラベルと現在値を付ける。
- 音量変更をaria-liveで毎回読み上げない。
- 初期音量をBGM28%、効果音55%とする。
- UIはキーボードとEscapeで操作可能にする。

## Testing Strategy

### Unit Tests

- preferencesのparse、clamp、不正値fallback。
- phase→BGM選択。
- judgment→effect選択。
- 同一判定キーの重複防止。
- no-op engineの全methodが例外を投げない。
- schedulerのstep選択をAudioContextなしで検証できる純粋関数。
- 64stepのkick、snare、hat、bass、chord、lead配置。

### Component and E2E

- ミュートボタンの状態とARIAラベル。
- 音量menuの開閉、range操作、Escape。
- localStorage設定の再読込。
- AudioContextをmockし、ゲーム開始後にunlockが1回だけ呼ばれる。
- カウント値の変更ごとにcount効果音が1回だけ選ばれることを確認する。
- 既存5件のE2Eと全ユニットテストを維持する。

### Manual Audio Verification

- Chrome/Chromium実機で自動再生制限を確認する。
- スピーカーまたはヘッドホンでクリックノイズ、音割れ、音量差を確認する。
- 再プレイ10回、タイトル復帰10回で二重BGMがないことを確認する。
- タブ非表示・復帰でBGMが1本だけ再開することを確認する。
- `3`、`2`、`1`と電子カウント音が同期することを確認する。
- 待機・プレイBGMを通して試聴し、単純な電子音反復に聞こえないことを確認する。
- 効果音再生時にBGMが一時的に下がり、判定音を聞き分けられることを確認する。

## Requirement Traceability

| Requirement | Design Section |
|---|---|
| 1 | Web Audio Engine, First Visit Behavior, Unlock API |
| 2 | BGM Design, Instrument Synthesis, SFX Ducking, Audio Selection Logic |
| 3 | Sound Effect Synthesis, React Audio Controller |
| 4 | Sound Effect Synthesis, Judgment Effect |
| 5 | Audio UI, App Integration |
| 6 | Audio Preferences, Audio Graph |
| 7 | Audio UI, Accessibility |
| 8 | Audio Controller, Lifecycle Sequences |
| 9 | Overview, Sound Effect Synthesis |
| 10 | Accessibility |
| 11 | Architecture, Testing Strategy |

## Risks

### Schedulerの重複

対策: engineをApp全体で1つだけ生成し、track変更前にtimerと予約ノードを必ず停止する。

### 効果音の多重再生

対策: judgment、wall、countdownへ一意キーを持ち、前回キーと同じ場合は再生しない。

### 展示会場で音が大きすぎる

対策: 控えめな初期音量、即時ミュート、BGM/SFX個別調整、設定保存を用意する。

### 音がゲーム処理を阻害する

対策: 音声失敗を状態遷移の成功条件にせず、すべてのengine呼び出しを安全に失敗可能にする。

### 合成楽器を増やして音割れする

対策: 各instrumentの音量を低く保ち、BGM busへ余裕を持たせる。判定音ではduckingし、
実ブラウザでヘッドホンとスピーカーの両方を試聴する。
