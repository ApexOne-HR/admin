import { Card, CardContent, Stack, Typography } from '@mui/material';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

type ComingSoonPageProps = {
  title: string;
  description: string;
};

/** Minimal placeholder until a real feature page exists. */
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <Stack spacing={2.5}>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="py-10 text-center">
          <Typography variant="h3" sx={{ mb: 1 }}>
            Coming soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This module is not implemented yet.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
