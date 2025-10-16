export const config = {
  databricks: {
    host: import.meta.env.VITE_DATABRICKS_HOST || '',
    token: import.meta.env.VITE_DATABRICKS_TOKEN || '',
  },
  aws: {
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_AWS_CLIENT_ID || '',
  },
  // モックモード設定
  mockMode: import.meta.env.VITE_MOCK_MODE === 'true' || false,
} as const;
