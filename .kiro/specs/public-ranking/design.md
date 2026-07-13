# Design Document

## Overview

`public-ranking`は仕様IDを維持したまま、インターネット公開を行わないローカルランキングへ
変更する。ゲーム結果は同じPCで動くNext.js Route Handlerへ登録し、SQLiteへ保存して、
タイトル画面と結果画面から開くゲーム内オーバーレイへ表示する。

責務は次の5境界へ分離する。

1. Ranking Domain: 入力正規化、検証、順位比較、DTO。
2. Ranking Repository: SQLite schema、query、transaction、migration。
3. Ranking API: HTTP request、status、body size、エラー変換。
4. Ranking UI: 開始前ニックネーム入力、結果登録状態、ゲーム内ランキング一覧。
5. Local Operation: production process、ローカルURL、環境変数、バックアップ。

ゲーム進行、Canvas、カメラ、姿勢検出はランキングDBやHTTPへ依存させない。

## Goals

- 開始前に設定したニックネームで結果を1回だけ自動登録する。
- ゲームを実行するPCのゲーム内画面へTop 100を表示する。
- 結果画面では入力操作を求めず、登録状態と順位を確認できる。
- 結果画面の状態を失わずランキングオーバーレイを開閉できる。
- Next.js再起動後もSQLite上の記録を保持する。
- 公開ドメイン、HTTPS証明書、Nginxなしで運用できる。
- ランキング障害時もゲーム本体を継続できる。

## Non-Goals

- QRコードと公開URL。
- 独立した`/ranking`ページ。
- スマートフォン、会場LAN、インターネット上の別端末からの閲覧。
- Nginx、HTTPS終端、DNS、公開用systemd設定。
- アカウント、認証、個人履歴。
- 改ざん不可能な競技用anti-cheat。
- 複数大会や会場の管理、削除・編集画面。
- カメラ画像、姿勢、端末情報、IPアドレスのDB保存。

## Architecture

```text
Game PC
┌───────────────────────────────┐
│ Browser: http://localhost:3000│
│ ┌───────────────────────────┐ │
│ │ NicknameInput             │ │
│ │ ResultSubmissionStatus    │ │
│ │ RankingOverlay            │ │
│ └─────────────┬─────────────┘ │
│               │ same-origin   │
│ ┌─────────────▼─────────────┐ │
│ │ Next.js Route Handlers    │ │
│ └─────────────┬─────────────┘ │
│               │ binding       │
│ ┌─────────────▼─────────────┐ │
│ │ SQLite: ranking.db        │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```

ブラウザ、Next.js、SQLiteは同じゲーム端末上で動作する。ランキングAPIはUIと永続化の
責務分離のために残すが、別端末から利用するための公開APIとしては扱わない。

## File Structure

```text
app/
└── api/
    ├── health/route.ts
    └── rankings/route.ts

src/ranking/
├── rankingTypes.ts
├── rankingValidation.ts
├── rankingOrder.ts
├── rankingRepository.ts
├── rankingService.ts
├── rankingClient.ts
└── rankingErrors.ts

src/components/ranking/
├── RankingPanel.tsx
├── RankingTable.tsx
├── RankingOverlay.tsx
├── NicknameInput.tsx
└── ResultSubmissionStatus.tsx

scripts/
└── backup-ranking.mjs
```

`app/ranking/`、`app/api/ranking-qr/`、`PublicRankingPage`、`RankingQrCode`、QR生成依存関係、
Nginx・公開用systemd設定は削除する。`rankingValidation`と`rankingOrder`はReactやSQLiteへ
依存させず、repositoryとRoute Handlerはserver-onlyとして扱う。

## Technology Decisions

### SQLite Driver

`better-sqlite3`を継続使用する。

- 短いtransactionとTop 100 queryの境界が明確になる。
- WAL modeとbusy timeoutを設定できる。
- Next.jsではserver external packageとして扱う。
- Route Handlerへ`runtime = "nodejs"`を指定する。

### Data Fetching

外部状態管理ライブラリは追加せず、`rankingClient`とReact hookで扱う。

- ランキングオーバーレイを開いたときに取得する。
- 手動更新操作を提供する。
- 同じPCで登録直後のentryを表示する場合は、オーバーレイを開いた時点で再取得する。
- 公開ページ用の10秒ポーリングは削除する。
- unmountと再取得前に`AbortController`で古いrequestを中断する。

## Data Model

### Database Schema

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE ranking_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score >= 0 AND score <= 1000000),
  successful_walls INTEGER NOT NULL CHECK(successful_walls >= 0 AND successful_walls <= 10000),
  speed_level INTEGER NOT NULL CHECK(speed_level >= 1 AND speed_level <= 100),
  misses INTEGER NOT NULL CHECK(misses >= 0 AND misses <= 100),
  created_at TEXT NOT NULL
);

CREATE INDEX ranking_order_idx ON ranking_entries (
  score DESC,
  successful_walls DESC,
  misses ASC,
  created_at ASC,
  id ASC
);
```

SQLite初期化時に`journal_mode = WAL`、`foreign_keys = ON`、`busy_timeout = 5000`を設定する。

### Domain Types

```typescript
export type RankingSubmission = {
  submissionId: string;
  displayName: string;
  score: number;
  successfulWalls: number;
  speedLevel: number;
  misses: number;
};

export type RankingEntry = {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  successfulWalls: number;
  speedLevel: number;
  achievedAt: string;
};

export type RankingSnapshot = {
  entries: RankingEntry[];
  totalEntries: number;
  updatedAt: string;
};
```

DBの連番IDはDTOでそのまま返さず、entry強調に必要なopaque IDへ変換する。

## Ranking Order

SQLと純粋比較関数で同じ順序を使う。

1. `score DESC`
2. `successful_walls DESC`
3. `misses ASC`
4. `created_at ASC`
5. `id ASC`

POST成功時は挿入したentryより上位の件数から順位を返し、GETは同じORDER BYでTop 100へ
1始まりの順位を付ける。

## Display Name Validation

画面上では「ニックネーム」、APIとDBでは`displayName`と表記する。ニックネームは
アカウントや永続的なユーザー識別子ではない。

正規化と検証は次の順序で行う。

1. 文字列型を確認する。
2. Unicode NFKCで正規化する。
3. 前後空白を除き、連続空白を1つへまとめる。
4. 制御文字、bidi override、zero-width文字、`<`、`>`を拒否する。
5. grapheme単位で1〜12文字を確認する。

クライアントでも同じ純粋関数を使い、APIで必ず再検証する。Reactのtext nodeとして描画し、
`dangerouslySetInnerHTML`は使わない。

## Submission Lifecycle

### Nickname State

- タイトル画面で、ゲーム開始操作より前にニックネームinputを表示する。
- ゲーム端末のランキングに表示されることと、本名・連絡先を入力しないことを示す。
- 有効なニックネームを確定してからカメラ準備へ進む。
- 確定値は`App`のメモリ上だけに保持し、`localStorage`やcookieへ保存しない。
- 結果画面から直接再プレイする場合は値を引き継ぐ。
- タイトルへ戻る場合は消去し、共有端末の次の参加者へ残さない。
- APIやDBの事前疎通は開始条件にしない。

### Submission ID

- 新しいゲームセッション開始時に`crypto.randomUUID()`を1回生成する。
- 同じresult画面の再送では同じIDを使う。
- 再プレイ時に新しいIDへ更新する。
- DBのUNIQUE constraintを最終的な重複防止にする。

### Result Screen

1. result遷移時に確定済みニックネームと結果を自動送信する。
2. 送信中は結果を表示したまま登録中であることを示す。
3. 成功後は登録済み状態と順位を表示する。
4. 失敗時は結果とsubmission IDを保持して再送操作を表示する。
5. 「ランキングを見る」でゲーム内オーバーレイを開き、登録entryを強調する。
6. client側の送信状態とDBのUNIQUE constraintで二重登録を防ぐ。

submission stateは`idle | submitting | success | error`とする。自動復帰timerは登録成功後に
開始し、送信中と失敗中は開始しない。明示的にタイトルへ戻る操作は常に利用できる。

## Ranking UI

### RankingPanel

表示状態は`loading`、`success`、`empty`、`refreshing`、`error`とする。更新失敗時に前回データが
あれば保持し、再読込操作を表示する。

表示項目:

- 順位
- ニックネーム
- スコア
- クリア枚数
- 最高速度
- 達成時刻

1位から3位を強調し、4位以下を走査しやすい一覧にする。想定するゲーム端末の画面内で
主要情報と操作を確認できるようにする。

### Game Overlay

- `App`の`rankingOverlay` stateで管理し、GamePhaseは増やさない。
- タイトルと結果からだけ開く。
- full viewportのdialogとして表示する。
- Escapeと閉じるbuttonを持つ。
- resultから開いた場合は閉じると同じresultへ戻る。
- overlay表示中は背面を操作不能にし、focusをdialog内へ維持する。
- カメラ、姿勢検出、ゲームtimerを起動しない。
- QRコード、URL、スマートフォン案内は配置しない。

## API Design

### `GET /api/rankings`

Top 100、総件数、更新時刻をJSONで返し、`Cache-Control: no-store`を設定する。

### `POST /api/rankings`

`RankingSubmission`を受け付け、bodyは8KB以下とする。

- `201`: `{ entry, rank }`
- `400`: JSONまたは型が不正
- `409`: submission ID重複
- `413`: body上限超過
- `500`または`503`: 保存不能

### `GET /api/health`

- `200`: process起動、DBへ`SELECT 1`成功
- `503`: DB利用不可

DB pathや例外messageは返さない。`GET /api/ranking-qr`は削除する。

## Repository Lifecycle

- module scopeのlazy singletonで1processに1connectionを持つ。
- 初回accessでディレクトリ確認、DB open、PRAGMA、migrationを行う。
- migrationはtransactionでversion順に適用する。
- テストは一時ディレクトリごとに独立repositoryを生成する。
- developmentでは未設定時に`./data/ranking.db`を使う。
- productionでは`RANKING_DATABASE_PATH`を設定する。
- DB利用不能時はランキングだけを失敗させ、ゲーム本体を継続する。

## Error Handling

Domain errorを`invalidSubmission`、`duplicateSubmission`、`databaseUnavailable`、
`rankingUnavailable`へ分類する。Route Handlerはdomain errorだけをHTTP statusへ変換し、未知の
例外はserver logへ記録する。clientはゲーム全体のerror phaseへ遷移せず、ランキング領域内で
再試行を提示する。

## Security and Privacy

- SQLはprepared statementとparameter bindingを使う。
- DB fileは`public/`へ置かない。
- POST bodyを8KBへ制限する。
- APIはsame-originで利用し、CORS headerを追加しない。
- ニックネームをHTMLとして解釈しない。
- IPアドレス、カメラ画像、姿勢、端末情報をDBへ保存しない。
- 公開URLを持たず、QRコードや別端末向け導線を生成しない。

client送信スコアは同じPCのブラウザから改変可能である。初期版は入力範囲検証までを対象とし、
賞品を伴う競技用途はNon-Goalとする。

## Local Operation

### Development

```text
npm run dev
http://localhost:3000
RANKING_DATABASE_PATH未設定時: ./data/ranking.db
```

### Production on the Game PC

```text
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=3000
RANKING_DATABASE_PATH=<ゲーム端末上の永続パス>/ranking.db
```

`npm run build`後に`npm run start`で起動し、同じPCの`http://localhost:3000`から利用する。
公開ドメイン、`NEXT_PUBLIC_RANKING_URL`、Nginx、証明書は設定しない。自動起動が必要な場合は
ローカルprocess管理を別途選べるが、インターネット公開設定とは分離する。

### Backup and Restore

- 稼働中はSQLite online backupまたは`.backup`を使用する。
- backup先と保存期間はゲーム端末の運用時に決める。
- 復元はprocess停止、現DB退避、backup配置、権限確認、process開始、health確認の順とする。
- 稼働中DBを通常の`cp`だけで複製しない。

## Removal Plan

既に存在する公開機能は、ローカルランキングの実装変更タスクで次の順に除去する。

1. タイトル画面とランキングdialogからQRコードを外す。
2. `app/ranking/`と`app/api/ranking-qr/`を削除する。
3. `PublicRankingPage`と`RankingQrCode`を削除する。
4. `qrcode`と型定義を依存関係から削除する。
5. `NEXT_PUBLIC_RANKING_URL`と公開専用Playwright設定を削除する。
6. Nginx、公開用systemd、証明書、公開環境変数のテンプレートとREADME記述を削除する。
7. ゲーム内ランキング、SQLite backup、ローカルproduction手順だけを残す。

## Testing Strategy

### Unit and Repository

- ニックネームの正規化、grapheme数、危険文字。
- 数値範囲、submission ID、同点順位。
- 一時SQLiteでmigration、insert、Top 100、重複、再open。
- API response parser。

### API

- GET空状態、GET順位。
- POST成功、validation 400、duplicate 409、oversize 413。
- DB unavailable 500/503、health 200/503。
- QR endpointが存在しないこと。

### Component and E2E

- 開始前ニックネーム入力と注意表示。
- 結果の自動登録、成功順位、失敗時再試行、二重送信防止。
- 再プレイ時の引き継ぎとタイトル復帰時の消去。
- タイトル・結果からゲーム内overlayを開閉できること。
- 直前entryを強調できること。
- QRコード、公開URL、スマートフォン導線が表示されないこと。
- ゲーム端末の想定画面サイズで非交差・非overflowを確認すること。

### Local Operation Manual

- production buildとローカルserver起動。
- `http://localhost:3000/api/health`、ゲーム、ランキング登録・表示。
- Next.js再起動後のデータ保持。
- SQLite backupとrestore。

## Requirement Traceability

| Requirement | Design Section |
|---|---|
| 1 | Display Name Validation, Submission Lifecycle |
| 2 | Ranking Order, Data Model |
| 3 | Ranking UI, Game Overlay |
| 4 | API Design, Security and Privacy |
| 5 | Repository Lifecycle, Backup and Restore |
| 6 | Local Operation, Removal Plan |
| 7 | Display Name Validation, Security and Privacy |
| 8 | Testing Strategy, Local Operation Manual |

## Risks

### 自動登録と結果画面の自動復帰

登録成功前に自動復帰すると再試行機会を失うため、timerは成功後に開始する。API障害中は
明示的な「タイトルへ戻る」を常時表示し、自動復帰時はニックネームを消去する。

### SQLite native module

Node.js versionと`better-sqlite3`の対応を固定し、ゲーム端末とCIでinstall・buildを確認する。

### ローカルprocess停止

Next.js processが停止するとゲームとランキングの両方を利用できない。READMEへ起動、health確認、
再起動の手順を短く記載し、公開サーバー運用を前提にしない復旧方法を用意する。
