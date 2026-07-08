# Technology Stack

このプロジェクトは、React + TypeScript + Next.js を基盤にしたブラウザゲームとして開発します。

ゲーム本体はカメラ、MediaPipe、Canvas、タイマーなどブラウザ実行に依存します。Next.jsを使う場合でも、これらの処理はクライアントコンポーネント配下に閉じ込め、サーバー側実行領域へ漏らさないことを基本方針にします。

## Architecture

主要な責務は分離します。

- カメラ入力: ブラウザのカメラ権限と映像ストリーム管理
- 姿勢検出: ライブラリ初期化、モデル読み込み、ランドマーク取得
- 表示: アバター、壁、UI、結果画面の描画
- ゲーム進行: 状態遷移、タイマー、レベル、ライフ、コンボ
- 判定: 壁パターンと姿勢ランドマークの衝突判定
- スコア: 成功、失敗、ボーナス、最終結果の計算

外部APIやブラウザAPIに依存する処理と、純粋なゲームロジックを分けます。判定やスコアは単体でテストしやすい形にしてください。

## Core Technologies

- Language: TypeScript
- Frontend: React
- Framework: Next.js App Router
- Pose Detection: MediaPipe Tasks Vision
- Rendering: Canvas 2D
- Styling: グローバルCSSを基本にし、必要に応じてReact/Next.jsに適した方式を追加する
- Test Runner: Vitest

## Next.js Usage

- `app/page.tsx` はページ入口として薄く保つ。
- ゲーム本体は `"use client"` を付けたコンポーネント配下で実行する。
- `window`, `document`, `navigator`, `HTMLVideoElement`, `MediaStream`, Canvas API はサーバーコンポーネントで直接参照しない。
- MediaPipeの初期化は、ユーザー操作後またはクライアントライフサイクル内で行う。
- API Routes、Server Actions、DB連携は必要になるまで追加しない。

## Development Environment

- SSH接続したUbuntuサーバー上で開発する。
- ブラウザでのカメラ利用は、基本的に `localhost` または安全なコンテキストを前提にする。
- 別端末から動作確認する場合は、Next.js開発サーバーのhost設定、HTTPS要件、カメラ権限を事前に確認する。
- Codexを使う。Claude Code専用の前提やファイルは導入しない。

## Commands

標準コマンドは次を基本にします。

```bash
# 開発サーバー
npm run dev

# 型チェック
npm run typecheck

# ビルド
npm run build

# ユニットテスト
npm test
```

## Development Standards

### Type Safety

- TypeScriptはstrictな型付けを基本にする。
- 姿勢ランドマーク、壁パターン、ゲーム状態、判定結果は型で表現する。
- `any` は外部ライブラリ境界など避けられない場合に限定し、理由が分かる形にする。

### Runtime State

- カメラ開始前に重い姿勢検出モデルを初期化しない。
- ユーザー操作を起点に、カメラ権限、姿勢検出、描画、ゲーム開始を順に進める。
- 停止、リトライ、ページ遷移でカメラストリームやアニメーションループを解放する。
- Next.jsのページ遷移やアンマウントでも、ストリーム、検出器、タイマーを残さない。

### Error Handling

次の状態はゲーム不能または判定不能状態として扱い、ユーザーに次の行動が分かるUIを用意します。

- カメラ許可拒否
- カメラ非搭載または取得失敗
- 姿勢検出モデルの読み込み失敗
- ブラウザ非対応
- 姿勢が検出できない状態

### Testing

- 衝突判定、スコア計算、レベル進行は純粋関数としてテスト可能にする。
- カメラや姿勢検出の実機依存部分は、薄いアダプターに閉じ込める。
- 実装後は少なくとも型チェック、ビルド、ユニットテストを実行し、結果を報告する。

## Key Technical Decisions

- 姿勢検出結果を直接UI全体に流さず、ゲームで必要な形に変換して扱う。
- 壁パターン、判定、スコアはデータとロジックを分け、調整しやすくする。
- 描画は毎フレーム更新されるため、Reactの通常レンダリングとCanvas描画の責務を混ぜすぎない。
- Next.jsを使っても、ブラウザゲームとしての実行境界を優先する。
- 参考リポジトリからのコピーではなく、仕様に基づいた独自実装を行う。
