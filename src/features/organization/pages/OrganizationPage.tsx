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
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can, isGlobalScope } from '@/features/auth/services/auth.service';
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
  useLocationsQuery,
  usePoliciesQuery,
  useWorkSchedulesQuery,
} from '@/features/masters/hooks/useMastersQueries';
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
import { COMPANY_CURRENCIES, COMPANY_TIMEZONES } from '../constants/companyOptions';
import type { Company, Department, Designation, Division } from '../types/organization.type';

type OrgTab = 'companies' | 'divisions' | 'departments' | 'designations';

type UnitForm = {
  name: string;
  is_active: boolean;
  currency: string;
  timezone: string;
  website: string;
  logo: string;
  tax_id: string;
  contact_address: string;
  contact_phone: string;
  company_type: string;
  address: string;
  company_id: number | '';
  division_id: number | '';
  department_id: number | '';
  default_policy_id: number | '';
  default_work_schedule_id: number | '';
  default_location_id: number | '';
};

const emptyForm: UnitForm = {
  name: '',
  is_active: true,
  currency: 'MMK',
  timezone: 'Asia/Yangon',
  website: '',
  logo: '',
  tax_id: '',
  contact_address: '',
  contact_phone: '',
  company_type: '',
  address: '',
  company_id: '',
  division_id: '',
  department_id: '',
  default_policy_id: '',
  default_work_schedule_id: '',
  default_location_id: '',
};

function optionalId(value: number | ''): number | null {
  return value === '' ? null : value;
}

export function OrganizationPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'organizations.view');
  const canManage = can(session?.user, 'organizations.manage');
  const canCreateCompany = canManage && isGlobalScope(session?.user);

  const [tab, setTab] = useState<OrgTab>('companies');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UnitForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const companiesQuery = useCompaniesQuery(canView);
  const divisionsQuery = useDivisionsQuery(undefined, canView);
  const departmentsQuery = useDepartmentsQuery(undefined, canView);
  const designationsQuery = useDesignationsQuery(undefined, undefined, canView);

  const mastersCompanyId =
    tab === 'companies'
      ? (editingId ?? undefined)
      : typeof form.company_id === 'number'
        ? form.company_id
        : undefined;

  const loadMasters = formOpen && (tab === 'companies' || tab === 'divisions') && Boolean(mastersCompanyId);
  const locationsQuery = useLocationsQuery(mastersCompanyId, loadMasters);
  const schedulesQuery = useWorkSchedulesQuery(mastersCompanyId, loadMasters);
  const policiesQuery = usePoliciesQuery(mastersCompanyId, loadMasters);

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
        <PageHeader title="Organization" description="Company → Division → Department → Designation" />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const companies = companiesQuery.data ?? [];
  const divisions = divisionsQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const policies = policiesQuery.data ?? [];

  const formDivisions = form.company_id
    ? divisions.filter((row) => row.company_id === form.company_id)
    : [];
  const formDepartments = form.company_id
    ? departments.filter((row) => row.division?.company_id === form.company_id)
    : form.division_id
      ? departments.filter((row) => row.division_id === form.division_id)
      : departments;

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
      currency: row.currency,
      timezone: row.timezone || 'Asia/Yangon',
      website: row.website ?? '',
      logo: row.logo ?? '',
      tax_id: row.tax_id ?? '',
      contact_address: row.contact_address ?? '',
      contact_phone: row.contact_phone ?? '',
      company_type: row.company_type ?? '',
      default_policy_id: row.default_policy_id ?? '',
      default_work_schedule_id: row.default_work_schedule_id ?? '',
      default_location_id: row.default_location_id ?? '',
      is_active: row.is_active,
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
      address: row.address ?? '',
      company_id: row.company_id,
      default_policy_id: row.default_policy_id ?? '',
      default_work_schedule_id: row.default_work_schedule_id ?? '',
      default_location_id: row.default_location_id ?? '',
      is_active: row.is_active,
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
      company_id: row.division?.company_id ?? '',
      division_id: row.division_id,
      is_active: row.is_active,
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
      company_id: row.company_id,
      division_id: row.department?.division_id ?? row.division?.id ?? '',
      department_id: row.department_id ?? '',
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
        name: form.name,
        company_id: form.company_id,
        division_id: form.division_id,
        currency: form.currency,
        timezone: form.timezone,
      },
      [
        { key: 'name', label: 'Name' },
        { key: 'company_id', label: 'Company', when: tab === 'divisions' || tab === 'designations' },
        { key: 'division_id', label: 'Division', when: tab === 'departments' },
        { key: 'currency', label: 'Currency', when: tab === 'companies' },
        { key: 'timezone', label: 'Timezone', when: tab === 'companies' },
      ],
    );

    setFieldErrors(required);
    if (hasFieldErrors(required)) {
      return;
    }

    try {
      if (tab === 'companies') {
        const payload = {
          name: form.name.trim(),
          currency: form.currency,
          timezone: form.timezone,
          website: form.website.trim() || null,
          logo: form.logo.trim() || null,
          tax_id: form.tax_id.trim() || null,
          contact_address: form.contact_address.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          company_type: form.company_type.trim() || null,
          default_policy_id: editingId ? optionalId(form.default_policy_id) : null,
          default_work_schedule_id: editingId ? optionalId(form.default_work_schedule_id) : null,
          default_location_id: editingId ? optionalId(form.default_location_id) : null,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateCompany.mutateAsync({ id: editingId, payload });
          toast.success('Company updated.');
        } else {
          await createCompany.mutateAsync(payload);
          toast.success('Company created. Add masters, then edit to set defaults.');
        }
      } else if (tab === 'divisions') {
        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          address: form.address.trim() || null,
          default_policy_id: optionalId(form.default_policy_id),
          default_work_schedule_id: optionalId(form.default_work_schedule_id),
          default_location_id: optionalId(form.default_location_id),
          is_active: form.is_active,
        };
        if (editingId) {
          await updateDivision.mutateAsync({ id: editingId, payload });
          toast.success('Division updated.');
        } else {
          await createDivision.mutateAsync(payload);
          toast.success('Division created.');
        }
      } else if (tab === 'departments') {
        const payload = {
          division_id: Number(form.division_id),
          name: form.name.trim(),
          is_active: form.is_active,
        };
        if (editingId) {
          await updateDepartment.mutateAsync({ id: editingId, payload });
          toast.success('Department updated.');
        } else {
          await createDepartment.mutateAsync(payload);
          toast.success('Department created.');
        }
      } else {
        const payload = {
          company_id: Number(form.company_id),
          department_id: form.department_id === '' ? null : Number(form.department_id),
          name: form.name.trim(),
          is_active: form.is_active,
        };
        if (editingId) {
          await updateDesignation.mutateAsync({ id: editingId, payload });
          toast.success('Designation updated.');
        } else {
          await createDesignation.mutateAsync(payload);
          toast.success('Designation created.');
        }
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: `Delete ${tabTitle}?`,
      description: 'Soft-deleted and hidden from lists.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }

    try {
      if (tab === 'companies') {
        await deleteCompany.mutateAsync(id);
      } else if (tab === 'divisions') {
        await deleteDivision.mutateAsync(id);
      } else if (tab === 'departments') {
        await deleteDepartment.mutateAsync(id);
      } else {
        await deleteDesignation.mutateAsync(id);
      }
      toast.success(`${tabTitle} deleted.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const masterLabel = (name: string, code?: string | null) =>
    code ? `${name} (${code})` : name;

  const companyColumns: AppTableColumn<Company>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'currency', header: 'Currency', render: (row) => row.currency },
    { key: 'timezone', header: 'Timezone', render: (row) => row.timezone },
    { key: 'type', header: 'Type', render: (row) => row.company_type ?? '—' },
    { key: 'phone', header: 'Phone', render: (row) => row.contact_phone ?? '—' },
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
      key: 'company',
      header: 'Company',
      render: (row) => row.company?.name ?? `Company #${row.company_id}`,
    },
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'address', header: 'Address', render: (row) => row.address ?? '—' },
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
      key: 'company',
      header: 'Company',
      render: (row) => row.division?.company?.name ?? '—',
    },
    {
      key: 'division',
      header: 'Division',
      render: (row) => row.division?.name ?? `Division #${row.division_id}`,
    },
    { key: 'name', header: 'Name', render: (row) => row.name },
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
      key: 'company',
      header: 'Company',
      render: (row) => row.company?.name ?? `Company #${row.company_id}`,
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) =>
        row.department_id
          ? (row.department?.name ?? `Department #${row.department_id}`)
          : 'Company-wide',
    },
    { key: 'name', header: 'Title', render: (row) => row.name },
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

  const activeQuery =
    tab === 'companies'
      ? companiesQuery
      : tab === 'divisions'
        ? divisionsQuery
        : tab === 'departments'
          ? departmentsQuery
          : designationsQuery;

  const showAdd = canManage && (tab !== 'companies' || canCreateCompany);
  const showDefaults = tab === 'companies' || tab === 'divisions';
  const defaultsReady =
    tab === 'divisions'
      ? Boolean(form.company_id)
      : Boolean(editingId);

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Organization"
        description="Company → Division → Department → Designation. Set default location / schedule / policy on Company and Division."
        action={
          showAdd ? (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Add {tabTitle}
            </Button>
          ) : null
        }
      />

      <Tabs value={tab} onChange={(_, value: OrgTab) => setTab(value)} variant="scrollable">
        <Tab value="companies" label="Companies" />
        <Tab value="divisions" label="Divisions" />
        <Tab value="departments" label="Departments" />
        <Tab value="designations" label="Designations" />
      </Tabs>

      {activeQuery.isError ? <RbacQueryError error={activeQuery.error} /> : null}

      {tab === 'companies' ? (
        <AppTable
          columns={companyColumns}
          rows={companies}
          getRowKey={(row) => row.id}
          isLoading={companiesQuery.isLoading}
          emptyState={<EmptyState title="No companies" description="Create a company to start." />}
        />
      ) : null}

      {tab === 'divisions' ? (
        <AppTable
          columns={divisionColumns}
          rows={divisions}
          getRowKey={(row) => row.id}
          isLoading={divisionsQuery.isLoading}
          emptyState={<EmptyState title="No divisions" description="Add divisions under a company." />}
        />
      ) : null}

      {tab === 'departments' ? (
        <AppTable
          columns={departmentColumns}
          rows={departments}
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
            <EmptyState
              title="No designations"
              description="Add job titles under a company (optionally scoped to a department)."
            />
          }
        />
      ) : null}

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="lg"
        title={editingId ? `Edit ${tabTitle}` : `Add ${tabTitle}`}
        description={
          showDefaults
            ? 'Defaults fall back Employee → Division → Company. Leave package comes after F5.'
            : undefined
        }
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={isSaving} onClick={() => void handleSave()}>
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2.5} sx={{ pt: 1 }}>
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
            {tab === 'divisions' || tab === 'designations' || tab === 'departments' ? (
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
                    default_policy_id: '',
                    default_work_schedule_id: '',
                    default_location_id: '',
                  }));
                }}
                required={tab !== 'departments'}
                error={Boolean(fieldErrors.company_id)}
                helperText={
                  fieldErrors.company_id ||
                  (tab === 'departments' ? 'Filter divisions by company' : undefined)
                }
                fullWidth
              >
                <MenuItem value="">Select company</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}

            {tab === 'departments' ? (
              <TextField
                select
                label="Division"
                value={form.division_id}
                onChange={(event) => {
                  setFieldErrors((current) => clearFieldError(current, 'division_id'));
                  setForm((current) => ({
                    ...current,
                    division_id: event.target.value === '' ? '' : Number(event.target.value),
                  }));
                }}
                required
                error={Boolean(fieldErrors.division_id)}
                helperText={fieldErrors.division_id}
                fullWidth
              >
                <MenuItem value="">Select division</MenuItem>
                {(form.company_id ? formDivisions : divisions).map((division) => (
                  <MenuItem key={division.id} value={division.id}>
                    {division.name}
                    {division.company ? ` (${division.company.name})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}

            {tab === 'designations' ? (
              <TextField
                select
                label="Department (optional)"
                value={form.department_id}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    department_id: event.target.value === '' ? '' : Number(event.target.value),
                  }));
                }}
                helperText="Leave empty for a company-wide title"
                fullWidth
              >
                <MenuItem value="">Company-wide</MenuItem>
                {formDepartments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                    {department.division ? ` · ${department.division.name}` : ''}
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
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              fullWidth
              sx={tab === 'companies' || tab === 'divisions' ? { gridColumn: { md: '1 / -1' } } : undefined}
            />

            {tab === 'divisions' ? (
              <TextField
                label="Address"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                multiline
                minRows={2}
                fullWidth
                sx={{ gridColumn: { md: '1 / -1' } }}
              />
            ) : null}

            {tab === 'companies' ? (
              <>
                <TextField
                  select
                  label="Currency"
                  value={form.currency}
                  onChange={(event) => {
                    setFieldErrors((current) => clearFieldError(current, 'currency'));
                    setForm((current) => ({ ...current, currency: event.target.value }));
                  }}
                  required
                  error={Boolean(fieldErrors.currency)}
                  helperText={fieldErrors.currency}
                  fullWidth
                >
                  {COMPANY_CURRENCIES.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Timezone"
                  value={form.timezone}
                  onChange={(event) => {
                    setFieldErrors((current) => clearFieldError(current, 'timezone'));
                    setForm((current) => ({ ...current, timezone: event.target.value }));
                  }}
                  required
                  error={Boolean(fieldErrors.timezone)}
                  helperText={fieldErrors.timezone}
                  fullWidth
                >
                  {COMPANY_TIMEZONES.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Company type"
                  value={form.company_type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company_type: event.target.value }))
                  }
                  placeholder="e.g. private, public, NGO"
                  fullWidth
                />

                <TextField
                  label="Tax ID"
                  value={form.tax_id}
                  onChange={(event) => setForm((current) => ({ ...current, tax_id: event.target.value }))}
                  fullWidth
                />

                <TextField
                  label="Website"
                  value={form.website}
                  onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                  fullWidth
                />

                <TextField
                  label="Logo"
                  value={form.logo}
                  onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))}
                  helperText="Path or URL"
                  fullWidth
                />

                <TextField
                  label="Contact phone"
                  value={form.contact_phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact_phone: event.target.value }))
                  }
                  fullWidth
                />

                <TextField
                  label="Contact address"
                  value={form.contact_address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact_address: event.target.value }))
                  }
                  multiline
                  minRows={2}
                  fullWidth
                  sx={{ gridColumn: { md: '1 / -1' } }}
                />
              </>
            ) : null}

            {showDefaults ? (
              <>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ gridColumn: { md: '1 / -1' }, pt: 1 }}
                >
                  Defaults (location · schedule · policy)
                </Typography>

                {!defaultsReady ? (
                  <Typography variant="body2" color="text.secondary" sx={{ gridColumn: { md: '1 / -1' } }}>
                    {tab === 'companies'
                      ? 'Save the company first, create masters under Masters, then edit to assign defaults.'
                      : 'Select a company to load its locations, schedules, and policies.'}
                  </Typography>
                ) : (
                  <>
                    <TextField
                      select
                      label="Default location"
                      value={form.default_location_id}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          default_location_id:
                            event.target.value === '' ? '' : Number(event.target.value),
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value="">None</MenuItem>
                      {locations.map((row) => (
                        <MenuItem key={row.id} value={row.id}>
                          {masterLabel(row.name, row.code)}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Default work schedule"
                      value={form.default_work_schedule_id}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          default_work_schedule_id:
                            event.target.value === '' ? '' : Number(event.target.value),
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value="">None</MenuItem>
                      {schedules.map((row) => (
                        <MenuItem key={row.id} value={row.id}>
                          {masterLabel(row.name, row.code)}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Default policy"
                      value={form.default_policy_id}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          default_policy_id:
                            event.target.value === '' ? '' : Number(event.target.value),
                        }))
                      }
                      fullWidth
                      sx={{ gridColumn: { md: '1 / -1' } }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {policies.map((row) => (
                        <MenuItem key={row.id} value={row.id}>
                          {masterLabel(row.name, row.code)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </>
                )}
              </>
            ) : null}
          </Box>

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
