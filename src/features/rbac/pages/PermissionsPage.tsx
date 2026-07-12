import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { ForbiddenAlert, RbacQueryError } from '../components/RbacShared';
import { usePermissionsQuery } from '../hooks/useRbacQueries';

export function PermissionsPage() {
  const { session } = useAdminSession();
  const canView = can(session?.user, 'permissions.view');
  const permissionsQuery = usePermissionsQuery(undefined, canView);

  const permissionsByGroup = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof permissionsQuery.data>>();
    (permissionsQuery.data ?? []).forEach((permission) => {
      const current = groups.get(permission.group) ?? [];
      current.push(permission);
      groups.set(permission.group, current);
    });
    return Array.from(groups.entries());
  }, [permissionsQuery.data]);

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Permissions"
          description="Permission catalog used by Admin role assignments."
        />
        <ForbiddenAlert />
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Permissions"
        description="Permission catalog used by Admin role assignments."
      />

      {permissionsQuery.isError ? <RbacQueryError error={permissionsQuery.error} /> : null}

      {permissionsQuery.isLoading ? <AppLoader label="Loading permissions..." /> : null}

      {!permissionsQuery.isLoading && (permissionsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="No permissions" description="Seed the API permissions first." />
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {permissionsByGroup.map(([group, permissions]) => (
          <Card key={group}>
            <CardContent className="p-4">
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="h3" sx={{ fontSize: 16 }}>
                    {group}
                  </Typography>
                  <Chip size="small" label={permissions?.length ?? 0} />
                </Stack>
                <Stack spacing={1}>
                  {(permissions ?? []).map((permission) => (
                    <div key={permission.id} className="rounded-lg border border-surface-border p-3">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {permission.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                        {permission.slug}
                      </Typography>
                    </div>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </div>
    </Stack>
  );
}
