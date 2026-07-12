import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Card>
      <CardContent>
        <Box className="px-4 py-10 text-center sm:px-8">
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl text-brand-700">
              —
            </div>
            <Stack spacing={0.75} sx={{ alignItems: 'center' }}>
              <Typography variant="h3">{title}</Typography>
              {description ? (
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
                  {description}
                </Typography>
              ) : null}
            </Stack>
            {action ? <div className="pt-1">{action}</div> : null}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
