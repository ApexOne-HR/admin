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
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  useEmployeeNrcOptionsQuery,
  useEmployeeQuery,
  useEmployeesQuery,
  useUpdateEmployeeMutation,
} from '../hooks/useEmployeeQueries';
import type {
  Employee,
  NrcCitizenship,
  EmployeeStatus,
  EmploymentLevel,
  EmploymentType,
} from '../types/employee.type';
import {
  EMPLOYEE_STATUS_OPTIONS,
  employeeStatusMeta,
} from '../utils/employeeStatus';
import {
  NRC_CITIZENSHIP_OPTIONS,
  formatNrcPreview,
  nrcTownshipsByCode,
  parseNrcValue,
} from '../utils/nrc';

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
  sir_name: string;
  full_name: string;
  myanmar_name: string;
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
  service_years: number;
  date_of_birth: string;
  is_foreigner: boolean;
  nrc_code: string;
  nrc_township_code: string;
  nrc_township_name: string;
  nrc_citizenship: NrcCitizenship | '';
  nrc_number_serial: string;
  passport_number: string;
  ssb_number: string;
  income_tax_applicable: boolean;
  current_address: string;
  permanent_address: string;
  policy_id: number | '';
  work_schedule_id: number | '';
  work_location_id: number | '';
  leave_package_id: number | '';
};

const emptyForm: FormState = {
  company_id: '',
  division_id: '',
  department_id: '',
  designation_id: '',
  report_to: '',
  employee_code: '',
  sir_name: '',
  full_name: '',
  myanmar_name: '',
  email: '',
  phone: '',
  status: 'offer',
  employment_type: '',
  employment_level: '',
  auto_attendance: false,
  date_of_joining: '',
  date_of_resignation: '',
  probation_periods_months: 3,
  permanent_date: '',
  service_years: 0,
  date_of_birth: '',
  is_foreigner: false,
  nrc_code: '',
  nrc_township_code: '',
  nrc_township_name: '',
  nrc_citizenship: '',
  nrc_number_serial: '',
  passport_number: '',
  ssb_number: '',
  income_tax_applicable: true,
  current_address: '',
  permanent_address: '',
  policy_id: '',
  work_schedule_id: '',
  work_location_id: '',
  leave_package_id: '',
};

function orgDefaultIds(
  division?: {
    default_policy_id: number | null;
    default_work_schedule_id: number | null;
    default_location_id: number | null;
    default_leave_package_id: number | null;
  } | null,
  company?: {
    default_policy_id: number | null;
    default_work_schedule_id: number | null;
    default_location_id: number | null;
    default_leave_package_id: number | null;
  } | null,
): Pick<FormState, 'policy_id' | 'work_schedule_id' | 'work_location_id' | 'leave_package_id'> {
  return {
    policy_id: division?.default_policy_id ?? company?.default_policy_id ?? '',
    work_schedule_id:
      division?.default_work_schedule_id ?? company?.default_work_schedule_id ?? '',
    work_location_id: division?.default_location_id ?? company?.default_location_id ?? '',
    leave_package_id:
      division?.default_leave_package_id ?? company?.default_leave_package_id ?? '',
  };
}

function employeeToForm(row: Employee): FormState {
  const parsedNrc = parseNrcValue(row.nrc_number);

  return {
    company_id: row.company_id,
    division_id: row.division_id ?? '',
    department_id: row.department_id ?? '',
    designation_id: row.designation_id ?? '',
    report_to: row.report_to ?? '',
    employee_code: row.employee_code,
    sir_name: row.sir_name ?? '',
    full_name: row.full_name,
    myanmar_name: row.myanmar_name ?? '',
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
    service_years: row.service_years ?? 0,
    date_of_birth: row.date_of_birth ?? '',
    is_foreigner: row.is_foreigner,
    nrc_code: parsedNrc?.code ?? '',
    nrc_township_code: parsedNrc?.townshipCode ?? '',
    nrc_township_name: '',
    nrc_citizenship: parsedNrc?.citizenship ?? '',
    nrc_number_serial: parsedNrc?.serial ?? '',
    passport_number: row.passport_number ?? '',
    ssb_number: row.ssb_number ?? '',
    income_tax_applicable: row.income_tax_applicable,
    current_address: row.current_address ?? '',
    permanent_address: row.permanent_address ?? '',
    policy_id: row.policy_id ?? '',
    work_schedule_id: row.work_schedule_id ?? '',
    work_location_id: row.work_location_id ?? '',
    leave_package_id: row.leave_package_id ?? '',
  };
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
  const nrcOptionsQuery = useEmployeeNrcOptionsQuery(allowed);
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
  const nrcCodeOptions = useMemo(
    () => Array.from(new Set((nrcOptionsQuery.data ?? []).map((option) => option.code))),
    [nrcOptionsQuery.data],
  );
  const townshipOptions = useMemo(
    () => nrcTownshipsByCode(nrcOptionsQuery.data ?? [], form.nrc_code),
    [form.nrc_code, nrcOptionsQuery.data],
  );
  const nrcPreview = formatNrcPreview({
    code: form.nrc_code,
    townshipCode: form.nrc_township_code,
    citizenship: form.nrc_citizenship,
    serial: form.nrc_number_serial,
  });

  const selectedCompany = companies.find((c) => c.id === formCompanyId);

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
        policy_id: form.policy_id,
        work_schedule_id: form.work_schedule_id,
        work_location_id: form.work_location_id,
        leave_package_id: form.leave_package_id,
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
        { key: 'policy_id', label: 'Policy' },
        { key: 'work_schedule_id', label: 'Work schedule' },
        { key: 'work_location_id', label: 'Work location' },
        { key: 'leave_package_id', label: 'Leave package' },
      ],
    );
    setFieldErrors(required);
    if (hasFieldErrors(required)) {
      return;
    }

    if (!form.is_foreigner) {
      const nrcErrors: FieldErrors = {};

      if (!form.nrc_code) {
        nrcErrors.nrc_code = 'NRC code is required.';
      }
      if (!form.nrc_township_code) {
        nrcErrors.nrc_township_code = 'Township is required.';
      }
      if (!form.nrc_citizenship) {
        nrcErrors.nrc_citizenship = 'Citizenship is required.';
      }
      if (!form.nrc_number_serial.trim()) {
        nrcErrors.nrc_number_serial = 'NRC number is required.';
      }

      if (hasFieldErrors(nrcErrors)) {
        setFieldErrors((current) => ({ ...current, ...nrcErrors }));
        return;
      }
    }

    const payload = {
      company_id: Number(form.company_id),
      division_id: Number(form.division_id),
      department_id: Number(form.department_id),
      designation_id: Number(form.designation_id),
      report_to: form.report_to === '' ? null : Number(form.report_to),
      employee_code: form.employee_code.trim(),
      sir_name: form.sir_name.trim() || null,
      full_name: form.full_name.trim(),
      myanmar_name: form.myanmar_name.trim() || null,
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
      nrc_number: form.is_foreigner ? null : nrcPreview || null,
      passport_number: form.passport_number.trim() || null,
      ssb_number: form.ssb_number.trim() || null,
      income_tax_applicable: form.income_tax_applicable,
      current_address: form.current_address.trim() || null,
      permanent_address: form.permanent_address.trim() || null,
      policy_id: Number(form.policy_id),
      work_schedule_id: Number(form.work_schedule_id),
      work_location_id: Number(form.work_location_id),
      leave_package_id: Number(form.leave_package_id),
    };

    try {
      if (editingId === null) {
        const created = await createEmployee.mutateAsync(payload);
        toast.success('Employee created.');
        navigate(`/employees/${created.id}`);
      } else {
        await updateEmployee.mutateAsync({ id: editingId, payload });
        toast.success('Employee updated.');
        navigate(`/employees/${editingId}`);
      }
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
            to={editingId !== null ? `/employees/${editingId}` : '/employees'}
            startIcon={<ArrowBackRoundedIcon />}
            color="inherit"
          >
            {editingId !== null ? 'Back' : 'Back to list'}
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
                label="Sir name (optional)"
                value={form.sir_name}
                onChange={(e) => patchForm({ sir_name: e.target.value })}
                fullWidth
                helperText="e.g. U, Daw, Mr, Ms"
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
                label="Myanmar name (optional)"
                value={form.myanmar_name}
                onChange={(e) => patchForm({ myanmar_name: e.target.value })}
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
                {EMPLOYEE_STATUS_OPTIONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {employeeStatusMeta(value).label}
                  </MenuItem>
                ))}
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
                  const companyId = e.target.value === '' ? '' : Number(e.target.value);
                  const company = companies.find((c) => c.id === companyId);
                  patchForm({
                    company_id: companyId,
                    division_id: '',
                    department_id: '',
                    designation_id: '',
                    report_to: '',
                    ...orgDefaultIds(null, company ?? null),
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
                  const divisionId = e.target.value === '' ? '' : Number(e.target.value);
                  const division = formDivisions.find((d) => d.id === divisionId);
                  patchForm({
                    division_id: divisionId,
                    department_id: '',
                    ...orgDefaultIds(division ?? null, selectedCompany ?? null),
                  });
                  setFieldErrors((c) => {
                    let next = clearFieldError(c, 'division_id');
                    next = clearFieldError(next, 'policy_id');
                    next = clearFieldError(next, 'work_schedule_id');
                    next = clearFieldError(next, 'work_location_id');
                    next = clearFieldError(next, 'leave_package_id');
                    return next;
                  });
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
              <TextField
                label="Service years"
                value={form.service_years}
                fullWidth
                disabled
                helperText="Computed from joining date"
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
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Personal information" sx={cardHeaderSx} />
        <CardContent>
          <FormGrid>
            <FormCell>
              <TextField
                label="Date of birth (optional)"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => patchForm({ date_of_birth: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
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
            <FormCell>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_foreigner}
                    onChange={(e) => {
                      if (e.target.checked) {
                        patchForm({
                          is_foreigner: true,
                          nrc_code: '',
                          nrc_township_code: '',
                          nrc_township_name: '',
                          nrc_citizenship: '',
                          nrc_number_serial: '',
                        });
                        setFieldErrors((current) => {
                          const next = { ...current };
                          delete next.nrc_code;
                          delete next.nrc_township_code;
                          delete next.nrc_citizenship;
                          delete next.nrc_number_serial;
                          return next;
                        });
                        return;
                      }

                      patchForm({ is_foreigner: false });
                    }}
                  />
                }
                label="Foreigner"
              />
            </FormCell>
            {!form.is_foreigner ? (
              <>
                <FormCell span={3}>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      width: { xs: '100%', md: '75%' },
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '1fr 2fr 1fr 2fr',
                      },
                    }}
                  >
                    <TextField
                      select
                      label="NRC code"
                      required
                      value={form.nrc_code}
                      onChange={(e) => {
                        patchForm({
                          nrc_code: e.target.value,
                          nrc_township_code: '',
                          nrc_township_name: '',
                        });
                        setFieldErrors((current) => clearFieldError(current, 'nrc_code'));
                      }}
                      error={Boolean(fieldErrors.nrc_code)}
                      helperText={fieldErrors.nrc_code}
                      fullWidth
                      disabled={nrcOptionsQuery.isLoading}
                    >
                      {nrcCodeOptions.map((code) => (
                        <MenuItem key={code} value={code}>
                          {code}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="NRC township"
                      required
                      value={form.nrc_township_code}
                      onChange={(e) => {
                        const selected = townshipOptions.find(
                          (option) => option.township_code === e.target.value,
                        );
                        patchForm({
                          nrc_township_code: e.target.value,
                          nrc_township_name: selected?.township_name_mm ?? '',
                        });
                        setFieldErrors((current) => clearFieldError(current, 'nrc_township_code'));
                      }}
                      error={Boolean(fieldErrors.nrc_township_code)}
                      helperText={fieldErrors.nrc_township_code}
                      fullWidth
                      disabled={!form.nrc_code}
                    >
                      {townshipOptions.map((option) => (
                        <MenuItem key={option.id} value={option.township_code}>
                          {option.township_code} / {option.township_name_mm}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="NRC type"
                      required
                      value={form.nrc_citizenship}
                      onChange={(e) => {
                        patchForm({ nrc_citizenship: e.target.value as NrcCitizenship | '' });
                        setFieldErrors((current) => clearFieldError(current, 'nrc_citizenship'));
                      }}
                      error={Boolean(fieldErrors.nrc_citizenship)}
                      helperText={fieldErrors.nrc_citizenship}
                      fullWidth
                    >
                      {NRC_CITIZENSHIP_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="NRC number"
                      required
                      value={form.nrc_number_serial}
                      onChange={(e) => {
                        patchForm({
                          nrc_number_serial: e.target.value.replace(/\D/g, '').slice(0, 6),
                        });
                        setFieldErrors((current) => clearFieldError(current, 'nrc_number_serial'));
                      }}
                      error={Boolean(fieldErrors.nrc_number_serial)}
                      helperText={fieldErrors.nrc_number_serial}
                      fullWidth
                    />
                  </Box>
                </FormCell>
              </>
            ) : null}
            <FormCell>
              <TextField
                label="Passport (optional)"
                value={form.passport_number}
                onChange={(e) => patchForm({ passport_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="SSB number (optional)"
                value={form.ssb_number}
                onChange={(e) => patchForm({ ssb_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell span={3}>
              <TextField
                label="Current address (optional)"
                value={form.current_address}
                onChange={(e) => patchForm({ current_address: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </FormCell>
            <FormCell span={3}>
              <TextField
                label="Permanent address (optional)"
                value={form.permanent_address}
                onChange={(e) => patchForm({ permanent_address: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Work settings" sx={cardHeaderSx} />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Required. Pre-filled from Division, then Company — change if needed.
          </Typography>
          <FormGrid>
            <FormCell>
              <TextField
                select
                label="Policy"
                required
                value={form.policy_id}
                onChange={(e) => {
                  patchForm({
                    policy_id: e.target.value === '' ? '' : Number(e.target.value),
                  });
                  setFieldErrors((c) => clearFieldError(c, 'policy_id'));
                }}
                error={Boolean(fieldErrors.policy_id)}
                helperText={fieldErrors.policy_id}
                fullWidth
                disabled={!formCompanyId}
              >
                {policies.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Work schedule"
                required
                value={form.work_schedule_id}
                onChange={(e) => {
                  patchForm({
                    work_schedule_id: e.target.value === '' ? '' : Number(e.target.value),
                  });
                  setFieldErrors((c) => clearFieldError(c, 'work_schedule_id'));
                }}
                error={Boolean(fieldErrors.work_schedule_id)}
                helperText={fieldErrors.work_schedule_id}
                fullWidth
                disabled={!formCompanyId}
              >
                {schedules.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Work location"
                required
                value={form.work_location_id}
                onChange={(e) => {
                  patchForm({
                    work_location_id: e.target.value === '' ? '' : Number(e.target.value),
                  });
                  setFieldErrors((c) => clearFieldError(c, 'work_location_id'));
                }}
                error={Boolean(fieldErrors.work_location_id)}
                helperText={fieldErrors.work_location_id}
                fullWidth
                disabled={!formCompanyId}
              >
                {locations.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>
              <TextField
                select
                label="Leave package"
                required
                value={form.leave_package_id}
                onChange={(e) => {
                  patchForm({
                    leave_package_id: e.target.value === '' ? '' : Number(e.target.value),
                  });
                  setFieldErrors((c) => clearFieldError(c, 'leave_package_id'));
                }}
                error={Boolean(fieldErrors.leave_package_id)}
                helperText={fieldErrors.leave_package_id}
                fullWidth
                disabled={!formCompanyId}
              >
                {packages.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </FormCell>
            <FormCell>{null}</FormCell>
            <FormCell>{null}</FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
        <Button
          component={RouterLink}
          to={editingId !== null ? `/employees/${editingId}` : '/employees'}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </Stack>
    </Stack>
  );
}
