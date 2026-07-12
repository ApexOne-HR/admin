import { Alert, AlertTitle, Card, CardContent, Stack } from '@mui/material';
import type { ReactNode } from 'react';

export type ErrorStateProps = {
  title?: string;
  message: string;
  action?: ReactNode;
};

export function ErrorState({ action, message, title = 'Something went wrong' }: ErrorStateProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Alert severity="error">
            <AlertTitle>{title}</AlertTitle>
            {message}
          </Alert>
          {action ? <div>{action}</div> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
