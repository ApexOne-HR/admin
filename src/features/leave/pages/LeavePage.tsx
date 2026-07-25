import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import {
  clearFieldError,
  hasFieldErrors,
  validateRequiredFields,
  type FieldErrors,
} from '@/components/common/form';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { useCompaniesQuery } from '@/features/organization/hooks/useOrganizationQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
  RoleActiveChip,
} from '@/features/rbac/components/RbacShared';
import {
  useCreateLeavePackageMutation,
  useCreateLeaveTypeMutation,
  useDeleteLeavePackageMutation,
  useDeleteLeaveTypeMutation,
  useLeavePackagesQuery,
  useLeaveTypesQuery,
  useUpdateLeavePackageMutation,
  useUpdateLeaveTypeMutation,
} from '../hooks/useLeaveQueries';
import type { LeavePackage, LeaveType } from '../types/leave.type';

type LeaveTab = 'types' | 'packages';

type ItemDraft = {
  leave_type_id: number | '';
  days_allowed: string;
};

type FormState = {
  company_id: number | '';
  name: string;
  code: string;
  description: string;
  is_paid: boolean;
  is_active: boolean;
  items: ItemDraft[];
};

const emptyForm: FormState = {
  company_id: '',
  name: '',
  code: '',
  description: '',
  is_paid: true,
  is_active: true,
  items: [],
};

export function LeavePage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'organizations.view');
  const canManage = can(session?.user, 'organizations.manage');

  const [tab, setTab] = useState<LeaveTab>('types');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const companiesQuery = useCompaniesQuery(canView);
  const typesQuery = useLeaveTypesQuery(undefined, canView);
  const packagesQuery = useLeavePackagesQuery(undefined, canView);
  const formTypesQuery = useLeaveTypesQuery(
    typeof form.company_id === 'number' ? form.company_id : undefined,
    formOpen && tab === 'packages' && typeof form.company_id === 'number',
  );

  const createType = useCreateLeaveTypeMutation();
  const updateType = useUpdateLeaveTypeMutation();
  const deleteType = useDeleteLeaveTypeMutation();
  const createPackage = useCreateLeavePackageMutation();
  const updatePackage = useUpdateLeavePackageMutation();
  const deletePackage = useDeleteLeavePackageMutation();

  const isSaving =
    createType.isPending ||
    updateType.isPending ||
    createPackage.isPending ||
    updatePackage.isPending;

  const tabTitle = useMemo(
    () => (tab === 'types' ? 'Leave type' : 'Leave package'),
    [tab],
  );

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Leave" description="Leave types and packages." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const companies = companiesQuery.data ?? [];
  const leaveTypes = typesQuery.data ?? [];
  const packages = packagesQuery.data ?? [];
  const companyTypes = formTypesQuery.data ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditType = (row: LeaveType) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      company_id: row.company_id,
      name: row.name,
      code: row.code,
      is_paid: row.is_paid,
      is_active: row.is_active,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditPackage = (row: LeavePackage) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      company_id: row.company_id,
      name: row.name,
      description: row.description ?? '',
      is_active: row.is_active,
      items: (row.items ?? []).map((item) => ({
        leave_type_id: item.leave_type_id,
        days_allowed: String(item.days_allowed),
      })),
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    const required = validateRequiredFields(
      {
        company_id: form.company_id,
        name: form.name,
        code: form.code,
      },
      [
        { key: 'company_id', label: 'Company' },
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code', when: tab === 'types' },
      ],
    );
    setFieldErrors(required);
    if (hasFieldErrors(required)) {
      return;
    }

    try {
      if (tab === 'types') {
        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          code: form.code.trim(),
          is_paid: form.is_paid,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateType.mutateAsync({ id: editingId, payload });
          toast.success('Leave type updated.');
        } else {
          await createType.mutateAsync(payload);
          toast.success('Leave type created.');
        }
      } else {
        const items = form.items
          .filter((item) => item.leave_type_id !== '' && item.days_allowed.trim() !== '')
          .map((item) => ({
            leave_type_id: Number(item.leave_type_id),
            days_allowed: Number(item.days_allowed),
          }));

        if (items.some((item) => !(item.days_allowed > 0))) {
          setFormError('Each package line needs days allowed greater than 0.');
          return;
        }

        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          description: form.description.trim() || null,
          is_active: form.is_active,
          items,
        };
        if (editingId) {
          await updatePackage.mutateAsync({ id: editingId, payload });
          toast.success('Leave package updated.');
        } else {
          await createPackage.mutateAsync(payload);
          toast.success('Leave package created.');
        }
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: `Delete ${tabTitle.toLowerCase()}?`,
      description: 'Soft-deleted and hidden from lists.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }
    try {
      if (tab === 'types') {
        await deleteType.mutateAsync(id);
      } else {
        await deletePackage.mutateAsync(id);
      }
      toast.success(`${tabTitle} deleted.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const typeColumns: AppTableColumn<LeaveType>[] = [
    {
      key: 'company',
      header: 'Company',
      render: (row) => row.company?.name ?? `Company #${row.company_id}`,
    },
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'code', header: 'Code', render: (row) => row.code },
    {
      key: 'paid',
      header: 'Paid',
      render: (row) => (row.is_paid ? 'Yes' : 'No'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditType(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const packageColumns: AppTableColumn<LeavePackage>[] = [
    {
      key: 'company',
      header: 'Company',
      render: (row) => row.company?.name ?? `Company #${row.company_id}`,
    },
    { key: 'name', header: 'Name', render: (row) => row.name },
    {
      key: 'items',
      header: 'Items',
      render: (row) =>
        (row.items ?? [])
          .map((item) => `${item.leave_type?.code ?? item.leave_type_id}: ${item.days_allowed}d`)
          .join(' · ') || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditPackage(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const activeQuery = tab === 'types' ? typesQuery : packagesQuery;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Leave"
        description="Leave types and packages (e.g. Standard = 10 Annual + 6 Casual)."
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Add {tabTitle}
            </Button>
          ) : null
        }
      />

      <Tabs value={tab} onChange={(_, value: LeaveTab) => setTab(value)}>
        <Tab value="types" label="Leave types" />
        <Tab value="packages" label="Packages" />
      </Tabs>

      {activeQuery.isError ? <RbacQueryError error={activeQuery.error} /> : null}

      {tab === 'types' ? (
        <AppTable
          columns={typeColumns}
          rows={leaveTypes}
          getRowKey={(row) => row.id}
          isLoading={typesQuery.isLoading}
          emptyState={
            <EmptyState title="No leave types" description="Add Annual, Casual, Sick, etc." />
          }
        />
      ) : (
        <AppTable
          columns={packageColumns}
          rows={packages}
          getRowKey={(row) => row.id}
          isLoading={packagesQuery.isLoading}
          emptyState={
            <EmptyState
              title="No leave packages"
              description="Create a package and assign type + days lines."
            />
          }
        />
      )}

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="lg"
        title={editingId ? `Edit ${tabTitle}` : `Add ${tabTitle}`}
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={isSaving} onClick={() => void handleSave()}>
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {formError ? (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          ) : null}

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <TextField
              select
              label="Company"
              value={form.company_id}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'company_id'));
                setForm((current) => ({
                  ...current,
                  company_id: event.target.value === '' ? '' : Number(event.target.value),
                  items: [],
                }));
              }}
              required
              error={Boolean(fieldErrors.company_id)}
              helperText={fieldErrors.company_id}
              fullWidth
            >
              <MenuItem value="">Select company</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'name'));
                setForm((current) => ({ ...current, name: event.target.value }));
              }}
              required
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              fullWidth
            />

            {tab === 'types' ? (
              <>
                <TextField
                  label="Code"
                  value={form.code}
                  onChange={(event) => {
                    setFieldErrors((current) => clearFieldError(current, 'code'));
                    setForm((current) => ({ ...current, code: event.target.value }));
                  }}
                  required
                  error={Boolean(fieldErrors.code)}
                  helperText={fieldErrors.code}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_paid}
                      onChange={(_, checked) =>
                        setForm((current) => ({ ...current, is_paid: checked }))
                      }
                    />
                  }
                  label="Paid leave"
                />
              </>
            ) : (
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                fullWidth
                sx={{ gridColumn: { md: '1 / -1' } }}
              />
            )}
          </Box>

          {tab === 'packages' ? (
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography variant="subtitle2">Package items</Typography>
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  disabled={!form.company_id}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      items: [...current.items, { leave_type_id: '', days_allowed: '' }],
                    }))
                  }
                >
                  Add line
                </Button>
              </Stack>

              {form.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Add leave type lines (e.g. Annual 10 + Casual 6).
                </Typography>
              ) : null}

              {form.items.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto' },
                    alignItems: 'center',
                  }}
                >
                  <TextField
                    select
                    label="Leave type"
                    value={item.leave_type_id}
                    onChange={(event) => {
                      const value = event.target.value === '' ? '' : Number(event.target.value);
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((row, i) =>
                          i === index ? { ...row, leave_type_id: value } : row,
                        ),
                      }));
                    }}
                    fullWidth
                  >
                    <MenuItem value="">Select type</MenuItem>
                    {companyTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Days allowed"
                    type="number"
                    slotProps={{ htmlInput: { min: 0.5, step: 0.5 } }}
                    value={item.days_allowed}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((row, i) =>
                          i === index ? { ...row, days_allowed: value } : row,
                        ),
                      }));
                    }}
                    fullWidth
                  />
                  <IconButton
                    color="error"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        items: current.items.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          ) : null}

          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(_, checked) => setForm((current) => ({ ...current, is_active: checked }))}
              />
            }
            label="Active"
          />
        </Stack>
      </AppModal>
    </Stack>
  );
}
