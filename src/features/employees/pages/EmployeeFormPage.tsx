import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { AppLoader } from '@/components/common/AppLoader';
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
import { useLeavePackagesQuery } from '@/features/leave/hooks/useLeaveQueries';
import {
  useLocationsQuery,
  usePoliciesQuery,
  useWorkSchedulesQuery,
} from '@/features/masters/hooks/useMastersQueries';
import {
  useCompaniesQuery,
  useDepartmentsQuery,
  useDesignationsQuery,
  useDivisionsQuery,
} from '@/features/organization/hooks/useOrganizationQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import {
  useCreateEmployeeMutation,
  useEmployeeQuery,
  useEmployeesQuery,
  useUpdateEmployeeMutation,
} from '../hooks/useEmployeeQueries';
import type {
  Employee,
  EmployeeStatus,
  EmploymentLevel,
  EmploymentType,
} from '../types/employee.type';

function FormGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        alignItems: 'start',
      }}
    >
      {children}
    </Box>
  );
}

function FormCell({
  children,
  span = 1,
}: {
  children: ReactNode;
  span?: 1 | 2 | 3;
}) {
  return (
    <Box
      sx={{
        gridColumn: {
          xs: '1 / -1',
          md: span === 1 ? 'auto' : `span ${span}`,
        },
        minWidth: 0,
      }}
    >
      {children}
    </Box>
  );
}

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

type FormState = {
  company_id: number | '';
  division_id: number | '';
  department_id: number | '';
  designation_id: number | '';
  report_to: number | '';
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  status: EmployeeStatus;
  employment_type: EmploymentType | '';
  employment_level: EmploymentLevel | '';
  auto_attendance: boolean;
  date_of_joining: string;
  date_of_resignation: string;
  probation_periods_months: number;
  permanent_date: string;
  date_of_birth: string;
  is_foreigner: boolean;
  nrc_number: string;
  passport_number: string;
  ssb_number: string;
  income_tax_applicable: boolean;
  residential_address: string;
  override_policy: boolean;
  policy_id: number | '';
  override_schedule: boolean;
  work_schedule_id: number | '';
  override_location: boolean;
  work_location_id: number | '';
  override_leave_package: boolean;
  leave_package_id: number | '';
};

const emptyForm: FormState = {
  company_id: '',
  division_id: '',
  department_id: '',
  designation_id: '',
  report_to: '',
  employee_code: '',
  full_name: '',
  email: '',
  phone: '',
  status: 'active',
  employment_type: '',
  employment_level: '',
  auto_attendance: false,
  date_of_joining: '',
  date_of_resignation: '',
  probation_periods_months: 3,
  permanent_date: '',
  date_of_birth: '',
  is_foreigner: false,
  nrc_number: '',
  passport_number: '',
  ssb_number: '',
  income_tax_applicable: true,
  residential_address: '',
  override_policy: false,
  policy_id: '',
  override_schedule: false,
  work_schedule_id: '',
  override_location: false,
  work_location_id: '',
  override_leave_package: false,
  leave_package_id: '',
};

function employeeToForm(row: Employee): FormState {
  return {
    company_id: row.company_id,
    division_id: row.division_id ?? '',
    department_id: row.department_id ?? '',
    designation_id: row.designation_id ?? '',
    report_to: row.report_to ?? '',
    employee_code: row.employee_code,
    full_name: row.full_name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    status: row.status,
    employment_type: row.employment_type ?? '',
    employment_level: (row.employment_level as EmploymentLevel | null) ?? '',
    auto_attendance: row.auto_attendance,
    date_of_joining: row.date_of_joining,
    date_of_resignation: row.date_of_resignation ?? '',
    probation_periods_months: row.probation_periods_months,
    permanent_date: row.permanent_date ?? '',
    date_of_birth: row.date_of_birth ?? '',
    is_foreigner: row.is_foreigner,
    nrc_number: row.nrc_number ?? '',
    passport_number: row.passport_number ?? '',
    ssb_number: row.ssb_number ?? '',
    income_tax_applicable: row.income_tax_applicable,
    residential_address: row.residential_address ?? '',
    override_policy: row.policy_id != null,
    policy_id: row.policy_id ?? '',
    override_schedule: row.work_schedule_id != null,
    work_schedule_id: row.work_schedule_id ?? '',
    override_location: row.work_location_id != null,
    work_location_id: row.work_location_id ?? '',
    override_leave_package: row.leave_package_id != null,
    leave_package_id: row.leave_package_id ?? '',
  };
}

function resolvePreviewName(
  override: boolean,
  overrideId: number | '',
  divisionDefaultId: number | null | undefined,
  companyDefaultId: number | null | undefined,
  options: Array<{ id: number; name: string }>,
): { name: string; source: string } {
  const pick = (id: number | null | undefined, source: string) => {
    if (!id) return null;
    const row = options.find((o) => o.id === id);
    return row ? { name: row.name, source } : null;
  };

  if (override) {
    return pick(overrideId === '' ? null : Number(overrideId), 'employee')
      ?? { name: '—', source: 'employee' };
  }

  return (
    pick(divisionDefaultId, 'division')
    ?? pick(companyDefaultId, 'company')
    ?? { name: '—', source: 'none' }
  );
}

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const editingId = isEdit ? Number(id) : null;
  const navigate = useNavigate();
  const toast = useToast();
  const { session } = useAdminSession();

  const canCreate = can(session?.user, 'employees.create');
  const canUpdate = can(session?.user, 'employees.update');
  const allowed = isEdit ? canUpdate : canCreate;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hydrated, setHydrated] = useState(!isEdit);

  const employeeQuery = useEmployeeQuery(editingId ?? undefined, isEdit && allowed);
  const companiesQuery = useCompaniesQuery(allowed);

  const formCompanyId = form.company_id === '' ? undefined : Number(form.company_id);
  const formDivisionsQuery = useDivisionsQuery(formCompanyId, allowed && Boolean(formCompanyId));
  const formDepartmentsQuery = useDepartmentsQuery(
    form.division_id === '' ? undefined : Number(form.division_id),
    allowed && form.division_id !== '',
  );
  const formDesignationsQuery = useDesignationsQuery(
    formCompanyId,
    undefined,
    allowed && Boolean(formCompanyId),
  );
  const formManagersQuery = useEmployeesQuery(
    { company_id: formCompanyId, per_page: 100, page: 1 },
    allowed && Boolean(formCompanyId),
  );
  const policiesQuery = usePoliciesQuery(formCompanyId, allowed && Boolean(formCompanyId));
  const schedulesQuery = useWorkSchedulesQuery(formCompanyId, allowed && Boolean(formCompanyId));
  const locationsQuery = useLocationsQuery(formCompanyId, allowed && Boolean(formCompanyId));
  const packagesQuery = useLeavePackagesQuery(formCompanyId, allowed && Boolean(formCompanyId));

  const createEmployee = useCreateEmployeeMutation();
  const updateEmployee = useUpdateEmployeeMutation();
  const isSaving = createEmployee.isPending || updateEmployee.isPending;

  useEffect(() => {
    if (employeeQuery.data && isEdit) {
      setForm(employeeToForm(employeeQuery.data));
      setHydrated(true);
    }
  }, [employeeQuery.data, isEdit]);

  const companies = companiesQuery.data ?? [];
  const formDivisions = formDivisionsQuery.data ?? [];
  const formDepartments = formDepartmentsQuery.data ?? [];
  const formDesignations = formDesignationsQuery.data ?? [];
  const managers = (formManagersQuery.data?.employees ?? []).filter((e) => e.id !== editingId);
  const policies = policiesQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const packages = packagesQuery.data ?? [];

  const selectedCompany = companies.find((c) => c.id === formCompanyId);
  const selectedDivision = formDivisions.find((d) => d.id === form.division_id);

  const previewPolicy = resolvePreviewName(
    form.override_policy,
    form.policy_id,
    selectedDivision?.default_policy_id,
    selectedCompany?.default_policy_id,
    policies,
  );
  const previewSchedule = resolvePreviewName(
    form.override_schedule,
    form.work_schedule_id,
    selectedDivision?.default_work_schedule_id,
    selectedCompany?.default_work_schedule_id,
    schedules,
  );
  const previewLocation = resolvePreviewName(
    form.override_location,
    form.work_location_id,
    selectedDivision?.default_location_id,
    selectedCompany?.default_location_id,
    locations,
  );
  const previewPackage = resolvePreviewName(
    form.override_leave_package,
    form.leave_package_id,
    selectedDivision?.default_leave_package_id,
    selectedCompany?.default_leave_package_id,
    packages,
  );

  const patchForm = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    setFormError(null);
    const required = validateRequiredFields(
      {
        company_id: form.company_id,
        division_id: form.division_id,
        department_id: form.department_id,
        designation_id: form.designation_id,
        employee_code: form.employee_code,
        full_name: form.full_name,
        employment_type: form.employment_type,
        date_of_joining: form.date_of_joining,
      },
      [
        { key: 'company_id', label: 'Company' },
        { key: 'division_id', label: 'Division' },
        { key: 'department_id', label: 'Department' },
        { key: 'designation_id', label: 'Designation' },
        { key: 'employee_code', label: 'Employee code' },
        { key: 'full_name', label: 'Full name' },
        { key: 'employment_type', label: 'Employment type' },
        { key: 'date_of_joining', label: 'Date of joining' },
      ],
    );
    setFieldErrors(required);
    if (hasFieldErrors(required)) {
      return;
    }

    const payload = {
      company_id: Number(form.company_id),
      division_id: Number(form.division_id),
      department_id: Number(form.department_id),
      designation_id: Number(form.designation_id),
      report_to: form.report_to === '' ? null : Number(form.report_to),
      employee_code: form.employee_code.trim(),
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
      employment_type: form.employment_type as EmploymentType,
      employment_level: form.employment_level === '' ? null : form.employment_level,
      auto_attendance: form.auto_attendance,
      date_of_joining: form.date_of_joining,
      date_of_resignation: form.date_of_resignation || null,
      probation_periods_months: form.probation_periods_months,
      permanent_date: form.permanent_date || null,
      date_of_birth: form.date_of_birth || null,
      is_foreigner: form.is_foreigner,
      nrc_number: form.nrc_number.trim() || null,
      passport_number: form.passport_number.trim() || null,
      ssb_number: form.ssb_number.trim() || null,
      income_tax_applicable: form.income_tax_applicable,
      residential_address: form.residential_address.trim() || null,
      policy_id: form.override_policy && form.policy_id !== '' ? Number(form.policy_id) : null,
      work_schedule_id:
        form.override_schedule && form.work_schedule_id !== ''
          ? Number(form.work_schedule_id)
          : null,
      work_location_id:
        form.override_location && form.work_location_id !== ''
          ? Number(form.work_location_id)
          : null,
      leave_package_id:
        form.override_leave_package && form.leave_package_id !== ''
          ? Number(form.leave_package_id)
          : null,
    };

    try {
      if (editingId === null) {
        await createEmployee.mutateAsync(payload);
        toast.success('Employee created.');
      } else {
        await updateEmployee.mutateAsync({ id: editingId, payload });
        toast.success('Employee updated.');
      }
      navigate('/employees');
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  if (!allowed) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title={isEdit ? 'Edit employee' : 'Add employee'}
          description="Employee profile and org placement."
        />
        <ForbiddenAlert />
      </Stack>
    );
  }

  if (isEdit && (employeeQuery.isLoading || !hydrated)) {
    return <AppLoader label="Loading employee…" />;
  }

  if (isEdit && employeeQuery.isError) {
    return <RbacQueryError error={employeeQuery.error} />;
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={isEdit ? 'Edit employee' : 'Add employee'}
        description="Org placement, employment timeline, and inheritance overrides."
        action={
          <Button
            component={RouterLink}
            to="/employees"
            startIcon={<ArrowBackRoundedIcon />}
            color="inherit"
          >
            Back to list
          </Button>
        }
      />

      {formError && (
        <Typography color="error" variant="body2">{formError}</Typography>
      )}

      <Card variant="outlined">
        <CardHeader title="Identity" sx={cardHeaderSx} />
        <CardContent>
          <FormGrid>
            <FormCell>
              <TextField
                label="Employee code"
                required
                value={form.employee_code}
                onChange={(e) => {
                  patchForm({ employee_code: e.target.value });
                  setFieldErrors((c) => clearFieldError(c, 'employee_code'));
                }}
                error={Boolean(fieldErrors.employee_code)}
                helperText={fieldErrors.employee_code}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Full name"
                required
                value={form.full_name}
                onChange={(e) => {
                  patchForm({ full_name: e.target.value });
                  setFieldErrors((c) => clearFieldError(c, 'full_name'));
                }}
                error={Boolean(fieldErrors.full_name)}
                helperText={fieldErrors.full_name}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Status"
                required
                value={form.status}
                onChange={(e) => patchForm({ status: e.target.value as EmployeeStatus })}
                fullWidth
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                label="Email (optional)"
                value={form.email}
                onChange={(e) => patchForm({ email: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Phone (optional)"
                value={form.phone}
                onChange={(e) => patchForm({ phone: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>{null}</FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Organization" sx={cardHeaderSx} />
        <CardContent>
          <FormGrid>
            <FormCell>
              <TextField
                select
                label="Company"
                required
                value={form.company_id}
                onChange={(e) => {
                  patchForm({
                    company_id: e.target.value === '' ? '' : Number(e.target.value),
                    division_id: '',
                    department_id: '',
                    designation_id: '',
                    report_to: '',
                    policy_id: '',
                    work_schedule_id: '',
                    work_location_id: '',
                    leave_package_id: '',
                  });
                  setFieldErrors((c) => clearFieldError(c, 'company_id'));
                }}
                error={Boolean(fieldErrors.company_id)}
                helperText={fieldErrors.company_id}
                fullWidth
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Division"
                required
                value={form.division_id}
                onChange={(e) => {
                  patchForm({
                    division_id: e.target.value === '' ? '' : Number(e.target.value),
                    department_id: '',
                  });
                  setFieldErrors((c) => clearFieldError(c, 'division_id'));
                }}
                error={Boolean(fieldErrors.division_id)}
                helperText={fieldErrors.division_id}
                fullWidth
                disabled={!formCompanyId}
              >
                {formDivisions.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Department"
                required
                value={form.department_id}
                onChange={(e) => {
                  patchForm({
                    department_id: e.target.value === '' ? '' : Number(e.target.value),
                  });
                  setFieldErrors((c) => clearFieldError(c, 'department_id'));
                }}
                error={Boolean(fieldErrors.department_id)}
                helperText={fieldErrors.department_id}
                fullWidth
                disabled={form.division_id === ''}
              >
                {formDepartments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Designation"
                required
                value={form.designation_id}
                onChange={(e) => {
                  patchForm({
                    designation_id: e.target.value === '' ? '' : Number(e.target.value),
                  });
                  setFieldErrors((c) => clearFieldError(c, 'designation_id'));
                }}
                error={Boolean(fieldErrors.designation_id)}
                helperText={fieldErrors.designation_id}
                fullWidth
                disabled={!formCompanyId}
              >
                {formDesignations.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Reports to (optional)"
                value={form.report_to}
                onChange={(e) =>
                  patchForm({
                    report_to: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                fullWidth
                disabled={!formCompanyId}
                helperText="Leave empty only for the company root employee."
              >
                <MenuItem value="">Root (no manager)</MenuItem>
                {managers.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.employee_code} — {m.full_name}
                  </MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>{null}</FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Employment" sx={cardHeaderSx} />
        <CardContent>
          <FormGrid>
            <FormCell>
              <TextField
                select
                label="Employment type"
                required
                value={form.employment_type}
                onChange={(e) => {
                  patchForm({ employment_type: e.target.value as EmploymentType | '' });
                  setFieldErrors((c) => clearFieldError(c, 'employment_type'));
                }}
                error={Boolean(fieldErrors.employment_type)}
                helperText={fieldErrors.employment_type}
                fullWidth
              >
                <MenuItem value="full-time">Full-time</MenuItem>
                <MenuItem value="part-time">Part-time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="others">Others</MenuItem>
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Employment level (optional)"
                value={form.employment_level}
                onChange={(e) =>
                  patchForm({
                    employment_level: e.target.value as EmploymentLevel | '',
                  })
                }
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Junior">Junior</MenuItem>
                <MenuItem value="Senior">Senior</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Executive">Executive</MenuItem>
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                label="Date of joining"
                type="date"
                required
                value={form.date_of_joining}
                onChange={(e) => {
                  patchForm({ date_of_joining: e.target.value });
                  setFieldErrors((c) => clearFieldError(c, 'date_of_joining'));
                }}
                error={Boolean(fieldErrors.date_of_joining)}
                helperText={fieldErrors.date_of_joining}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Probation months (optional)"
                type="number"
                value={form.probation_periods_months}
                onChange={(e) =>
                  patchForm({ probation_periods_months: Number(e.target.value) || 0 })
                }
                fullWidth
                helperText="Defaults to 3 if left as-is on create"
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Permanent date (optional)"
                type="date"
                value={form.permanent_date}
                onChange={(e) => patchForm({ permanent_date: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Blank = joining + probation"
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Resignation date (optional)"
                type="date"
                value={form.date_of_resignation}
                onChange={(e) => patchForm({ date_of_resignation: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FormCell>
            <FormCell>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.auto_attendance}
                    onChange={(e) => patchForm({ auto_attendance: e.target.checked })}
                  />
                }
                label="Auto attendance"
              />
            </FormCell>
            <FormCell>{null}</FormCell>
            <FormCell>{null}</FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Overrides" sx={cardHeaderSx} />
        <CardContent>
          <Stack spacing={1.5}>
            <FormGrid>
              <FormCell>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.override_policy}
                      onChange={(e) =>
                        patchForm({
                          override_policy: e.target.checked,
                          policy_id: e.target.checked ? form.policy_id : '',
                        })
                      }
                    />
                  }
                  label="Override policy"
                />
              </FormCell>
              <FormCell span={2}>
                {form.override_policy ? (
                  <TextField
                    select
                    label="Policy"
                    value={form.policy_id}
                    onChange={(e) =>
                      patchForm({ policy_id: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    fullWidth
                  >
                    {policies.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </FormCell>
              <FormCell>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.override_schedule}
                      onChange={(e) =>
                        patchForm({
                          override_schedule: e.target.checked,
                          work_schedule_id: e.target.checked ? form.work_schedule_id : '',
                        })
                      }
                    />
                  }
                  label="Override work schedule"
                />
              </FormCell>
              <FormCell span={2}>
                {form.override_schedule ? (
                  <TextField
                    select
                    label="Work schedule"
                    value={form.work_schedule_id}
                    onChange={(e) =>
                      patchForm({
                        work_schedule_id: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    fullWidth
                  >
                    {schedules.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </FormCell>
              <FormCell>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.override_location}
                      onChange={(e) =>
                        patchForm({
                          override_location: e.target.checked,
                          work_location_id: e.target.checked ? form.work_location_id : '',
                        })
                      }
                    />
                  }
                  label="Override work location"
                />
              </FormCell>
              <FormCell span={2}>
                {form.override_location ? (
                  <TextField
                    select
                    label="Work location"
                    value={form.work_location_id}
                    onChange={(e) =>
                      patchForm({
                        work_location_id: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    fullWidth
                  >
                    {locations.map((l) => (
                      <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </FormCell>
              <FormCell>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.override_leave_package}
                      onChange={(e) =>
                        patchForm({
                          override_leave_package: e.target.checked,
                          leave_package_id: e.target.checked ? form.leave_package_id : '',
                        })
                      }
                    />
                  }
                  label="Override leave package"
                />
              </FormCell>
              <FormCell span={2}>
                {form.override_leave_package ? (
                  <TextField
                    select
                    label="Leave package"
                    value={form.leave_package_id}
                    onChange={(e) =>
                      patchForm({
                        leave_package_id: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    fullWidth
                  >
                    {packages.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </FormCell>
            </FormGrid>

            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom>
                Effective defaults preview
              </Typography>
              <FormGrid>
                <FormCell>
                  <Typography variant="body2">
                    Policy: {previewPolicy.name} ({previewPolicy.source})
                  </Typography>
                </FormCell>
                <FormCell>
                  <Typography variant="body2">
                    Schedule: {previewSchedule.name} ({previewSchedule.source})
                  </Typography>
                </FormCell>
                <FormCell>
                  <Typography variant="body2">
                    Location: {previewLocation.name} ({previewLocation.source})
                  </Typography>
                </FormCell>
                <FormCell>
                  <Typography variant="body2">
                    Leave package: {previewPackage.name} ({previewPackage.source})
                  </Typography>
                </FormCell>
                <FormCell>{null}</FormCell>
                <FormCell>{null}</FormCell>
              </FormGrid>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Demographics" sx={cardHeaderSx} />
        <CardContent>
          <FormGrid>
            <FormCell>
              <TextField
                label="Date of birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => patchForm({ date_of_birth: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FormCell>
            <FormCell>
              <TextField
                label="NRC"
                value={form.nrc_number}
                onChange={(e) => patchForm({ nrc_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Passport"
                value={form.passport_number}
                onChange={(e) => patchForm({ passport_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="SSB number"
                value={form.ssb_number}
                onChange={(e) => patchForm({ ssb_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_foreigner}
                    onChange={(e) => patchForm({ is_foreigner: e.target.checked })}
                  />
                }
                label="Foreigner"
              />
            </FormCell>
            <FormCell>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.income_tax_applicable}
                    onChange={(e) => patchForm({ income_tax_applicable: e.target.checked })}
                  />
                }
                label="Income tax applicable"
              />
            </FormCell>
            <FormCell span={3}>
              <TextField
                label="Residential address (optional)"
                value={form.residential_address}
                onChange={(e) => patchForm({ residential_address: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
        <Button component={RouterLink} to="/employees" disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </Stack>
    </Stack>
  );
}
