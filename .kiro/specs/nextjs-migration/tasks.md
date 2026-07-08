# Implementation Plan

## 方針

- 既存のゲーム体験を変えず、アプリ基盤だけをNext.jsへ移行する。
- ブラウザAPI依存は `"use client"` 配下に閉じ込める。
- Vite時代の履歴説明を残すのではなく、READMEとsteeringは現在のNext.js前提として書く。
- 実装後は型チェック、ビルド、ユニットテストを必ず実行する。

## Tasks

- [x] 1. Next.js依存とスクリプトへ切り替える
  - 作業内容: `next` を追加し、Vite専用依存とスクリプトをNext.js用へ置き換える。
  - 変更するファイル: `package.json`, `package-lock.json`
  - 依存関係: なし
  - 完了条件: `npm run dev`, `npm run build`, `npm run start`, `npm run typecheck`, `npm test` の意図がNext.js構成として明確になる。
  - 確認方法: `npm install` 後にスクリプト一覧とlockfile差分を確認する。
  - _Requirements: 1.2, 1.3, 4.4_

- [x] 2. Next.js App Routerのエントリを追加する
  - 作業内容: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.ts`, `next-env.d.ts` を追加する。
  - 変更するファイル: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.ts`, `next-env.d.ts`
  - 依存関係: 1
  - 完了条件: Next.jsのページとしてゲームアプリを表示できる入口がある。
  - 確認方法: `npm run typecheck` を実行する。
  - _Requirements: 1.1, 2.1_

- [x] 3. 既存アプリをクライアントコンポーネント化する
  - 作業内容: `src/App.tsx` をクライアントコンポーネントとして扱い、必要ならブラウザAPI参照がクライアント境界内にあることを調整する。
  - 変更するファイル: `src/App.tsx`, 必要に応じて `src/components/`
  - 依存関係: 2
  - 完了条件: カメラ、姿勢検出、Canvas、タイマー処理がサーバーコンポーネントで実行されない。
  - 確認方法: `npm run build` でブラウザAPI参照エラーが出ないことを確認する。
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Vite専用ファイルを取り除く
  - 作業内容: ViteのHTMLエントリ、Reactルート作成ファイル、Vite設定を削除し、Next.jsエントリへ一本化する。
  - 変更するファイル: `index.html`, `src/main.tsx`, `vite.config.ts`
  - 依存関係: 2, 3
  - 完了条件: アプリ起動がNext.jsの `app/` から行われ、Vite専用ファイルに依存しない。
  - 確認方法: `rg "vite|createRoot|index.html"` で不要参照が残っていないことを確認する。
  - _Requirements: 1.4_

- [x] 5. TypeScript設定をNext.js前提に調整する
  - 作業内容: `tsconfig.json` をNext.jsに合う設定へ更新し、strictな型チェックを維持する。
  - 変更するファイル: `tsconfig.json`
  - 依存関係: 2
  - 完了条件: Next.jsが必要とする型設定と既存テスト対象の型チェックが両立する。
  - 確認方法: `npm run typecheck` を実行する。
  - _Requirements: 4.1, 4.3_

- [x] 6. READMEとsteeringを現在のNext.js前提へ更新する
  - 作業内容: セットアップ、開発サーバー、ビルド、SSHポートフォワーディング、技術方針をNext.js構成として書き換える。
  - 変更するファイル: `README.md`, `.kiro/steering/tech.md`
  - 依存関係: 1, 2, 4
  - 完了条件: Vite移行の履歴ではなく、現在の実行方法と判断基準が書かれている。
  - 確認方法: READMEのコマンドを実行し、記載と実態が一致することを確認する。
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. 移行後の検証を実行する
  - 作業内容: 型チェック、ビルド、ユニットテストを実行し、可能なら開発サーバーを起動する。
  - 変更するファイル: なし
  - 依存関係: 1-6
  - 完了条件: `npm run typecheck`, `npm run build`, `npm test` が成功する。開発サーバー確認結果を報告できる。
  - 確認方法: 各コマンドの出力を確認する。
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 4.2, 4.4_

## Requirements Coverage

| Requirement | Covered by Tasks |
|-------------|------------------|
| 1.1 | 2 |
| 1.2 | 1, 7 |
| 1.3 | 1, 7 |
| 1.4 | 4 |
| 2.1 | 2, 3 |
| 2.2 | 3 |
| 2.3 | 3 |
| 2.4 | 3 |
| 3.1 | 7 |
| 3.2 | 7 |
| 3.3 | 7 |
| 3.4 | 7 |
| 4.1 | 5 |
| 4.2 | 7 |
| 4.3 | 5 |
| 4.4 | 1, 7 |
| 5.1 | 6 |
| 5.2 | 6 |
| 5.3 | 6 |
| 5.4 | 6 |
