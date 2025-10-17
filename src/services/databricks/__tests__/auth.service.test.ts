import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { databricksAuthService } from '../auth.service';
import { AuthenticationError, DatabricksAPIError } from '@/types/common.types';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock config
vi.mock('@/constants/config', () => ({
  config: {
    mockMode: false,
  },
}));

// Mock mockServices
vi.mock('@/mocks/mockServices', () => ({
  mockAuthService: {
    connect: vi.fn(),
  },
}));

describe('DatabricksAuthService', () => {
  const validCredentials = {
    host: 'https://test.databricks.com',
    token: 'dapi-valid-token-123',
  };

  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    
    // Reset service state
    databricksAuthService.disconnect();

    // Mock axios.create
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('connect', () => {
    it('should connect successfully with valid credentials', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });

      const result = await databricksAuthService.connect(validCredentials);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: validCredentials.host,
        headers: {
          Authorization: `Bearer ${validCredentials.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    });

    it('should save credentials on successful connection', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });

      await databricksAuthService.connect(validCredentials);

      const stored = sessionStorage.getItem('databricks_credentials');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(validCredentials);
    });

    it('should return error for missing host', async () => {
      const invalidCredentials = {
        host: '',
        token: 'valid-token',
      };

      const result = await databricksAuthService.connect(invalidCredentials);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Databricksホストが必要です');
    });

    it('should return error for missing token', async () => {
      const invalidCredentials = {
        host: 'https://test.databricks.com',
        token: '',
      };

      const result = await databricksAuthService.connect(invalidCredentials);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Personal Access Tokenが必要です');
    });

    it('should return error for invalid URL', async () => {
      const invalidCredentials = {
        host: 'invalid-url',
        token: 'valid-token-123',
      };

      const result = await databricksAuthService.connect(invalidCredentials);
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効なホストURLです');
    });

    it('should return error for short token', async () => {
      const invalidCredentials = {
        host: 'https://test.databricks.com',
        token: 'short',
      };

      const result = await databricksAuthService.connect(invalidCredentials);
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効なトークン形式です');
    });

    it('should throw error for 401 authentication error', async () => {
      const axiosError = {
        response: { status: 401, data: {} },
        message: 'Unauthorized',
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(databricksAuthService.connect(validCredentials)).rejects.toThrow();
    });

    it('should throw error for connection error', async () => {
      const axiosError = {
        response: { status: 500, data: {} },
        message: 'Server error',
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(databricksAuthService.connect(validCredentials)).rejects.toThrow();
    });
  });

  describe('getStoredCredentials', () => {
    it('should return stored credentials', () => {
      sessionStorage.setItem('databricks_credentials', JSON.stringify(validCredentials));

      const stored = databricksAuthService.getStoredCredentials();
      expect(stored).toEqual(validCredentials);
    });

    it('should return null when no credentials stored', () => {
      const stored = databricksAuthService.getStoredCredentials();
      expect(stored).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      sessionStorage.setItem('databricks_credentials', 'invalid-json');

      const stored = databricksAuthService.getStoredCredentials();
      expect(stored).toBeNull();
    });
  });

  describe('clearCredentials', () => {
    it('should clear stored credentials', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });
      await databricksAuthService.connect(validCredentials);

      databricksAuthService.clearCredentials();

      const stored = sessionStorage.getItem('databricks_credentials');
      expect(stored).toBeNull();
      expect(databricksAuthService.getCurrentCredentials()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });
      await databricksAuthService.connect(validCredentials);

      expect(databricksAuthService.isAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      expect(databricksAuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return auth headers when authenticated', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });
      await databricksAuthService.connect(validCredentials);

      const headers = databricksAuthService.getAuthHeaders();
      expect(headers).toEqual({
        Authorization: `Bearer ${validCredentials.token}`,
        'Content-Type': 'application/json',
      });
    });

    it('should throw error when not authenticated', () => {
      expect(() => databricksAuthService.getAuthHeaders()).toThrow(AuthenticationError);
    });
  });

  describe('autoConnect', () => {
    it('should auto connect with stored credentials', async () => {
      sessionStorage.setItem('databricks_credentials', JSON.stringify(validCredentials));
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });

      const result = await databricksAuthService.autoConnect();

      expect(result).toBe(true);
      expect(databricksAuthService.isAuthenticated()).toBe(true);
    });

    it('should return false when no stored credentials', async () => {
      const result = await databricksAuthService.autoConnect();

      expect(result).toBe(false);
    });

    it('should return false on connection error', async () => {
      sessionStorage.setItem('databricks_credentials', JSON.stringify(validCredentials));
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await databricksAuthService.autoConnect();

      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect and clear credentials', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });
      await databricksAuthService.connect(validCredentials);

      databricksAuthService.disconnect();

      expect(databricksAuthService.isAuthenticated()).toBe(false);
      expect(databricksAuthService.getCurrentCredentials()).toBeNull();
    });
  });

  describe('getAxiosInstance', () => {
    it('should return axios instance when authenticated', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { clusters: [] } });
      await databricksAuthService.connect(validCredentials);

      const instance = databricksAuthService.getAxiosInstance();
      expect(instance).toBeDefined();
    });

    it('should return null when not authenticated', () => {
      const instance = databricksAuthService.getAxiosInstance();
      expect(instance).toBeNull();
    });
  });
});
