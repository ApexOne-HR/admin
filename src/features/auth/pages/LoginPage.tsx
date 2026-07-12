import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import { useAdminSession } from '../hooks/useAdminSession';

type LoginLocationState = {
  from?: string;
};

export function LoginPage() {
  const { login } = useAdminSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LoginLocationState | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      void navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="main"
      className="grid min-h-svh place-items-center bg-surface-background px-4 py-8 sm:px-6"
    >
      <section className="w-full max-w-md">
        <Stack spacing={2.5} sx={{ mb: 3.5, alignItems: 'center', textAlign: 'center' }}>
          <img src="/logo.png" alt="ApexOne" className="block h-20 w-20 object-contain" />
          <Stack spacing={0.75}>
            <Typography variant="h1">ApexOne HR Admin</Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with your Admin API account.
            </Typography>
          </Stack>
        </Stack>

        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <Stack spacing={3}>
              {error ? <Alert severity="error">{error}</Alert> : null}

              <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
                <TextField
                  label="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </section>
    </Box>
  );
}
