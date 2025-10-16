import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useJobsStore, selectSuccessfulRuns, selectFailedRuns } from '@/stores/jobsStore';
import { Loading } from '@/components/common/Loading';
import type { Job } from '@/types/databricks.types';

interface JobDetailProps {
  job: Job;
}

export const JobDetail: React.FC<JobDetailProps> = ({ job }) => {
  const { selectedJob, jobRuns, fetchJob, fetchJobRuns, loading } = useJobsStore();
  const successfulRuns = useJobsStore(selectSuccessfulRuns);
  const failedRuns = useJobsStore(selectFailedRuns);

  useEffect(() => {
    fetchJob(job.job_id);
    fetchJobRuns(job.job_id);
  }, [job.job_id, fetchJob, fetchJobRuns]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const getRunStateColor = (state: string) => {
    switch (state) {
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'RUNNING':
        return 'primary';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRunStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      SUCCESS: '成功',
      FAILED: '失敗',
      RUNNING: '実行中',
      PENDING: '待機中',
      TERMINATED: '終了',
      CANCELED: 'キャンセル',
    };
    return labels[state] || state;
  };

  if (loading && !selectedJob) {
    return <Loading message="ジョブ詳細を読み込み中..." />;
  }

  const detail = selectedJob || job;

  return (
    <Box>
      {/* 基本情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {detail.settings.name}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                ジョブID
              </Typography>
              <Typography variant="body1" gutterBottom>
                {detail.job_id}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                作成日時
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatTimestamp(detail.created_time)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                作成者
              </Typography>
              <Typography variant="body1" gutterBottom>
                {detail.creator_user_name}
              </Typography>
            </Grid>
            {detail.settings.schedule && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  スケジュール
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {detail.settings.schedule.quartz_cron_expression}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  タイムゾーン: {detail.settings.schedule.timezone_id}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            実行統計
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {jobRuns.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総実行回数
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {successfulRuns.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  成功
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {failedRuns.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  失敗
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.primary">
                  {successfulRuns.length > 0
                    ? `${((successfulRuns.length / jobRuns.length) * 100).toFixed(1)}%`
                    : '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  成功率
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 実行履歴 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            実行履歴
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {jobRuns.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              実行履歴がありません
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>実行ID</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>開始時刻</TableCell>
                    <TableCell>実行時間</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobRuns.slice(0, 10).map((run) => (
                    <TableRow key={run.run_id}>
                      <TableCell>{run.run_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRunStateLabel(
                            run.state.result_state || run.state.life_cycle_state
                          )}
                          size="small"
                          color={getRunStateColor(
                            run.state.result_state || run.state.life_cycle_state
                          )}
                        />
                      </TableCell>
                      <TableCell>{formatTimestamp(run.start_time)}</TableCell>
                      <TableCell>
                        {run.execution_duration
                          ? formatDuration(run.execution_duration)
                          : run.state.life_cycle_state === 'RUNNING'
                          ? '実行中'
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
