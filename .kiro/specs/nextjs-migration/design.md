# Design Document

## Overview

`nextjs-migration` では、現行のReactアプリを Next.js App Router の1画面アプリとして再配置する。

ゲーム本体はブラウザAPIに強く依存するため、Next.jsのサーバーコンポーネントでゲーム処理を動かさない。`app/page.tsx` はページとしてクライアントゲームコンポーネントを表示し、実際の状態管理、カメラ、姿勢検出、Canvas描画は `"use client"` を付けたコンポーネント配下で行う。

## Goals

- React + TypeScript + Next.js をプロジェクトの標準構成にする。
- 既存のゲーム体験、状態遷移、描画、判定、テストを維持する。
- ブラウザAPI依存をクライアント境界内に閉じ込める。
- Vite固有ファイルをNext.js構成へ置き換える。
- READMEとsteeringを現在の構成に合わせる。

## Non-Goals

- ゲームデザインや壁パターンの作り直し。
- サーバーサイドレンダリングを使ったゲーム状態の生成。
- API Route、Server Actions、DB、認証、ランキングの追加。
- MediaPipeモデルの自前ホスティング。
- UI全面刷新。

## Architecture

### Application Boundary

Next.jsのページ層は薄く保つ。

```text
app/
├── layout.tsx
├── page.tsx
└── globals.css
src/
├── App.tsx
├── camera/
├── components/
├── game/
├── pose/
└── rendering/
```

`src/App.tsx` はクライアントコンポーネントとして扱う。`app/page.tsx` は `App` を描画するだけにし、ページ側へゲームロジックを持たせない。

### Client Component Strategy

`src/App.tsx` の先頭へ `"use client"` を追加する。これにより、配下のコンポーネントとhooksはクライアント側で実行される。

ブラウザAPI依存は次の既存境界を維持する。

- `src/camera/`: `navigator.mediaDevices` と `MediaStream` 管理
- `src/pose/`: MediaPipe初期化と推論
- `src/rendering/`: Canvas 2D描画
- `src/components/GameScreen.tsx`: Canvas要素と描画ライフサイクル
- `src/game/`: UIやブラウザAPIに依存しない純粋ロジック

### Styling

現在の `src/style.css` は `app/globals.css` へ移すか、`app/globals.css` から同等内容を保持する。Next.jsではグローバルCSSを `app/layout.tsx` から読み込む。

CSS ModulesやCSS-in-JSへの移行は行わない。

### Entry Point Replacement

Vite構成の次のファイルは不要になる。

- `index.html`
- `vite.config.ts`
- `src/main.tsx`

Next.js構成では次のファイルを追加する。

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `next.config.ts`
- `next-env.d.ts`

`tsconfig.json` はNext.jsが期待する設定へ調整する。ただし `strict` は維持する。

### Package Scripts

`package.json` のスクリプトをNext.js前提にする。

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start -H 0.0.0.0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

Next.jsのビルドは型チェックを含むが、確認コマンドとして `typecheck` は残す。

### Dependency Changes

追加する主依存:

- `next`

削除するVite専用依存:

- `vite`
- `@vitejs/plugin-react`

維持する依存:

- `react`
- `react-dom`
- `typescript`
- `vitest`
- `@mediapipe/tasks-vision`
- ReactとNode向けの型定義

## Data and Logic Compatibility

`src/game/` は移行による変更を最小化する。壁パターン、衝突判定、スコア、速度、ゲームループはNext.jsへ依存させない。

`src/rendering/` もCanvas APIを使うが、DOMの取得やReact状態を持たない描画関数として維持する。

## Testing Strategy

移行後に次を確認する。

- `npm test`: 既存ユニットテストが通る
- `npm run typecheck`: TypeScript型チェックが通る
- `npm run build`: Next.js本番ビルドが通る
- `npm run dev`: SSH環境で開発サーバーが起動する

ブラウザ実機確認では、モック姿勢モード、カメラ許可、MediaPipe初期化、Canvas描画、結果画面遷移を確認する。

## Risks and Mitigations

### サーバー実行時にブラウザAPIで失敗する

`src/App.tsx` をクライアントコンポーネントにし、ブラウザAPI参照をhooksやイベントハンドラ内に維持する。

### MediaPipeのWASMやモデル読み込みが壊れる

現在と同じ外部配信元からクライアント側で読み込む。Next.jsのサーバー処理へMediaPipeを移さない。

### CSS適用順が変わる

グローバルCSSは `app/layout.tsx` で一度だけ読み込み、既存のクラス名と構造を維持する。

### テスト環境がNext.jsに引きずられる

ユニットテスト対象は純粋ロジック中心のまま維持し、Next.jsページ層のテストは今回追加しない。
