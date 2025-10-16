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
  LinearProgress,
} from '@mui/material';
import { useClustersStore } from '@/stores/clustersStore';
import { Loading } from '@/components/common/Loading';
import type { Cluster } from '@/types/databricks.types';

interface ClusterDetailProps {
  cluster: Cluster;
}

export const ClusterDetail: React.FC<ClusterDetailProps> = ({ cluster }) => {
  const { selectedCluster, fetchCluster, loading } = useClustersStore();

  useEffect(() => {
    fetchCluster(cluster.cluster_id);
  }, [cluster.cluster_id, fetchCluster]);

  const getStateColor = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return 'success';
      case 'TERMINATED':
        return 'default';
      case 'PENDING':
      case 'RESTARTING':
        return 'warning';
      case 'ERROR':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      RUNNING: '実行中',
      TERMINATED: '停止',
      PENDING: '起動中',
      RESTARTING: '再起動中',
      TERMINATING: '停止中',
      ERROR: 'エラー',
    };
    return labels[state] || state;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  if (loading && !selectedCluster) {
    return <Loading message="クラスター詳細を読み込み中..." />;
  }

  const detail = selectedCluster || cluster;

  return (
    <Box>
      {/* 基本情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="div">
              {detail.cluster_name}
            </Typography>
            <Chip
              label={getStateLabel(detail.state)}
              color={getStateColor(detail.state)}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                クラスターID
              </Typography>
              <Typography variant="body1" gutterBottom>
                {detail.cluster_id}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Sparkバージョン
              </Typography>
              <Typography variant="body1" gutterBottom>
                {detail.spark_version}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                ノードタイプ
              </Typography>
              <Typography variant="body1" gutterBottom>
                {detail.node_type_id}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                ワーカー数
              </Typography>
              <Typography variant="body1" gutterBottom>
                {detail.num_workers}
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
            {detail.last_activity_time && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  最終アクティビティ
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatTimestamp(detail.last_activity_time)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* メトリクス */}
      {selectedCluster?.metrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              リソース使用状況
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">CPU使用率</Typography>
                <Typography variant="body2">
                  {selectedCluster.metrics.cpu_usage?.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={selectedCluster.metrics.cpu_usage || 0}
                color={
                  (selectedCluster.metrics.cpu_usage || 0) > 80
                    ? 'error'
                    : (selectedCluster.metrics.cpu_usage || 0) > 60
                    ? 'warning'
                    : 'primary'
                }
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">メモリ使用率</Typography>
                <Typography variant="body2">
                  {selectedCluster.metrics.memory_usage?.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={selectedCluster.metrics.memory_usage || 0}
                color={
                  (selectedCluster.metrics.memory_usage || 0) > 80
                    ? 'error'
                    : (selectedCluster.metrics.memory_usage || 0) > 60
                    ? 'warning'
                    : 'primary'
                }
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">ディスク使用率</Typography>
                <Typography variant="body2">
                  {selectedCluster.metrics.disk_usage?.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={selectedCluster.metrics.disk_usage || 0}
                color={
                  (selectedCluster.metrics.disk_usage || 0) > 80
                    ? 'error'
                    : (selectedCluster.metrics.disk_usage || 0) > 60
                    ? 'warning'
                    : 'primary'
                }
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ノード情報 */}
      {selectedCluster?.driver && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ノード情報
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              ドライバーノード
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ノードID</TableCell>
                    <TableCell>プライベートIP</TableCell>
                    <TableCell>インスタンスID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{selectedCluster.driver.node_id}</TableCell>
                    <TableCell>{selectedCluster.driver.private_ip}</TableCell>
                    <TableCell>{selectedCluster.driver.instance_id}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {selectedCluster.executors && selectedCluster.executors.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  エグゼキューターノード ({selectedCluster.executors.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ノードID</TableCell>
                        <TableCell>プライベートIP</TableCell>
                        <TableCell>インスタンスID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCluster.executors.map((executor) => (
                        <TableRow key={executor.node_id}>
                          <TableCell>{executor.node_id}</TableCell>
                          <TableCell>{executor.private_ip}</TableCell>
                          <TableCell>{executor.instance_id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
