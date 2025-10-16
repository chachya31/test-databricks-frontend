#!/bin/bash

# AWS S3 + CloudFront デプロイスクリプト

set -e

# 環境変数のチェック
if [ -z "$S3_BUCKET" ]; then
  echo "Error: S3_BUCKET environment variable is not set"
  exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "Error: CLOUDFRONT_DISTRIBUTION_ID environment variable is not set"
  exit 1
fi

echo "Building application..."
npm run build

echo "Deploying to S3 bucket: $S3_BUCKET"
aws s3 sync dist/ s3://$S3_BUCKET --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment completed successfully!"
