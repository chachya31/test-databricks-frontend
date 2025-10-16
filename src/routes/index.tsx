import React from 'react';
import { Navigate } from 'react-router-dom';

// Lazy load pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const ClustersPage = React.lazy(() => import('@/pages/ClustersPage'));
const NotebooksPage = React.lazy(() => import('@/pages/NotebooksPage'));
const DataPage = React.lazy(() => import('@/pages/DataPage'));
const JobsPage = React.lazy(() => import('@/pages/JobsPage'));

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  title: string;
  requireAuth: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Dashboard />,
    title: 'ダッシュボード',
    requireAuth: true,
  },
  {
    path: '/clusters',
    element: <ClustersPage />,
    title: 'クラスター管理',
    requireAuth: true,
  },
  {
    path: '/notebooks',
    element: <NotebooksPage />,
    title: 'ノートブック管理',
    requireAuth: true,
  },
  {
    path: '/data',
    element: <DataPage />,
    title: 'データ管理',
    requireAuth: true,
  },
  {
    path: '/jobs',
    element: <JobsPage />,
    title: 'ジョブ管理',
    requireAuth: true,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
    title: 'Not Found',
    requireAuth: false,
  },
];
