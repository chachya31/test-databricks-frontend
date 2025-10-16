import React, { useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useClustersStore, selectFilteredClusters } from '@/stores/clustersStore';
import { Loading } from '@/components/common/Loading';
import { useNotification } from '@/components/common/Notification';
import type { Cluster } from '@/types/databricks.types';

interface ClusterListProps {
  onSelectCluster?: (cluster: Cluster) => void;
}

export const ClusterList: React.FC<ClusterListProps> = ({ onSelectCluster }) => {
  const {
    fetchClusters,
    startCluster,
    stopCluster,
    loading,
    error,
    setSearchQuery,
    setStatusFilter,
    searchQuery,
    statusFilter,
  } = useClustersStore();

  const clusters = useClustersStore(selectFilteredClusters);
  const { showSuccess, showError } = useNotification();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearch(value);
    setSearchQuery(value);
  };

  const handleStatusFilterChange = (event: any) => {
    const value = event.target.value;
    setStatusFilter(value === 'ALL' ? [] : [value]);
  };

  const handleStartCluster = async (clusterId: string, clusterName: string) => {
    try {
      await startCluster(clusterId);
      showSuccess(`クラスター "${clusterName}" を開始しました`);
    } catch (err) {
      showError(`クラスターの開始に失敗しました: ${err}`);
    }
  };

  const handleStopCluster = async (clusterId: string, clusterName: string) => {
    try {
      await stopCluster(clusterId);
      showSuccess(`クラスター "${clusterName}" を停止しました`);
    } catch (err) {
      showError(`クラスターの停止に失敗しました: ${err}`);
    }
  };

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

  if (loading && clusters.length === 0) {
    return <Loading message="クラスター一覧を読み込み中..." />;
  }

  return (
    <Box>
      {/* フィルターとアクション */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="クラスターを検索..."
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>ステータス</InputLabel>
          <Select
            value={statusFilter.length > 0 ? statusFilter[0] : 'ALL'}
            onChange={handleStatusFilterChange}
            label="ステータス"
          >
            <MenuItem value="ALL">すべて</MenuItem>
            <MenuItem value="RUNNING">実行中</MenuItem>
            <MenuItem value="TERMINATED">停止</MenuItem>
            <MenuItem value="PENDING">起動中</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchClusters()}
          disabled={loading}
        >
          更新
        </Button>
      </Box>

      {/* クラスター一覧 */}
      {clusters.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              クラスターが見つかりません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {clusters.map((cluster) => (
            <Grid key={cluster.cluster_id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {cluster.cluster_name}
                    </Typography>
                    <Chip
                      label={getStateLabel(cluster.state)}
                      color={getStateColor(cluster.state)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ID: {cluster.cluster_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ノードタイプ: {cluster.node_type_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ワーカー数: {cluster.num_workers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    作成者: {cluster.creator_user_name}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    {cluster.state === 'TERMINATED' && (
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleStartCluster(cluster.cluster_id, cluster.cluster_name)}
                        title="開始"
                      >
                        <StartIcon />
                      </IconButton>
                    )}
                    {cluster.state === 'RUNNING' && (
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleStopCluster(cluster.cluster_id, cluster.cluster_name)}
                        title="停止"
                      >
                        <StopIcon />
                      </IconButton>
                    )}
                    <IconButton
                      color="info"
                      size="small"
                      onClick={() => onSelectCluster?.(cluster)}
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
