import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
}

export const Loading: React.FC<LoadingProps> = ({
  message = '読み込み中...',
  fullScreen = false,
  size = 40,
}) => {
  if (fullScreen) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={size} />
          {message && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

// インラインローディングスピナー
export const InlineLoading: React.FC<{ size?: number }> = ({ size = 20 }) => {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
      <CircularProgress size={size} />
    </Box>
  );
};
