import type {
  Cluster,
  ClusterDetail,
  NotebookItem,
  Notebook,
  Job,
  JobRun,
  Database,
  Table,
  QueryResult,
} from '@/types/databricks.types';

// Mock Clusters
export const mockClusters: Cluster[] = [
  {
    cluster_id: 'cluster-001',
    cluster_name: 'Production Cluster',
    state: 'RUNNING',
    node_type_id: 'i3.xlarge',
    num_workers: 4,
    spark_version: '11.3.x-scala2.12',
    created_time: Date.now() - 86400000 * 7,
    creator_user_name: 'admin@example.com',
    last_activity_time: Date.now() - 3600000,
  },
  {
    cluster_id: 'cluster-002',
    cluster_name: 'Development Cluster',
    state: 'TERMINATED',
    node_type_id: 'i3.large',
    num_workers: 2,
    spark_version: '11.3.x-scala2.12',
    created_time: Date.now() - 86400000 * 14,
    creator_user_name: 'dev@example.com',
    last_activity_time: Date.now() - 86400000,
  },
  {
    cluster_id: 'cluster-003',
    cluster_name: 'Analytics Cluster',
    state: 'RUNNING',
    node_type_id: 'i3.2xlarge',
    num_workers: 8,
    spark_version: '12.2.x-scala2.12',
    created_time: Date.now() - 86400000 * 3,
    creator_user_name: 'analytics@example.com',
    last_activity_time: Date.now() - 1800000,
  },
];

export const mockClusterDetail: ClusterDetail = {
  ...mockClusters[0],
  driver: {
    node_id: 'node-driver-001',
    private_ip: '10.0.1.10',
    public_dns: 'ec2-xxx.compute.amazonaws.com',
    instance_id: 'i-0123456789abcdef0',
    start_timestamp: Date.now() - 86400000,
  },
  executors: [
    {
      node_id: 'node-executor-001',
      private_ip: '10.0.1.11',
      instance_id: 'i-0123456789abcdef1',
      start_timestamp: Date.now() - 86400000,
    },
    {
      node_id: 'node-executor-002',
      private_ip: '10.0.1.12',
      instance_id: 'i-0123456789abcdef2',
      start_timestamp: Date.now() - 86400000,
    },
  ],
  metrics: {
    cpu_usage: 45.5,
    memory_usage: 62.3,
    disk_usage: 38.7,
  },
};

// Mock Notebooks
export const mockNotebooks: NotebookItem[] = [
  {
    path: '/Users/admin/Data Analysis',
    object_type: 'DIRECTORY',
    created_at: Date.now() - 86400000 * 30,
    modified_at: Date.now() - 86400000 * 2,
  },
  {
    path: '/Users/admin/Data Analysis/Sales Report',
    object_type: 'NOTEBOOK',
    language: 'PYTHON',
    created_at: Date.now() - 86400000 * 15,
    modified_at: Date.now() - 86400000,
  },
  {
    path: '/Users/admin/Data Analysis/Customer Segmentation',
    object_type: 'NOTEBOOK',
    language: 'PYTHON',
    created_at: Date.now() - 86400000 * 10,
    modified_at: Date.now() - 86400000 * 3,
  },
  {
    path: '/Users/admin/ETL Pipeline',
    object_type: 'NOTEBOOK',
    language: 'SCALA',
    created_at: Date.now() - 86400000 * 20,
    modified_at: Date.now() - 86400000 * 5,
  },
];

export const mockNotebook: Notebook = {
  path: '/Users/admin/Data Analysis/Sales Report',
  language: 'PYTHON',
  cells: [
    {
      cell_type: 'markdown',
      source: ['# Sales Report Analysis', '', 'This notebook analyzes sales data.'],
    },
    {
      cell_type: 'code',
      source: ['import pandas as pd', 'import matplotlib.pyplot as plt', '', 'print("Setup complete")'],
      outputs: [],
      execution_count: 1,
    },
    {
      cell_type: 'code',
      source: ['df = pd.read_csv("/data/sales.csv")', 'df.head()'],
      outputs: [],
      execution_count: 2,
    },
  ],
  metadata: {
    name: 'Sales Report',
    path: '/Users/admin/Data Analysis/Sales Report',
    language: 'PYTHON',
    created_at: Date.now() - 86400000 * 15,
    modified_at: Date.now() - 86400000,
  },
};

// Mock Jobs
export const mockJobs: Job[] = [
  {
    job_id: 'job-001',
    settings: {
      name: 'Daily ETL Pipeline',
      schedule: {
        quartz_cron_expression: '0 0 2 * * ?',
        timezone_id: 'Asia/Tokyo',
      },
    },
    created_time: Date.now() - 86400000 * 60,
    creator_user_name: 'admin@example.com',
  },
  {
    job_id: 'job-002',
    settings: {
      name: 'Weekly Report Generation',
      schedule: {
        quartz_cron_expression: '0 0 8 ? * MON',
        timezone_id: 'Asia/Tokyo',
      },
    },
    created_time: Date.now() - 86400000 * 45,
    creator_user_name: 'analytics@example.com',
  },
  {
    job_id: 'job-003',
    settings: {
      name: 'Data Quality Check',
      schedule: {
        quartz_cron_expression: '0 0 */6 * * ?',
        timezone_id: 'Asia/Tokyo',
      },
    },
    created_time: Date.now() - 86400000 * 30,
    creator_user_name: 'dev@example.com',
  },
];

export const mockJobRuns: JobRun[] = [
  {
    run_id: 'run-001',
    job_id: 'job-001',
    run_name: 'Daily ETL Pipeline - 2024-01-15',
    state: {
      life_cycle_state: 'TERMINATED',
      result_state: 'SUCCESS',
    },
    start_time: Date.now() - 86400000,
    end_time: Date.now() - 86400000 + 3600000,
    execution_duration: 3600000,
  },
  {
    run_id: 'run-002',
    job_id: 'job-001',
    run_name: 'Daily ETL Pipeline - 2024-01-16',
    state: {
      life_cycle_state: 'RUNNING',
    },
    start_time: Date.now() - 1800000,
  },
  {
    run_id: 'run-003',
    job_id: 'job-002',
    run_name: 'Weekly Report Generation - Week 3',
    state: {
      life_cycle_state: 'TERMINATED',
      result_state: 'FAILED',
      state_message: 'Task failed with exception',
    },
    start_time: Date.now() - 86400000 * 2,
    end_time: Date.now() - 86400000 * 2 + 1800000,
    execution_duration: 1800000,
  },
];

// Mock Databases
export const mockDatabases: Database[] = [
  {
    name: 'sales_db',
    description: 'Sales data warehouse',
    owner: 'admin@example.com',
  },
  {
    name: 'customer_db',
    description: 'Customer information database',
    owner: 'analytics@example.com',
  },
  {
    name: 'product_db',
    description: 'Product catalog database',
    owner: 'dev@example.com',
  },
];

export const mockTables: Table[] = [
  {
    name: 'orders',
    database: 'sales_db',
    table_type: 'MANAGED',
    columns: [
      { name: 'order_id', type: 'bigint' },
      { name: 'customer_id', type: 'bigint' },
      { name: 'order_date', type: 'date' },
      { name: 'total_amount', type: 'decimal(10,2)' },
    ],
    owner: 'admin@example.com',
  },
  {
    name: 'customers',
    database: 'customer_db',
    table_type: 'MANAGED',
    columns: [
      { name: 'customer_id', type: 'bigint' },
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'created_at', type: 'timestamp' },
    ],
    owner: 'analytics@example.com',
  },
];

export const mockQueryResult: QueryResult = {
  columns: [
    { name: 'order_id', type: 'bigint' },
    { name: 'customer_id', type: 'bigint' },
    { name: 'total_amount', type: 'decimal(10,2)' },
  ],
  rows: [
    [1001, 5001, 1250.50],
    [1002, 5002, 890.25],
    [1003, 5001, 2340.00],
    [1004, 5003, 567.80],
    [1005, 5004, 1890.45],
  ],
  row_count: 5,
  execution_time: 1234,
  truncated: false,
};
