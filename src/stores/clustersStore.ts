import { create } from 'zustand';
import { clustersService } from '@/services/databricks';
import type { Cluster, ClusterDetail } from '@/types/databricks.types';

interface ClustersState {
  // State
  clusters: Cluster[];
  selectedCluster: ClusterDetail | null;
  loading: boolean;
  error: string | null;
  operationInProgress: boolean;

  // Filters
  searchQuery: string;
  statusFilter: string[];

  // Actions
  fetchClusters: () => Promise<void>;
  fetchCluster: (clusterId: string) => Promise<void>;
  startCluster: (clusterId: string) => Promise<void>;
  stopCluster: (clusterId: string) => Promise<void>;
  restartCluster: (clusterId: string) => Promise<void>;
  selectCluster: (cluster: ClusterDetail | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (statuses: string[]) => void;
  clearError: () => void;
  refreshClusters: () => Promise<void>;
}

export const useClustersStore = create<ClustersState>((set, get) => ({
  // Initial State
  clusters: [],
  selectedCluster: null,
  loading: false,
  error: null,
  operationInProgress: false,
  searchQuery: '',
  statusFilter: [],

  // Actions
  fetchClusters: async () => {
    set({ loading: true, error: null });

    try {
      const clusters = await clustersService.list();
      set({ clusters, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'クラスター一覧の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchCluster: async (clusterId: string) => {
    set({ loading: true, error: null });

    try {
      const cluster = await clustersService.get(clusterId);
      set({ selectedCluster: cluster, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'クラスター詳細の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  startCluster: async (clusterId: string) => {
    set({ operationInProgress: true, error: null });

    try {
      await clustersService.start(clusterId);

      // クラスター一覧を更新
      await get().fetchClusters();

      // 選択中のクラスターを更新
      if (get().selectedCluster?.cluster_id === clusterId) {
        await get().fetchCluster(clusterId);
      }

      set({ operationInProgress: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'クラスターの開始に失敗しました';
      set({ error: errorMessage, operationInProgress: false });
      throw error;
    }
  },

  stopCluster: async (clusterId: string) => {
    set({ operationInProgress: true, error: null });

    try {
      await clustersService.stop(clusterId);

      // クラスター一覧を更新
      await get().fetchClusters();

      // 選択中のクラスターを更新
      if (get().selectedCluster?.cluster_id === clusterId) {
        await get().fetchCluster(clusterId);
      }

      set({ operationInProgress: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'クラスターの停止に失敗しました';
      set({ error: errorMessage, operationInProgress: false });
      throw error;
    }
  },

  restartCluster: async (clusterId: string) => {
    set({ operationInProgress: true, error: null });

    try {
      await clustersService.restart(clusterId);

      // クラスター一覧を更新
      await get().fetchClusters();

      // 選択中のクラスターを更新
      if (get().selectedCluster?.cluster_id === clusterId) {
        await get().fetchCluster(clusterId);
      }

      set({ operationInProgress: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'クラスターの再起動に失敗しました';
      set({ error: errorMessage, operationInProgress: false });
      throw error;
    }
  },

  selectCluster: (cluster: ClusterDetail | null) => {
    set({ selectedCluster: cluster });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setStatusFilter: (statuses: string[]) => {
    set({ statusFilter: statuses });
  },

  clearError: () => {
    set({ error: null });
  },

  refreshClusters: async () => {
    await get().fetchClusters();
  },
}));

// Selectors
export const selectFilteredClusters = (state: ClustersState): Cluster[] => {
  let filtered = state.clusters;

  // 検索フィルター
  if (state.searchQuery) {
    filtered = clustersService.filterClusters(filtered, {
      search: state.searchQuery,
    });
  }

  // ステータスフィルター
  if (state.statusFilter.length > 0) {
    filtered = clustersService.filterClusters(filtered, {
      states: state.statusFilter,
    });
  }

  return filtered;
};
