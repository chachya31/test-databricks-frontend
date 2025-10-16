import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { PlayArrow as RunIcon } from '@mui/icons-material';
import { useJobsStore } from '@/stores/jobsStore';
import { useNotification } from '@/components/common/Notification';
import type { Job } from '@/types/databricks.types';

interface JobRunnerProps {
  job: Job;
  onRunComplete?: () => void;
}

export const JobRunner: React.FC<JobRunnerProps> = ({ job, onRunComplete }) => {
  const { runJob, executing } = useJobsStore();
  const { showSuccess, showError } = useNotification();
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [parameters, setParameters] = useState<Record<string, string>>({});

  const handleOpenConfirm = () => {
    setConfirmDialog(true);
  };

  const handleCloseConfirm = () => {
    setConfirmDialog(false);
    setParameters({});
  };

  const handleRunJob = async () => {
    try {
      await runJob(job.job_id, Object.keys(parameters).length > 0 ? parameters : undefined);
      showSuccess(`ジョブ "${job.settings.name}" を実行しました`);
      onRunComplete?.();
      handleCloseConfirm();
    } catch (error) {
      showError(`ジョブの実行に失敗しました: ${error}`);
    }
  };

  const handleParameterChange = (key: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        startIcon={executing ? <CircularProgress size={20} /> : <RunIcon />}
        onClick={handleOpenConfirm}
        disabled={executing}
      >
        ジョブを実行
      </Button>

      {/* 実行確認ダイアログ */}
      <Dialog open={confirmDialog} onClose={handleCloseConfirm} maxWidth="sm" fullWidth>
        <DialogTitle>ジョブの実行</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ジョブ "{job.settings.name}" を実行しますか？
          </DialogContentText>

          {/* パラメータ入力（オプション） */}
          <Box sx={{ mt: 3 }}>
            <DialogContentText variant="body2" gutterBottom>
              パラメータ（オプション）
            </DialogContentText>
            <TextField
              fullWidth
              label="パラメータキー"
              placeholder="例: date"
              size="small"
              sx={{ mb: 2 }}
              onChange={(e) => {
                const key = e.target.value;
                if (key) {
                  handleParameterChange(key, parameters[key] || '');
                }
              }}
            />
            <TextField
              fullWidth
              label="パラメータ値"
              placeholder="例: 2024-01-01"
              size="small"
              onChange={(e) => {
                const keys = Object.keys(parameters);
                if (keys.length > 0) {
                  handleParameterChange(keys[0], e.target.value);
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} disabled={executing}>
            キャンセル
          </Button>
          <Button
            onClick={handleRunJob}
            variant="contained"
            disabled={executing}
            startIcon={executing ? <CircularProgress size={20} /> : <RunIcon />}
          >
            {executing ? '実行中...' : '実行'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
