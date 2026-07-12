import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import type { AdminUser } from '@/features/auth/types/auth.type';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
} from '../components/RbacShared';
import {
  useRolesQuery,
  useSyncUserRolesMutation,
  useUsersQuery,
} from '../hooks/useRbacQueries';

export function UsersPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const canView = can(session?.user, 'users.view');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const usersQuery = useUsersQuery(page, perPage, canView);
  const rolesQuery = useRolesQuery(can(session?.user, 'roles.view'));
  const syncRoles = useSyncUserRolesMutation();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [assignError, setAssignError] = useState<string | null>(null);

  const lastPage = useMemo(() => {
    const meta = usersQuery.data?.meta;
    return typeof meta?.last_page === 'number' ? meta.last_page : 1;
  }, [usersQuery.data?.meta]);

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Users" description="Assign Admin roles to users." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const openAssign = (user: AdminUser) => {
    setSelectedUser(user);
    setRoleIds((user.roles ?? []).map((role) => role.id));
    setAssignError(null);
  };

  const toggleRole = (roleId: number) => {
    setRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  };

  const handleSync = async () => {
    if (!selectedUser) {
      return;
    }

    setAssignError(null);
    try {
      await syncRoles.mutateAsync({
        userId: selectedUser.id,
        payload: { role_ids: roleIds },
      });
      setSelectedUser(null);
      toast.success('User roles updated.');
    } catch (error) {
      setAssignError(getApiErrorMessage(error));
    }
  };

  const columns: AppTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.email}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {(row.roles ?? []).length
            ? (row.roles ?? []).map((role) => role.name).join(', ')
            : 'No roles'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="users.assign_role">
          <Button size="small" onClick={() => openAssign(row)}>
            Assign roles
          </Button>
        </PermissionGate>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Users" description="Assign Admin roles to users." />

      {usersQuery.isError ? <RbacQueryError error={usersQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={usersQuery.data?.users ?? []}
        getRowKey={(row) => row.id}
        isLoading={usersQuery.isLoading}
        emptyState={<EmptyState title="No users" description="No users found." />}
      />

      {lastPage > 1 ? (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Pagination
            page={page}
            count={lastPage}
            onChange={(_, nextPage) => setPage(nextPage)}
            color="primary"
          />
        </Stack>
      ) : null}

      <AppModal
        open={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title="Assign roles"
        description={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : undefined}
        actions={
          <>
            <Button onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={syncRoles.isPending}
              onClick={() => void handleSync()}
            >
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {assignError ? (
            <Typography color="error" variant="body2">
              {assignError}
            </Typography>
          ) : null}
          <FormGroup>
            {(rolesQuery.data ?? []).map((role) => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    checked={roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                }
                label={`${role.name}${role.is_active ? '' : ' (inactive)'}`}
              />
            ))}
          </FormGroup>
          {(rolesQuery.data ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No roles available.
            </Typography>
          ) : null}
        </Stack>
      </AppModal>
    </Stack>
  );
}
