# Requirements Document

## Introduction

`human-shaped-safe-areas` は、現在の四角い安全領域を、プレイヤーが体で作るポーズに近い複雑な穴へ拡張する機能です。

現状の壁は矩形の安全領域を表示し、プレイヤーの判定領域も矩形として比較しています。このため、見た目が単調で「体を使って壁の穴に合わせる」体験が弱くなっています。本機能では、壁の穴を人間が作り出すポーズらしい形にし、描画と判定の両方で同じ形状定義を使うことで、見た目とゲーム結果の納得感を高めます。

## Boundary Context

- **今回実装する範囲**: 壁パターンが矩形以外の安全領域形状を持てるデータ構造、複合形状の描画、複合形状に基づく簡易判定、代表的な人型ポーズ穴の追加、ユニットテスト、README更新。
- **今回実装しない範囲**: 物理シミュレーション、ピクセル完全な画像マスク判定、3Dモデル、画像素材による穴、ユーザーごとの体格キャリブレーション、高度な難易度自動調整。
- **隣接する期待**: 複雑な見た目にしても、展示で初めて遊ぶ人が理解できる視認性と判定の寛容さを保つ。

## Requirements

### Requirement 1: 人型に近い安全領域形状

**Objective:** As a プレイヤー, I want 壁の穴が人間のポーズに近い形で表示される, so that 体を使って穴に合わせる遊びとして直感的に感じられる

#### Acceptance Criteria

1. The Wall Dodge Game shall 矩形だけでなく、複数の基本形状を組み合わせた安全領域を壁パターンとして定義できる
2. The Wall Dodge Game shall 胴体、腕、脚、頭の余白を想起できる安全領域を表示できる
3. The Wall Dodge Game shall 安全領域が複雑になっても、プレイヤーが入るべき場所を緑色の領域として認識できる
4. The Wall Dodge Game shall 各安全領域を壁の正規化座標で定義し、Canvasサイズや壁の進行度に依存しないデータとして扱う

### Requirement 2: 描画と判定の一致

**Objective:** As a プレイヤー, I want 見えている穴と判定結果が一致する, so that 失敗した理由に納得できる

#### Acceptance Criteria

1. When 壁が描画される, the Wall Dodge Game shall 壁パターンの安全領域形状定義から穴を描画する
2. When 壁が判定位置に到達する, the Wall Dodge Game shall 同じ安全領域形状定義を使って成功または失敗を判定する
3. The Wall Dodge Game shall 表示用の穴だけを複雑にして、判定を従来の大きな矩形だけに残さない
4. The Wall Dodge Game shall 判定の揺れを吸収するため、複合形状にも既存と同程度の許容幅を適用できる

### Requirement 3: アバター判定点による簡易判定

**Objective:** As a 開発者, I want 複雑な形状でもテストしやすい判定方式にする, so that 実装後に調整しやすい

#### Acceptance Criteria

1. The Wall Dodge Game shall プレイヤーの矩形全体だけでなく、姿勢またはアバター由来の代表点を安全領域との比較に使える
2. The Wall Dodge Game shall 最小構成では、プレイヤー判定領域から作る頭、胴体、左右端、足元などの代表点で判定できる
3. If 必須代表点が安全領域の外にある, the Wall Dodge Game shall 失敗として扱う
4. If 姿勢が検出できない, the Wall Dodge Game shall 既存と同様に判定不能として扱う
5. The Wall Dodge Game shall 判定ロジックをUIやCanvas APIに依存しない純粋関数として維持する

### Requirement 4: 壁パターンの種類

**Objective:** As a プレイヤー, I want いろいろな体の形を作る壁が出てくる, so that 単調ではない体験として遊べる

#### Acceptance Criteria

1. The Wall Dodge Game shall 立つ、しゃがむ、片側に寄る、腕を広げる、片足寄りなどのポーズを想起できる壁パターンを提供する
2. The Wall Dodge Game shall 初回プレイでも無理なく理解できる形状と、高得点向けの難しい形状を混在させる
3. The Wall Dodge Game shall 危険なジャンプや過度な反りなど、展示環境で怪我につながりやすい姿勢を強要しない
4. The Wall Dodge Game shall パターンごとに表示名、形状、配置基準、スコア値を持つ

### Requirement 5: 視認性と展示体験

**Objective:** As a 展示で初めて遊ぶ来場者, I want 複雑な穴でもすぐに合わせ方が分かる, so that 短時間でゲームを楽しめる

#### Acceptance Criteria

1. The Wall Dodge Game shall 複雑な安全領域の輪郭を十分な太さとコントラストで表示する
2. The Wall Dodge Game shall 壁本体と安全領域の境界がプレイ中の進行アニメーションでも判別できる
3. The Wall Dodge Game shall 安全領域が細かすぎて、姿勢検出の揺れだけで頻繁に失敗する状態を避ける
4. The Wall Dodge Game shall モック姿勢モードでも複合形状の描画と判定を確認できる

### Requirement 6: 既存仕様との互換性

**Objective:** As a 開発者, I want 既存のゲーム進行を壊さず安全領域だけを拡張する, so that 段階的に品質を上げられる

#### Acceptance Criteria

1. The Wall Dodge Game shall タイトル、準備、カウントダウン、プレイ、結果、エラーの状態遷移を変更しない
2. The Wall Dodge Game shall ハート、スコア、ミス、結果表示の基本挙動を維持する
3. The Wall Dodge Game shall 既存の矩形安全領域パターンを必要に応じて新しい形状定義へ移行できる
4. The Wall Dodge Game shall 衝突判定、壁パターン、描画ジオメトリのユニットテストを更新する
5. The Wall Dodge Game shall 実装後に型チェック、ビルド、ユニットテストを通す
