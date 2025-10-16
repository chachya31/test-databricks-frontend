import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthState,
  DatabricksCredentials,
  CognitoCredentials,
  AuthUser,
  AuthTokens,
} from '@/types/auth.types';
import { cognitoService } from '@/services/aws/cognito.service';
import { databricksAuthService } from '@/services/databricks/auth.service';

interface AuthStore extends AuthState {
  // Actions
  loginWithDatabricks: (credentials: DatabricksCredentials) => Promise<boolean>;
  loginWithCognito: (credentials: CognitoCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial State
      isAuthenticated: false,
      user: null,
      tokens: null,
      databricksCredentials: null,
      loading: false,
      error: null,

      // Actions
      loginWithDatabricks: async (credentials: DatabricksCredentials) => {
        set({ loading: true, error: null });

        try {
          const result = await databricksAuthService.connect(credentials);

          if (result.success && result.user) {
            set({
              isAuthenticated: true,
              user: result.user,
              databricksCredentials: credentials,
              loading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isAuthenticated: false,
              error: result.error || 'ログインに失敗しました',
              loading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'ログインに失敗しました';
          set({
            isAuthenticated: false,
            error: errorMessage,
            loading: false,
          });
          return false;
        }
      },

      loginWithCognito: async (credentials: CognitoCredentials) => {
        set({ loading: true, error: null });

        try {
          const result = await cognitoService.login(credentials);

          if (result.success && result.user && result.tokens) {
            // Cognitoセッションを保存
            cognitoService.saveSession(result.tokens, result.user);

            set({
              isAuthenticated: true,
              user: result.user,
              tokens: result.tokens,
              loading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isAuthenticated: false,
              error: result.error || 'ログインに失敗しました',
              loading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'ログインに失敗しました';
          set({
            isAuthenticated: false,
            error: errorMessage,
            loading: false,
          });
          return false;
        }
      },

      logout: async () => {
        set({ loading: true });

        try {
          // Cognitoからログアウト
          await cognitoService.logout();
          cognitoService.clearSession();

          // Databricks認証をクリア
          databricksAuthService.disconnect();

          set({
            isAuthenticated: false,
            user: null,
            tokens: null,
            databricksCredentials: null,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // エラーが発生してもログアウト状態にする
          set({
            isAuthenticated: false,
            user: null,
            tokens: null,
            databricksCredentials: null,
            loading: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          return false;
        }

        try {
          const newAccessToken = await cognitoService.refreshToken(tokens.refreshToken);

          const newTokens: AuthTokens = {
            ...tokens,
            accessToken: newAccessToken,
            expiresAt: Date.now() + 3600000, // 1時間後
          };

          set({ tokens: newTokens });
          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          // トークンのリフレッシュに失敗したらログアウト
          await get().logout();
          return false;
        }
      },

      checkAuth: async () => {
        set({ loading: true });

        try {
          // Databricks認証をチェック
          const databricksAuth = await databricksAuthService.autoConnect();
          if (databricksAuth) {
            const credentials = databricksAuthService.getCurrentCredentials();
            set({
              isAuthenticated: true,
              databricksCredentials: credentials,
              user: {
                id: 'databricks-user',
                username: 'Databricks User',
                email: '',
              },
              loading: false,
            });
            return true;
          }

          // Cognito認証をチェック
          const isSessionValid = await cognitoService.isSessionValid();
          if (isSessionValid) {
            const user = await cognitoService.getCurrentUser();
            const session = await cognitoService.getCurrentSession();

            if (user && session) {
              set({
                isAuthenticated: true,
                user,
                tokens: session,
                loading: false,
              });
              return true;
            }
          }

          // 認証されていない
          set({
            isAuthenticated: false,
            user: null,
            tokens: null,
            databricksCredentials: null,
            loading: false,
          });
          return false;
        } catch (error) {
          console.error('Check auth error:', error);
          set({
            isAuthenticated: false,
            user: null,
            tokens: null,
            databricksCredentials: null,
            loading: false,
          });
          return false;
        }
      },

      setUser: (user: AuthUser | null) => {
        set({ user });
      },

      setTokens: (tokens: AuthTokens | null) => {
        set({ tokens });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // 永続化する項目を選択（トークンは除外してセキュリティを向上）
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        databricksCredentials: state.databricksCredentials,
      }),
    }
  )
);
