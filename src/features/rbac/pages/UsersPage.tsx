import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppPagination } from '@/components/common/AppPagination';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import type { AdminUser, DataScopeEntry } from '@/features/auth/types/auth.type';
import { can, isGlobalScope } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { useCompaniesQuery, useDivisionsQuery } from '@/features/organization/hooks/useOrganizationQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
} from '../components/RbacShared';
import {
  useRolesQuery,
  useSyncUserOrganizationScopesMutation,
  useSyncUserRolesMutation,
  useUsersQuery,
} from '../hooks/useRbacQueries';

type ScopeDraft = {
  company_id: number | '';
  division_id: number | '';
};

function formatScopeSummary(user: AdminUser): string {
  if (isGlobalScope(user)) {
    return 'All companies';
  }

  const scopes = user.data_scope?.scopes ?? [];
  if (scopes.length === 0) {
    return 'No scope assigned';
  }

  return scopes
    .map((scope: DataScopeEntry) => {
      const company = scope.company?.name ?? `Company #${scope.company_id}`;
      if (!scope.division_id) {
        return `${company} (all divisions)`;
      }
      const division = scope.division?.name ?? `Division #${scope.division_id}`;
      return `${company} / ${division}`;
    })
    .join('; ');
}

export function UsersPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const canView = can(session?.user, 'users.view');
  const canAssign = can(session?.user, 'users.assign_role');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const usersQuery = useUsersQuery(page, perPage, canView);
  const rolesQuery = useRolesQuery(can(session?.user, 'roles.view') || canAssign);
  const companiesQuery = useCompaniesQuery(canAssign);
  const divisionsQuery = useDivisionsQuery(undefined, canAssign);
  const syncRoles = useSyncUserRolesMutation();
  const syncScopes = useSyncUserOrganizationScopesMutation();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [scopeUser, setScopeUser] = useState<AdminUser | null>(null);
  const [scopeDrafts, setScopeDrafts] = useState<ScopeDraft[]>([]);
  const [scopeError, setScopeError] = useState<string | null>(null);

  const paginationMeta = usersQuery.data?.meta;
  const lastPage = typeof paginationMeta?.last_page === 'number' ? paginationMeta.last_page : 1;

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Users" description="Assign Admin roles and data scopes." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const openAssign = (user: AdminUser) => {
    setSelectedUser(user);
    setRoleIds((user.roles ?? []).map((role) => role.id));
    setAssignError(null);
  };

  const openScope = (user: AdminUser) => {
    setScopeUser(user);
    setScopeError(null);
    const existing = user.data_scope?.scopes ?? [];
    setScopeDrafts(
      existing.length
        ? existing.map((scope) => ({
            company_id: scope.company_id,
            division_id: scope.division_id ?? '',
          }))
        : [{ company_id: '', division_id: '' }],
    );
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

  const handleSyncScopes = async () => {
    if (!scopeUser) {
      return;
    }

    const scopes = scopeDrafts
      .filter((draft) => draft.company_id !== '')
      .map((draft) => ({
        company_id: Number(draft.company_id),
        division_id: draft.division_id === '' ? null : Number(draft.division_id),
      }));

    setScopeError(null);
    try {
      await syncScopes.mutateAsync({
        userId: scopeUser.id,
        payload: { scopes },
      });
      setScopeUser(null);
      toast.success('User data scope updated.');
    } catch (error) {
      setScopeError(getApiErrorMessage(error));
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
      key: 'scope',
      header: 'Data scope',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {formatScopeSummary(row)}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="users.assign_role">
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => openAssign(row)}>
              Roles
            </Button>
            <Button size="small" onClick={() => openScope(row)}>
              Scope
            </Button>
          </Stack>
        </PermissionGate>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Users"
        description="Assign Admin roles and company/division data scopes."
      />

      {usersQuery.isError ? <RbacQueryError error={usersQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={usersQuery.data?.users ?? []}
        getRowKey={(row) => row.id}
        isLoading={usersQuery.isLoading}
        footer={
          paginationMeta && paginationMeta.total > 0 ? (
            <AppPagination
              page={page}
              lastPage={lastPage}
              perPage={perPage}
              total={paginationMeta.total}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
            />
          ) : undefined
        }
        emptyState={<EmptyState title="No users" description="No users found." />}
      />

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

      <AppModal
        open={scopeUser !== null}
        onClose={() => setScopeUser(null)}
        title="Assign data scope"
        description={
          scopeUser
            ? `${scopeUser.name} — leave empty for no access. Global users ignore this list.`
            : undefined
        }
        actions={
          <>
            <Button onClick={() => setScopeUser(null)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={syncScopes.isPending}
              onClick={() => void handleSyncScopes()}
            >
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {scopeError ? (
            <Typography color="error" variant="body2">
              {scopeError}
            </Typography>
          ) : null}
          {scopeUser && isGlobalScope(scopeUser) ? (
            <Typography variant="body2" color="text.secondary">
              This user has global access (view_all permissions). Scope rows are optional and
              unused while those permissions remain.
            </Typography>
          ) : null}

          {scopeDrafts.map((draft, index) => {
            const divisionsForCompany = (divisionsQuery.data ?? []).filter(
              (division) => draft.company_id === '' || division.company_id === draft.company_id,
            );

            return (
              <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  label="Company"
                  value={draft.company_id}
                  onChange={(event) => {
                    const companyId = event.target.value === '' ? '' : Number(event.target.value);
                    setScopeDrafts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { company_id: companyId, division_id: '' }
                          : item,
                      ),
                    );
                  }}
                  fullWidth
                >
                  <MenuItem value="">Select company</MenuItem>
                  {(companiesQuery.data ?? []).map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Division (optional)"
                  value={draft.division_id}
                  onChange={(event) => {
                    const divisionId = event.target.value === '' ? '' : Number(event.target.value);
                    setScopeDrafts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, division_id: divisionId } : item,
                      ),
                    );
                  }}
                  fullWidth
                  helperText="Empty = all divisions in the company"
                >
                  <MenuItem value="">All divisions</MenuItem>
                  {divisionsForCompany.map((division) => (
                    <MenuItem key={division.id} value={division.id}>
                      {division.name}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  color="error"
                  aria-label="Remove scope row"
                  onClick={() =>
                    setScopeDrafts((current) =>
                      current.length === 1
                        ? [{ company_id: '', division_id: '' }]
                        : current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <DeleteRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            );
          })}

          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() =>
              setScopeDrafts((current) => [...current, { company_id: '', division_id: '' }])
            }
          >
            Add company scope
          </Button>
        </Stack>
      </AppModal>
    </Stack>
  );
}
