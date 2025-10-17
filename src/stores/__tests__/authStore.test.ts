import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { databricksAuthService } from '@/services/databricks/auth.service';
import { cognitoService } from '@/services/aws/cognito.service';

// Mock services
vi.mock('@/services/databricks/auth.service');
vi.mock('@/services/aws/cognito.service');

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      tokens: null,
      databricksCredentials: null,
      loading: false,
      error: null,
    });
    
    vi.clearAllMocks();
  });

  describe('loginWithDatabricks', () => {
    it('should login successfully with valid credentials', async () => {
      const mockCredentials = {
        host: 'https://test.databricks.com',
        token: 'test-token',
      };
      
      const mockUser = {
        id: 'test-user',
        username: 'Test User',
        email: 'test@example.com',
      };

      vi.mocked(databricksAuthService.connect).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const { loginWithDatabricks } = useAuthStore.getState();
      const result = await loginWithDatabricks(mockCredentials);

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().databricksCredentials).toEqual(mockCredentials);
    });

    it('should handle login failure', async () => {
      const mockCredentials = {
        host: 'https://test.databricks.com',
        token: 'invalid-token',
      };

      vi.mocked(databricksAuthService.connect).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { loginWithDatabricks } = useAuthStore.getState();
      const result = await loginWithDatabricks(mockCredentials);

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });

    it('should handle exception during login', async () => {
      const mockCredentials = {
        host: 'https://test.databricks.com',
        token: 'test-token',
      };

      vi.mocked(databricksAuthService.connect).mockRejectedValue(
        new Error('Network error')
      );

      const { loginWithDatabricks } = useAuthStore.getState();
      const result = await loginWithDatabricks(mockCredentials);

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Network error');
    });
  });

  describe('loginWithCognito', () => {
    it('should login successfully with Cognito', async () => {
      const mockCredentials = {
        username: 'testuser',
        password: 'testpass',
      };
      
      const mockUser = {
        id: 'cognito-user',
        username: 'Test User',
        email: 'test@example.com',
      };
      
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        idToken: 'id-token',
        expiresAt: Date.now() + 3600000,
      };

      vi.mocked(cognitoService.login).mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: mockTokens,
      });

      vi.mocked(cognitoService.saveSession).mockReturnValue();

      const { loginWithCognito } = useAuthStore.getState();
      const result = await loginWithCognito(mockCredentials);

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().tokens).toEqual(mockTokens);
      expect(cognitoService.saveSession).toHaveBeenCalledWith(mockTokens, mockUser);
    });

    it('should handle Cognito login failure', async () => {
      const mockCredentials = {
        username: 'testuser',
        password: 'wrongpass',
      };

      vi.mocked(cognitoService.login).mockResolvedValue({
        success: false,
        error: 'Invalid password',
      });

      const { loginWithCognito } = useAuthStore.getState();
      const result = await loginWithCognito(mockCredentials);

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid password');
    });
  });

  describe('logout', () => {
    it('should logout and clear state', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: '1', username: 'test', email: 'test@example.com' },
        tokens: { accessToken: 'token', expiresAt: Date.now() + 3600000 },
        databricksCredentials: { host: 'test', token: 'test' },
      });

      vi.mocked(cognitoService.logout).mockResolvedValue();
      vi.mocked(cognitoService.clearSession).mockReturnValue();
      vi.mocked(databricksAuthService.disconnect).mockReturnValue();

      const { logout } = useAuthStore.getState();
      await logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.databricksCredentials).toBeNull();
    });

    it('should clear state even if logout fails', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: '1', username: 'test', email: 'test@example.com' },
      });

      vi.mocked(cognitoService.logout).mockRejectedValue(new Error('Logout failed'));

      const { logout } = useAuthStore.getState();
      await logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should check Databricks authentication', async () => {
      const mockCredentials = {
        host: 'test',
        token: 'test',
      };

      vi.mocked(databricksAuthService.autoConnect).mockResolvedValue(true);
      vi.mocked(databricksAuthService.getCurrentCredentials).mockReturnValue(mockCredentials);

      const { checkAuth } = useAuthStore.getState();
      const result = await checkAuth();

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().databricksCredentials).toEqual(mockCredentials);
    });

    it('should check Cognito authentication', async () => {
      const mockUser = {
        id: 'cognito-user',
        username: 'Test User',
        email: 'test@example.com',
      };

      const mockSession = {
        accessToken: 'access-token',
        expiresAt: Date.now() + 3600000,
      };

      vi.mocked(databricksAuthService.autoConnect).mockResolvedValue(false);
      vi.mocked(cognitoService.isSessionValid).mockResolvedValue(true);
      vi.mocked(cognitoService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(cognitoService.getCurrentSession).mockResolvedValue(mockSession);

      const { checkAuth } = useAuthStore.getState();
      const result = await checkAuth();

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should return false when no authentication found', async () => {
      vi.mocked(databricksAuthService.autoConnect).mockResolvedValue(false);
      vi.mocked(cognitoService.isSessionValid).mockResolvedValue(false);

      const { checkAuth } = useAuthStore.getState();
      const result = await checkAuth();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const oldTokens = {
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 1000,
      };

      useAuthStore.setState({ tokens: oldTokens });

      vi.mocked(cognitoService.refreshToken).mockResolvedValue('new-access-token');

      const { refreshToken } = useAuthStore.getState();
      const result = await refreshToken();

      expect(result).toBe(true);
      expect(useAuthStore.getState().tokens?.accessToken).toBe('new-access-token');
    });

    it('should return false when no refresh token', async () => {
      useAuthStore.setState({ tokens: null });

      const { refreshToken } = useAuthStore.getState();
      const result = await refreshToken();

      expect(result).toBe(false);
    });

    it('should logout on refresh failure', async () => {
      const oldTokens = {
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 1000,
      };

      useAuthStore.setState({ 
        tokens: oldTokens,
        isAuthenticated: true,
      });

      vi.mocked(cognitoService.refreshToken).mockRejectedValue(new Error('Refresh failed'));
      vi.mocked(cognitoService.logout).mockResolvedValue();
      vi.mocked(cognitoService.clearSession).mockReturnValue();
      vi.mocked(databricksAuthService.disconnect).mockReturnValue();

      const { refreshToken } = useAuthStore.getState();
      const result = await refreshToken();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('utility actions', () => {
    it('should set user', () => {
      const mockUser = { id: '1', username: 'test', email: 'test@example.com' };
      const { setUser } = useAuthStore.getState();
      
      setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should set tokens', () => {
      const mockTokens = { accessToken: 'token', expiresAt: Date.now() + 3600000 };
      const { setTokens } = useAuthStore.getState();
      
      setTokens(mockTokens);
      expect(useAuthStore.getState().tokens).toEqual(mockTokens);
    });

    it('should set error', () => {
      const { setError } = useAuthStore.getState();
      
      setError('Test error');
      expect(useAuthStore.getState().error).toBe('Test error');
    });

    it('should clear error', () => {
      useAuthStore.setState({ error: 'Test error' });
      const { clearError } = useAuthStore.getState();
      
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
