import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, status } = useAdminSession();

  if (status === 'loading') {
    return (
      <Box className="grid min-h-svh place-items-center bg-surface-background">
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress />
          <Typography color="text.secondary">Checking admin session...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
