import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClustersStore, selectFilteredClusters } from '../clustersStore';
import { clustersService } from '@/services/databricks';
import type { Cluster, ClusterDetail } from '@/types/databricks.types';

// Mock clusters service
vi.mock('@/services/databricks', () => ({
  clustersService: {
    list: vi.fn(),
    get: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
    filterClusters: vi.fn(),
  },
}));

describe('ClustersStore', () => {
  const mockClusters: Cluster[] = [
    {
      cluster_id: 'cluster-1',
      cluster_name: 'Test Cluster 1',
      state: 'RUNNING',
      spark_version: '11.3.x-scala2.12',
      node_type_id: 'i3.xlarge',
      num_workers: 2,
    },
    {
      cluster_id: 'cluster-2',
      cluster_name: 'Test Cluster 2',
      state: 'TERMINATED',
      spark_version: '11.3.x-scala2.12',
      node_type_id: 'i3.xlarge',
      num_workers: 4,
    },
  ];

  const mockClusterDetail: ClusterDetail = {
    cluster_id: 'cluster-1',
    cluster_name: 'Test Cluster 1',
    state: 'RUNNING',
    spark_version: '11.3.x-scala2.12',
    node_type_id: 'i3.xlarge',
    num_workers: 2,
    driver_node_type_id: 'i3.xlarge',
    autoscale: undefined,
    enable_elastic_disk: false,
    cluster_source: 'UI',
    state_message: '',
    start_time: Date.now(),
  };

  beforeEach(() => {
    // Reset store state
    useClustersStore.setState({
      clusters: [],
      selectedCluster: null,
      loading: false,
      error: null,
      operationInProgress: false,
      searchQuery: '',
      statusFilter: [],
    });
    
    vi.clearAllMocks();
  });

  describe('fetchClusters', () => {
    it('should fetch clusters successfully', async () => {
      vi.mocked(clustersService.list).mockResolvedValue(mockClusters);

      const { fetchClusters } = useClustersStore.getState();
      await fetchClusters();

      const state = useClustersStore.getState();
      expect(state.clusters).toEqual(mockClusters);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      vi.mocked(clustersService.list).mockRejectedValue(new Error('Fetch failed'));

      const { fetchClusters } = useClustersStore.getState();
      await fetchClusters();

      const state = useClustersStore.getState();
      expect(state.error).toBe('Fetch failed');
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchCluster', () => {
    it('should fetch cluster detail successfully', async () => {
      vi.mocked(clustersService.get).mockResolvedValue(mockClusterDetail);

      const { fetchCluster } = useClustersStore.getState();
      await fetchCluster('cluster-1');

      const state = useClustersStore.getState();
      expect(state.selectedCluster).toEqual(mockClusterDetail);
      expect(state.loading).toBe(false);
    });

    it('should handle fetch cluster error', async () => {
      vi.mocked(clustersService.get).mockRejectedValue(new Error('Cluster not found'));

      const { fetchCluster } = useClustersStore.getState();
      await fetchCluster('invalid-id');

      const state = useClustersStore.getState();
      expect(state.error).toBe('Cluster not found');
      expect(state.loading).toBe(false);
    });
  });

  describe('startCluster', () => {
    it('should start cluster successfully', async () => {
      vi.mocked(clustersService.start).mockResolvedValue();
      vi.mocked(clustersService.list).mockResolvedValue(mockClusters);

      const { startCluster } = useClustersStore.getState();
      await startCluster('cluster-1');

      expect(clustersService.start).toHaveBeenCalledWith('cluster-1');
      expect(useClustersStore.getState().operationInProgress).toBe(false);
    });

    it('should handle start cluster error', async () => {
      vi.mocked(clustersService.start).mockRejectedValue(new Error('Start failed'));

      const { startCluster } = useClustersStore.getState();
      
      await expect(startCluster('cluster-1')).rejects.toThrow('Start failed');
      expect(useClustersStore.getState().error).toBe('Start failed');
      expect(useClustersStore.getState().operationInProgress).toBe(false);
    });

    it('should refresh selected cluster after start', async () => {
      useClustersStore.setState({ selectedCluster: mockClusterDetail });

      vi.mocked(clustersService.start).mockResolvedValue();
      vi.mocked(clustersService.list).mockResolvedValue(mockClusters);
      vi.mocked(clustersService.get).mockResolvedValue(mockClusterDetail);

      const { startCluster } = useClustersStore.getState();
      await startCluster('cluster-1');

      expect(clustersService.get).toHaveBeenCalledWith('cluster-1');
    });
  });

  describe('stopCluster', () => {
    it('should stop cluster successfully', async () => {
      vi.mocked(clustersService.stop).mockResolvedValue();
      vi.mocked(clustersService.list).mockResolvedValue(mockClusters);

      const { stopCluster } = useClustersStore.getState();
      await stopCluster('cluster-1');

      expect(clustersService.stop).toHaveBeenCalledWith('cluster-1');
      expect(useClustersStore.getState().operationInProgress).toBe(false);
    });

    it('should handle stop cluster error', async () => {
      vi.mocked(clustersService.stop).mockRejectedValue(new Error('Stop failed'));

      const { stopCluster } = useClustersStore.getState();
      
      await expect(stopCluster('cluster-1')).rejects.toThrow('Stop failed');
      expect(useClustersStore.getState().error).toBe('Stop failed');
    });
  });

  describe('restartCluster', () => {
    it('should restart cluster successfully', async () => {
      vi.mocked(clustersService.restart).mockResolvedValue();
      vi.mocked(clustersService.list).mockResolvedValue(mockClusters);

      const { restartCluster } = useClustersStore.getState();
      await restartCluster('cluster-1');

      expect(clustersService.restart).toHaveBeenCalledWith('cluster-1');
      expect(useClustersStore.getState().operationInProgress).toBe(false);
    });

    it('should handle restart cluster error', async () => {
      vi.mocked(clustersService.restart).mockRejectedValue(new Error('Restart failed'));

      const { restartCluster } = useClustersStore.getState();
      
      await expect(restartCluster('cluster-1')).rejects.toThrow('Restart failed');
      expect(useClustersStore.getState().error).toBe('Restart failed');
    });
  });

  describe('utility actions', () => {
    it('should select cluster', () => {
      const { selectCluster } = useClustersStore.getState();
      
      selectCluster(mockClusterDetail);
      expect(useClustersStore.getState().selectedCluster).toEqual(mockClusterDetail);
    });

    it('should set search query', () => {
      const { setSearchQuery } = useClustersStore.getState();
      
      setSearchQuery('test query');
      expect(useClustersStore.getState().searchQuery).toBe('test query');
    });

    it('should set status filter', () => {
      const { setStatusFilter } = useClustersStore.getState();
      
      setStatusFilter(['RUNNING', 'PENDING']);
      expect(useClustersStore.getState().statusFilter).toEqual(['RUNNING', 'PENDING']);
    });

    it('should clear error', () => {
      useClustersStore.setState({ error: 'Test error' });
      const { clearError } = useClustersStore.getState();
      
      clearError();
      expect(useClustersStore.getState().error).toBeNull();
    });

    it('should refresh clusters', async () => {
      vi.mocked(clustersService.list).mockResolvedValue(mockClusters);

      const { refreshClusters } = useClustersStore.getState();
      await refreshClusters();

      expect(clustersService.list).toHaveBeenCalled();
      expect(useClustersStore.getState().clusters).toEqual(mockClusters);
    });
  });

  describe('selectFilteredClusters', () => {
    beforeEach(() => {
      useClustersStore.setState({ clusters: mockClusters });
    });

    it('should return all clusters when no filters applied', () => {
      const state = useClustersStore.getState();
      vi.mocked(clustersService.filterClusters).mockReturnValue(mockClusters);

      const filtered = selectFilteredClusters(state);
      expect(filtered).toEqual(mockClusters);
    });

    it('should filter by search query', () => {
      useClustersStore.setState({ searchQuery: 'Test Cluster 1' });
      const state = useClustersStore.getState();

      const filteredClusters = [mockClusters[0]];
      vi.mocked(clustersService.filterClusters).mockReturnValue(filteredClusters);

      const filtered = selectFilteredClusters(state);
      expect(clustersService.filterClusters).toHaveBeenCalledWith(mockClusters, {
        search: 'Test Cluster 1',
      });
      expect(filtered).toEqual(filteredClusters);
    });

    it('should filter by status', () => {
      useClustersStore.setState({ statusFilter: ['RUNNING'] });
      const state = useClustersStore.getState();

      const filteredClusters = [mockClusters[0]];
      vi.mocked(clustersService.filterClusters).mockReturnValue(filteredClusters);

      const filtered = selectFilteredClusters(state);
      expect(clustersService.filterClusters).toHaveBeenCalledWith(mockClusters, {
        states: ['RUNNING'],
      });
      expect(filtered).toEqual(filteredClusters);
    });
  });
});
