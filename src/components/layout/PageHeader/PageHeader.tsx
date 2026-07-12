import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Breadcrumbs, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{
        alignItems: { xs: 'stretch', md: 'flex-start' },
        justifyContent: 'space-between',
      }}
    >
      <Stack spacing={0.75}>
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon fontSize="small" />}
          sx={{
            color: 'text.secondary',
            fontSize: 12,
            '& .MuiBreadcrumbs-separator': { mx: 0.5 },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="primary.main" sx={{ fontSize: 12, fontWeight: 500 }}>
            {title}
          </Typography>
        </Breadcrumbs>
        <Typography variant="h1">{title}</Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
            {description}
          </Typography>
        ) : null}
      </Stack>

      {action ? <div className="shrink-0">{action}</div> : null}
    </Stack>
  );
}
