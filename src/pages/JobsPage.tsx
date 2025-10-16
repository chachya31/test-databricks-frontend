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
import { JobsDashboard } from '@/components/jobs/JobsDashboard';
import { JobDetail } from '@/components/jobs/JobDetail';
import { JobRunner } from '@/components/jobs/JobRunner';
import { useJobsStore } from '@/stores/jobsStore';
import { useNotification } from '@/components/common/Notification';
import type { Job } from '@/types/databricks.types';

const JobsPage: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { runJob } = useJobsStore();
  const { showSuccess, showError } = useNotification();

  const handleCloseDetail = () => {
    setSelectedJob(null);
  };

  const handleRunJob = async (jobId: string) => {
    try {
      await runJob(jobId);
      showSuccess('ジョブを実行しました');
    } catch (error) {
      showError(`ジョブの実行に失敗しました: ${error}`);
    }
  };

  return (
    <Box>
      <Navigation />
      <Typography variant="h4" gutterBottom>
        ジョブ管理
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Databricksジョブの表示と実行管理
      </Typography>

      <JobsDashboard onSelectJob={setSelectedJob} onRunJob={handleRunJob} />

      {/* ジョブ詳細ダイアログ */}
      <Dialog open={!!selectedJob} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">ジョブ詳細</Typography>
            <IconButton onClick={handleCloseDetail} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <>
              <JobDetail job={selectedJob} />
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <JobRunner job={selectedJob} onRunComplete={handleCloseDetail} />
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default JobsPage;
