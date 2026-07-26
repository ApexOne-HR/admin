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
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
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
  useCreateFiscalYearMutation,
  useDeleteFiscalYearMutation,
  useFiscalYearsQuery,
  useUpdateFiscalYearMutation,
} from '../hooks/useFiscalQueries';
import type { FiscalYear } from '../types/fiscal.type';

type FormState = {
  company_id: number | '';
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  company_id: '',
  name: '',
  start_date: '',
  end_date: '',
  is_active: false,
};

export function FiscalYearsPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'organizations.view');
  const canManage = can(session?.user, 'organizations.manage');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const companiesQuery = useCompaniesQuery(canView);
  const yearsQuery = useFiscalYearsQuery(undefined, canView);
  const createYear = useCreateFiscalYearMutation();
  const updateYear = useUpdateFiscalYearMutation();
  const deleteYear = useDeleteFiscalYearMutation();

  const isSaving = createYear.isPending || updateYear.isPending;

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Fiscal years" description="Company fiscal year calendars." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const companies = companiesQuery.data ?? [];
  const years = yearsQuery.data ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (row: FiscalYear) => {
    setEditingId(row.id);
    setForm({
      company_id: row.company_id,
      name: row.name,
      start_date: row.start_date,
      end_date: row.end_date,
      is_active: row.is_active,
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
        start_date: form.start_date,
        end_date: form.end_date,
      },
      [
        { key: 'company_id', label: 'Company' },
        { key: 'name', label: 'Name' },
        { key: 'start_date', label: 'Start date' },
        { key: 'end_date', label: 'End date' },
      ],
    );
    setFieldErrors(required);
    if (hasFieldErrors(required)) {
      return;
    }

    if (form.end_date <= form.start_date) {
      setFieldErrors((current) => ({
        ...current,
        end_date: 'End date must be after start date.',
      }));
      return;
    }

    const payload = {
      company_id: Number(form.company_id),
      name: form.name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateYear.mutateAsync({ id: editingId, payload });
        toast.success('Fiscal year updated.');
      } else {
        await createYear.mutateAsync(payload);
        toast.success('Fiscal year created.');
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete fiscal year?',
      description: 'Soft-deleted and hidden from lists.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }
    try {
      await deleteYear.mutateAsync(id);
      toast.success('Fiscal year deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: AppTableColumn<FiscalYear>[] = [
    {
      key: 'company',
      header: 'Company',
      render: (row) => row.company?.name ?? `Company #${row.company_id}`,
    },
    { key: 'name', header: 'Name', render: (row) => row.name },
    {
      key: 'range',
      header: 'Period',
      render: (row) => `${row.start_date} → ${row.end_date}`,
    },
    {
      key: 'status',
      header: 'Active',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEdit(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Fiscal years"
        description="One active fiscal year per company. Used later for leave allocations and payroll."
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Add fiscal year
            </Button>
          ) : null
        }
      />

      {yearsQuery.isError ? <RbacQueryError error={yearsQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={years}
        getRowKey={(row) => row.id}
        isLoading={yearsQuery.isLoading}
        emptyState={
          <EmptyState title="No fiscal years" description='Add e.g. "FY 2025-2026" for a company.' />
        }
      />

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        title={editingId ? 'Edit fiscal year' : 'Add fiscal year'}
        description="Activating a year deactivates any other active year for that company."
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
                }));
              }}
              required
              error={Boolean(fieldErrors.company_id)}
              helperText={fieldErrors.company_id}
              fullWidth
              sx={{ gridColumn: { md: '1 / -1' } }}
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
              placeholder="FY 2025-2026"
              required
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              fullWidth
              sx={{ gridColumn: { md: '1 / -1' } }}
            />

            <TextField
              label="Start date"
              type="date"
              value={form.start_date}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'start_date'));
                setForm((current) => ({ ...current, start_date: event.target.value }));
              }}
              required
              error={Boolean(fieldErrors.start_date)}
              helperText={fieldErrors.start_date}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="End date"
              type="date"
              value={form.end_date}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'end_date'));
                setForm((current) => ({ ...current, end_date: event.target.value }));
              }}
              required
              error={Boolean(fieldErrors.end_date)}
              helperText={fieldErrors.end_date}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(_, checked) => setForm((current) => ({ ...current, is_active: checked }))}
              />
            }
            label="Active (only one per company)"
          />
        </Stack>
      </AppModal>
    </Stack>
  );
}
