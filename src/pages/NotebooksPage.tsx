import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Navigation } from '@/components/common/Navigation';
import { NotebookBrowser } from '@/components/notebooks/NotebookBrowser';
import { NotebookViewer } from '@/components/notebooks/NotebookViewer';
import { useNotebooksStore } from '@/stores/notebooksStore';
import { useClustersStore } from '@/stores/clustersStore';
import { useNotification } from '@/components/common/Notification';
import type { NotebookItem } from '@/types/databricks.types';

const NotebooksPage: React.FC = () => {
  const [selectedNotebook, setSelectedNotebook] = useState<NotebookItem | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const { executeCell } = useNotebooksStore();
  const { clusters } = useClustersStore();
  const { showSuccess, showError } = useNotification();

  const runningClusters = clusters.filter((c) => c.state === 'RUNNING');

  const handleCloseViewer = () => {
    setSelectedNotebook(null);
  };

  const handleExecuteCell = async (cellIndex: number) => {
    if (!selectedClusterId) {
      showError('クラスターを選択してください');
      return;
    }

    try {
      await executeCell(cellIndex, selectedClusterId);
      showSuccess(`セル ${cellIndex + 1} を実行しました`);
    } catch (error) {
      showError(`セルの実行に失敗しました: ${error}`);
    }
  };

  return (
    <Box>
      <Navigation />
      <Typography variant="h4" gutterBottom>
        ノートブック管理
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Databricksノートブックの閲覧と実行
      </Typography>

      <Grid container spacing={3}>
        {/* ノートブックブラウザー */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              ノートブック
            </Typography>
            <NotebookBrowser onSelectNotebook={setSelectedNotebook} />
          </Paper>
        </Grid>

        {/* プレビュー/説明 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: '70vh', overflow: 'auto' }}>
            {selectedNotebook ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  プレビュー
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ノートブックをダブルクリックして詳細を表示
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">{selectedNotebook.path.split('/').pop()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    パス: {selectedNotebook.path}
                  </Typography>
                  {selectedNotebook.language && (
                    <Typography variant="body2" color="text.secondary">
                      言語: {selectedNotebook.language}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => setSelectedNotebook(selectedNotebook)}
                  >
                    詳細を表示
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  左側からノートブックを選択してください
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ノートブック詳細ダイアログ */}
      <Dialog open={!!selectedNotebook} onClose={handleCloseViewer} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">ノートブック詳細</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {runningClusters.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>クラスター</InputLabel>
                  <Select
                    value={selectedClusterId}
                    onChange={(e) => setSelectedClusterId(e.target.value)}
                    label="クラスター"
                  >
                    <MenuItem value="">
                      <em>選択してください</em>
                    </MenuItem>
                    {runningClusters.map((cluster) => (
                      <MenuItem key={cluster.cluster_id} value={cluster.cluster_id}>
                        {cluster.cluster_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <IconButton onClick={handleCloseViewer} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotebook && (
            <NotebookViewer
              notebook={selectedNotebook}
              clusterId={selectedClusterId}
              onExecuteCell={handleExecuteCell}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default NotebooksPage;
