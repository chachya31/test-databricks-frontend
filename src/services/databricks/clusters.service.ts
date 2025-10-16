import { apiClient } from './api.client';
import type {
  Cluster,
  ClusterDetail,
  ListClustersResponse,
} from '@/types/databricks.types';
import { config } from '@/constants/config';
import { mockClustersService } from '@/mocks/mockServices';

/**
 * クラスター管理サービス
 */
class ClustersService {
  private readonly BASE_PATH = '/api/2.0/clusters';

  /**
   * クラスター一覧を取得
   */
  async list(): Promise<Cluster[]> {
    if (config.mockMode) {
      return mockClustersService.list();
    }

    try {
      const response = await apiClient.get<ListClustersResponse>(`${this.BASE_PATH}/list`);
      return response.clusters || [];
    } catch (error) {
      console.error('Failed to list clusters:', error);
      throw error;
    }
  }

  /**
   * クラスター詳細を取得
   */
  async get(clusterId: string): Promise<ClusterDetail> {
    if (config.mockMode) {
      return mockClustersService.get(clusterId);
    }

    try {
      const response = await apiClient.get<ClusterDetail>(`${this.BASE_PATH}/get`, {
        params: { cluster_id: clusterId },
      });
      return response;
    } catch (error) {
      console.error(`Failed to get cluster ${clusterId}:`, error);
      throw error;
    }
  }

  /**
   * クラスターを開始
   */
  async start(clusterId: string): Promise<void> {
    if (config.mockMode) {
      return mockClustersService.start(clusterId);
    }

    try {
      await apiClient.post(`${this.BASE_PATH}/start`, {
        cluster_id: clusterId,
      });
      console.log(`Cluster ${clusterId} start requested`);
    } catch (error) {
      console.error(`Failed to start cluster ${clusterId}:`, error);
      throw error;
    }
  }

  /**
   * クラスターを停止
   */
  async stop(clusterId: string): Promise<void> {
    if (config.mockMode) {
      return mockClustersService.stop(clusterId);
    }

    try {
      await apiClient.post(`${this.BASE_PATH}/delete`, {
        cluster_id: clusterId,
      });
      console.log(`Cluster ${clusterId} stop requested`);
    } catch (error) {
      console.error(`Failed to stop cluster ${clusterId}:`, error);
      throw error;
    }
  }

  /**
   * クラスターを再起動
   */
  async restart(clusterId: string): Promise<void> {
    if (config.mockMode) {
      return mockClustersService.restart(clusterId);
    }

    try {
      await apiClient.post(`${this.BASE_PATH}/restart`, {
        cluster_id: clusterId,
      });
      console.log(`Cluster ${clusterId} restart requested`);
    } catch (error) {
      console.error(`Failed to restart cluster ${clusterId}:`, error);
      throw error;
    }
  }

  /**
   * クラスターのイベントログを取得
   */
  async getEvents(clusterId: string, startTime?: number, endTime?: number): Promise<any> {
    try {
      const params: any = { cluster_id: clusterId };
      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;

      const response = await apiClient.post(`${this.BASE_PATH}/events`, params);
      return response;
    } catch (error) {
      console.error(`Failed to get events for cluster ${clusterId}:`, error);
      throw error;
    }
  }

  /**
   * クラスターのステータスをポーリング
   */
  async pollStatus(
    clusterId: string,
    targetStates: string[],
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<ClusterDetail> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const cluster = await this.get(clusterId);

      if (targetStates.includes(cluster.state)) {
        return cluster;
      }

      // エラー状態の場合は即座に返す
      if (cluster.state === 'ERROR') {
        throw new Error(`Cluster ${clusterId} is in ERROR state: ${cluster.state_message}`);
      }

      // 待機
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Cluster ${clusterId} did not reach target state within timeout`);
  }

  /**
   * 実行中のクラスターのみを取得
   */
  async listRunning(): Promise<Cluster[]> {
    const clusters = await this.list();
    return clusters.filter((cluster) => cluster.state === 'RUNNING');
  }

  /**
   * クラスターをフィルタリング
   */
  filterClusters(clusters: Cluster[], filters: {
    search?: string;
    states?: string[];
    createdBy?: string;
  }): Cluster[] {
    let filtered = [...clusters];

    // 検索フィルター
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (cluster) =>
          cluster.cluster_name.toLowerCase().includes(searchLower) ||
          cluster.cluster_id.toLowerCase().includes(searchLower)
      );
    }

    // ステータスフィルター
    if (filters.states && filters.states.length > 0) {
      filtered = filtered.filter((cluster) => filters.states!.includes(cluster.state));
    }

    // 作成者フィルター
    if (filters.createdBy) {
      filtered = filtered.filter((cluster) => cluster.creator_user_name === filters.createdBy);
    }

    return filtered;
  }

  /**
   * クラスターをソート
   */
  sortClusters(
    clusters: Cluster[],
    sortBy: 'name' | 'state' | 'created' | 'activity',
    direction: 'asc' | 'desc' = 'asc'
  ): Cluster[] {
    const sorted = [...clusters].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.cluster_name.localeCompare(b.cluster_name);
          break;
        case 'state':
          comparison = a.state.localeCompare(b.state);
          break;
        case 'created':
          comparison = a.created_time - b.created_time;
          break;
        case 'activity':
          comparison = (a.last_activity_time || 0) - (b.last_activity_time || 0);
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
}

export const clustersService = new ClustersService();
