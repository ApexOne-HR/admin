import { Navigate } from 'react-router-dom';
import { SessionLoadingScreen } from '@/components/common/SessionLoadingScreen';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

export function LoginRoute() {
  const { isAuthenticated, status } = useAdminSession();

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}
