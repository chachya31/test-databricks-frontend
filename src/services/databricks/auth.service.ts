import axios, { type AxiosInstance } from 'axios';
import type { DatabricksCredentials, AuthResult } from '@/types/auth.types';
import { AuthenticationError, DatabricksAPIError } from '@/types/common.types';
import { config } from '@/constants/config';
import { mockAuthService } from '@/mocks/mockServices';

/**
 * Databricks認証サービス
 */
class DatabricksAuthService {
  private credentials: DatabricksCredentials | null = null;
  private axiosInstance: AxiosInstance | null = null;

  /**
   * Databricksに接続
   */
  async connect(credentials: DatabricksCredentials): Promise<AuthResult> {
    // モックモードの場合
    if (config.mockMode) {
      const result = await mockAuthService.connect(credentials);
      if (result.success) {
        this.credentials = credentials;
        // モックモード用のダミーAxiosインスタンス
        this.axiosInstance = axios.create({
          baseURL: credentials.host,
        });
      }
      return result;
    }

    try {
      // 認証情報のバリデーション
      this.validateCredentials(credentials);

      // Axiosインスタンスを作成
      this.axiosInstance = axios.create({
        baseURL: credentials.host,
        headers: {
          Authorization: `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      // 接続テスト: クラスター一覧を取得して認証を確認
      await this.testConnection();

      // 認証情報を保存
      this.credentials = credentials;
      this.saveCredentials(credentials);

      return {
        success: true,
        user: {
          id: 'databricks-user',
          username: 'Databricks User',
          email: '',
        },
      };
    } catch (error) {
      console.error('Databricks connection error:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          throw new AuthenticationError('認証に失敗しました。トークンを確認してください。');
        }
        throw new DatabricksAPIError(
          error.message,
          'CONNECTION_ERROR',
          statusCode,
          error.response?.data
        );
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Databricksへの接続に失敗しました',
      };
    }
  }

  /**
   * 認証情報のバリデーション
   */
  private validateCredentials(credentials: DatabricksCredentials): void {
    if (!credentials.host) {
      throw new AuthenticationError('Databricksホストが必要です');
    }

    if (!credentials.token) {
      throw new AuthenticationError('Personal Access Tokenが必要です');
    }

    // ホストURLの形式チェック
    try {
      new URL(credentials.host);
    } catch {
      throw new AuthenticationError('無効なホストURLです');
    }

    // トークンの基本的なチェック
    if (credentials.token.length < 10) {
      throw new AuthenticationError('無効なトークン形式です');
    }
  }

  /**
   * 接続テスト
   */
  private async testConnection(): Promise<void> {
    if (!this.axiosInstance) {
      throw new AuthenticationError('Axiosインスタンスが初期化されていません');
    }

    try {
      // クラスター一覧を取得して接続を確認
      await this.axiosInstance.get('/api/2.0/clusters/list');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          throw new AuthenticationError('認証に失敗しました');
        }
        throw new DatabricksAPIError(
          '接続テストに失敗しました',
          'CONNECTION_TEST_FAILED',
          statusCode
        );
      }
      throw error;
    }
  }

  /**
   * 認証情報を保存
   */
  private saveCredentials(credentials: DatabricksCredentials): void {
    try {
      // セキュリティ上、トークンは暗号化して保存することを推奨
      // 現在は簡易的にsessionStorageに保存
      sessionStorage.setItem('databricks_credentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Save credentials error:', error);
    }
  }

  /**
   * 保存された認証情報を取得
   */
  getStoredCredentials(): DatabricksCredentials | null {
    try {
      const stored = sessionStorage.getItem('databricks_credentials');
      if (!stored) {
        return null;
      }
      return JSON.parse(stored) as DatabricksCredentials;
    } catch (error) {
      console.error('Get stored credentials error:', error);
      return null;
    }
  }

  /**
   * 認証情報をクリア
   */
  clearCredentials(): void {
    try {
      this.credentials = null;
      this.axiosInstance = null;
      sessionStorage.removeItem('databricks_credentials');
    } catch (error) {
      console.error('Clear credentials error:', error);
    }
  }

  /**
   * 現在の認証情報を取得
   */
  getCurrentCredentials(): DatabricksCredentials | null {
    return this.credentials;
  }

  /**
   * Axiosインスタンスを取得
   */
  getAxiosInstance(): AxiosInstance | null {
    return this.axiosInstance;
  }

  /**
   * 認証済みかチェック
   */
  isAuthenticated(): boolean {
    return this.credentials !== null && this.axiosInstance !== null;
  }

  /**
   * 認証ヘッダーを取得
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.credentials) {
      throw new AuthenticationError('認証されていません');
    }

    return {
      Authorization: `Bearer ${this.credentials.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 保存された認証情報で自動接続を試みる
   */
  async autoConnect(): Promise<boolean> {
    try {
      const stored = this.getStoredCredentials();
      if (!stored) {
        return false;
      }

      const result = await this.connect(stored);
      return result.success;
    } catch (error) {
      console.error('Auto connect error:', error);
      return false;
    }
  }

  /**
   * 接続を切断
   */
  disconnect(): void {
    this.clearCredentials();
  }
}

export const databricksAuthService = new DatabricksAuthService();
