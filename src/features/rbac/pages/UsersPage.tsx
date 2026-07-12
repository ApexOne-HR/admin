import {
  Button,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import type { AdminUser } from '@/features/auth/types/auth.type';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
  getRbacErrorMessage,
} from '../components/RbacShared';
import {
  useAssignUserRoleMutation,
  useRolesQuery,
  useUsersQuery,
} from '../hooks/useRbacQueries';

export function UsersPage() {
  const { session } = useAdminSession();
  const canView = can(session?.user, 'users.view');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const usersQuery = useUsersQuery(page, perPage, canView);
  const rolesQuery = useRolesQuery(can(session?.user, 'roles.view'));
  const assignRole = useAssignUserRoleMutation();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleId, setRoleId] = useState<number | ''>('');
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
    setRoleId(user.role?.id ?? '');
    setAssignError(null);
  };

  const handleAssign = async () => {
    if (!selectedUser || roleId === '') {
      return;
    }

    setAssignError(null);
    try {
      await assignRole.mutateAsync({
        userId: selectedUser.id,
        payload: { role_id: Number(roleId) },
      });
      setSelectedUser(null);
    } catch (error) {
      setAssignError(getRbacErrorMessage(error));
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
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.role?.name ?? 'No role'}
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
            Assign role
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
        title="Assign role"
        description={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : undefined}
        actions={
          <>
            <Button onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={assignRole.isPending || roleId === ''}
              onClick={() => void handleAssign()}
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
          <TextField
            select
            label="Role"
            value={roleId}
            onChange={(event) => setRoleId(event.target.value === '' ? '' : Number(event.target.value))}
            fullWidth
          >
            {(rolesQuery.data ?? []).map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </AppModal>
    </Stack>
  );
}
