# Databricks Frontend Application

TypeScript + React ベースのフロントエンドアプリケーションで、AWS上のDatabricksとの連携機能を提供します。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)

## 機能

- 🔐 セキュアな認証（AWS Cognito + Databricks Personal Access Token）
- 🖥️ クラスター管理（表示、開始、停止、監視）
- 📓 ノートブック実行と結果表示
- 📊 データベース/テーブル閲覧とSQLクエリ実行
- ⚙️ ジョブ管理と実行監視

## 技術スタック

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router
- **Testing**: Vitest + React Testing Library

## セットアップ

### 前提条件

- Node.js 20.19+ または 22.12+
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してDatabricksの情報を設定
```

### 開発

```bash
# 開発サーバーの起動
npm run dev

# 型チェック
npm run type-check

# リント
npm run lint

# フォーマット
npm run format
```

### テスト

```bash
# テストの実行
npm run test

# テストのウォッチモード
npm run test:watch

# カバレッジレポート
npm run coverage
```

### ビルド

```bash
# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

## プロジェクト構造

```
src/
├── components/      # Reactコンポーネント
│   ├── auth/       # 認証関連
│   ├── clusters/   # クラスター管理
│   ├── notebooks/  # ノートブック管理
│   ├── data/       # データ閲覧
│   ├── jobs/       # ジョブ管理
│   └── common/     # 共通コンポーネント
├── services/       # APIサービス
│   ├── databricks/ # Databricks API
│   └── aws/        # AWS サービス
├── stores/         # Zustand状態管理
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
├── hooks/          # カスタムフック
└── constants/      # 定数
```

## 環境変数

`.env`ファイルで以下の環境変数を設定してください：

```env
# Databricks設定
VITE_DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
VITE_DATABRICKS_TOKEN=your-personal-access-token

# AWS Cognito設定（オプション）
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=your-user-pool-id
VITE_AWS_CLIENT_ID=your-client-id

# モックモード（実際のDatabricksアカウントなしでテスト可能）
VITE_MOCK_MODE=true
```

### モックモード

実際のDatabricksアカウントがなくても、モックデータを使用してアプリケーションをテストできます。

1. `.env`ファイルで`VITE_MOCK_MODE=true`に設定
2. ログイン画面で任意のホストとトークンを入力（例: `https://mock.databricks.com` と `mock-token`）
3. すべての機能がモックデータで動作します

モックモードでは以下が利用可能です：
- クラスター管理（一覧表示、開始/停止操作）
- ノートブック管理（一覧表示、実行）
- データ管理（データベース/テーブル閲覧、クエリ実行）
- ジョブ管理（一覧表示、実行、履歴）

## ライセンス

MIT
