import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ConfirmProvider } from '@/components/common/feedback/ConfirmProvider';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';
import { AdminSessionProvider } from '@/features/auth/hooks/AdminSessionProvider';
import { muiTheme } from '@/theme/muiTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <ToastProvider>
          <ConfirmProvider>
            <AdminSessionProvider>{children}</AdminSessionProvider>
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
