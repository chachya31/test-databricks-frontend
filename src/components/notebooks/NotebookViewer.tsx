import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Code as CodeIcon,
  Article as MarkdownIcon,
} from '@mui/icons-material';
import { useNotebooksStore, selectExecutionResult } from '@/stores/notebooksStore';
import { Loading } from '@/components/common/Loading';
import type { NotebookItem } from '@/types/databricks.types';

interface NotebookViewerProps {
  notebook: NotebookItem;
  clusterId?: string;
  onExecuteCell?: (cellIndex: number) => void;
}

export const NotebookViewer: React.FC<NotebookViewerProps> = ({
  notebook,
  clusterId,
  onExecuteCell,
}) => {
  const { currentNotebook, fetchNotebook, loading, executing } = useNotebooksStore();

  useEffect(() => {
    fetchNotebook(notebook.path);
  }, [notebook.path, fetchNotebook]);

  if (loading && !currentNotebook) {
    return <Loading message="ノートブックを読み込み中..." />;
  }

  if (!currentNotebook) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          ノートブックを読み込めませんでした
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* ノートブックヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h5">{currentNotebook.metadata.name}</Typography>
          <Chip label={currentNotebook.language} size="small" color="primary" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          パス: {currentNotebook.path}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          最終更新: {new Date(currentNotebook.metadata.modified_at).toLocaleString('ja-JP')}
        </Typography>
      </Box>

      {/* セル一覧 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {currentNotebook.cells.map((cell, index) => (
          <CellComponent
            key={index}
            cell={cell}
            cellIndex={index}
            clusterId={clusterId}
            executing={executing}
            onExecute={() => onExecuteCell?.(index)}
          />
        ))}
      </Box>
    </Box>
  );
};

// セルコンポーネント
interface CellComponentProps {
  cell: any;
  cellIndex: number;
  clusterId?: string;
  executing: boolean;
  onExecute?: () => void;
}

const CellComponent: React.FC<CellComponentProps> = ({
  cell,
  cellIndex,
  clusterId,
  executing,
  onExecute,
}) => {
  const executionResult = useNotebooksStore((state) => selectExecutionResult(state, cellIndex));

  return (
    <Card>
      <CardContent>
        {/* セルヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {cell.cell_type === 'code' ? (
              <>
                <CodeIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2">コードセル [{cellIndex + 1}]</Typography>
              </>
            ) : (
              <>
                <MarkdownIcon fontSize="small" color="secondary" />
                <Typography variant="subtitle2">マークダウンセル [{cellIndex + 1}]</Typography>
              </>
            )}
          </Box>
          {cell.cell_type === 'code' && clusterId && (
            <IconButton
              size="small"
              color="primary"
              onClick={onExecute}
              disabled={executing}
              title="実行"
            >
              <PlayIcon />
            </IconButton>
          )}
        </Box>

        {/* セル内容 */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: cell.cell_type === 'code' ? 'grey.50' : 'background.paper',
            fontFamily: cell.cell_type === 'code' ? 'monospace' : 'inherit',
          }}
        >
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              m: 0,
            }}
          >
            {cell.source.join('\n')}
          </Typography>
        </Paper>

        {/* 実行結果 */}
        {executionResult && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                実行結果:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor:
                    executionResult.result_type === 'error' ? 'error.light' : 'success.light',
                  mt: 1,
                }}
              >
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0,
                    color:
                      executionResult.result_type === 'error'
                        ? 'error.contrastText'
                        : 'success.contrastText',
                  }}
                >
                  {typeof executionResult.data === 'string'
                    ? executionResult.data
                    : JSON.stringify(executionResult.data, null, 2)}
                </Typography>
              </Paper>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};
