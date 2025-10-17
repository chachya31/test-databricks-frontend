import { describe, it, expect } from 'vitest';
import { ErrorHandler, handleError, isRetryableError } from '../errorHandler';
import { DatabricksAPIError, NetworkError, AuthenticationError } from '@/types/common.types';

describe('ErrorHandler', () => {
  describe('handle', () => {
    it('should handle DatabricksAPIError with 401 status', () => {
      const error = new DatabricksAPIError('Unauthorized', 'AUTH_ERROR', 401);
      const message = ErrorHandler.handle(error);
      expect(message).toBe('認証に失敗しました。再度ログインしてください。');
    });

    it('should handle DatabricksAPIError with 404 status', () => {
      const error = new DatabricksAPIError('Not found', 'NOT_FOUND', 404);
      const message = ErrorHandler.handle(error);
      expect(message).toBe('リソースが見つかりません。');
    });

    it('should handle NetworkError', () => {
      const error = new NetworkError('Connection failed');
      const message = ErrorHandler.handle(error);
      expect(message).toBe('ネットワークエラーが発生しました。接続を確認してください。');
    });

    it('should handle AuthenticationError', () => {
      const error = new AuthenticationError('Invalid credentials');
      const message = ErrorHandler.handle(error);
      expect(message).toBe('認証エラー: Invalid credentials');
    });

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');
      const message = ErrorHandler.handle(error);
      expect(message).toBe('Something went wrong');
    });

    it('should handle unknown error', () => {
      const message = ErrorHandler.handle('unknown error');
      expect(message).toBe('予期しないエラーが発生しました');
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable status codes', () => {
      const error429 = new DatabricksAPIError('Rate limit', 'RATE_LIMIT', 429);
      const error503 = new DatabricksAPIError('Service unavailable', 'SERVICE_ERROR', 503);

      expect(ErrorHandler.isRetryable(error429)).toBe(true);
      expect(ErrorHandler.isRetryable(error503)).toBe(true);
    });

    it('should return false for non-retryable status codes', () => {
      const error404 = new DatabricksAPIError('Not found', 'NOT_FOUND', 404);
      expect(ErrorHandler.isRetryable(error404)).toBe(false);
    });

    it('should return true for NetworkError', () => {
      const error = new NetworkError('Connection failed');
      expect(ErrorHandler.isRetryable(error)).toBe(true);
    });

    it('should return false for unknown errors', () => {
      expect(ErrorHandler.isRetryable(new Error('Unknown'))).toBe(false);
    });
  });
});

describe('Helper functions', () => {
  it('handleError should return error message', () => {
    const error = new Error('Test error');
    const message = handleError(error, 'test-context');
    expect(message).toBe('Test error');
  });

  it('isRetryableError should check if error is retryable', () => {
    const retryable = new NetworkError('Connection failed');
    const notRetryable = new Error('Generic error');

    expect(isRetryableError(retryable)).toBe(true);
    expect(isRetryableError(notRetryable)).toBe(false);
  });
});
