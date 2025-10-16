import React, { useEffect } from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent } from '@mui/material';
import {
  Storage as StorageIcon,
  Description as NotebookIcon,
  Work as JobIcon,
  TableChart as DataIcon,
} from '@mui/icons-material';
import { Navigation } from '@/components/common/Navigation';
import { useClustersStore } from '@/stores/clustersStore';
import { useJobsStore } from '@/stores/jobsStore';

const Dashboard: React.FC = () => {
  const { clusters, fetchClusters } = useClustersStore();
  const { jobs, activeRuns, fetchJobs, fetchActiveRuns } = useJobsStore();

  useEffect(() => {
    fetchClusters();
    fetchJobs();
    fetchActiveRuns();
  }, [fetchClusters, fetchJobs, fetchActiveRuns]);

  const runningClusters = clusters.filter((c) => c.state === 'RUNNING').length;

  const stats = [
    {
      title: 'クラスター',
      value: clusters.length,
      subtitle: `${runningClusters}台が実行中`,
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
      color: '#FF3621',
    },
    {
      title: 'ジョブ',
      value: jobs.length,
      subtitle: `${activeRuns.length}件が実行中`,
      icon: <JobIcon sx={{ fontSize: 40 }} />,
      color: '#00A972',
    },
    {
      title: 'ノートブック',
      value: '-',
      subtitle: 'ワークスペース内',
      icon: <NotebookIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'データベース',
      value: '-',
      subtitle: '利用可能',
      icon: <DataIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Navigation />
      <Typography variant="h4" gutterBottom>
        ダッシュボード
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Databricksワークスペースの概要
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            クイックアクセス
          </Typography>
          <Typography variant="body2" color="text.secondary">
            左側のメニューから各機能にアクセスできます。
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
