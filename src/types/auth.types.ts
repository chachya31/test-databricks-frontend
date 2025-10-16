// Authentication Types

export interface DatabricksCredentials {
  host: string;
  token: string;
}

export interface CognitoCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  databricksCredentials: DatabricksCredentials | null;
  loading: boolean;
  error: string | null;
}

export interface LoginRequest {
  databricks?: DatabricksCredentials;
  cognito?: CognitoCredentials;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  tokens?: AuthTokens;
  error?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  tokens?: AuthTokens;
  error?: string;
}

export interface SessionInfo {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

// AWS Cognito Types
export interface CognitoUser {
  username: string;
  attributes: {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
}

export interface CognitoSession {
  accessToken: {
    jwtToken: string;
    payload: any;
  };
  idToken: {
    jwtToken: string;
    payload: any;
  };
  refreshToken: {
    token: string;
  };
}

// Token Management
export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  expiresAt: number;
}

// Permission Types
export type Permission = 'read' | 'write' | 'admin';

export interface UserPermissions {
  clusters: Permission[];
  notebooks: Permission[];
  jobs: Permission[];
  data: Permission[];
}
