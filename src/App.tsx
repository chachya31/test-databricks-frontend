import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { NotificationProvider } from '@/components/common/Notification';
import { Chatbot } from '@/components/common/Chatbot';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/common/Layout';
import { LoginForm } from '@/components/auth/LoginForm';

// Lazy load pages for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ClustersPage = React.lazy(() => import('./pages/ClustersPage'));
const NotebooksPage = React.lazy(() => import('./pages/NotebooksPage'));
const DataPage = React.lazy(() => import('./pages/DataPage'));
const JobsPage = React.lazy(() => import('./pages/JobsPage'));

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF3621', // Databricks red
    },
    secondary: {
      main: '#00A972', // Databricks green
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginForm />} />

              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <Layout>
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/clusters" element={<ClustersPage />} />
                          <Route path="/notebooks" element={<NotebooksPage />} />
                          <Route path="/data" element={<DataPage />} />
                          <Route path="/jobs" element={<JobsPage />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </React.Suspense>
                      {/* Chatbot - 全ページで利用可能 */}
                      <Chatbot />
                    </Layout>
                  </AuthGuard>
                }
              />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
