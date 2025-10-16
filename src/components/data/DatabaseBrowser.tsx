import React, { useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  TableChart as TableIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useDataStore } from '@/stores/dataStore';
import { Loading } from '@/components/common/Loading';
import type { Database, Table } from '@/types/databricks.types';

interface DatabaseBrowserProps {
  onSelectTable?: (database: string, table: Table) => void;
}

export const DatabaseBrowser: React.FC<DatabaseBrowserProps> = ({ onSelectTable }) => {
  const { databases, tables, selectedDatabase, fetchDatabases, fetchTables, loading } =
    useDataStore();
  const [expandedDatabases, setExpandedDatabases] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const handleDatabaseClick = async (database: Database) => {
    const dbName = database.name;
    const isExpanded = expandedDatabases.has(dbName);

    if (isExpanded) {
      // 折りたたむ
      const newExpanded = new Set(expandedDatabases);
      newExpanded.delete(dbName);
      setExpandedDatabases(newExpanded);
    } else {
      // 展開してテーブルを取得
      const newExpanded = new Set(expandedDatabases);
      newExpanded.add(dbName);
      setExpandedDatabases(newExpanded);
      await fetchTables(dbName);
    }
  };

  const handleTableClick = (database: string, table: Table) => {
    onSelectTable?.(database, table);
  };

  const getTablesForDatabase = (dbName: string) => {
    return tables.filter((t) => t.database === dbName);
  };

  if (loading && databases.length === 0) {
    return <Loading message="データベースを読み込み中..." />;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        データベース
      </Typography>

      <List>
        {databases.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="データベースが見つかりません"
              secondary="データベースを作成してください"
            />
          </ListItem>
        ) : (
          databases.map((database) => {
            const isExpanded = expandedDatabases.has(database.name);
            const dbTables = getTablesForDatabase(database.name);

            return (
              <React.Fragment key={database.name}>
                {/* データベース */}
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDatabaseClick(database)}
                    >
                      {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => handleDatabaseClick(database)}>
                    <ListItemIcon>
                      <DatabaseIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={database.name}
                      secondary={database.description || 'データベース'}
                    />
                  </ListItemButton>
                </ListItem>

                {/* テーブル一覧 */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {loading && selectedDatabase === database.name ? (
                      <ListItem sx={{ pl: 4 }}>
                        <ListItemText primary="読み込み中..." />
                      </ListItem>
                    ) : dbTables.length === 0 ? (
                      <ListItem sx={{ pl: 4 }}>
                        <ListItemText
                          primary="テーブルがありません"
                          secondary="テーブルを作成してください"
                        />
                      </ListItem>
                    ) : (
                      dbTables.map((table) => (
                        <ListItem key={table.name} disablePadding sx={{ pl: 4 }}>
                          <ListItemButton
                            onClick={() => handleTableClick(database.name, table)}
                          >
                            <ListItemIcon>
                              <TableIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={table.name}
                              secondary={`${table.columns.length} カラム`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })
        )}
      </List>
    </Box>
  );
};
