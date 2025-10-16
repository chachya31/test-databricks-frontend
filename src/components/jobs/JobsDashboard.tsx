import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  PlayArrow as RunIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useJobsStore, selectFilteredJobs } from '@/stores/jobsStore';
import { Loading } from '@/components/common/Loading';
import type { Job } from '@/types/databricks.types';

interface JobsDashboardProps {
  onSelectJob?: (job: Job) => void;
  onRunJob?: (jobId: string) => void;
}

export const JobsDashboard: React.FC<JobsDashboardProps> = ({ onSelectJob, onRunJob }) => {
  const { fetchJobs, fetchActiveRuns, loading, setSearchQuery, searchQuery } = useJobsStore();
  const jobs = useJobsStore(selectFilteredJobs);
  const [localSearch, setLocalSearch] = React.useState(searchQuery);

  useEffect(() => {
    fetchJobs();
    fetchActiveRuns();
  }, [fetchJobs, fetchActiveRuns]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearch(value);
    setSearchQuery(value);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  if (loading && jobs.length === 0) {
    return <Loading message="ジョブ一覧を読み込み中..." />;
  }

  return (
    <Box>
      {/* 検索とアクション */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="ジョブを検索..."
          value={localSearch}
          onChange={handleSearchChange}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchJobs();
            fetchActiveRuns();
          }}
          disabled={loading}
        >
          更新
        </Button>
      </Box>

      {/* ジョブ一覧 */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              ジョブが見つかりません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {jobs.map((job) => (
            <Grid key={job.job_id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {job.settings.name}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ジョブID: {job.job_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    作成日時: {formatTimestamp(job.created_time)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    作成者: {job.creator_user_name}
                  </Typography>

                  {job.settings.schedule && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`スケジュール: ${job.settings.schedule.quartz_cron_expression}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => onRunJob?.(job.job_id)}
                      title="実行"
                    >
                      <RunIcon />
                    </IconButton>
                    <IconButton
                      color="info"
                      size="small"
                      onClick={() => onSelectJob?.(job)}
                      title="詳細"
                    >
                      <InfoIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
