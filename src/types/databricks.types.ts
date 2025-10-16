// Cluster Types
export type ClusterState =
  | 'PENDING'
  | 'RUNNING'
  | 'RESTARTING'
  | 'RESIZING'
  | 'TERMINATING'
  | 'TERMINATED'
  | 'ERROR'
  | 'UNKNOWN';

export interface Cluster {
  cluster_id: string;
  cluster_name: string;
  state: ClusterState;
  state_message?: string;
  node_type_id: string;
  driver_node_type_id?: string;
  num_workers: number;
  autoscale?: {
    min_workers: number;
    max_workers: number;
  };
  spark_version: string;
  created_time: number;
  creator_user_name: string;
  last_state_loss_time?: number;
  last_activity_time?: number;
}

export interface NodeInfo {
  node_id: string;
  private_ip: string;
  public_dns?: string;
  instance_id: string;
  start_timestamp: number;
}

export interface ClusterMetrics {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
}

export interface LogEntry {
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export interface ClusterDetail extends Cluster {
  driver?: NodeInfo;
  executors?: NodeInfo[];
  metrics?: ClusterMetrics;
  logs?: LogEntry[];
  spark_conf?: Record<string, string>;
  aws_attributes?: {
    zone_id?: string;
    availability?: string;
    instance_profile_arn?: string;
  };
}

// Notebook Types
export type NotebookLanguage = 'PYTHON' | 'SCALA' | 'SQL' | 'R';
export type CellType = 'code' | 'markdown';

export interface NotebookItem {
  path: string;
  object_type: 'NOTEBOOK' | 'DIRECTORY' | 'LIBRARY';
  language?: NotebookLanguage;
  created_at?: number;
  modified_at?: number;
}

export interface NotebookMetadata {
  name: string;
  path: string;
  language: NotebookLanguage;
  created_at: number;
  modified_at: number;
}

export interface CellOutput {
  output_type: 'stream' | 'display_data' | 'execute_result' | 'error';
  data?: any;
  text?: string[];
  traceback?: string[];
}

export interface NotebookCell {
  cell_type: CellType;
  source: string[];
  outputs?: CellOutput[];
  execution_count?: number;
  metadata?: Record<string, any>;
}

export interface Notebook {
  path: string;
  language: NotebookLanguage;
  cells: NotebookCell[];
  metadata: NotebookMetadata;
}

export interface ExecutionContext {
  context_id: string;
  cluster_id: string;
  status: 'Running' | 'Pending' | 'Error';
}

export interface ExecutionResult {
  result_type: 'text' | 'table' | 'image' | 'error';
  data?: any;
  summary?: string;
  truncated?: boolean;
}

// Job Types
export type JobRunState = 'PENDING' | 'RUNNING' | 'TERMINATING' | 'TERMINATED' | 'SKIPPED' | 'INTERNAL_ERROR';
export type JobRunResultState = 'SUCCESS' | 'FAILED' | 'TIMEDOUT' | 'CANCELED';

export interface JobSettings {
  name: string;
  tasks?: JobTask[];
  job_clusters?: JobCluster[];
  timeout_seconds?: number;
  max_concurrent_runs?: number;
  schedule?: JobSchedule;
  email_notifications?: EmailNotifications;
}

export interface JobTask {
  task_key: string;
  description?: string;
  depends_on?: { task_key: string }[];
  notebook_task?: {
    notebook_path: string;
    base_parameters?: Record<string, string>;
  };
  spark_python_task?: {
    python_file: string;
    parameters?: string[];
  };
  existing_cluster_id?: string;
  new_cluster?: any;
}

export interface JobCluster {
  job_cluster_key: string;
  new_cluster: any;
}

export interface JobSchedule {
  quartz_cron_expression: string;
  timezone_id: string;
  pause_status?: 'PAUSED' | 'UNPAUSED';
}

export interface EmailNotifications {
  on_start?: string[];
  on_success?: string[];
  on_failure?: string[];
}

export interface Job {
  job_id: string;
  settings: JobSettings;
  created_time: number;
  creator_user_name: string;
}

export interface JobRun {
  run_id: string;
  job_id: string;
  run_name?: string;
  state: {
    life_cycle_state: JobRunState;
    result_state?: JobRunResultState;
    state_message?: string;
  };
  start_time: number;
  end_time?: number;
  setup_duration?: number;
  execution_duration?: number;
  cleanup_duration?: number;
  trigger?: 'PERIODIC' | 'ONE_TIME' | 'RETRY';
}

export interface JobDetail extends Job {
  runs?: JobRun[];
}

// Data Types
export interface Database {
  name: string;
  description?: string;
  location?: string;
  owner?: string;
}

export interface Column {
  name: string;
  type: string;
  comment?: string;
  nullable?: boolean;
}

export interface Table {
  name: string;
  database: string;
  table_type: 'MANAGED' | 'EXTERNAL' | 'VIEW';
  columns: Column[];
  owner?: string;
  created_at?: number;
  last_accessed?: number;
  comment?: string;
  storage_location?: string;
}

export interface TableDetail extends Table {
  partitions?: string[];
  properties?: Record<string, string>;
  statistics?: {
    num_rows?: number;
    total_size?: number;
  };
}

export interface QueryResult {
  columns: Column[];
  rows: any[][];
  row_count: number;
  execution_time: number;
  statement_id?: string;
  truncated?: boolean;
}

export interface QueryStatus {
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  error?: {
    message: string;
    error_code?: string;
  };
}

// Workspace Types
export interface WorkspaceObject {
  path: string;
  object_type: 'NOTEBOOK' | 'DIRECTORY' | 'LIBRARY' | 'FILE';
  object_id?: number;
  language?: NotebookLanguage;
  created_at?: number;
  modified_at?: number;
}

// API Response Types
export interface ListClustersResponse {
  clusters: Cluster[];
}

export interface ListNotebooksResponse {
  objects: NotebookItem[];
}

export interface ListJobsResponse {
  jobs: Job[];
  has_more?: boolean;
  next_page_token?: string;
}

export interface ListDatabasesResponse {
  databases: Database[];
}

export interface ListTablesResponse {
  tables: Table[];
}
