import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useDataStore } from '@/stores/dataStore';
import { useNotification } from '@/components/common/Notification';
import { Loading } from '@/components/common/Loading';

export const QueryEditor: React.FC = () => {
  const {
    currentQuery,
    queryResult,
    queryHistory,
    executing,
    setCurrentQuery,
    executeQuery,
    exportResult,
  } = useDataStore();
  const { showSuccess, showError } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [historyAnchorEl, setHistoryAnchorEl] = useState<null | HTMLElement>(null);

  const handleExecuteQuery = async () => {
    if (!currentQuery.trim()) {
      showError('クエリを入力してください');
      return;
    }

    try {
      await executeQuery(currentQuery);
      showSuccess('クエリを実行しました');
    } catch (error) {
      showError(`クエリの実行に失敗しました: ${error}`);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = await exportResult(format);
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_result.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(`結果を${format.toUpperCase()}形式でエクスポートしました`);
      setAnchorEl(null);
    } catch (error) {
      showError(`エクスポートに失敗しました: ${error}`);
    }
  };

  const handleSelectHistory = (query: string) => {
    setCurrentQuery(query);
    setHistoryAnchorEl(null);
  };

  return (
    <Box>
      {/* クエリエディター */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">SQLクエリエディター</Typography>
            <Box>
              <IconButton
                size="small"
                onClick={(e) => setHistoryAnchorEl(e.currentTarget)}
                title="クエリ履歴"
              >
                <HistoryIcon />
              </IconButton>
              <Menu
                anchorEl={historyAnchorEl}
                open={Boolean(historyAnchorEl)}
                onClose={() => setHistoryAnchorEl(null)}
              >
                {queryHistory.length === 0 ? (
                  <MenuItem disabled>履歴がありません</MenuItem>
                ) : (
                  queryHistory.slice(0, 10).map((query, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => handleSelectHistory(query)}
                      sx={{ maxWidth: 400 }}
                    >
                      <Typography variant="body2" noWrap>
                        {query.substring(0, 50)}
                        {query.length > 50 ? '...' : ''}
                      </Typography>
                    </MenuItem>
                  ))
                )}
              </Menu>
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={8}
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            placeholder="SELECT * FROM database.table LIMIT 100"
            variant="outlined"
            sx={{
              fontFamily: 'monospace',
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
              },
            }}
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={executing ? undefined : <RunIcon />}
              onClick={handleExecuteQuery}
              disabled={executing || !currentQuery.trim()}
            >
              {executing ? '実行中...' : 'クエリを実行'}
            </Button>
            {queryResult && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                エクスポート
              </Button>
            )}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => handleExport('csv')}>CSV形式</MenuItem>
              <MenuItem onClick={() => handleExport('json')}>JSON形式</MenuItem>
            </Menu>
          </Box>
        </CardContent>
      </Card>

      {/* 実行中表示 */}
      {executing && <Loading message="クエリを実行中..." />}

      {/* クエリ結果 */}
      {queryResult && !executing && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">クエリ結果</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${queryResult.row_count} 行`} size="small" />
                <Chip
                  label={`実行時間: ${(queryResult.execution_time / 1000).toFixed(2)}秒`}
                  size="small"
                  color="primary"
                />
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {queryResult.columns.map((column) => (
                      <TableCell key={column.name}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {column.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {column.type}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryResult.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} hover>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Typography variant="body2">
                            {cell !== null && cell !== undefined ? String(cell) : 'NULL'}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {queryResult.truncated && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  結果が切り詰められています。完全な結果を取得するには、LIMIT句を使用してください。
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
