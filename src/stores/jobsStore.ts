import { create } from 'zustand';
import { jobsService } from '@/services/databricks';
import type { Job, JobRun, JobDetail } from '@/types/databricks.types';

interface JobsState {
  // State
  jobs: Job[];
  selectedJob: JobDetail | null;
  jobRuns: JobRun[];
  activeRuns: JobRun[];
  loading: boolean;
  executing: boolean;
  error: string | null;

  // Filters
  searchQuery: string;

  // Actions
  fetchJobs: () => Promise<void>;
  fetchJob: (jobId: string) => Promise<void>;
  fetchJobRuns: (jobId?: string) => Promise<void>;
  fetchActiveRuns: () => Promise<void>;
  runJob: (jobId: string, parameters?: Record<string, string>) => Promise<JobRun>;
  cancelRun: (runId: string) => Promise<void>;
  retryRun: (runId: string) => Promise<void>;
  getJobStatistics: (jobId: string) => Promise<any>;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
  refreshJobs: () => Promise<void>;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  // Initial State
  jobs: [],
  selectedJob: null,
  jobRuns: [],
  activeRuns: [],
  loading: false,
  executing: false,
  error: null,
  searchQuery: '',

  // Actions
  fetchJobs: async () => {
    set({ loading: true, error: null });

    try {
      const jobs = await jobsService.list();
      set({ jobs, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ジョブ一覧の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchJob: async (jobId: string) => {
    set({ loading: true, error: null });

    try {
      const job = await jobsService.get(jobId);
      set({ selectedJob: job, loading: false });

      // ジョブの実行履歴も取得
      await get().fetchJobRuns(jobId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ジョブ詳細の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchJobRuns: async (jobId?: string) => {
    set({ loading: true, error: null });

    try {
      const runs = await jobsService.listRuns(jobId);
      set({ jobRuns: runs, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ジョブ実行履歴の取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchActiveRuns: async () => {
    set({ loading: true, error: null });

    try {
      const runs = await jobsService.listActiveRuns();
      set({ activeRuns: runs, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '実行中ジョブの取得に失敗しました';
      set({ error: errorMessage, loading: false });
    }
  },

  runJob: async (jobId: string, parameters?: Record<string, string>) => {
    set({ executing: true, error: null });

    try {
      const run = await jobsService.run(jobId, parameters);

      // アクティブな実行を更新
      await get().fetchActiveRuns();

      // 選択中のジョブの実行履歴を更新
      if (get().selectedJob?.job_id === jobId) {
        await get().fetchJobRuns(jobId);
      }

      set({ executing: false });
      return run;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ジョブの実行に失敗しました';
      set({ error: errorMessage, executing: false });
      throw error;
    }
  },

  cancelRun: async (runId: string) => {
    set({ executing: true, error: null });

    try {
      await jobsService.cancelRun(runId);

      // アクティブな実行を更新
      await get().fetchActiveRuns();

      // 実行履歴を更新
      await get().fetchJobRuns();

      set({ executing: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ジョブのキャンセルに失敗しました';
      set({ error: errorMessage, executing: false });
      throw error;
    }
  },

  retryRun: async (runId: string) => {
    set({ executing: true, error: null });

    try {
      await jobsService.retryRun(runId);

      // アクティブな実行を更新
      await get().fetchActiveRuns();

      // 実行履歴を更新
      await get().fetchJobRuns();

      set({ executing: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ジョブの再試行に失敗しました';
      set({ error: errorMessage, executing: false });
      throw error;
    }
  },

  getJobStatistics: async (jobId: string) => {
    try {
      const statistics = await jobsService.getJobStatistics(jobId);
      return statistics;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ジョブ統計の取得に失敗しました';
      set({ error: errorMessage });
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearError: () => {
    set({ error: null });
  },

  refreshJobs: async () => {
    await get().fetchJobs();
    await get().fetchActiveRuns();
  },
}));

// Selectors
export const selectFilteredJobs = (state: JobsState): Job[] => {
  let filtered = state.jobs;

  // 検索フィルター
  if (state.searchQuery) {
    filtered = jobsService.filterJobs(filtered, {
      search: state.searchQuery,
    });
  }

  return filtered;
};

export const selectJobRunsByStatus = (
  state: JobsState,
  status: 'PENDING' | 'RUNNING' | 'TERMINATED'
) => {
  return state.jobRuns.filter((run) => run.state.life_cycle_state === status);
};

export const selectSuccessfulRuns = (state: JobsState) => {
  return state.jobRuns.filter((run) => run.state.result_state === 'SUCCESS');
};

export const selectFailedRuns = (state: JobsState) => {
  return state.jobRuns.filter((run) => run.state.result_state === 'FAILED');
};
