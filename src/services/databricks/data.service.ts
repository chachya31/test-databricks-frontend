import { apiClient } from './api.client';
import type {
  Database,
  Table,
  TableDetail,
  QueryResult,
  Column,
} from '@/types/databricks.types';

/**
 * データ管理サービス
 */
class DataService {
  private readonly SQL_PATH = '/api/2.0/sql';
  private readonly WAREHOUSES_PATH = '/api/2.0/sql/warehouses';

  /**
   * データベース一覧を取得
   */
  async listDatabases(): Promise<Database[]> {
    try {
      // SQL Warehouseを使用してデータベース一覧を取得
      const query = 'SHOW DATABASES';
      const result = await this.executeQuery(query);

      // 結果をDatabase型に変換
      const databases: Database[] = result.rows.map((row) => ({
        name: row[0] as string,
        description: row[1] as string,
      }));

      return databases;
    } catch (error) {
      console.error('Failed to list databases:', error);
      throw error;
    }
  }

  /**
   * テーブル一覧を取得
   */
  async listTables(database: string): Promise<Table[]> {
    try {
      const query = `SHOW TABLES IN ${database}`;
      const result = await this.executeQuery(query);

      const tables: Table[] = result.rows.map((row) => ({
        name: row[1] as string,
        database: row[0] as string,
        table_type: 'MANAGED',
        columns: [],
      }));

      return tables;
    } catch (error) {
      console.error(`Failed to list tables in ${database}:`, error);
      throw error;
    }
  }

  /**
   * テーブル詳細を取得
   */
  async getTable(database: string, table: string): Promise<TableDetail> {
    try {
      // テーブルスキーマを取得
      const describeQuery = `DESCRIBE TABLE ${database}.${table}`;
      const schemaResult = await this.executeQuery(describeQuery);

      const columns: Column[] = schemaResult.rows.map((row) => ({
        name: row[0] as string,
        type: row[1] as string,
        comment: row[2] as string,
      }));

      // テーブル詳細情報を取得
      const detailQuery = `DESCRIBE TABLE EXTENDED ${database}.${table}`;
      const detailResult = await this.executeQuery(detailQuery);

      const tableDetail: TableDetail = {
        name: table,
        database,
        table_type: 'MANAGED',
        columns,
        owner: this.extractProperty(detailResult.rows, 'Owner'),
        comment: this.extractProperty(detailResult.rows, 'Comment'),
        storage_location: this.extractProperty(detailResult.rows, 'Location'),
      };

      return tableDetail;
    } catch (error) {
      console.error(`Failed to get table ${database}.${table}:`, error);
      throw error;
    }
  }

  /**
   * テーブルのサンプルデータを取得
   */
  async getTableSample(
    database: string,
    table: string,
    limit: number = 100
  ): Promise<QueryResult> {
    try {
      const query = `SELECT * FROM ${database}.${table} LIMIT ${limit}`;
      return await this.executeQuery(query);
    } catch (error) {
      console.error(`Failed to get sample data from ${database}.${table}:`, error);
      throw error;
    }
  }

  /**
   * SQLクエリを実行
   */
  async executeQuery(query: string, warehouseId?: string): Promise<QueryResult> {
    try {
      // SQL Warehouseが指定されていない場合は、最初の利用可能なものを使用
      if (!warehouseId) {
        const warehouses = await this.listWarehouses();
        if (warehouses.length === 0) {
          throw new Error('利用可能なSQL Warehouseがありません');
        }
        warehouseId = warehouses[0].id;
      }

      // クエリを実行
      const executeResponse = await apiClient.post<any>(`${this.SQL_PATH}/statements`, {
        warehouse_id: warehouseId,
        statement: query,
        wait_timeout: '30s',
      });

      const statementId = executeResponse.statement_id;

      // 結果を待機
      const result = await this.pollQueryStatus(statementId);

      return result;
    } catch (error) {
      console.error('Failed to execute query:', error);
      throw error;
    }
  }

  /**
   * クエリステータスをポーリング
   */
  private async pollQueryStatus(
    statementId: string,
    maxAttempts: number = 60
  ): Promise<QueryResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await apiClient.get<any>(`${this.SQL_PATH}/statements/${statementId}`);

      const status = response.status?.state;

      if (status === 'SUCCEEDED') {
        const result = response.result;
        const manifest = response.manifest;

        return {
          columns: manifest?.schema?.columns || [],
          rows: result?.data_array || [],
          row_count: result?.row_count || 0,
          execution_time: response.status?.execution_time || 0,
          statement_id: statementId,
          truncated: manifest?.truncated || false,
        };
      }

      if (status === 'FAILED' || status === 'CANCELED') {
        throw new Error(response.status?.error?.message || 'Query execution failed');
      }

      // 待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Query execution timeout');
  }

  /**
   * SQL Warehouse一覧を取得
   */
  async listWarehouses(): Promise<any[]> {
    try {
      const response = await apiClient.get<any>(this.WAREHOUSES_PATH);
      return response.warehouses || [];
    } catch (error) {
      console.error('Failed to list warehouses:', error);
      throw error;
    }
  }

  /**
   * クエリ結果をエクスポート
   */
  async exportQueryResult(
    result: QueryResult,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    if (format === 'csv') {
      return this.convertToCSV(result);
    } else {
      return JSON.stringify(result.rows, null, 2);
    }
  }

  /**
   * クエリ結果をCSVに変換
   */
  private convertToCSV(result: QueryResult): string {
    const headers = result.columns.map((col) => col.name).join(',');
    const rows = result.rows.map((row) => row.join(',')).join('\n');
    return `${headers}\n${rows}`;
  }

  /**
   * プロパティを抽出（DESCRIBE EXTENDED結果から）
   */
  private extractProperty(rows: any[][], propertyName: string): string | undefined {
    const row = rows.find((r) => r[0] === propertyName);
    return row ? (row[1] as string) : undefined;
  }

  /**
   * テーブルを検索
   */
  async searchTables(query: string): Promise<Table[]> {
    try {
      const databases = await this.listDatabases();
      const allTables: Table[] = [];

      for (const db of databases) {
        const tables = await this.listTables(db.name);
        allTables.push(...tables);
      }

      const queryLower = query.toLowerCase();
      return allTables.filter(
        (table) =>
          table.name.toLowerCase().includes(queryLower) ||
          table.database.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error('Failed to search tables:', error);
      throw error;
    }
  }

  /**
   * クエリ履歴を取得
   */
  async getQueryHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await apiClient.get<any>(`${this.SQL_PATH}/history/queries`, {
        params: {
          max_results: limit,
        },
      });
      return response.res || [];
    } catch (error) {
      console.error('Failed to get query history:', error);
      // エラーが発生しても空配列を返す
      return [];
    }
  }

  /**
   * クエリをキャンセル
   */
  async cancelQuery(statementId: string): Promise<void> {
    try {
      await apiClient.post(`${this.SQL_PATH}/statements/${statementId}/cancel`);
      console.log(`Query ${statementId} cancelled`);
    } catch (error) {
      console.error(`Failed to cancel query ${statementId}:`, error);
      throw error;
    }
  }
}

export const dataService = new DataService();
