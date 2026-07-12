import { Box, CircularProgress, Stack, Typography } from '@mui/material';

export type AppLoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

export function AppLoader({ label = 'Loading...', fullScreen = false }: AppLoaderProps) {
  return (
    <Box
      className={
        fullScreen
          ? 'grid min-h-svh place-items-center bg-surface-background px-4'
          : 'grid min-h-48 place-items-center px-4 py-8'
      }
    >
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Box>
  );
}
