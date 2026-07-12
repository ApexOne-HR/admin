import { Box, CircularProgress, Stack, Typography } from '@mui/material';

type SessionLoadingScreenProps = {
  label?: string;
};

export function SessionLoadingScreen({ label = 'Checking admin session...' }: SessionLoadingScreenProps) {
  return (
    <Box className="grid min-h-svh place-items-center bg-surface-background">
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <CircularProgress />
        <Typography color="text.secondary">{label}</Typography>
      </Stack>
    </Box>
  );
}
