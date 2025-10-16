import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Storage as StorageIcon } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export const LoginForm: React.FC = () => {
  const [host, setHost] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<{ host?: string; token?: string }>({});

  const { loginWithDatabricks, loading, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState)?.from?.pathname || '/';

  const validateForm = (): boolean => {
    const newErrors: { host?: string; token?: string } = {};

    if (!host.trim()) {
      newErrors.host = 'Databricksホストを入力してください';
    } else {
      try {
        new URL(host);
      } catch {
        newErrors.host = '有効なURLを入力してください（例: https://your-workspace.cloud.databricks.com）';
      }
    }

    if (!token.trim()) {
      newErrors.token = 'Personal Access Tokenを入力してください';
    } else if (token.length < 10) {
      newErrors.token = 'トークンが短すぎます';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await loginWithDatabricks({
      host: host.trim(),
      token: token.trim(),
    });

    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleToggleTokenVisibility = () => {
    setShowToken(!showToken);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <StorageIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Databricks Frontend
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Databricksワークスペースに接続
            </Typography>
          </Box>

          {authError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {authError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Databricks Host"
              placeholder="https://your-workspace.cloud.databricks.com"
              value={host}
              onChange={(e) => {
                setHost(e.target.value);
                if (errors.host) {
                  setErrors({ ...errors, host: undefined });
                }
              }}
              error={!!errors.host}
              helperText={errors.host || 'DatabricksワークスペースのURLを入力してください'}
              margin="normal"
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Personal Access Token"
              type={showToken ? 'text' : 'password'}
              placeholder="dapi..."
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (errors.token) {
                  setErrors({ ...errors, token: undefined });
                }
              }}
              error={!!errors.token}
              helperText={
                errors.token ||
                'DatabricksのPersonal Access Tokenを入力してください'
              }
              margin="normal"
              required
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle token visibility"
                      onClick={handleToggleTokenVisibility}
                      edge="end"
                    >
                      {showToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Personal Access Tokenの取得方法:</strong>
              <br />
              1. Databricksワークスペースにログイン
              <br />
              2. 右上のユーザーアイコン → Settings
              <br />
              3. Developer → Access tokens → Generate new token
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
