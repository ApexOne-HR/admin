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
  min_service_years: string;
  max_service_years: string;
  days_allowed: string;
  mid_year_mode: '' | 'prorate' | 'schedule';
};

const emptyItem = (): ItemDraft => ({
  leave_type_id: '',
  min_service_years: '0',
  max_service_years: '',
  days_allowed: '',
  mid_year_mode: '',
});

type FormState = {
  company_id: number | '';
  name: string;
  description: string;
  is_paid: boolean;
  is_active: boolean;
  allowed_in_probation: boolean;
  allow_half_day: boolean;
  allowed_gender: '' | 'male' | 'female';
  min_notice_days: string;
  max_late_request_days: string;
  items: ItemDraft[];
};

const emptyForm: FormState = {
  company_id: '',
  name: '',
  description: '',
  is_paid: true,
  is_active: true,
  allowed_in_probation: true,
  allow_half_day: false,
  allowed_gender: '',
  min_notice_days: '0',
  max_late_request_days: '0',
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
        <PageHeader title="Leave structure" description="Leave types and packages." />
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
      is_paid: row.is_paid,
      is_active: row.is_active,
      allowed_in_probation: row.allowed_in_probation,
      allow_half_day: row.allow_half_day,
      allowed_gender: row.allowed_gender ?? '',
      min_notice_days: String(row.min_notice_days ?? 0),
      max_late_request_days: String(row.max_late_request_days ?? 0),
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
        min_service_years: String(item.min_service_years ?? 0),
        max_service_years: item.max_service_years === null || item.max_service_years === undefined
          ? ''
          : String(item.max_service_years),
        days_allowed: String(item.days_allowed),
        mid_year_mode: item.mid_year_mode === 'prorate' || item.mid_year_mode === 'schedule'
          ? item.mid_year_mode
          : '',
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
      },
      [
        { key: 'company_id', label: 'Company' },
        { key: 'name', label: 'Name' },
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
          is_paid: form.is_paid,
          is_active: form.is_active,
          allowed_in_probation: form.allowed_in_probation,
          allow_half_day: form.allow_half_day,
          allowed_gender: form.allowed_gender || null,
          min_notice_days: Number(form.min_notice_days) || 0,
          max_late_request_days: Number(form.max_late_request_days) || 0,
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
            min_service_years: Number(item.min_service_years) || 0,
            max_service_years: item.max_service_years.trim() === '' ? null : Number(item.max_service_years),
            days_allowed: Number(item.days_allowed),
            mid_year_mode: item.mid_year_mode === '' ? null : item.mid_year_mode,
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
    {
      key: 'paid',
      header: 'Paid',
      render: (row) => (row.is_paid ? 'Yes' : 'No'),
    },
    {
      key: 'probation',
      header: 'Probation',
      render: (row) => (row.allowed_in_probation ? 'Allowed' : 'Blocked'),
    },
    {
      key: 'unit',
      header: 'Day unit',
      render: (row) => (row.allow_half_day ? 'Full / Half' : 'Full'),
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
          .map((item) => {
            const typeName = item.leave_type?.name ?? String(item.leave_type_id);
            const max = item.max_service_years === null ? '+' : `–${item.max_service_years}`;
            const mode = item.mid_year_mode === 'prorate'
              ? ' prorate'
              : item.mid_year_mode === 'schedule'
                ? ' schedule'
                : '';
            return `${typeName} ${item.min_service_years}${max}y: ${item.days_allowed}d${mode}`;
          })
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
        title="Leave structure"
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
        maxWidth={tab === 'packages' ? 'xl' : 'md'}
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
                <Typography variant="subtitle2" sx={{ gridColumn: { md: '1 / -1' }, mt: 1 }}>
                  Request rules
                </Typography>
                <TextField
                  select
                  label="Allowed gender"
                  value={form.allowed_gender}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      allowed_gender: event.target.value as '' | 'male' | 'female',
                    }))
                  }
                  fullWidth
                  helperText="All = no gender restriction"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </TextField>
                <TextField
                  label="Min notice days"
                  type="number"
                  value={form.min_notice_days}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, min_notice_days: event.target.value }))
                  }
                  fullWidth
                  helperText="Must request at least N days before leave start. 0 = same-day OK."
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                />
                <TextField
                  label="Late request days"
                  type="number"
                  value={form.max_late_request_days}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, max_late_request_days: event.target.value }))
                  }
                  fullWidth
                  helperText="May request up to N days after leave start. 0 = no backdated requests."
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
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
                      items: [...current.items, emptyItem()],
                    }))
                  }
                >
                  Add line
                </Button>
              </Stack>

              {form.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Add lines per tenure range. The same leave type may appear more than once (e.g. Annual 0–1, 1–3, 3+).
                  Leave max years empty for an open-ended range. Mid-year: empty = no upgrade; Prorate = full next band; Schedule = floored share of the delta for remaining months.
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Leave max years empty for an open-ended range.
                </Typography>
              )}

              {form.items.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: '1fr 1fr',
                      md: 'minmax(0, 2fr) repeat(3, minmax(0, 1fr)) minmax(0, 1.2fr) 48px',
                    },
                    alignItems: 'end',
                  }}
                >
                  <TextField
                    select
                    label="Leave type"
                    size="small"
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
                        {type.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Min years"
                    type="number"
                    size="small"
                    value={item.min_service_years}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((row, i) =>
                          i === index ? { ...row, min_service_years: value } : row,
                        ),
                      }));
                    }}
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  />
                  <TextField
                    label="Max years"
                    type="number"
                    size="small"
                    value={item.max_service_years}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((row, i) =>
                          i === index ? { ...row, max_service_years: value } : row,
                        ),
                      }));
                    }}
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  />
                  <TextField
                    label="Days"
                    type="number"
                    size="small"
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
                    slotProps={{ htmlInput: { min: 0.5, step: 0.5 } }}
                  />
                  <TextField
                    select
                    label="Mid-year"
                    size="small"
                    value={item.mid_year_mode}
                    onChange={(event) => {
                      const value = event.target.value as ItemDraft['mid_year_mode'];
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((row, i) =>
                          i === index ? { ...row, mid_year_mode: value } : row,
                        ),
                      }));
                    }}
                    fullWidth
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="prorate">Prorate</MenuItem>
                    <MenuItem value="schedule">Schedule</MenuItem>
                  </TextField>
                  <IconButton
                    color="error"
                    sx={{ justifySelf: 'center', mb: 0.25 }}
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

          {tab === 'types' ? (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 0.5, md: 3 }}
              sx={{ flexWrap: 'wrap' }}
            >
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
              <FormControlLabel
                control={
                  <Switch
                    checked={form.allowed_in_probation}
                    onChange={(_, checked) =>
                      setForm((current) => ({ ...current, allowed_in_probation: checked }))
                    }
                  />
                }
                label="Allowed in probation"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.allow_half_day}
                    onChange={(_, checked) =>
                      setForm((current) => ({ ...current, allow_half_day: checked }))
                    }
                  />
                }
                label="Allow half day"
              />
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
