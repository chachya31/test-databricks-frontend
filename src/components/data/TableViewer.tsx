import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { useDataStore } from '@/stores/dataStore';
import { Loading } from '@/components/common/Loading';
import { useNotification } from '@/components/common/Notification';
import type { Table as TableType } from '@/types/databricks.types';

interface TableViewerProps {
  database: string;
  table: TableType;
}

export const TableViewer: React.FC<TableViewerProps> = ({ database, table }) => {
  const { selectedTable, queryResult, fetchTable, fetchTableSample, loading } = useDataStore();
  const { showError } = useNotification();

  useEffect(() => {
    fetchTable(database, table.name);
  }, [database, table.name, fetchTable]);

  const handleViewSample = async () => {
    try {
      await fetchTableSample(database, table.name, 100);
    } catch (error) {
      showError(`サンプルデータの取得に失敗しました: ${error}`);
    }
  };

  const tableDetail = selectedTable || table;

  if (loading && !selectedTable) {
    return <Loading message="テーブル情報を読み込み中..." />;
  }

  return (
    <Box>
      {/* テーブル基本情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">{tableDetail.name}</Typography>
            <Chip label={tableDetail.table_type} size="small" />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            データベース: {tableDetail.database}
          </Typography>
          {tableDetail.owner && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              所有者: {tableDetail.owner}
            </Typography>
          )}
          {tableDetail.comment && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              説明: {tableDetail.comment}
            </Typography>
          )}

          <Button
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={handleViewSample}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            サンプルデータを表示
          </Button>
        </CardContent>
      </Card>

      {/* スキーマ情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            スキーマ
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>カラム名</TableCell>
                  <TableCell>データ型</TableCell>
                  <TableCell>コメント</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableDetail.columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {column.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={column.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {column.comment || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* サンプルデータ */}
      {queryResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              サンプルデータ ({queryResult.row_count} 行)
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {queryResult.columns.map((column) => (
                      <TableCell key={column.name}>
                        <Typography variant="body2" fontWeight="medium">
                          {column.name}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryResult.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
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
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
