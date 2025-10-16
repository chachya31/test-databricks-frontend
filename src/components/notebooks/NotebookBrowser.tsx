import React, { useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as NotebookIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNotebooksStore } from '@/stores/notebooksStore';
import { Loading } from '@/components/common/Loading';
import type { NotebookItem } from '@/types/databricks.types';

interface NotebookBrowserProps {
  onSelectNotebook?: (notebook: NotebookItem) => void;
}

export const NotebookBrowser: React.FC<NotebookBrowserProps> = ({ onSelectNotebook }) => {
  const { notebooks, currentPath, fetchNotebooks, setCurrentPath, loading } = useNotebooksStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const handleItemClick = (item: NotebookItem) => {
    if (item.object_type === 'DIRECTORY') {
      setCurrentPath(item.path);
      fetchNotebooks(item.path);
    } else if (item.object_type === 'NOTEBOOK') {
      onSelectNotebook?.(item);
    }
  };

  const handleBackClick = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
    fetchNotebooks(parentPath);
  };

  const getLanguageColor = (language?: string) => {
    switch (language) {
      case 'PYTHON':
        return 'primary';
      case 'SCALA':
        return 'secondary';
      case 'SQL':
        return 'success';
      case 'R':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredNotebooks = searchQuery
    ? notebooks.filter((nb) => nb.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : notebooks;

  if (loading && notebooks.length === 0) {
    return <Loading message="ノートブックを読み込み中..." />;
  }

  return (
    <Box>
      {/* 検索バー */}
      <TextField
        fullWidth
        placeholder="ノートブックを検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* 現在のパス */}
      <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          現在のパス: {currentPath}
        </Typography>
      </Box>

      {/* ノートブック一覧 */}
      <List>
        {/* 親ディレクトリへ戻る */}
        {currentPath !== '/' && (
          <ListItem disablePadding>
            <ListItemButton onClick={handleBackClick}>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary=".." secondary="親ディレクトリ" />
            </ListItemButton>
          </ListItem>
        )}

        {filteredNotebooks.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="ノートブックが見つかりません"
              secondary="別のディレクトリを確認してください"
            />
          </ListItem>
        ) : (
          filteredNotebooks.map((item) => (
            <ListItem
              key={item.path}
              disablePadding
              secondaryAction={
                item.object_type === 'NOTEBOOK' && item.language ? (
                  <Chip
                    label={item.language}
                    size="small"
                    color={getLanguageColor(item.language)}
                  />
                ) : null
              }
            >
              <ListItemButton onClick={() => handleItemClick(item)}>
                <ListItemIcon>
                  {item.object_type === 'DIRECTORY' ? <FolderIcon /> : <NotebookIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={item.path.split('/').pop()}
                  secondary={
                    item.modified_at
                      ? `更新: ${new Date(item.modified_at).toLocaleString('ja-JP')}`
                      : undefined
                  }
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
};
