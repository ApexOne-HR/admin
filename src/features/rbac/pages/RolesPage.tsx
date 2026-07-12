import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AppButton } from '@/components/common/AppButton';
import { AppModal } from '@/components/common/AppModal';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import type { Role } from '@/features/auth/types/auth.type';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import {
  ForbiddenAlert,
  PermissionGate,
  RoleActiveChip,
  RoleSummary,
  RbacQueryError,
  getRbacErrorMessage,
} from '../components/RbacShared';
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  usePermissionsQuery,
  useRolesQuery,
  useSyncRolePermissionsMutation,
  useUpdateRoleMutation,
} from '../hooks/useRbacQueries';

type RoleFormState = {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
};

const emptyForm: RoleFormState = {
  name: '',
  slug: '',
  description: '',
  is_active: true,
};

export function RolesPage() {
  const { session } = useAdminSession();
  const canView = can(session?.user, 'roles.view');
  const rolesQuery = useRolesQuery(canView);
  const permissionsQuery = usePermissionsQuery(undefined, can(session?.user, 'permissions.view'));

  const createRole = useCreateRoleMutation();
  const updateRole = useUpdateRoleMutation();
  const deleteRole = useDeleteRoleMutation();
  const syncPermissions = useSyncRolePermissionsMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const permissionsByGroup = useMemo(() => {
    const groups = new Map<string, typeof permissionsQuery.data>();
    (permissionsQuery.data ?? []).forEach((permission) => {
      const current = groups.get(permission.group) ?? [];
      current.push(permission);
      groups.set(permission.group, current);
    });
    return Array.from(groups.entries());
  }, [permissionsQuery.data]);

  useEffect(() => {
    if (permissionsRole) {
      setSelectedPermissionIds((permissionsRole.permissions ?? []).map((item) => item.id));
      setPermissionsError(null);
    }
  }, [permissionsRole]);

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Roles" description="Manage Admin roles and permission sets." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      slug: role.slug,
      description: role.description ?? '',
      is_active: role.is_active,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveRole = async () => {
    setFormError(null);
    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          roleId: editingRole.id,
          payload: {
            name: form.name,
            slug: form.slug || undefined,
            description: form.description || null,
            is_active: form.is_active,
          },
        });
      } else {
        await createRole.mutateAsync({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description || undefined,
          is_active: form.is_active,
        });
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(getRbacErrorMessage(error));
    }
  };

  const handleDelete = async (role: Role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) {
      return;
    }

    try {
      await deleteRole.mutateAsync(role.id);
    } catch (error) {
      window.alert(getRbacErrorMessage(error));
    }
  };

  const handleSyncPermissions = async () => {
    if (!permissionsRole) {
      return;
    }

    setPermissionsError(null);
    try {
      await syncPermissions.mutateAsync({
        roleId: permissionsRole.id,
        payload: { permission_ids: selectedPermissionIds },
      });
      setPermissionsRole(null);
    } catch (error) {
      setPermissionsError(getRbacErrorMessage(error));
    }
  };

  const columns: AppTableColumn<Role>[] = [
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <RoleSummary name={row.name} slug={row.slug} description={row.description} />
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.permissions?.length ?? 0}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <PermissionGate permission="roles.sync_permissions">
            <IconButton
              aria-label="Permissions"
              size="small"
              onClick={() => setPermissionsRole(row)}
            >
              <SecurityRoundedIcon fontSize="small" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="roles.update">
            <IconButton aria-label="Edit" size="small" onClick={() => openEdit(row)}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="roles.delete">
            <IconButton aria-label="Delete" size="small" onClick={() => void handleDelete(row)}>
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </PermissionGate>
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Roles"
        description="Manage Admin roles and permission sets."
        action={
          <PermissionGate permission="roles.create">
            <AppButton startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreate}>
              Create role
            </AppButton>
          </PermissionGate>
        }
      />

      {rolesQuery.isError ? <RbacQueryError error={rolesQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={rolesQuery.data ?? []}
        getRowKey={(row) => row.id}
        isLoading={rolesQuery.isLoading}
        emptyState={<EmptyState title="No roles" description="Create a role to get started." />}
      />

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRole ? 'Edit role' : 'Create role'}
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => void handleSaveRole()}
              disabled={createRole.isPending || updateRole.isPending || !form.name.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            label="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Slug"
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            helperText="Optional. Auto-generated from name if empty."
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            fullWidth
            multiline
            minRows={2}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
              />
            }
            label="Active"
          />
        </Stack>
      </AppModal>

      <AppModal
        open={permissionsRole !== null}
        onClose={() => setPermissionsRole(null)}
        title={`Permissions · ${permissionsRole?.name ?? ''}`}
        description="Checked permissions replace the full set for this role."
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => setPermissionsRole(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => void handleSyncPermissions()}
              disabled={syncPermissions.isPending || !can(session?.user, 'roles.sync_permissions')}
            >
              Save permissions
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {permissionsError ? <Alert severity="error">{permissionsError}</Alert> : null}
          {permissionsQuery.isError ? <RbacQueryError error={permissionsQuery.error} /> : null}
          {permissionsQuery.isLoading ? <Typography>Loading permissions...</Typography> : null}
          {permissionsByGroup.map(([group, permissions]) => (
            <Stack key={group} spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                {group}
              </Typography>
              <Stack>
                {(permissions ?? []).map((permission) => (
                  <FormControlLabel
                    key={permission.id}
                    control={
                      <Checkbox
                        checked={selectedPermissionIds.includes(permission.id)}
                        onChange={(event) => {
                          setSelectedPermissionIds((current) =>
                            event.target.checked
                              ? [...current, permission.id]
                              : current.filter((id) => id !== permission.id),
                          );
                        }}
                      />
                    }
                    label={`${permission.name} (${permission.slug})`}
                  />
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </AppModal>
    </Stack>
  );
}
