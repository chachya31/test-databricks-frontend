import {
  mockClusters,
  mockClusterDetail,
  mockNotebooks,
  mockNotebook,
  mockJobs,
  mockJobRuns,
  mockDatabases,
  mockTables,
  mockQueryResult,
} from './mockData';
import type { DatabricksCredentials, AuthResult } from '@/types/auth.types';

// 遅延をシミュレート
const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService = {
  async connect(credentials: DatabricksCredentials): Promise<AuthResult> {
    await delay(800);

    // モックモードでは任意の認証情報を受け入れる
    if (credentials.host && credentials.token) {
      return {
        success: true,
        user: {
          id: 'mock-user-id',
          username: 'Mock User',
          email: 'mock@example.com',
        },
      };
    }

    return {
      success: false,
      error: '認証情報を入力してください',
    };
  },
};

export const mockClustersService = {
  async list() {
    await delay();
    return mockClusters;
  },

  async get(clusterId: string) {
    await delay();
    return { ...mockClusterDetail, cluster_id: clusterId };
  },

  async start(clusterId: string) {
    await delay(1000);
    console.log(`Mock: Starting cluster ${clusterId}`);
  },

  async stop(clusterId: string) {
    await delay(1000);
    console.log(`Mock: Stopping cluster ${clusterId}`);
  },

  async restart(clusterId: string) {
    await delay(1500);
    console.log(`Mock: Restarting cluster ${clusterId}`);
  },
};

export const mockNotebooksService = {
  async list(path: string = '/') {
    await delay();
    return mockNotebooks.filter((nb) => nb.path.startsWith(path));
  },

  async get(path: string) {
    await delay();
    return { ...mockNotebook, path };
  },

  async executeCommand(_contextId: string, _clusterId: string, command: string) {
    await delay(1500);
    return {
      result_type: 'text' as const,
      data: `Mock execution result for: ${command.substring(0, 50)}...`,
      summary: 'Execution completed successfully',
    };
  },

  async createContext(clusterId: string, _language: string) {
    await delay();
    return {
      context_id: `mock-context-${Date.now()}`,
      cluster_id: clusterId,
      status: 'Running' as const,
    };
  },
};

export const mockJobsService = {
  async list() {
    await delay();
    return mockJobs;
  },

  async get(jobId: string) {
    await delay();
    const job = mockJobs.find((j) => j.job_id === jobId);
    return job || mockJobs[0];
  },

  async listRuns(jobId?: string) {
    await delay();
    if (jobId) {
      return mockJobRuns.filter((run) => run.job_id === jobId);
    }
    return mockJobRuns;
  },

  async run(jobId: string, parameters?: Record<string, string>) {
    await delay(1000);
    console.log(`Mock: Running job ${jobId}`, parameters);
    return {
      ...mockJobRuns[1],
      run_id: `mock-run-${Date.now()}`,
      job_id: jobId,
    };
  },

  async cancelRun(runId: string) {
    await delay();
    console.log(`Mock: Cancelling run ${runId}`);
  },

  async listActiveRuns() {
    await delay();
    return mockJobRuns.filter((run) => run.state.life_cycle_state === 'RUNNING');
  },
};

export const mockDataService = {
  async listDatabases() {
    await delay();
    return mockDatabases;
  },

  async listTables(database: string) {
    await delay();
    return mockTables.filter((t) => t.database === database);
  },

  async getTable(database: string, table: string) {
    await delay();
    const foundTable = mockTables.find((t) => t.database === database && t.name === table);
    return foundTable || mockTables[0];
  },

  async executeQuery(query: string, _warehouseId?: string) {
    await delay(1500);
    console.log(`Mock: Executing query: ${query}`);
    return mockQueryResult;
  },

  async getTableSample(_database: string, _table: string, _limit: number = 100) {
    await delay();
    return mockQueryResult;
  },
};
