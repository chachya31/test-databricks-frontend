import { create } from 'zustand';
import { notebooksService } from '@/services/databricks';
import type {
  NotebookItem,
  Notebook,
  ExecutionResult,
  ExecutionContext,
} from '@/types/databricks.types';

interface NotebooksState {
  // State
  notebooks: NotebookItem[];
  currentNotebook: Notebook | null;
  currentPath: string;
  executionResults: Map<number, ExecutionResult>;
  executionContext: ExecutionContext | null;
  loading: boolean;
  executing: boolean;
  error: string | null;

  // Actions
  fetchNotebooks: (path?: string) => Promise<void>;
  fetchNotebook: (path: string) => Promise<void>;
  executeCell: (cellIndex: number, clusterId: string) => Promise<void>;
  executeNotebook: (notebookPath: string, clusterId: string) => Promise<void>;
  createContext: (clusterId: string, language?: string) => Promise<void>;
  clearResults: () => void;
  setCurrentPath: (path: string) => void;
  clearError: () => void;
  searchNotebooks: (query: string) => Promise<void>;
}

export const useNotebooksStore = create<NotebooksState>((set, get) => ({
  // Initial State
  notebooks: [],
  currentNotebook: null,
  currentPath: '/',
  executionResults: new Map(),
  executionContext: null,
  loading: false,
  executing: false,
  error: null,

  // Actions
  fetchNotebooks: async (path?: string) => {
    const targetPath = path || get().currentPath;
    set({ loading: true, error: null });

    try {
      const notebooks = await notebooksService.list(targetPath);
      set({ notebooks, currentPath: targetPath, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ノートブック一覧の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchNotebook: async (path: string) => {
    set({ loading: true, error: null });

    try {
      const notebook = await notebooksService.get(path);
      set({ currentNotebook: notebook, loading: false, executionResults: new Map() });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ノートブックの取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  executeCell: async (cellIndex: number, clusterId: string) => {
    const { currentNotebook, executionContext } = get();

    if (!currentNotebook) {
      set({ error: 'ノートブックが選択されていません' });
      return;
    }

    if (cellIndex >= currentNotebook.cells.length) {
      set({ error: '無効なセルインデックスです' });
      return;
    }

    set({ executing: true, error: null });

    try {
      // コンテキストがない場合は作成
      let context = executionContext;
      if (!context) {
        context = await notebooksService.createContext(
          clusterId,
          currentNotebook.language.toLowerCase()
        );
        set({ executionContext: context });
      }

      const cell = currentNotebook.cells[cellIndex];
      if (cell.cell_type !== 'code') {
        set({ executing: false });
        return;
      }

      const command = cell.source.join('\n');
      const result = await notebooksService.executeCommand(context.context_id, clusterId, command);

      // 結果を保存
      const results = new Map(get().executionResults);
      results.set(cellIndex, result);

      set({ executionResults: results, executing: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'セルの実行に失敗しました';
      set({ error: errorMessage, executing: false });
      throw error;
    }
  },

  executeNotebook: async (notebookPath: string, clusterId: string) => {
    set({ executing: true, error: null, executionResults: new Map() });

    try {
      const results = await notebooksService.executeNotebook(notebookPath, clusterId);

      // 結果をMapに変換
      const resultsMap = new Map<number, ExecutionResult>();
      results.forEach((result, index) => {
        resultsMap.set(index, result);
      });

      set({ executionResults: resultsMap, executing: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ノートブックの実行に失敗しました';
      set({ error: errorMessage, executing: false });
      throw error;
    }
  },

  createContext: async (clusterId: string, language: string = 'python') => {
    try {
      const context = await notebooksService.createContext(clusterId, language);
      set({ executionContext: context });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '実行コンテキストの作成に失敗しました';
      set({ error: errorMessage });
      throw error;
    }
  },

  clearResults: () => {
    set({ executionResults: new Map(), executionContext: null });
  },

  setCurrentPath: (path: string) => {
    set({ currentPath: path });
  },

  clearError: () => {
    set({ error: null });
  },

  searchNotebooks: async (query: string) => {
    set({ loading: true, error: null });

    try {
      const notebooks = await notebooksService.search(query, get().currentPath);
      set({ notebooks, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ノートブックの検索に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },
}));

// Selectors
export const selectNotebooksByType = (state: NotebooksState, type: 'NOTEBOOK' | 'DIRECTORY') => {
  return state.notebooks.filter((item) => item.object_type === type);
};

export const selectExecutionResult = (state: NotebooksState, cellIndex: number) => {
  return state.executionResults.get(cellIndex);
};
