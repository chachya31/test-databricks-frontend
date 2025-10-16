import { create } from 'zustand';
import { dataService } from '@/services/databricks';
import type { Database, Table, TableDetail, QueryResult } from '@/types/databricks.types';

interface DataState {
  // State
  databases: Database[];
  tables: Table[];
  selectedDatabase: string | null;
  selectedTable: TableDetail | null;
  queryResult: QueryResult | null;
  queryHistory: string[];
  loading: boolean;
  executing: boolean;
  error: string | null;

  // Query Editor State
  currentQuery: string;
  selectedWarehouseId: string | null;

  // Actions
  fetchDatabases: () => Promise<void>;
  fetchTables: (database: string) => Promise<void>;
  fetchTable: (database: string, table: string) => Promise<void>;
  fetchTableSample: (database: string, table: string, limit?: number) => Promise<void>;
  executeQuery: (query: string, warehouseId?: string) => Promise<void>;
  cancelQuery: (statementId: string) => Promise<void>;
  exportResult: (format: 'csv' | 'json') => Promise<string>;
  setCurrentQuery: (query: string) => void;
  setSelectedDatabase: (database: string | null) => void;
  setSelectedWarehouseId: (warehouseId: string | null) => void;
  addToHistory: (query: string) => void;
  clearResult: () => void;
  clearError: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial State
  databases: [],
  tables: [],
  selectedDatabase: null,
  selectedTable: null,
  queryResult: null,
  queryHistory: [],
  loading: false,
  executing: false,
  error: null,
  currentQuery: '',
  selectedWarehouseId: null,

  // Actions
  fetchDatabases: async () => {
    set({ loading: true, error: null });

    try {
      const databases = await dataService.listDatabases();
      set({ databases, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'データベース一覧の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchTables: async (database: string) => {
    set({ loading: true, error: null, selectedDatabase: database });

    try {
      const tables = await dataService.listTables(database);
      set({ tables, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'テーブル一覧の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchTable: async (database: string, table: string) => {
    set({ loading: true, error: null });

    try {
      const tableDetail = await dataService.getTable(database, table);
      set({ selectedTable: tableDetail, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'テーブル詳細の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchTableSample: async (database: string, table: string, limit: number = 100) => {
    set({ executing: true, error: null });

    try {
      const result = await dataService.getTableSample(database, table, limit);
      set({ queryResult: result, executing: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'サンプルデータの取得に失敗しました';
      set({ error: errorMessage, executing: false });
    }
  },

  executeQuery: async (query: string, warehouseId?: string) => {
    set({ executing: true, error: null });

    try {
      const targetWarehouseId = warehouseId || get().selectedWarehouseId || undefined;
      const result = await dataService.executeQuery(query, targetWarehouseId);

      // クエリ履歴に追加
      get().addToHistory(query);

      set({ queryResult: result, executing: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'クエリの実行に失敗しました';
      set({ error: errorMessage, executing: false });
      throw error;
    }
  },

  cancelQuery: async (statementId: string) => {
    try {
      await dataService.cancelQuery(statementId);
      set({ executing: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'クエリのキャンセルに失敗しました';
      set({ error: errorMessage });
      throw error;
    }
  },

  exportResult: async (format: 'csv' | 'json') => {
    const { queryResult } = get();

    if (!queryResult) {
      throw new Error('エクスポートする結果がありません');
    }

    try {
      const exported = await dataService.exportQueryResult(queryResult, format);
      return exported;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'エクスポートに失敗しました';
      set({ error: errorMessage });
      throw error;
    }
  },

  setCurrentQuery: (query: string) => {
    set({ currentQuery: query });
  },

  setSelectedDatabase: (database: string | null) => {
    set({ selectedDatabase: database, tables: [], selectedTable: null });
  },

  setSelectedWarehouseId: (warehouseId: string | null) => {
    set({ selectedWarehouseId: warehouseId });
  },

  addToHistory: (query: string) => {
    const history = get().queryHistory;
    const trimmedQuery = query.trim();

    // 重複を避ける
    if (trimmedQuery && !history.includes(trimmedQuery)) {
      const newHistory = [trimmedQuery, ...history].slice(0, 50); // 最大50件
      set({ queryHistory: newHistory });
    }
  },

  clearResult: () => {
    set({ queryResult: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Selectors
export const selectTablesByDatabase = (state: DataState, database: string) => {
  return state.tables.filter((table) => table.database === database);
};

export const selectQueryResultColumns = (state: DataState) => {
  return state.queryResult?.columns || [];
};

export const selectQueryResultRows = (state: DataState) => {
  return state.queryResult?.rows || [];
};
