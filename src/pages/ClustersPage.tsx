import React, { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Navigation } from '@/components/common/Navigation';
import { ClusterList } from '@/components/clusters/ClusterList';
import { ClusterDetail } from '@/components/clusters/ClusterDetail';
import { ClusterControls } from '@/components/clusters/ClusterControls';
import type { Cluster } from '@/types/databricks.types';

const ClustersPage: React.FC = () => {
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  const handleCloseDetail = () => {
    setSelectedCluster(null);
  };

  return (
    <Box>
      <Navigation />
      <Typography variant="h4" gutterBottom>
        クラスター管理
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Databricksクラスターの表示と管理
      </Typography>

      <ClusterList onSelectCluster={setSelectedCluster} />

      {/* クラスター詳細ダイアログ */}
      <Dialog
        open={!!selectedCluster}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">クラスター詳細</Typography>
            <IconButton onClick={handleCloseDetail} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCluster && (
            <>
              <ClusterDetail cluster={selectedCluster} />
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <ClusterControls
                  cluster={selectedCluster}
                  onOperationComplete={handleCloseDetail}
                />
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ClustersPage;
