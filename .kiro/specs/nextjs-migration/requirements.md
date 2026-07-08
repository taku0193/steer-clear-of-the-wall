# Requirements Document

## Introduction

`nextjs-migration` は、現在のブラウザゲーム実装を React + TypeScript + Next.js 構成へ移行するための仕様です。

目的は、ゲーム体験と既存の責務分離を維持したまま、アプリ基盤を Next.js に置き換えることです。カメラ、MediaPipe、Canvas、ゲームループはブラウザ実行が前提のため、Next.js のサーバー側実行領域へ漏らさず、クライアントコンポーネントとして扱います。

## Boundary Context

- **今回実装する範囲**: Vite構成からNext.js App Router構成への移行、エントリポイントの置き換え、グローバルCSSの接続、既存Reactコンポーネントとゲームロジックの移設、READMEと実行コマンドの更新、型チェック・ビルド・テストの維持。
- **今回実装しない範囲**: ゲームルールの変更、壁パターンや当たり判定の再設計、UIデザインの刷新、ランキングやバックエンド連携、サーバーサイド姿勢検出、Next.js API Routeの追加。
- **前提**: 既存の `src/game/`, `src/rendering/`, `src/camera/`, `src/pose/`, `src/components/` の責務分離は維持する。

## Requirements

### Requirement 1: Next.js アプリ基盤

**Objective:** As a 開発者, I want アプリを Next.js で起動・ビルドできる, so that React + TypeScript + Next.js を前提に開発を進められる

#### Acceptance Criteria

1. The Wall Dodge Game shall Next.js App Router構成でアプリを表示できる
2. The Wall Dodge Game shall `npm run dev` でNext.js開発サーバーを起動できる
3. The Wall Dodge Game shall `npm run build` でNext.jsの本番ビルドを実行できる
4. The Wall Dodge Game shall Vite専用のエントリ、設定、HTMLテンプレートへ依存しない

### Requirement 2: ブラウザAPI依存の隔離

**Objective:** As a 開発者, I want カメラ・MediaPipe・Canvas処理をクライアント実行に限定する, so that Next.jsのサーバー実行時にブラウザAPI参照で壊れない

#### Acceptance Criteria

1. The Wall Dodge Game shall カメラ、姿勢検出、Canvas描画、ゲーム画面の副作用をクライアントコンポーネント内で扱う
2. The Wall Dodge Game shall `window`, `document`, `navigator`, `HTMLVideoElement`, `MediaStream` などをサーバーコンポーネントで直接参照しない
3. The Wall Dodge Game shall MediaPipeの初期化をユーザー操作またはクライアントライフサイクル後に行う
4. If カメラや姿勢検出が利用できない, the Wall Dodge Game shall 既存と同じエラー状態またはモック姿勢モードで扱える

### Requirement 3: 既存ゲーム体験の維持

**Objective:** As a プレイヤー, I want 移行後も同じゲームとして遊べる, so that フレームワーク変更で体験が変わらない

#### Acceptance Criteria

1. The Wall Dodge Game shall タイトル、準備、カウントダウン、プレイ、結果、エラーの状態遷移を維持する
2. The Wall Dodge Game shall アバター表示、壁描画、安全領域、衝突判定、スコア、ハート、速度上昇を維持する
3. The Wall Dodge Game shall 実カメラモードとモック姿勢モードを維持する
4. The Wall Dodge Game shall 画面全体を使ったゲームUIを維持する

### Requirement 4: 純粋ロジックとテストの維持

**Objective:** As a 開発者, I want ゲームロジックのテスト可能性を保つ, so that 移行後も安全に調整できる

#### Acceptance Criteria

1. The Wall Dodge Game shall `src/game/` の純粋ロジックをReactやNext.jsに依存させない
2. The Wall Dodge Game shall 既存のユニットテストをNext.js移行後も実行できる
3. The Wall Dodge Game shall TypeScript strict前提を維持する
4. The Wall Dodge Game shall 移行後に `npm test`, `npm run typecheck`, `npm run build` を成功させる

### Requirement 5: ドキュメントと運用コマンド

**Objective:** As a 開発者, I want READMEとプロジェクトメモリがNext.js前提に揃っている, so that 新しい作業者が迷わず起動・確認できる

#### Acceptance Criteria

1. The Wall Dodge Game shall READMEのセットアップ、開発サーバー、ビルド、確認コマンドをNext.js構成に更新する
2. The Wall Dodge Game shall SSHポートフォワーディングとカメラ利用条件の説明をNext.js開発サーバー前提に更新する
3. The Wall Dodge Game shall `.kiro/steering/tech.md` の長期技術方針をNext.js前提に更新する
4. The Wall Dodge Game shall 実装履歴ではなく、現在の構成と今後守るべき方針を記述する
