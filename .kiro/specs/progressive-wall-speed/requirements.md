# Requirements Document

## Introduction

`progressive-wall-speed` は、プレイヤーが壁回避に成功し続けるほど、迫る壁の速度が段階的に上がる機能です。

現状の壁は固定速度で進行し、壁1枚あたり約2.4秒で判定位置に到達します。このため、慣れたプレイヤーには後半の緊張感が弱くなります。本機能では、成功した壁の枚数に応じて速度を段階的に上げ、短時間の展示プレイでも上達と難易度上昇を感じられるようにします。

## Boundary Context

- **今回実装する範囲**: 成功数の記録、成功数に応じた壁速度段階、速度段階の初期化、HUDまたはフィードバックでの速度変化表示、ゲームループのユニットテスト、README更新。
- **今回実装しない範囲**: 難易度自動推定、プレイヤー別キャリブレーション、スコアランキング、バックエンド保存、壁パターンの出現確率調整。
- **隣接する期待**: 速度上昇はゲームを面白くするための調整であり、初回プレイヤーがすぐ失敗するほど急激にしない。

## Requirements

### Requirement 1: 成功数による速度上昇

**Objective:** As a プレイヤー, I want 壁を何枚か避けると次第に壁が速くなる, so that 上達に応じた緊張感を感じられる

#### Acceptance Criteria

1. When プレイヤーが壁回避に成功する, the Wall Dodge Game shall 成功した壁の枚数を増やす
2. When 成功した壁の枚数が設定された段階条件に到達する, the Wall Dodge Game shall 壁の進行速度を上げる
3. The Wall Dodge Game shall ミスまたは姿勢未検出の判定では成功枚数を増やさない
4. The Wall Dodge Game shall 速度上昇後も壁が判定位置に到達したときだけ1回判定する

### Requirement 2: 段階的で上限のある速度

**Objective:** As a 展示で初めて遊ぶ来場者, I want 速度が急に上がりすぎない, so that 理不尽に感じず遊び続けられる

#### Acceptance Criteria

1. The Wall Dodge Game shall 壁速度を段階制として扱う
2. The Wall Dodge Game shall 初期速度を既存のプレイ感に近い速度として維持する
3. The Wall Dodge Game shall 速度段階に上限を設ける
4. The Wall Dodge Game shall 最大速度でも壁の動きが視認でき、プレイヤーが反応できる余地を残す
5. The Wall Dodge Game shall 速度段階の閾値と速度値をゲームロジック内でテスト可能な定数またはデータとして管理する

### Requirement 3: ゲーム状態との統合

**Objective:** As a 開発者, I want 速度上昇をゲーム状態として明確に扱う, so that リトライや結果表示で破綻しない

#### Acceptance Criteria

1. The Wall Dodge Game shall 現在の成功枚数をゲーム状態として保持する
2. The Wall Dodge Game shall 現在の速度段階をゲーム状態または純粋関数から導出できる形で扱う
3. When 新しいプレイを開始する, the Wall Dodge Game shall 成功枚数と速度段階を初期状態へ戻す
4. When ハートがなくなり結果画面へ遷移する, the Wall Dodge Game shall 直前までの成功枚数を保持して表示または検証できる
5. The Wall Dodge Game shall 既存のハート、スコア、ミス、壁順序の基本挙動を維持する

### Requirement 4: プレイヤーへの速度変化フィードバック

**Objective:** As a プレイヤー, I want 壁が速くなったことが分かる, so that 変化をゲーム展開として理解できる

#### Acceptance Criteria

1. When 速度段階が上がる, the Wall Dodge Game shall プレイヤーに速度が上がったことを短く伝える
2. The Wall Dodge Game shall プレイ中に現在の速度段階または難易度感を確認できる表示を用意する
3. The Wall Dodge Game shall 速度表示がスコア、ハート、判定フィードバックの視認性を妨げない
4. The Wall Dodge Game shall モック姿勢モードでも速度上昇と表示を確認できる

### Requirement 5: テスト可能なゲームループ

**Objective:** As a 開発者, I want 速度上昇ロジックを自動テストで確認できる, so that 調整しても退行を検出できる

#### Acceptance Criteria

1. The Wall Dodge Game shall 成功時だけ成功枚数が増えることをユニットテストで確認する
2. The Wall Dodge Game shall 成功枚数が閾値に達したとき速度段階が上がることをユニットテストで確認する
3. The Wall Dodge Game shall 最大速度段階を超えて速度が上がらないことをユニットテストで確認する
4. The Wall Dodge Game shall リトライ時に速度関連状態が初期化されることをユニットテストで確認する
5. The Wall Dodge Game shall 実装後に型チェック、ビルド、ユニットテストを通す
