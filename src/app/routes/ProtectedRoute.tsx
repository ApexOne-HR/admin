import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SessionLoadingScreen } from '@/components/common/SessionLoadingScreen';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, status } = useAdminSession();

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
