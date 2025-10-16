import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface NavigationProps {
  items?: BreadcrumbItem[];
}

export const Navigation: React.FC<NavigationProps> = ({ items }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // itemsが指定されていない場合は、パスから自動生成
  const breadcrumbs = items || generateBreadcrumbsFromPath(location.pathname);

  const handleClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return isLast ? (
          <Typography key={index} color="text.primary">
            {item.label}
          </Typography>
        ) : (
          <Link
            key={index}
            underline="hover"
            color="inherit"
            onClick={() => handleClick(item.path)}
            sx={{ cursor: 'pointer' }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

// パスからブレッドクラムを生成
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const pathMap: Record<string, string> = {
    '': 'ホーム',
    clusters: 'クラスター',
    notebooks: 'ノートブック',
    data: 'データ',
    jobs: 'ジョブ',
  };

  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'ホーム', path: '/' }];

  let currentPath = '';
  paths.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = pathMap[segment] || segment;
    breadcrumbs.push({ label, path: currentPath });
  });

  return breadcrumbs;
}
