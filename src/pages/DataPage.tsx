import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import { Navigation } from '@/components/common/Navigation';
import { DatabaseBrowser } from '@/components/data/DatabaseBrowser';
import { TableViewer } from '@/components/data/TableViewer';
import { QueryEditor } from '@/components/data/QueryEditor';
import type { Table } from '@/types/databricks.types';

const DataPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<{
    database: string;
    table: Table;
  } | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleSelectTable = (database: string, table: Table) => {
    setSelectedTable({ database, table });
    setActiveTab(0); // テーブルビューアータブに切り替え
  };

  return (
    <Box>
      <Navigation />
      <Typography variant="h4" gutterBottom>
        データ管理
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        データベース、テーブルの閲覧とSQLクエリの実行
      </Typography>

      <Grid container spacing={3}>
        {/* データベースブラウザー */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 2, height: '75vh', overflow: 'auto' }}>
            <DatabaseBrowser onSelectTable={handleSelectTable} />
          </Paper>
        </Grid>

        {/* メインコンテンツ */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Paper sx={{ height: '75vh', overflow: 'auto' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="テーブルビューアー" />
              <Tab label="SQLクエリエディター" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <>
                  {selectedTable ? (
                    <TableViewer
                      database={selectedTable.database}
                      table={selectedTable.table}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        左側からテーブルを選択してください
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {activeTab === 1 && <QueryEditor />}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataPage;
