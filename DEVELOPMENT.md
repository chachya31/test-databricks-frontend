# 開発ガイド

## アプリケーションの起動方法

### 1. モックモードで起動（推奨）

実際のDatabricksアカウントがなくても動作確認できます。

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

### 2. ログイン

ログイン画面で以下の情報を入力：
- **Databricks Host**: `https://mock.databricks.com` （任意の値でOK）
- **Personal Access Token**: `mock-token` （任意の値でOK）

### 3. 動作確認

ログイン後、以下の機能が利用可能です：

#### ダッシュボード
- クラスター数、ジョブ数などの統計情報を表示
- 各機能へのクイックアクセス

#### クラスター管理 (`/clusters`)
- クラスター一覧の表示
- 検索・フィルタリング機能
- クラスターの開始/停止/再起動
- クラスター詳細情報の表示
  - 基本情報
  - リソース使用状況（CPU、メモリ、ディスク）
  - ノード情報

#### その他のページ
- ノートブック管理 (`/notebooks`) - 実装予定
- データ管理 (`/data`) - 実装予定
- ジョブ管理 (`/jobs`) - 実装予定

## モックデータについて

モックデータは `src/mocks/mockData.ts` で定義されています：
- 3つのクラスター（実行中、停止、実行中）
- 複数のノートブック
- 3つのジョブと実行履歴
- データベースとテーブル

## 実際のDatabricksアカウントで使用する場合

1. `.env`ファイルを編集：
```env
VITE_MOCK_MODE=false
VITE_DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
VITE_DATABRICKS_TOKEN=your-actual-token
```

2. 開発サーバーを再起動

## トラブルシューティング

### ポート5173が使用中の場合
```bash
# 別のポートで起動
npm run dev -- --port 3000
```

### ビルドエラーが発生する場合
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

### 型エラーが発生する場合
```bash
# 型チェックを実行
npm run type-check
```

## 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview

# 型チェック
npm run type-check

# リント
npm run lint

# リント自動修正
npm run lint:fix

# コードフォーマット
npm run format

# テスト実行
npm run test
```

## 開発のヒント

### ホットリロード
ファイルを保存すると自動的にブラウザが更新されます。

### React Developer Tools
Chrome拡張機能をインストールすると、コンポーネントの状態を確認できます。

### Zustand DevTools
状態管理の確認には、ブラウザのコンソールで以下を実行：
```javascript
window.__ZUSTAND_DEVTOOLS__
```

### エラーログ
ブラウザのコンソール（F12）でエラーやログを確認できます。
