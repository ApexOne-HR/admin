import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { AppLoader } from '@/components/common/AppLoader';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import { useEmployeeQuery } from '../hooks/useEmployeeQueries';
import type { EffectiveDefault, EmployeeStatus } from '../types/employee.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

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

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word' }}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Typography>
    </Box>
  );
}

function statusChip(status: EmployeeStatus) {
  const color =
    status === 'active' ? 'success' : status === 'inactive' ? 'default' : 'error';
  return <Chip size="small" label={status} color={color} />;
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No';
}

function formatEmploymentType(value: string | null | undefined) {
  if (!value) return '—';
  if (value === 'full-time') return 'Full-time';
  if (value === 'part-time') return 'Part-time';
  if (value === 'contract') return 'Contract';
  if (value === 'others') return 'Others';
  return value;
}

function formatEffective(item: EffectiveDefault | null | undefined) {
  if (!item) return '—';
  return `${item.name} (${item.source})`;
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);
  const { session } = useAdminSession();
  const canView = can(session?.user, 'employees.view');
  const canUpdate = can(session?.user, 'employees.update');

  const employeeQuery = useEmployeeQuery(
    Number.isFinite(employeeId) ? employeeId : undefined,
    canView && Number.isFinite(employeeId),
  );

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Employee" description="Employee profile." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  if (employeeQuery.isLoading) {
    return <AppLoader label="Loading employee…" />;
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return <RbacQueryError error={employeeQuery.error ?? new Error('Employee not found')} />;
  }

  const employee = employeeQuery.data;
  const defaults = employee.effective_defaults;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={employee.full_name}
        description={`${employee.employee_code} · ${employee.company?.name ?? '—'}`}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to="/employees"
              startIcon={<ArrowBackRoundedIcon />}
              color="inherit"
            >
              Back to list
            </Button>
            <PermissionGate permission="employees.update">
              <Button
                component={RouterLink}
                to={`/employees/${employee.id}/edit`}
                variant="contained"
                startIcon={<EditRoundedIcon />}
                disabled={!canUpdate}
              >
                Edit
              </Button>
            </PermissionGate>
          </Stack>
        }
      />

      <Card variant="outlined">
        <CardHeader title="Identity" sx={cardHeaderSx} />
        <CardContent>
          <FormGrid>
            <FormCell>
              <DetailField label="Employee code" value={employee.employee_code} />
            </FormCell>
            <FormCell>
              <DetailField label="Full name" value={employee.full_name} />
            </FormCell>
            <FormCell>
              <DetailField label="Status" value={statusChip(employee.status)} />
            </FormCell>
            <FormCell>
              <DetailField label="Email" value={employee.email} />
            </FormCell>
            <FormCell>
              <DetailField label="Phone" value={employee.phone} />
            </FormCell>
            <FormCell>
              <DetailField label="Service years" value={String(employee.service_years ?? 0)} />
            </FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Organization" sx={cardHeaderSx} />
        <CardContent>
          <FormGrid>
            <FormCell>
              <DetailField label="Company" value={employee.company?.name} />
            </FormCell>
            <FormCell>
              <DetailField label="Division" value={employee.division?.name} />
            </FormCell>
            <FormCell>
              <DetailField label="Department" value={employee.department?.name} />
            </FormCell>
            <FormCell>
              <DetailField label="Designation" value={employee.designation?.name} />
            </FormCell>
            <FormCell>
              <DetailField
                label="Reports to"
                value={
                  employee.manager
                    ? `${employee.manager.employee_code} — ${employee.manager.full_name}`
                    : 'Root (no manager)'
                }
              />
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
              <DetailField
                label="Employment type"
                value={formatEmploymentType(employee.employment_type)}
              />
            </FormCell>
            <FormCell>
              <DetailField label="Employment level" value={employee.employment_level} />
            </FormCell>
            <FormCell>
              <DetailField label="Date of joining" value={employee.date_of_joining} />
            </FormCell>
            <FormCell>
              <DetailField
                label="Probation months"
                value={String(employee.probation_periods_months ?? '—')}
              />
            </FormCell>
            <FormCell>
              <DetailField label="Permanent date" value={employee.permanent_date} />
            </FormCell>
            <FormCell>
              <DetailField label="Resignation date" value={employee.date_of_resignation} />
            </FormCell>
            <FormCell>
              <DetailField label="Auto attendance" value={yesNo(employee.auto_attendance)} />
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
                <DetailField
                  label="Policy override"
                  value={employee.policy_id ? 'Yes' : 'Inherit'}
                />
              </FormCell>
              <FormCell>
                <DetailField
                  label="Schedule override"
                  value={employee.work_schedule_id ? 'Yes' : 'Inherit'}
                />
              </FormCell>
              <FormCell>
                <DetailField
                  label="Location override"
                  value={employee.work_location_id ? 'Yes' : 'Inherit'}
                />
              </FormCell>
              <FormCell>
                <DetailField
                  label="Leave package override"
                  value={employee.leave_package_id ? 'Yes' : 'Inherit'}
                />
              </FormCell>
              <FormCell>{null}</FormCell>
              <FormCell>{null}</FormCell>
            </FormGrid>

            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem' }}>
                Effective defaults
              </Typography>
              <FormGrid>
                <FormCell>
                  <DetailField label="Policy" value={formatEffective(defaults?.policy)} />
                </FormCell>
                <FormCell>
                  <DetailField
                    label="Schedule"
                    value={formatEffective(defaults?.work_schedule)}
                  />
                </FormCell>
                <FormCell>
                  <DetailField
                    label="Location"
                    value={formatEffective(defaults?.work_location)}
                  />
                </FormCell>
                <FormCell>
                  <DetailField
                    label="Leave package"
                    value={formatEffective(defaults?.leave_package)}
                  />
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
              <DetailField label="Date of birth" value={employee.date_of_birth} />
            </FormCell>
            <FormCell>
              <DetailField label="NRC" value={employee.nrc_number} />
            </FormCell>
            <FormCell>
              <DetailField label="Passport" value={employee.passport_number} />
            </FormCell>
            <FormCell>
              <DetailField label="SSB number" value={employee.ssb_number} />
            </FormCell>
            <FormCell>
              <DetailField label="Foreigner" value={yesNo(employee.is_foreigner)} />
            </FormCell>
            <FormCell>
              <DetailField
                label="Income tax applicable"
                value={yesNo(employee.income_tax_applicable)}
              />
            </FormCell>
            <FormCell span={3}>
              <DetailField label="Residential address" value={employee.residential_address} />
            </FormCell>
          </FormGrid>
        </CardContent>
      </Card>
    </Stack>
  );
}
