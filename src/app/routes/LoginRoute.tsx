import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

export function LoginRoute() {
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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}
