// Common Utility Types

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
  timestamp?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextPageToken?: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp?: number;
}

export class DatabricksAPIError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'DatabricksAPIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Loading State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Filter and Sort Types
export interface FilterOptions {
  search?: string;
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  nextPageToken?: string;
}

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  timestamp: number;
}

// Action Types
export interface Action<T = any> {
  type: string;
  payload?: T;
  error?: boolean;
  meta?: any;
}

// Store State Types
export interface BaseStoreState {
  loading: boolean;
  error: string | null;
}

// Form Types
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>;
  };
  isValid: boolean;
  isSubmitting: boolean;
  submitError?: string;
}

// Route Types
export interface RouteConfig {
  path: string;
  title: string;
  icon?: string;
  requireAuth?: boolean;
  permissions?: string[];
}

// Theme Types
export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor?: string;
  secondaryColor?: string;
}

// Export/Import Types
export type ExportFormat = 'csv' | 'json' | 'excel' | 'parquet';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Status Types
export type Status = 'idle' | 'pending' | 'success' | 'error';

export interface StatusState {
  status: Status;
  message?: string;
}

// Time Types
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface Duration {
  value: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

// Retry Configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
}

// Cache Configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number;
  strategy?: 'lru' | 'fifo';
}
