import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
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
  useAllowanceDeductionsQuery,
  useCreateAllowanceDeductionMutation,
  useDeleteAllowanceDeductionMutation,
  useUpdateAllowanceDeductionMutation,
} from '../hooks/useCompensationQueries';
import type { AllowanceDeduction, AllowanceDeductionType } from '../types/compensation.type';

type FormState = {
  company_id: number | '';
  name: string;
  code: string;
  type: AllowanceDeductionType;
  is_taxable: boolean;
  is_active: boolean;
};

const emptyForm: FormState = {
  company_id: '',
  name: '',
  code: '',
  type: 'allowance',
  is_taxable: true,
  is_active: true,
};

export function CompensationPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'organizations.view');
  const canManage = can(session?.user, 'organizations.manage');

  const [filterCompanyId, setFilterCompanyId] = useState<number | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const companiesQuery = useCompaniesQuery(canView);
  const catalogQuery = useAllowanceDeductionsQuery(
    { company_id: filterCompanyId === '' ? undefined : Number(filterCompanyId) },
    canView,
  );
  const createItem = useCreateAllowanceDeductionMutation();
  const updateItem = useUpdateAllowanceDeductionMutation();
  const deleteItem = useDeleteAllowanceDeductionMutation();

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Salary Structure"
          description="Company allowances and deductions catalog."
        />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const companies = companiesQuery.data ?? [];
  const rows = catalogQuery.data ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (row: AllowanceDeduction) => {
    setEditingId(row.id);
    setForm({
      company_id: row.company_id,
      name: row.name,
      code: row.code,
      type: row.type,
      is_taxable: row.is_taxable,
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
        code: form.code,
        type: form.type,
      },
      [
        { key: 'company_id', label: 'Company' },
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'type', label: 'Type' },
      ],
    );
    setFieldErrors(required);
    if (hasFieldErrors(required)) {
      return;
    }

    const payload = {
      company_id: Number(form.company_id),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      is_taxable: form.is_taxable,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateItem.mutateAsync({ id: editingId, payload });
        toast.success('Allowance/deduction updated.');
      } else {
        await createItem.mutateAsync(payload);
        toast.success('Allowance/deduction created.');
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (row: AllowanceDeduction) => {
    const ok = await confirm({
      title: 'Delete catalog item',
      description: `Delete ${row.name} (${row.code})?`,
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) return;
    try {
      await deleteItem.mutateAsync(row.id);
      toast.success('Deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: AppTableColumn<AllowanceDeduction>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'code', header: 'Code', render: (row) => row.code },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (row.type === 'allowance' ? 'Allowance' : 'Deduction'),
    },
    {
      key: 'company',
      header: 'Company',
      render: (row) => row.company?.name ?? `Company #${row.company_id}`,
    },
    {
      key: 'taxable',
      header: 'Taxable',
      render: (row) => (row.is_taxable ? 'Yes' : 'No'),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="organizations.manage">
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
            <IconButton size="small" onClick={() => openEdit(row)} aria-label="Edit">
              <EditRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => void handleDelete(row)}
              aria-label="Delete"
            >
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </PermissionGate>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Salary Structure"
        description="Company allowances and deductions used on employee salary structures."
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Add item
            </Button>
          ) : null
        }
      />

      <TextField
        select
        size="small"
        label="Company"
        value={filterCompanyId}
        onChange={(e) => setFilterCompanyId(e.target.value === '' ? '' : Number(e.target.value))}
        sx={{ maxWidth: 260 }}
      >
        <MenuItem value="">All</MenuItem>
        {companies.map((company) => (
          <MenuItem key={company.id} value={company.id}>
            {company.name}
          </MenuItem>
        ))}
      </TextField>

      {catalogQuery.isError ? <RbacQueryError error={catalogQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        isLoading={catalogQuery.isLoading}
        emptyState={
          <EmptyState
            title="No allowances/deductions"
            description="Create Skill, Lunch, Performance, or deduction catalog items."
          />
        }
      />

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit catalog item' : 'Add catalog item'}
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={createItem.isPending || updateItem.isPending}
              onClick={() => void handleSave()}
            >
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
          <TextField
            select
            required
            label="Company"
            value={form.company_id}
            disabled={Boolean(editingId)}
            error={Boolean(fieldErrors.company_id)}
            helperText={fieldErrors.company_id}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                company_id: e.target.value === '' ? '' : Number(e.target.value),
              }));
              setFieldErrors((prev) => clearFieldError(prev, 'company_id'));
            }}
          >
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            label="Name"
            value={form.name}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              setFieldErrors((prev) => clearFieldError(prev, 'name'));
            }}
          />
          <TextField
            required
            label="Code"
            value={form.code}
            error={Boolean(fieldErrors.code)}
            helperText={fieldErrors.code ?? 'Unique per company (e.g. SKILL, LUNCH)'}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
              setFieldErrors((prev) => clearFieldError(prev, 'code'));
            }}
          />
          <TextField
            select
            required
            label="Type"
            value={form.type}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                type: e.target.value as AllowanceDeductionType,
              }))
            }
          >
            <MenuItem value="allowance">Allowance</MenuItem>
            <MenuItem value="deduction">Deduction</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_taxable}
                onChange={(e) => setForm((prev) => ({ ...prev, is_taxable: e.target.checked }))}
              />
            }
            label="Taxable"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
            }
            label="Active"
          />
        </Stack>
      </AppModal>
    </Stack>
  );
}
