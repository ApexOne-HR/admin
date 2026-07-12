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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
  RoleActiveChip,
} from '@/features/rbac/components/RbacShared';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  clearFieldError,
  hasFieldErrors,
  validateRequiredFields,
  type FieldErrors,
} from '@/components/common/form';
import {
  useCompaniesQuery,
  useCreateCompanyMutation,
  useCreateDepartmentMutation,
  useCreateDesignationMutation,
  useCreateDivisionMutation,
  useDeleteCompanyMutation,
  useDeleteDepartmentMutation,
  useDeleteDesignationMutation,
  useDeleteDivisionMutation,
  useDepartmentsQuery,
  useDesignationsQuery,
  useDivisionsQuery,
  useUpdateCompanyMutation,
  useUpdateDepartmentMutation,
  useUpdateDesignationMutation,
  useUpdateDivisionMutation,
} from '../hooks/useOrganizationQueries';
import type {
  Company,
  Department,
  Designation,
  Division,
} from '../types/organization.type';

type OrgTab = 'companies' | 'divisions' | 'departments' | 'designations';

type UnitForm = {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  currency: string;
  company_id: number | '';
  division_id: number | '';
  department_id: number | '';
};

const emptyForm: UnitForm = {
  name: '',
  code: '',
  description: '',
  is_active: true,
  currency: 'MMK',
  company_id: '',
  division_id: '',
  department_id: '',
};

export function OrganizationPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'organizations.view');
  const canManage = can(session?.user, 'organizations.manage');

  const [tab, setTab] = useState<OrgTab>('companies');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UnitForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const companiesQuery = useCompaniesQuery(canView);
  const divisionsQuery = useDivisionsQuery(undefined, canView);
  const departmentsQuery = useDepartmentsQuery(undefined, canView);
  const designationsQuery = useDesignationsQuery(undefined, canView);

  const createCompany = useCreateCompanyMutation();
  const updateCompany = useUpdateCompanyMutation();
  const deleteCompany = useDeleteCompanyMutation();
  const createDivision = useCreateDivisionMutation();
  const updateDivision = useUpdateDivisionMutation();
  const deleteDivision = useDeleteDivisionMutation();
  const createDepartment = useCreateDepartmentMutation();
  const updateDepartment = useUpdateDepartmentMutation();
  const deleteDepartment = useDeleteDepartmentMutation();
  const createDesignation = useCreateDesignationMutation();
  const updateDesignation = useUpdateDesignationMutation();
  const deleteDesignation = useDeleteDesignationMutation();

  const isSaving =
    createCompany.isPending ||
    updateCompany.isPending ||
    createDivision.isPending ||
    updateDivision.isPending ||
    createDepartment.isPending ||
    updateDepartment.isPending ||
    createDesignation.isPending ||
    updateDesignation.isPending;

  const tabTitle = useMemo(() => {
    const map: Record<OrgTab, string> = {
      companies: 'Company',
      divisions: 'Division',
      departments: 'Department',
      designations: 'Designation',
    };
    return map[tab];
  }, [tab]);

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Organization"
          description="Company → Division → Department → Designation"
        />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditCompany = (row: Company) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      name: row.name,
      code: row.code,
      description: row.description ?? '',
      is_active: row.is_active,
      currency: row.currency,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditDivision = (row: Division) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      name: row.name,
      code: row.code,
      description: row.description ?? '',
      is_active: row.is_active,
      company_id: row.company_id,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditDepartment = (row: Department) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      name: row.name,
      code: row.code,
      description: row.description ?? '',
      is_active: row.is_active,
      division_id: row.division_id,
      company_id: row.division?.company_id ?? '',
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditDesignation = (row: Designation) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      name: row.name,
      code: row.code,
      description: row.description ?? '',
      is_active: row.is_active,
      department_id: row.department_id,
      division_id: row.division?.id ?? row.department?.division_id ?? '',
      company_id: row.company?.id ?? row.department?.division?.company_id ?? '',
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);

    const nextFieldErrors = validateRequiredFields(
      {
        name: form.name,
        code: form.code,
        company_id: form.company_id,
        division_id: form.division_id,
        department_id: form.department_id,
        currency: form.currency,
      },
      [
        { key: 'company_id', label: 'Company', when: tab !== 'companies' },
        {
          key: 'division_id',
          label: 'Division',
          when: tab === 'departments' || tab === 'designations',
        },
        { key: 'department_id', label: 'Department', when: tab === 'designations' },
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'currency', label: 'Currency', when: tab === 'companies' },
      ],
    );

    setFieldErrors(nextFieldErrors);
    if (hasFieldErrors(nextFieldErrors)) {
      return;
    }

    try {
      if (tab === 'companies') {
        const payload = {
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          currency: form.currency.trim() || 'MMK',
          is_active: form.is_active,
        };
        if (editingId) {
          await updateCompany.mutateAsync({ id: editingId, payload });
        } else {
          await createCompany.mutateAsync(payload);
        }
      }

      if (tab === 'divisions') {
        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateDivision.mutateAsync({ id: editingId, payload });
        } else {
          await createDivision.mutateAsync(payload);
        }
      }

      if (tab === 'departments') {
        const payload = {
          division_id: Number(form.division_id),
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateDepartment.mutateAsync({ id: editingId, payload });
        } else {
          await createDepartment.mutateAsync(payload);
        }
      }

      if (tab === 'designations') {
        const payload = {
          department_id: Number(form.department_id),
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateDesignation.mutateAsync({ id: editingId, payload });
        } else {
          await createDesignation.mutateAsync(payload);
        }
      }

      setFormOpen(false);
      toast.success(editingId ? `${tabTitle} updated.` : `${tabTitle} created.`);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: `Delete ${tabTitle.toLowerCase()}?`,
      description:
        'It will be removed from lists but kept in the database. Records with children cannot be deleted — deactivate them instead.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }

    try {
      if (tab === 'companies') await deleteCompany.mutateAsync(id);
      if (tab === 'divisions') await deleteDivision.mutateAsync(id);
      if (tab === 'departments') await deleteDepartment.mutateAsync(id);
      if (tab === 'designations') await deleteDesignation.mutateAsync(id);
      toast.success(`${tabTitle} deleted.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const companyColumns: AppTableColumn<Company>[] = [
    {
      key: 'name',
      header: 'Company',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code} · {row.currency}
          </Typography>
        </Stack>
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
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditCompany(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const divisionColumns: AppTableColumn<Division>[] = [
    {
      key: 'name',
      header: 'Division',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code} · {row.company?.name ?? `Company #${row.company_id}`}
          </Typography>
        </Stack>
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
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditDivision(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const departmentColumns: AppTableColumn<Department>[] = [
    {
      key: 'name',
      header: 'Department',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code} · {row.division?.name ?? `Division #${row.division_id}`}
            {row.division?.company ? ` · ${row.division.company.name}` : ''}
          </Typography>
        </Stack>
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
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditDepartment(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const designationColumns: AppTableColumn<Designation>[] = [
    {
      key: 'name',
      header: 'Designation',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.department?.name ?? `Department #${row.department_id}`}
        </Typography>
      ),
    },
    {
      key: 'division',
      header: 'Division',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.division?.name ?? row.department?.division?.name ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.company?.name ?? row.department?.division?.company?.name ?? '—'}
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
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditDesignation(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const filteredDivisions = (divisionsQuery.data ?? []).filter(
    (item) => form.company_id === '' || item.company_id === form.company_id,
  );
  const filteredDepartments = (departmentsQuery.data ?? []).filter(
    (item) => form.division_id === '' || item.division_id === form.division_id,
  );

  const activeQuery =
    tab === 'companies'
      ? companiesQuery
      : tab === 'divisions'
        ? divisionsQuery
        : tab === 'departments'
          ? departmentsQuery
          : designationsQuery;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Organization"
        description="Company → Division → Department → Designation (identity only; hours in Phase 2)."
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Add {tabTitle}
            </Button>
          ) : null
        }
      />

      <Tabs
        value={tab}
        onChange={(_, value: OrgTab) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab value="companies" label="Companies" />
        <Tab value="divisions" label="Divisions" />
        <Tab value="departments" label="Departments" />
        <Tab value="designations" label="Designations" />
      </Tabs>

      {activeQuery.isError ? <RbacQueryError error={activeQuery.error} /> : null}

      {tab === 'companies' ? (
        <AppTable
          columns={companyColumns}
          rows={companiesQuery.data ?? []}
          getRowKey={(row) => row.id}
          isLoading={companiesQuery.isLoading}
          emptyState={<EmptyState title="No companies" description="Create Company A / B to start." />}
        />
      ) : null}

      {tab === 'divisions' ? (
        <AppTable
          columns={divisionColumns}
          rows={divisionsQuery.data ?? []}
          getRowKey={(row) => row.id}
          isLoading={divisionsQuery.isLoading}
          emptyState={<EmptyState title="No divisions" description="Add divisions under a company." />}
        />
      ) : null}

      {tab === 'departments' ? (
        <AppTable
          columns={departmentColumns}
          rows={departmentsQuery.data ?? []}
          getRowKey={(row) => row.id}
          isLoading={departmentsQuery.isLoading}
          emptyState={
            <EmptyState title="No departments" description="Add departments under a division." />
          }
        />
      ) : null}

      {tab === 'designations' ? (
        <AppTable
          columns={designationColumns}
          rows={designationsQuery.data ?? []}
          getRowKey={(row) => row.id}
          isLoading={designationsQuery.isLoading}
          emptyState={
            <EmptyState title="No designations" description="Add job titles under a department." />
          }
        />
      ) : null}

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
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

          {tab === 'divisions' || tab === 'departments' || tab === 'designations' ? (
            <TextField
              select
              label="Company"
              value={form.company_id}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'company_id'));
                setForm((current) => ({
                  ...current,
                  company_id: event.target.value === '' ? '' : Number(event.target.value),
                  division_id: '',
                  department_id: '',
                }));
              }}
              fullWidth
              required
              error={Boolean(fieldErrors.company_id)}
              helperText={fieldErrors.company_id}
            >
              {(companiesQuery.data ?? []).map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          {tab === 'departments' || tab === 'designations' ? (
            <TextField
              select
              label="Division"
              value={form.division_id}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'division_id'));
                setForm((current) => ({
                  ...current,
                  division_id: event.target.value === '' ? '' : Number(event.target.value),
                  department_id: '',
                }));
              }}
              fullWidth
              required
              error={Boolean(fieldErrors.division_id)}
              helperText={fieldErrors.division_id}
            >
              {filteredDivisions.map((division) => (
                <MenuItem key={division.id} value={division.id}>
                  {division.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          {tab === 'designations' ? (
            <TextField
              select
              label="Department"
              value={form.department_id}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'department_id'));
                setForm((current) => ({
                  ...current,
                  department_id: event.target.value === '' ? '' : Number(event.target.value),
                }));
              }}
              fullWidth
              required
              error={Boolean(fieldErrors.department_id)}
              helperText={fieldErrors.department_id}
            >
              {filteredDepartments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          <TextField
            label="Name"
            value={form.name}
            onChange={(event) => {
              setFieldErrors((current) => clearFieldError(current, 'name'));
              setForm((current) => ({ ...current, name: event.target.value }));
            }}
            required
            fullWidth
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
          />
          <TextField
            label="Code"
            value={form.code}
            onChange={(event) => {
              setFieldErrors((current) => clearFieldError(current, 'code'));
              setForm((current) => ({ ...current, code: event.target.value }));
            }}
            required
            fullWidth
            error={Boolean(fieldErrors.code)}
            helperText={fieldErrors.code ?? 'Unique within parent (or globally for companies).'}
          />
          {tab === 'companies' ? (
            <TextField
              label="Currency"
              value={form.currency}
              onChange={(event) => {
                setFieldErrors((current) => clearFieldError(current, 'currency'));
                setForm((current) => ({
                  ...current,
                  currency: event.target.value.toUpperCase(),
                }));
              }}
              required
              fullWidth
              error={Boolean(fieldErrors.currency)}
              helperText={fieldErrors.currency}
              slotProps={{ htmlInput: { maxLength: 3 } }}
            />
          ) : null}
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
              <Switch
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
    </Stack>
  );
}
