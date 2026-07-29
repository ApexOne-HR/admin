import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { AppLoader } from '@/components/common/AppLoader';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import { EmployeeAccountTab } from '../components/EmployeeAccountTab';
import { EmployeeAssetsTab } from '../components/EmployeeAssetsTab';
import { EmployeeBanksTab } from '../components/EmployeeBanksTab';
import { EmployeeCompensationTab } from '../components/EmployeeCompensationTab';
import { EmployeeDocumentsTab } from '../components/EmployeeDocumentsTab';
import { EmployeeEducationsTab } from '../components/EmployeeEducationsTab';
import { EmployeeEmergencyContactsTab } from '../components/EmployeeEmergencyContactsTab';
import { EmployeeLeaveAllocationsTab } from '../components/EmployeeLeaveAllocationsTab';
import { EmployeePersonalInformationTab } from '../components/EmployeePersonalInformationTab';
import { useEmployeeQuery } from '../hooks/useEmployeeQueries';
import type { EffectiveDefault, EmployeeStatus } from '../types/employee.type';
import { employeeStatusMeta } from '../utils/employeeStatus';

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
      <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word', fontWeight: 500 }}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Typography>
    </Box>
  );
}

function statusChip(status: EmployeeStatus) {
  const meta = employeeStatusMeta(status);
  return <Chip size="small" label={meta.label} color={meta.color} />;
}

function sectionTitle(icon: ReactNode, label: string) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {icon}
      <Box component="span">{label}</Box>
    </Stack>
  );
}

function tabLabel(icon: ReactNode, label: string, incomplete = false) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      {icon}
      <Box component="span">{label}</Box>
      {incomplete ? (
        <ErrorOutlineRoundedIcon fontSize="small" color="warning" />
      ) : null}
    </Stack>
  );
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

function initialDetailTab(searchParams: URLSearchParams): number {
  const tab = searchParams.get('tab');
  if (tab === 'account') return 1;
  if (tab === 'personal' || tab === '2') return 2;
  if (tab === 'documents' || tab === '3') return 3;
  if (tab === 'banks' || tab === '4') return 4;
  if (tab === 'emergency' || tab === '5') return 5;
  if (tab === 'education' || tab === '6') return 6;
  if (tab === 'leave' || tab === '7') return 7;
  if (tab === 'compensation' || tab === '8') return 8;
  if (tab === 'assets' || tab === '9') return 9;
  if (tab === '1') return 1;
  return 0;
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);
  const [searchParams] = useSearchParams();
  const { session } = useAdminSession();
  const canView = can(session?.user, 'employees.view');
  const canUpdate = can(session?.user, 'employees.update');
  const canManageAccount = can(session?.user, 'employees.manage_account');
  const canManageSalary = can(session?.user, 'employees.manage_salary');
  const canManageAssets = can(session?.user, 'employees.manage_assets');
  const [tab, setTab] = useState(() => initialDetailTab(searchParams));

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
  const missing = new Set(employee.missing_sections ?? []);

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={employee.full_name}
        description={`${employee.employee_code} · ${employee.company?.name ?? '—'}`}
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

      <Tabs
        value={tab}
        onChange={(_event, value: number) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab
          label={tabLabel(
            <PersonOutlineOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />,
            'Employee Profile',
          )}
        />
        <Tab
          label={tabLabel(
            <ManageAccountsRoundedIcon fontSize="small" sx={{ color: 'secondary.main' }} />,
            'Account',
          )}
        />
        <Tab
          label={tabLabel(
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />,
            'Personal Information',
          )}
        />
        <Tab
          label={tabLabel(
            <FolderOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />,
            'Documents',
            missing.has('documents'),
          )}
        />
        <Tab
          label={tabLabel(
            <CreditCardOutlinedIcon fontSize="small" sx={{ color: 'secondary.main' }} />,
            'Banks',
            missing.has('banks'),
          )}
        />
        <Tab
          label={tabLabel(
            <CallOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} />,
            'Emergency',
            missing.has('emergency'),
          )}
        />
        <Tab
          label={tabLabel(
            <SchoolOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />,
            'Education',
            missing.has('education'),
          )}
        />
        <Tab
          label={tabLabel(
            <AssignmentTurnedInOutlinedIcon fontSize="small" sx={{ color: 'success.main' }} />,
            'Leave balances',
            missing.has('leave'),
          )}
        />
        <Tab
          label={tabLabel(
            <PaymentsOutlinedIcon fontSize="small" sx={{ color: 'success.dark' }} />,
            'Compensation',
            missing.has('compensation'),
          )}
        />
        <Tab
          label={tabLabel(
            <Inventory2OutlinedIcon fontSize="small" sx={{ color: 'warning.dark' }} />,
            'Assets',
          )}
        />
      </Tabs>

      {tab === 0 ? (
        <Stack spacing={2.5}>
      <Card variant="outlined">
        <CardHeader
          title={sectionTitle(
            <BadgeOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />,
            'Identity',
          )}
          sx={cardHeaderSx}
          action={
            <PermissionGate permission="employees.update">
              <Button
                component={RouterLink}
                to={`/employees/${employee.id}/edit`}
                size="small"
                startIcon={<EditRoundedIcon />}
                disabled={!canUpdate}
              >
                Edit
              </Button>
            </PermissionGate>
          }
        />
        <CardContent>
          <FormGrid>
            <FormCell>
              <DetailField label="Employee code" value={employee.employee_code} />
            </FormCell>
            <FormCell>
              <DetailField label="Sir name" value={employee.sir_name} />
            </FormCell>
            <FormCell>
              <DetailField label="Full name" value={employee.full_name} />
            </FormCell>
            <FormCell>
              <DetailField label="Myanmar name" value={employee.myanmar_name} />
            </FormCell>
            <FormCell>
              <DetailField label="Status" value={statusChip(employee.status)} />
            </FormCell>
            <FormCell>
              <DetailField label="Work email" value={employee.email} />
            </FormCell>
            <FormCell>
              <DetailField label="Work phone" value={employee.phone} />
            </FormCell>
            <FormCell>{null}</FormCell>
            <FormCell>{null}</FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title={sectionTitle(
            <BusinessOutlinedIcon fontSize="small" sx={{ color: 'secondary.main' }} />,
            'Organization',
          )}
          sx={cardHeaderSx}
        />
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
        <CardHeader
          title={sectionTitle(
            <WorkOutlineRoundedIcon fontSize="small" sx={{ color: 'success.main' }} />,
            'Employment',
          )}
          sx={cardHeaderSx}
        />
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
              <DetailField label="Service years" value={String(employee.service_years ?? 0)} />
            </FormCell>
            <FormCell>
              <DetailField label="Auto attendance" value={yesNo(employee.auto_attendance)} />
            </FormCell>
            <FormCell>{null}</FormCell>
          </FormGrid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title={sectionTitle(
            <TuneOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />,
            'Work settings',
          )}
          sx={cardHeaderSx}
        />
        <CardContent>
          <FormGrid>
            <FormCell>
              <DetailField label="Policy" value={formatEffective(defaults?.policy)} />
            </FormCell>
            <FormCell>
              <DetailField
                label="Work schedule"
                value={formatEffective(defaults?.work_schedule)}
              />
            </FormCell>
            <FormCell>
              <DetailField
                label="Work location"
                value={formatEffective(defaults?.work_location)}
              />
            </FormCell>
            <FormCell>
              <DetailField
                label="Work location address"
                value={employee.work_location_address}
              />
            </FormCell>
            <FormCell>
              <DetailField
                label="Leave package"
                value={formatEffective(defaults?.leave_package)}
              />
            </FormCell>
            <FormCell>{null}</FormCell>
          </FormGrid>
        </CardContent>
      </Card>
        </Stack>
      ) : null}

      {tab === 1 ? (
        <EmployeeAccountTab employee={employee} canManage={canManageAccount} />
      ) : null}

      {tab === 2 ? (
        <EmployeePersonalInformationTab employee={employee} canEdit={canUpdate} />
      ) : null}

      {tab === 3 ? (
        <EmployeeDocumentsTab employeeId={employee.id} canEdit={canUpdate} />
      ) : null}

      {tab === 4 ? (
        <EmployeeBanksTab employeeId={employee.id} canEdit={canUpdate} />
      ) : null}

      {tab === 5 ? (
        <EmployeeEmergencyContactsTab employeeId={employee.id} canEdit={canUpdate} />
      ) : null}

      {tab === 6 ? (
        <EmployeeEducationsTab employeeId={employee.id} canEdit={canUpdate} />
      ) : null}

      {tab === 7 ? (
        <EmployeeLeaveAllocationsTab
          employeeId={employee.id}
          companyId={employee.company_id}
          canEdit={canUpdate}
        />
      ) : null}

      {tab === 8 ? (
        <EmployeeCompensationTab
          employeeId={employee.id}
          companyId={employee.company_id}
          canEdit={canManageSalary}
        />
      ) : null}

      {tab === 9 ? (
        <EmployeeAssetsTab employeeId={employee.id} canManage={canManageAssets} />
      ) : null}
    </Stack>
  );
}
