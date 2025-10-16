import { DatabricksAPIError, NetworkError, AuthenticationError } from '@/types/common.types';

/**
 * グローバルエラーハンドラー
 */
export class ErrorHandler {
  /**
   * エラーを処理してユーザーフレンドリーなメッセージを返す
   */
  static handle(error: unknown): string {
    console.error('Error occurred:', error);

    if (error instanceof DatabricksAPIError) {
      return this.handleDatabricksError(error);
    }

    if (error instanceof NetworkError) {
      return this.handleNetworkError(error);
    }

    if (error instanceof AuthenticationError) {
      return this.handleAuthError(error);
    }

    if (error instanceof Error) {
      return error.message;
    }

    return '予期しないエラーが発生しました';
  }

  /**
   * Databricks APIエラーを処理
   */
  private static handleDatabricksError(error: DatabricksAPIError): string {
    const statusCode = error.statusCode;

    switch (statusCode) {
      case 400:
        return `リクエストが無効です: ${error.message}`;
      case 401:
        return '認証に失敗しました。再度ログインしてください。';
      case 403:
        return 'この操作を実行する権限がありません。';
      case 404:
        return 'リソースが見つかりません。';
      case 429:
        return 'リクエスト数が多すぎます。しばらく待ってから再試行してください。';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
      default:
        return error.message || 'APIエラーが発生しました';
    }
  }

  /**
   * ネットワークエラーを処理
   */
  private static handleNetworkError(_error: NetworkError): string {
    return 'ネットワークエラーが発生しました。接続を確認してください。';
  }

  /**
   * 認証エラーを処理
   */
  private static handleAuthError(error: AuthenticationError): string {
    return `認証エラー: ${error.message}`;
  }

  /**
   * エラーをログに記録
   */
  static log(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    console.error(`${timestamp} ${contextStr}`, error);

    // 本番環境では、エラーログをサーバーに送信することを推奨
    if (import.meta.env.PROD) {
      // TODO: エラーログをサーバーに送信
      // this.sendErrorToServer(error, context);
    }
  }

  /**
   * リトライ可能なエラーかチェック
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof DatabricksAPIError) {
      const retryableStatusCodes = [429, 500, 502, 503, 504];
      return error.statusCode ? retryableStatusCodes.includes(error.statusCode) : false;
    }

    if (error instanceof NetworkError) {
      return true;
    }

    return false;
  }
}

/**
 * エラーハンドリング用のヘルパー関数
 */
export const handleError = (error: unknown, context?: string): string => {
  ErrorHandler.log(error, context);
  return ErrorHandler.handle(error);
};

export const isRetryableError = (error: unknown): boolean => {
  return ErrorHandler.isRetryable(error);
};
