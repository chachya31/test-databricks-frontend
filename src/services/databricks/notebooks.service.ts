import { apiClient } from './api.client';
import type {
  NotebookItem,
  Notebook,
  ExecutionContext,
  ExecutionResult,
  ListNotebooksResponse,
} from '@/types/databricks.types';

/**
 * ノートブック管理サービス
 */
class NotebooksService {
  private readonly WORKSPACE_PATH = '/api/2.0/workspace';
  private readonly CONTEXT_PATH = '/api/1.2/contexts';
  private readonly COMMANDS_PATH = '/api/1.2/commands';

  /**
   * ワークスペース内のオブジェクト一覧を取得
   */
  async list(path: string = '/'): Promise<NotebookItem[]> {
    try {
      const response = await apiClient.get<ListNotebooksResponse>(`${this.WORKSPACE_PATH}/list`, {
        params: { path },
      });
      return response.objects || [];
    } catch (error) {
      console.error(`Failed to list notebooks at ${path}:`, error);
      throw error;
    }
  }

  /**
   * ノートブックの内容を取得
   */
  async get(path: string): Promise<Notebook> {
    try {
      const response = await apiClient.get<any>(`${this.WORKSPACE_PATH}/export`, {
        params: {
          path,
          format: 'SOURCE',
        },
      });

      // エクスポートされたコンテンツをパース
      const content = response.content ? atob(response.content) : '';

      // 簡易的なノートブック構造を作成
      const notebook: Notebook = {
        path,
        language: this.detectLanguage(path),
        cells: this.parseNotebookContent(content),
        metadata: {
          name: path.split('/').pop() || '',
          path,
          language: this.detectLanguage(path),
          created_at: Date.now(),
          modified_at: Date.now(),
        },
      };

      return notebook;
    } catch (error) {
      console.error(`Failed to get notebook ${path}:`, error);
      throw error;
    }
  }

  /**
   * 実行コンテキストを作成
   */
  async createContext(clusterId: string, language: string = 'python'): Promise<ExecutionContext> {
    try {
      const response = await apiClient.post<any>(`${this.CONTEXT_PATH}/create`, {
        clusterId,
        language,
      });

      return {
        context_id: response.id,
        cluster_id: clusterId,
        status: 'Running',
      };
    } catch (error) {
      console.error('Failed to create execution context:', error);
      throw error;
    }
  }

  /**
   * コマンドを実行
   */
  async executeCommand(
    contextId: string,
    clusterId: string,
    command: string
  ): Promise<ExecutionResult> {
    try {
      // コマンドを実行
      const executeResponse = await apiClient.post<any>(`${this.COMMANDS_PATH}/execute`, {
        clusterId,
        contextId,
        command,
      });

      const commandId = executeResponse.id;

      // 実行結果を待機
      const result = await this.pollCommandStatus(clusterId, contextId, commandId);

      return result;
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  /**
   * コマンドのステータスをポーリング
   */
  private async pollCommandStatus(
    clusterId: string,
    contextId: string,
    commandId: string,
    maxAttempts: number = 60
  ): Promise<ExecutionResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await apiClient.get<any>(`${this.COMMANDS_PATH}/status`, {
        params: {
          clusterId,
          contextId,
          commandId,
        },
      });

      const status = response.status;

      if (status === 'Finished') {
        return {
          result_type: 'text',
          data: response.results?.data,
          summary: response.results?.summary,
          truncated: response.results?.truncated,
        };
      }

      if (status === 'Error' || status === 'Cancelled') {
        return {
          result_type: 'error',
          data: response.results?.cause || 'Execution failed',
        };
      }

      // 待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Command execution timeout');
  }

  /**
   * ノートブック全体を実行
   */
  async executeNotebook(
    notebookPath: string,
    clusterId: string
  ): Promise<ExecutionResult[]> {
    try {
      const notebook = await this.get(notebookPath);
      const context = await this.createContext(clusterId, notebook.language.toLowerCase());

      const results: ExecutionResult[] = [];

      // 各セルを順次実行
      for (const cell of notebook.cells) {
        if (cell.cell_type === 'code') {
          const command = cell.source.join('\n');
          const result = await this.executeCommand(context.context_id, clusterId, command);
          results.push(result);

          // エラーが発生したら停止
          if (result.result_type === 'error') {
            break;
          }
        }
      }

      return results;
    } catch (error) {
      console.error(`Failed to execute notebook ${notebookPath}:`, error);
      throw error;
    }
  }

  /**
   * ノートブックコンテンツをパース
   */
  private parseNotebookContent(content: string): any[] {
    // 簡易的な実装: 実際にはノートブック形式に応じて適切にパース
    const lines = content.split('\n');
    const cells = [];
    let currentCell: any = null;

    for (const line of lines) {
      // セル区切りを検出（# COMMAND ---------- など）
      if (line.includes('COMMAND') || line.startsWith('# MAGIC')) {
        if (currentCell) {
          cells.push(currentCell);
        }
        currentCell = {
          cell_type: 'code',
          source: [],
          outputs: [],
        };
      } else if (currentCell) {
        currentCell.source.push(line);
      } else {
        // 最初のセル
        currentCell = {
          cell_type: 'code',
          source: [line],
          outputs: [],
        };
      }
    }

    if (currentCell) {
      cells.push(currentCell);
    }

    return cells.length > 0 ? cells : [{ cell_type: 'code', source: [content], outputs: [] }];
  }

  /**
   * パスから言語を検出
   */
  private detectLanguage(path: string): any {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'py':
        return 'PYTHON';
      case 'scala':
        return 'SCALA';
      case 'sql':
        return 'SQL';
      case 'r':
        return 'R';
      default:
        return 'PYTHON';
    }
  }

  /**
   * ノートブックを検索
   */
  async search(query: string, rootPath: string = '/'): Promise<NotebookItem[]> {
    try {
      const allItems = await this.list(rootPath);
      const queryLower = query.toLowerCase();

      return allItems.filter((item) => {
        if (item.object_type !== 'NOTEBOOK') return false;
        return item.path.toLowerCase().includes(queryLower);
      });
    } catch (error) {
      console.error('Failed to search notebooks:', error);
      throw error;
    }
  }

  /**
   * ディレクトリ構造を再帰的に取得
   */
  async listRecursive(path: string = '/', maxDepth: number = 3): Promise<NotebookItem[]> {
    const results: NotebookItem[] = [];

    const traverse = async (currentPath: string, depth: number) => {
      if (depth > maxDepth) return;

      try {
        const items = await this.list(currentPath);
        results.push(...items);

        // ディレクトリを再帰的に探索
        for (const item of items) {
          if (item.object_type === 'DIRECTORY') {
            await traverse(item.path, depth + 1);
          }
        }
      } catch (error) {
        console.error(`Failed to traverse ${currentPath}:`, error);
      }
    };

    await traverse(path, 0);
    return results;
  }
}

export const notebooksService = new NotebooksService();
