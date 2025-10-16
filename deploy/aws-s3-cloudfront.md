# AWS S3 + CloudFront デプロイメントガイド

## 前提条件

- AWS CLIがインストールされていること
- AWS認証情報が設定されていること
- S3バケットとCloudFrontディストリビューションが作成されていること

## デプロイ手順

### 1. アプリケーションをビルド

```bash
npm run build
```

### 2. S3バケットにアップロード

```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

### 3. CloudFrontキャッシュを無効化

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## S3バケット設定

### バケットポリシー

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 静的ウェブサイトホスティング設定

- インデックスドキュメント: `index.html`
- エラードキュメント: `index.html` (SPAのため)

## CloudFront設定

### オリジン設定

- オリジンドメイン: S3バケットのウェブサイトエンドポイント
- オリジンプロトコルポリシー: HTTP Only

### ビヘイビア設定

- ビューアープロトコルポリシー: Redirect HTTP to HTTPS
- 許可されたHTTPメソッド: GET, HEAD, OPTIONS
- キャッシュポリシー: CachingOptimized

### エラーページ設定

- HTTPエラーコード: 403, 404
- エラーキャッシング最小TTL: 0
- カスタムエラーレスポンス: /index.html (200)

## 環境変数の設定

本番環境用の環境変数を`.env.production`に設定：

```env
VITE_DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
VITE_DATABRICKS_TOKEN=
VITE_MOCK_MODE=false
```

## CI/CDパイプライン例（GitHub Actions）

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          VITE_MOCK_MODE: false
          
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Deploy to S3
        run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
        
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

## セキュリティ考慮事項

1. **環境変数**: 機密情報は環境変数で管理し、コードにハードコードしない
2. **HTTPS**: CloudFrontでHTTPSを強制
3. **CORS**: 必要に応じてCORS設定を追加
4. **認証**: AWS Cognitoまたは他の認証サービスを使用
5. **WAF**: AWS WAFでセキュリティルールを設定

## モニタリング

- CloudWatch Logsでアクセスログを監視
- CloudWatch Metricsでパフォーマンスを監視
- AWS X-Rayでトレーシング（オプション）

## コスト最適化

- CloudFrontのキャッシュTTLを適切に設定
- S3のライフサイクルポリシーで古いバージョンを削除
- CloudFrontの価格クラスを適切に選択
