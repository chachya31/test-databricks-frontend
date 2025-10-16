import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
} from '@mui/icons-material';
import { useClustersStore } from '@/stores/clustersStore';
import { useNotification } from '@/components/common/Notification';
import type { Cluster } from '@/types/databricks.types';

interface ClusterControlsProps {
  cluster: Cluster;
  onOperationComplete?: () => void;
}

export const ClusterControls: React.FC<ClusterControlsProps> = ({
  cluster,
  onOperationComplete,
}) => {
  const { startCluster, stopCluster, restartCluster, operationInProgress } = useClustersStore();
  const { showSuccess, showError } = useNotification();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'start' | 'stop' | 'restart' | null;
  }>({ open: false, action: null });

  const handleOpenConfirm = (action: 'start' | 'stop' | 'restart') => {
    setConfirmDialog({ open: true, action });
  };

  const handleCloseConfirm = () => {
    setConfirmDialog({ open: false, action: null });
  };

  const handleConfirmAction = async () => {
    const { action } = confirmDialog;
    if (!action) return;

    try {
      switch (action) {
        case 'start':
          await startCluster(cluster.cluster_id);
          showSuccess(`クラスター "${cluster.cluster_name}" を開始しました`);
          break;
        case 'stop':
          await stopCluster(cluster.cluster_id);
          showSuccess(`クラスター "${cluster.cluster_name}" を停止しました`);
          break;
        case 'restart':
          await restartCluster(cluster.cluster_id);
          showSuccess(`クラスター "${cluster.cluster_name}" を再起動しました`);
          break;
      }
      onOperationComplete?.();
    } catch (error) {
      const actionLabel = {
        start: '開始',
        stop: '停止',
        restart: '再起動',
      }[action];
      showError(`クラスターの${actionLabel}に失敗しました: ${error}`);
    } finally {
      handleCloseConfirm();
    }
  };

  const getActionMessage = () => {
    const { action } = confirmDialog;
    if (!action) return '';

    const messages = {
      start: `クラスター "${cluster.cluster_name}" を開始しますか？`,
      stop: `クラスター "${cluster.cluster_name}" を停止しますか？実行中のジョブは中断されます。`,
      restart: `クラスター "${cluster.cluster_name}" を再起動しますか？実行中のジョブは中断されます。`,
    };

    return messages[action];
  };

  const canStart = cluster.state === 'TERMINATED';
  const canStop = cluster.state === 'RUNNING';
  const canRestart = cluster.state === 'RUNNING';

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={operationInProgress ? <CircularProgress size={20} /> : <StartIcon />}
          onClick={() => handleOpenConfirm('start')}
          disabled={!canStart || operationInProgress}
        >
          開始
        </Button>

        <Button
          variant="contained"
          color="error"
          startIcon={operationInProgress ? <CircularProgress size={20} /> : <StopIcon />}
          onClick={() => handleOpenConfirm('stop')}
          disabled={!canStop || operationInProgress}
        >
          停止
        </Button>

        <Button
          variant="outlined"
          startIcon={operationInProgress ? <CircularProgress size={20} /> : <RestartIcon />}
          onClick={() => handleOpenConfirm('restart')}
          disabled={!canRestart || operationInProgress}
        >
          再起動
        </Button>
      </Box>

      {/* 確認ダイアログ */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirm}>
        <DialogTitle>操作の確認</DialogTitle>
        <DialogContent>
          <DialogContentText>{getActionMessage()}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} disabled={operationInProgress}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            disabled={operationInProgress}
            autoFocus
          >
            {operationInProgress ? '実行中...' : '実行'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
