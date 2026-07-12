import { Alert, Chip, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { ErrorState } from '@/components/common/ErrorState';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { ApiError } from '@/infra/http/apiClient';

type PermissionGateProps = {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { session } = useAdminSession();
  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowed = permissions.some((slug) => can(session?.user, slug));

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function getRbacErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.body?.errors) {
      const first = Object.values(error.body.errors)[0];
      if (first?.[0]) {
        return first[0];
      }
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
}

export function RbacQueryError({ error }: { error: unknown }) {
  return <ErrorState title="Unable to load data" message={getRbacErrorMessage(error)} />;
}

export function RoleActiveChip({ active }: { active: boolean }) {
  return (
    <Chip
      size="small"
      label={active ? 'Active' : 'Inactive'}
      color={active ? 'success' : 'default'}
      variant="outlined"
    />
  );
}

export function RoleSummary({
  name,
  slug,
  description,
}: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
        {slug}
        {description ? ` · ${description}` : ''}
      </Typography>
    </Stack>
  );
}

export function ForbiddenAlert() {
  return <Alert severity="warning">You do not have permission to view this page.</Alert>;
}
