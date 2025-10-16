import { type AxiosInstance, type AxiosError, type AxiosRequestConfig } from 'axios';
import { databricksAuthService } from './auth.service';
import { DatabricksAPIError, NetworkError } from '@/types/common.types';

/**
 * Databricks APIクライアント
 * 認証ヘッダーとエラーハンドリングのインターセプターを持つAxiosインスタンス
 */
class DatabricksAPIClient {
  private axiosInstance: AxiosInstance | null = null;

  /**
   * APIクライアントを初期化
   */
  initialize(): void {
    const authInstance = databricksAuthService.getAxiosInstance();
    
    if (!authInstance) {
      throw new Error('Databricks認証が必要です');
    }

    this.axiosInstance = authInstance;
    this.setupInterceptors();
  }

  /**
   * インターセプターを設定
   */
  private setupInterceptors(): void {
    if (!this.axiosInstance) return;

    // リクエストインターセプター
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 認証ヘッダーを追加
        const credentials = databricksAuthService.getCurrentCredentials();
        if (credentials) {
          config.headers.Authorization = `Bearer ${credentials.token}`;
        }

        // リクエストログ（開発環境のみ）
        if (import.meta.env.DEV) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // レスポンスログ（開発環境のみ）
        if (import.meta.env.DEV) {
          console.log(`[API Response] ${response.config.url}`, response.data);
        }
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: AxiosError): Promise<never> {
    // ネットワークエラー
    if (!error.response) {
      console.error('[Network Error]', error.message);
      return Promise.reject(
        new NetworkError('ネットワークエラーが発生しました。接続を確認してください。')
      );
    }

    // HTTPエラー
    const { status, data } = error.response;
    const errorData = data as any;

    let errorMessage = 'APIエラーが発生しました';
    let errorCode = 'UNKNOWN_ERROR';

    // Databricks APIのエラーメッセージを抽出
    if (errorData?.message) {
      errorMessage = errorData.message;
    } else if (errorData?.error) {
      errorMessage = errorData.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (errorData?.error_code) {
      errorCode = errorData.error_code;
    }

    // ステータスコード別のエラーメッセージ
    switch (status) {
      case 401:
        errorMessage = '認証に失敗しました。再度ログインしてください。';
        errorCode = 'UNAUTHORIZED';
        break;
      case 403:
        errorMessage = 'アクセス権限がありません。';
        errorCode = 'FORBIDDEN';
        break;
      case 404:
        errorMessage = 'リソースが見つかりません。';
        errorCode = 'NOT_FOUND';
        break;
      case 429:
        errorMessage = 'リクエスト数が多すぎます。しばらく待ってから再試行してください。';
        errorCode = 'RATE_LIMIT_EXCEEDED';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
        errorCode = 'SERVER_ERROR';
        break;
    }

    console.error(`[API Error] ${status} ${errorCode}:`, errorMessage);

    return Promise.reject(
      new DatabricksAPIError(errorMessage, errorCode, status, errorData)
    );
  }

  /**
   * GETリクエスト
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    if (!this.axiosInstance) {
      this.initialize();
    }
    const response = await this.axiosInstance!.get<T>(url, config);
    return response.data;
  }

  /**
   * POSTリクエスト
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (!this.axiosInstance) {
      this.initialize();
    }
    const response = await this.axiosInstance!.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUTリクエスト
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (!this.axiosInstance) {
      this.initialize();
    }
    const response = await this.axiosInstance!.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETEリクエスト
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    if (!this.axiosInstance) {
      this.initialize();
    }
    const response = await this.axiosInstance!.delete<T>(url, config);
    return response.data;
  }

  /**
   * PATCHリクエスト
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (!this.axiosInstance) {
      this.initialize();
    }
    const response = await this.axiosInstance!.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * リトライ機能付きリクエスト
   */
  async requestWithRetry<T = any>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        // 最後の試行の場合はエラーをスロー
        if (attempt === maxRetries) {
          break;
        }

        // リトライ可能なエラーかチェック
        if (error instanceof DatabricksAPIError) {
          const shouldRetry =
            error.statusCode === 429 || // Rate limit
            error.statusCode === 503 || // Service unavailable
            error.statusCode === 504; // Gateway timeout

          if (!shouldRetry) {
            throw error;
          }
        }

        // 指数バックオフで待機
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * クライアントをリセット
   */
  reset(): void {
    this.axiosInstance = null;
  }
}

export const apiClient = new DatabricksAPIClient();
