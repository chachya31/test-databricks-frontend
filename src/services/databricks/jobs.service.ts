import { apiClient } from './api.client';
import type { Job, JobRun, JobDetail, ListJobsResponse } from '@/types/databricks.types';
import { config } from '@/constants/config';
import { mockJobsService } from '@/mocks/mockServices';

/**
 * ジョブ管理サービス
 */
class JobsService {
  private readonly BASE_PATH = '/api/2.1/jobs';

  /**
   * ジョブ一覧を取得
   */
  async list(limit: number = 25, offset: number = 0): Promise<Job[]> {
    if (config.mockMode) {
      return mockJobsService.list();
    }

    try {
      const response = await apiClient.get<ListJobsResponse>(`${this.BASE_PATH}/list`, {
        params: {
          limit,
          offset,
          expand_tasks: false,
        },
      });
      return response.jobs || [];
    } catch (error) {
      console.error('Failed to list jobs:', error);
      throw error;
    }
  }

  /**
   * ジョブ詳細を取得
   */
  async get(jobId: string): Promise<JobDetail> {
    try {
      const response = await apiClient.get<JobDetail>(`${this.BASE_PATH}/get`, {
        params: { job_id: jobId },
      });
      return response;
    } catch (error) {
      console.error(`Failed to get job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * ジョブを実行
   */
  async run(jobId: string, parameters?: Record<string, string>): Promise<JobRun> {
    try {
      const payload: any = { job_id: jobId };
      if (parameters) {
        payload.notebook_params = parameters;
      }

      const response = await apiClient.post<any>(`${this.BASE_PATH}/run-now`, payload);

      // 実行情報を取得
      const runId = response.run_id;
      const run = await this.getRun(runId);

      console.log(`Job ${jobId} started with run_id ${runId}`);
      return run;
    } catch (error) {
      console.error(`Failed to run job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * ジョブ実行情報を取得
   */
  async getRun(runId: string): Promise<JobRun> {
    try {
      const response = await apiClient.get<any>(`${this.BASE_PATH}/runs/get`, {
        params: { run_id: runId },
      });
      return response;
    } catch (error) {
      console.error(`Failed to get run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * ジョブの実行履歴を取得
   */
  async listRuns(
    jobId?: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<JobRun[]> {
    if (config.mockMode) {
      return mockJobsService.listRuns(jobId);
    }

    try {
      const params: any = {
        limit,
        offset,
        expand_tasks: false,
      };

      if (jobId) {
        params.job_id = jobId;
      }

      const response = await apiClient.get<any>(`${this.BASE_PATH}/runs/list`, {
        params,
      });

      return response.runs || [];
    } catch (error) {
      console.error('Failed to list job runs:', error);
      throw error;
    }
  }

  /**
   * ジョブ実行をキャンセル
   */
  async cancelRun(runId: string): Promise<void> {
    try {
      await apiClient.post(`${this.BASE_PATH}/runs/cancel`, {
        run_id: runId,
      });
      console.log(`Run ${runId} cancelled`);
    } catch (error) {
      console.error(`Failed to cancel run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * ジョブ実行の出力を取得
   */
  async getRunOutput(runId: string): Promise<any> {
    try {
      const response = await apiClient.get<any>(`${this.BASE_PATH}/runs/get-output`, {
        params: { run_id: runId },
      });
      return response;
    } catch (error) {
      console.error(`Failed to get output for run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * ジョブ実行のステータスをポーリング
   */
  async pollRunStatus(
    runId: string,
    targetStates: string[],
    maxAttempts: number = 120,
    intervalMs: number = 5000
  ): Promise<JobRun> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const run = await this.getRun(runId);
      const state = run.state.life_cycle_state;

      if (targetStates.includes(state)) {
        return run;
      }

      // 終了状態の場合は即座に返す
      if (state === 'TERMINATED' || state === 'INTERNAL_ERROR') {
        return run;
      }

      // 待機
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Run ${runId} did not reach target state within timeout`);
  }

  /**
   * ジョブをフィルタリング
   */
  filterJobs(
    jobs: Job[],
    filters: {
      search?: string;
      createdBy?: string;
    }
  ): Job[] {
    let filtered = [...jobs];

    // 検索フィルター
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.settings.name.toLowerCase().includes(searchLower) ||
          job.job_id.toLowerCase().includes(searchLower)
      );
    }

    // 作成者フィルター
    if (filters.createdBy) {
      filtered = filtered.filter((job) => job.creator_user_name === filters.createdBy);
    }

    return filtered;
  }

  /**
   * ジョブをソート
   */
  sortJobs(
    jobs: Job[],
    sortBy: 'name' | 'created' | 'id',
    direction: 'asc' | 'desc' = 'asc'
  ): Job[] {
    const sorted = [...jobs].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.settings.name.localeCompare(b.settings.name);
          break;
        case 'created':
          comparison = a.created_time - b.created_time;
          break;
        case 'id':
          comparison = a.job_id.localeCompare(b.job_id);
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * 実行中のジョブを取得
   */
  async listActiveRuns(): Promise<JobRun[]> {
    if (config.mockMode) {
      return mockJobsService.listActiveRuns();
    }

    try {
      const response = await apiClient.get<any>(`${this.BASE_PATH}/runs/list`, {
        params: {
          active_only: true,
          limit: 100,
        },
      });
      return response.runs || [];
    } catch (error) {
      console.error('Failed to list active runs:', error);
      throw error;
    }
  }

  /**
   * ジョブの統計情報を取得
   */
  async getJobStatistics(jobId: string, limit: number = 50): Promise<any> {
    try {
      const runs = await this.listRuns(jobId, limit);

      const statistics = {
        total_runs: runs.length,
        successful_runs: runs.filter((r) => r.state.result_state === 'SUCCESS').length,
        failed_runs: runs.filter((r) => r.state.result_state === 'FAILED').length,
        canceled_runs: runs.filter((r) => r.state.result_state === 'CANCELED').length,
        average_duration: 0,
        last_run: runs[0],
      };

      // 平均実行時間を計算
      const completedRuns = runs.filter((r) => r.execution_duration);
      if (completedRuns.length > 0) {
        const totalDuration = completedRuns.reduce((sum, r) => sum + (r.execution_duration || 0), 0);
        statistics.average_duration = totalDuration / completedRuns.length;
      }

      return statistics;
    } catch (error) {
      console.error(`Failed to get statistics for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * ジョブ実行を再試行
   */
  async retryRun(runId: string): Promise<JobRun> {
    try {
      const response = await apiClient.post<any>(`${this.BASE_PATH}/runs/repair`, {
        run_id: runId,
        rerun_all_failed_tasks: true,
      });

      const newRunId = response.repair_id;
      const run = await this.getRun(newRunId);

      console.log(`Run ${runId} retried with new run_id ${newRunId}`);
      return run;
    } catch (error) {
      console.error(`Failed to retry run ${runId}:`, error);
      throw error;
    }
  }
}

export const jobsService = new JobsService();
