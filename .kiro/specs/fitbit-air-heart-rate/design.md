# Design Document

## Overview

`fitbit-air-heart-rate`は、Google Fitbit Airが公開する標準BLE Heart Rate Serviceを
Web Bluetoothで購読し、現在心拍数のHUD表示、ゲームセッション内記録、結果画面の
時系列グラフを追加する。

リアルタイム経路はGoogle Health APIを通さず、ゲームを表示しているブラウザ端末から
Fitbit Airへ直接接続する。心拍機能はカメラ、姿勢検出、ゲーム進行、判定、スコアから
分離し、接続不能や切断がゲーム本体の失敗へ波及しない構成にする。

初期実装では外部ライブラリを追加しない。Bluetooth境界は薄いTypeScriptアダプター、
Heart Rate Measurement解析とセッション集計は純粋関数、画面統合は専用React hookと
表示コンポーネントで扱う。結果グラフはレスポンシブなSVGとして描画する。

## Goals

- Fitbit Airから届くBLE通知をライブ心拍数として表示する。
- カウントダウン開始から結果確定までの有効なサンプルだけを記録する。
- 結果画面で心拍変化、最小、平均、最大、記録時間を即時表示する。
- 切断区間や古い値を、連続したライブデータとして誤表示しない。
- Bluetooth障害時も既存ゲーム、ランキング登録、自動復帰を継続する。
- タイトル復帰時に心拍データと選択デバイスへの参照を破棄する。
- Web Bluetooth、React、ゲームロジックの依存境界を明確にする。

## Non-Goals

- Google Health API、Fitbit Web API、OAuthの追加。
- 心拍データのサーバー送信または永続保存。
- 心拍数を使ったゲームルール、スコア、難易度、健康評価。
- 医療的な閾値、警告、診断。
- Web Bluetooth非対応ブラウザ向けのネイティブ中継アプリ。
- Fitbit Air以外のBLE心拍計に対する製品サポート保証。

## Current System Constraints

- `App`が`GamePhase`、カメラ、姿勢検出、ランキング登録の画面レベル状態を保持している。
- ゲーム進行は`src/game/`の純粋ロジック、描画はCanvas、HUDと結果はReactで構成される。
- 実カメラでは位置合わせ完了後に自動でカウントダウンへ進む。
- モック姿勢は準備画面から直接カウントダウンへ進む。
- 結果画面はランキング登録成功後に自動でタイトルへ戻る。
- 開発サーバーはSSH先Ubuntuで動作しうるが、Web Bluetoothはブラウザを開く手元端末の
  Bluetoothアダプターを使用する。
- Web Bluetoothはセキュアコンテキストと一時的なユーザー操作を要求するため、デバイス
  選択は自動実行せず、接続buttonのclickから直接開始する。

## Architecture

```text
Fitbit Air
    │ BLE Heart Rate Service / Measurement notification
    ▼
WebBluetoothHeartRateAdapter
    │ validated HeartRateReading / connection event
    ▼
useHeartRateMonitor
    ├── current reading + freshness ──► Connection Panel / Game HUD
    └── HeartRateSession recorder ────► frozen Result Snapshot
                                               │
                                               ▼
                                HeartRateResultPanel / SVG Chart
```

依存方向:

- `heart-rate`ドメインはReact、Next.js、ゲーム、Canvasへ依存しない。
- Web Bluetooth固有型とGATTライフサイクルはアダプターへ閉じ込める。
- React hookはアダプターと純粋なセッション関数を組み合わせる。
- `App`は現在値と確定済み結果を各画面へ渡すが、`GameState`へ心拍数を追加しない。
- `GameScreen`と`ResultScreen`は表示用propsだけを受け取り、Bluetoothへ直接依存しない。
- ランキングclient、API、repositoryは心拍型へ依存しない。

## File Structure

```text
src/heart-rate/
├── heartRateTypes.ts
├── heartRateMeasurement.ts
├── heartRateMeasurement.test.ts
├── heartRateSession.ts
├── heartRateSession.test.ts
├── webBluetoothHeartRate.ts
└── useHeartRateMonitor.ts

src/components/
├── HeartRateConnectionPanel.tsx
├── HeartRateResultPanel.tsx
├── HeartRateChart.tsx
├── GameStatusHud.tsx              # 心拍HUDを追加
├── GameScreen.tsx                 # 心拍表示propsと再接続操作を追加
└── ResultScreen.tsx               # 確定済み心拍結果を追加

src/styles/
└── heart-rate.css

tests/e2e/
└── heart-rate.spec.ts
```

追加変更:

- `src/App.tsx`: hook統合、接続操作、セッション開始・終了・破棄、画面props。
- `src/style.css`: `heart-rate.css`の読み込み。
- `src/styles/responsive.css`: HUD、準備panel、結果グラフの画面幅・高さ対応。
- `README.md`: Fitbit Air設定、対応ブラウザ、接続手順、データ保持方針、手動確認。

Web Bluetoothの型がTypeScriptのDOM定義で不足する場合は、アダプター内に必要最小限の
構造型を定義する。アプリ全体へ広いambient型を追加せず、外部型パッケージも導入しない。

## Data Model

```typescript
export type HeartRateConnectionStatus =
  | "unsupported"
  | "idle"
  | "requesting"
  | "connected"
  | "disconnected"
  | "error";

export type HeartRateErrorCode =
  | "unsupported"
  | "insecureContext"
  | "deviceNotSelected"
  | "connectionFailed"
  | "serviceUnavailable"
  | "notificationFailed";

export type HeartRateReading = {
  bpm: number;
  receivedAtMs: number;
};

export type HeartRateSample = {
  bpm: number;
  elapsedMs: number;
  segmentId: number;
};

export type HeartRateStatistics = {
  minimumBpm: number;
  averageBpm: number;
  maximumBpm: number;
};

export type HeartRateSessionResult = {
  samples: readonly HeartRateSample[];
  durationMs: number;
  statistics: HeartRateStatistics | null;
};

export type HeartRateFreshness = "waiting" | "live" | "stale";
```

### Time Source

BLE Heart Rate Measurement通知には、この機能で利用できる測定時刻が含まれない。そのため
ブラウザで通知を受け取った時点を測定時点として扱う。

- 経過時間とfreshnessには`performance.now()`の単調増加時刻を使う。
- セッション開始時の単調時刻を`0ms`としてサンプルの`elapsedMs`へ変換する。
- 表示のためだけに絶対日時を保存しない。
- テストではclock関数を注入し、時刻依存を固定する。

### Validation Constants

```typescript
export const MIN_HEART_RATE_BPM = 1;
export const MAX_HEART_RATE_BPM = 300;
export const HEART_RATE_FRESH_MS = 5_000;
```

`HEART_RATE_FRESH_MS`はHUDでライブとみなす上限と、グラフの連続segmentを切る上限に
共通利用する。実機確認で通知間隔が5秒を安定して超える場合は、要求を変えず定数だけを
調整できるようにする。

## BLE Protocol and Parsing

### Standard UUIDs

```text
Heart Rate Service:     0x180D / "heart_rate"
Heart Rate Measurement: 0x2A37 / "heart_rate_measurement"
```

接続手順:

1. `navigator.bluetooth`と`window.isSecureContext`を確認する。
2. button clickから`navigator.bluetooth.requestDevice()`を呼び出す。
3. filterへHeart Rate Serviceだけを指定する。
4. 選択されたdeviceのGATT serverへ接続する。
5. Heart Rate ServiceとHeart Rate Measurement characteristicを取得する。
6. `characteristicvaluechanged`を登録し、notificationを開始する。
7. `gattserverdisconnected`を登録し、切断状態をhookへ通知する。

### Measurement Parser

Heart Rate Measurementの先頭byteをflagsとして扱う。

- bit 0が`0`: 2byte目を8bit BPMとして読む。
- bit 0が`1`: 2〜3byte目をlittle-endian 16bit BPMとして読む。
- DataViewでない値、必要byte数未満、整数でない値、`1..300`外の値は拒否する。
- Energy ExpendedやRR-Intervalなど、今回使用しない後続fieldは読み取らない。

解析失敗はそのnotificationだけを破棄する。接続を自動切断せず、ゲームエラーにも遷移
させない。同じ形式エラーを毎通知UIへ追加せず、adapter内の最新エラーとして抑制する。

## Adapter Design

```typescript
export interface HeartRateAdapter {
  isSupported(): boolean;
  connect(): Promise<void>;
  disconnect(options?: { forgetDevice?: boolean }): Promise<void>;
  subscribe(listener: HeartRateAdapterListener): () => void;
}

export type HeartRateAdapterEvent =
  | { type: "status"; status: HeartRateConnectionStatus }
  | { type: "reading"; reading: HeartRateReading }
  | { type: "error"; code: HeartRateErrorCode; message: string };
```

adapterは選択済み`BluetoothDevice`とcharacteristicを1つだけ保持する。

- 同時`connect()`は1つにまとめ、多重chooserと多重notificationを防ぐ。
- 再接続では同じdevice参照が利用可能ならchooserを開かずGATTへ再接続する。
- 新規device選択が必要な場合だけ、明示的な接続操作からchooserを開く。
- `disconnect()`はnotification停止、listener解除、GATT切断の順にbest effortで実行する。
- `forgetDevice: true`ではdevice参照も破棄する。
- component unmount後の非同期接続完了はsession tokenで無視し、残ったGATTを切断する。

ブラウザのDOMExceptionはadapterでアプリ用errorへ変換する。

| Browser error / condition | App code | 表示方針 |
|---|---|---|
| Web Bluetoothなし | `unsupported` | Chrome系ブラウザを案内 |
| insecure context | `insecureContext` | localhostまたはHTTPSを案内 |
| chooser取消 | `deviceNotSelected` | エラー画面へ遷移せず再試行を表示 |
| GATT `NetworkError` | `connectionFailed` | 他アプリ接続と共有設定を確認 |
| service/characteristicなし | `serviceUnavailable` | Fitbit Airの心拍数共有を確認 |
| notification開始失敗 | `notificationFailed` | 再接続を案内 |

## React State Integration

### `useHeartRateMonitor`

hookは次を返す。

```typescript
type HeartRateMonitor = {
  connectionStatus: HeartRateConnectionStatus;
  freshness: HeartRateFreshness;
  currentBpm: number | null;
  errorMessage: string | null;
  result: HeartRateSessionResult | null;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  startSession(): void;
  finishSession(): void;
  resetSession(): void;
  disposeForTitle(): Promise<void>;
};
```

- connection state、最新reading、現在segment IDはゲーム状態と別のReact state/refで保持する。
- BPM通知は約1Hzを想定するが固定せず、届いた有効値ごとに現在値を更新する。
- 1秒timerでfreshnessを再評価し、最新通知から5秒を超えたら`stale`にする。
- BPM更新を`GameState`へ入れないため、壁進行、判定、スコアの純粋関数は変更しない。
- session recorderはrefで現在状態を保持し、追加時にimmutableな表示snapshotを生成する。
- 結果確定後のevent handlerはreading表示を更新しても確定済みresultへ追加しない。
- unmount cleanupでadapterを完全にdisposeする。

### Session State Machine

```text
idle ── startSession ──► recording ── finishSession ──► finished
  ▲                           │                              │
  └──────── resetSession ─────┴──────── resetSession ───────┘
```

- `idle`: readingはHUD準備表示へ使えるがサンプル記録しない。
- `recording`: 有効なreadingを相対時刻へ変換して追加する。
- `finished`: immutableな結果snapshotを保持し、新しいreadingを無視する。
- `resetSession`: サンプル、統計、開始時刻、segmentを空へ戻す。

切断eventまたは5秒を超える通知間隔の後に次のサンプルを受け取ると、`segmentId`を増やす。
これにより短時間で再接続した場合もグラフ上の欠落を明示できる。

### App Phase Integration

| Game phase / event | Heart-rate action |
|---|---|
| `title` | 接続なし、前回resultなし、device参照なし |
| `preparing` | 接続・再接続UIを表示、readingは記録しない |
| countdown開始操作 | `resetSession()`後に`startSession()` |
| `countdown` | サンプルを記録、必要ならcompact statusを表示 |
| `playing` | サンプルを記録、現在BPMをHUD表示 |
| `result`遷移 | `finishSession()`し、GATTを切断、resultを固定 |
| `error`遷移 | GATTを切断し、未確定sessionを破棄 |
| 再プレイ | resultを破棄して`preparing`、選択device参照は再接続用に維持可能 |
| タイトル復帰・自動復帰 | GATT切断、device参照、reading、session、resultをすべて破棄 |

実カメラの`startCountdownFromPreparation`とモック姿勢の`handleUseMockPose`の両方で、
ゲームphase変更前に同じ`startSession()`を呼ぶ。結果遷移は`gameState.phase`監視で一度だけ
確定する。短いReact effect境界で届いた通知が次の結果へ混入しないよう、session generation
IDとfinished flagをevent handler側でも確認する。

## Session Aggregation

`heartRateSession.ts`は次の純粋操作を提供する。

```typescript
createHeartRateSession(startedAtMs)
appendHeartRateReading(session, reading)
markHeartRateGap(session)
finishHeartRateSession(session, finishedAtMs)
calculateHeartRateStatistics(samples)
splitHeartRateSegments(samples)
```

規則:

- セッション開始前と終了後のreadingは記録しない。
- `elapsedMs`は`0`以上へclampし、前サンプルより前の時刻は追加しない。
- 同一`elapsedMs`の重複通知は最後の有効値だけを採用する。
- 平均値は記録した有効サンプルの算術平均を整数へ四捨五入する。
- 統計は補間値を作らず、実際に記録したサンプルだけから計算する。
- 0件ではstatisticsを`null`、1件では最小・平均・最大を同じ値にする。
- `durationMs`はセッション開始から結果確定までとし、サンプルの有無に依存しない。

算術平均は「記録された測定値の平均」であり、時間加重された医療的指標として表示しない。

## UI Design

### Preparation Connection Panel

`HeartRateConnectionPanel`を通常の準備画面へ配置する。

- 見出し: `Fitbit Air 心拍数`
- 状態: 未接続、接続中、接続済み、受信待ち、非対応、切断
- 現在値: 接続済みで有効値があれば`72 BPM`
- 主操作: `Fitbit Airを接続`
- 再操作: `再接続`
- 補足: Google Healthアプリで「心拍数を共有」を有効にする案内
- プライバシー: 今回の結果表示だけに一時記録し、保存しない旨

カメラ開始とモック姿勢のbuttonは心拍未接続でも有効に保つ。接続は推奨するが、ゲームの
開始条件には加えない。実カメラ開始後のcamera preparation panelにはcompactな接続状態と
再接続操作を残し、自動カウントダウンの条件は変更しない。

### Playing HUD

既存`GameStatusHud`へ5番目の心拍itemを追加する。

```text
心拍
♥ 124 BPM   LIVE
```

- `live`: 数値、BPM、live dotまたは`LIVE`を表示する。
- `waiting`: `-- BPM / 受信待ち`を表示する。
- `stale`または`disconnected`: 数値を現在値として残さず`-- BPM / 切断`を表示する。
- 色は補助に留め、文言または記号を併用する。
- 数値更新領域へ`aria-live`を付けず、読み上げの連続発火を防ぐ。
- 要素全体へ最新値を含む`aria-label`を設定する。

切断時だけ、既存の終了buttonやwall cueと重ならない位置へ小さな`心拍を再接続`buttonを
表示する。ゲーム進行は一時停止しないため、プレイヤーは無視してプレイを継続できる。

desktop HUDは5列、mobileは`hearts/score`、`miss/speed`、`heart-rate`の3段gridとする。
compact heightでは心拍itemの高さを抑え、wall cue、pose status、終了buttonとの非交差を
E2Eで確認する。

### Result Panel

`HeartRateResultPanel`を既存result summaryとランキング登録状態の間へ配置する。

表示内容:

- 見出し: `プレイ中の心拍数`
- 最小、平均、最大BPM
- 記録時間
- responsive SVG graph
- 欠落区間がある場合の短い注記
- 医療用途ではない旨

0件ではgraph containerを表示せず、「今回は心拍データを記録できませんでした」と再接続を
促す。1件では折れ線ではなく測定点を表示する。result panelの追加後もスコア、ランキング、
再プレイ、タイトル、自動復帰を最初のviewport内または通常スクロールで操作できるようにする。

## Chart Design

`HeartRateChart`は外部chart libraryを使わずSVGで描画する。

### Chart Model

```typescript
type HeartRateChartPoint = {
  x: number;
  y: number;
  bpm: number;
  elapsedMs: number;
};

type HeartRateChartSegment = {
  id: number;
  points: readonly HeartRateChartPoint[];
};
```

- x軸は`0..durationMs`をviewBox内へ線形変換する。
- y軸は記録値の最小・最大へ上下10BPMの余白を付け、10BPM単位へ丸める。
- 全値が同じ場合も上下10BPMを確保する。
- y範囲は表示上`1..300`へ制限する。
- 異なる`segmentId`、または隣接サンプルが5秒を超える箇所では別polylineにする。
- 欠落segment間を線でつながない。
- x軸に開始`0:00`と終了時間、y軸にBPM目盛を表示する。
- SVG自体は装飾として`aria-hidden="true"`にし、隣接する統計と要約を支援技術向け情報とする。

グラフ計算はDOMへ依存しない純粋関数としてテストできる形にする。描画点数の実機確認で
負荷が見られる場合だけ、統計用raw samplesを維持したまま表示用downsamplingを設計追加する。

## Error and Fallback Behavior

心拍エラーは`GameError`へ追加しない。camera/pose error screenへ遷移せず、心拍UI内の局所状態
として扱う。

- 接続キャンセル: 未接続へ戻し、再試行可能。
- 接続失敗: エラー文と再接続buttonを表示。
- 不正notification: 値を破棄し、前の値が5秒を超えればstale表示。
- 途中切断: segmentを終了し、HUDを切断表示。ゲームは継続。
- 非対応ブラウザ: 接続buttonを無効にし、Chrome系ブラウザを案内。ゲームは継続。
- 結果データ0件: 心拍なしresultを表示し、ランキング登録は通常どおり続行。

Web Bluetooth接続中にcameraまたはpose errorが発生した場合、既存error遷移を優先してGATTを
切断する。心拍側のcleanup失敗で既存error messageを上書きしない。

## Privacy and Security

- BPM、samples、statistics、device IDをHTTP requestへ含めない。
- 心拍データをSQLite、localStorage、cookie、sessionStorageへ書かない。
- BPMやGoogle Health情報をserver log、browser consoleへ出力しない。
- selected device objectはブラウザメモリ内だけで保持し、タイトル復帰時に参照を破棄する。
- 接続前に一時記録と非永続化を短く表示する。
- top-level same-originでWeb Bluetoothを使い、cross-origin iframeを追加しない。
- API secret、OAuth token、Google accountを必要としない。
- 医療判断を行わず、「フィットネス・ゲーム表示用」の注記を表示する。

## Accessibility

- 接続状態の変化だけを`aria-live="polite"`で通知し、BPM更新は連続読み上げしない。
- `BPM`単位と状態文言を数値に併記する。
- live、stale、errorを色だけで表現しない。
- graphの代替として最小、平均、最大、記録時間、欠落有無をtextで提供する。
- 接続・再接続buttonはキーボード操作と明確なfocus表示を維持する。
- heart beat animationは装飾とし、`prefers-reduced-motion`で停止する。

## Performance and Lifecycle

- BLE notificationは通常のReact state更新として扱うが、Canvas render loopへ依存させない。
- stale判定timerは1つだけ作り、不要phaseとunmountで解除する。
- adapter listenerは1接続につき1組だけ登録する。
- result確定後はGATTを切断して通知を止め、frozen snapshotだけを保持する。
- replay、title return、auto returnでgeneration IDを更新し、遅延した非同期処理を無視する。
- 心拍機能のcleanupはcamera resource sessionと独立させ、互いのtokenを共有しない。

## Testing Strategy

### Unit Tests

`heartRateMeasurement.test.ts`:

- 8bit値。
- 16bit little-endian値。
- 空DataView。
- 途中で切れた16bit値。
- DataView以外。
- 0、301、非整数相当の不正値。

`heartRateSession.test.ts`:

- 開始前と終了後のreadingを記録しない。
- 経過時間と順序。
- 同一時刻の重複。
- 切断後のsegment ID。
- 5秒超のgap。
- 0件、1件、複数件の最小・平均・最大。
- finished resultのimmutability。
- resetで前回データを破棄。
- chart segmentがgapをまたいで接続されない。

adapter testでは最小のfake Bluetooth APIを注入し、device選択、GATT接続、service取得、
notification、切断、listener cleanup、多重connect抑止を確認する。

### E2E

Playwrightの`page.addInitScript`で`navigator.bluetooth`へfake adapterを注入し、実BLE機器を
CI条件にしない。

- 準備画面から接続し、受信BPMが表示される。
- モック姿勢で開始後、HUDがライブBPMを表示する。
- 通知停止後にstale表示となる。
- 切断後もゲームが結果まで進む。
- 結果画面にgraphと統計が表示される。
- 0件では心拍なし状態を表示する。
- 再プレイとタイトル復帰で前回統計が消える。
- desktop、compact、mobile、low-heightで既存UIと交差しない。

### Manual Device Verification

- Google HealthアプリからFitbit Airの心拍数共有を開始する。
- Chrome系ブラウザのchooserでFitbit Airを選択する。
- 安静時と軽い運動時にBPM更新を確認する。
- 腕を動かしたときの一時欠落と復帰を確認する。
- Google Healthアプリ、他の運動機器、別タブとの接続競合を確認する。
- Fitbit Airを遠ざける、共有停止する、Bluetoothを切る方法で切断を確認する。
- 同一デバイスへの再接続と、別プレイヤー開始時のデータ破棄を確認する。
- SSHポートフォワーディングの`localhost`から手元端末Bluetoothへ接続できることを確認する。

実機確認はFitbit Airのfirmware、Google Healthアプリ、ブラウザの組み合わせを記録する。
実機で接続、ライブ更新、切断、再接続、結果graphを確認するまで完了扱いにしない。

## Risks and Mitigations

### Browser Support

Web Bluetoothはすべての主要ブラウザで利用できない。展示端末を対応するChrome系ブラウザへ
固定し、非対応時は心拍なしでゲームを続ける。

### Device Advertising and Pairing

Fitbit Air側で心拍数共有が有効でない場合、chooserへ表示されない。接続UIに事前手順を表示し、
他アプリや運動機器へ接続中の場合は切断して再試行する案内を用意する。

### Notification Gaps

光学センサーは装着状態や動作で一時的に値が止まる。5秒freshness、segment分割、欠落表示で
古い値や補間値を実測として見せない。

### Result Screen Density

既存resultへgraphを追加すると低い画面で操作が画面外になりうる。graph高さを抑え、app shellの
縦scroll、responsive layout、既存visual E2Eの非交差確認で対応する。

### Concurrent Resource Cleanup

camera、pose、audio、heart rateが独立した外部resourceを持つ。専用adapterとgeneration IDで
cleanupを分離し、`App`の共通resetから各cleanupを明示的に呼ぶ。

## References

- `https://github.com/taku0193/fitbit-air-heart-rate`
- `https://support.google.com/product-documentation/answer/16923066`
- `https://support.google.com/googlehealth/answer/14236705`
- `https://developer.mozilla.org/docs/Web/API/Web_Bluetooth_API`

参照リポジトリはMIT Licenseだが、実装は本プロジェクトの型、React lifecycle、画面遷移、
品質基準に合わせて独自に構成する。標準BLE UUIDとHeart Rate Measurement仕様は相互運用に
必要なプロトコル情報として利用する。
