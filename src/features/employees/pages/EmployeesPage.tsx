import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Link,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppPagination } from '@/components/common/AppPagination';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import {
  useCompaniesQuery,
  useDivisionsQuery,
} from '@/features/organization/hooks/useOrganizationQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import {
  useDeleteEmployeeMutation,
  useEmployeesQuery,
} from '../hooks/useEmployeeQueries';
import type { Employee, EmployeeStatus } from '../types/employee.type';
import {
  EMPLOYEE_STATUS_OPTIONS,
  employeeStatusMeta,
} from '../utils/employeeStatus';

function missingSectionsLabel(sections: string[] | undefined) {
  if (!sections || sections.length === 0) {
    return 'Incomplete profile data';
  }

  const labels: Record<string, string> = {
    banks: 'Banks',
    documents: 'Documents',
    emergency: 'Emergency',
    education: 'Education',
    leave: 'Leave balances',
  };

  return `Missing: ${sections.map((key) => labels[key] ?? key).join(', ')}`;
}

function statusChip(status: EmployeeStatus) {
  const meta = employeeStatusMeta(status);
  return <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />;
}

export function EmployeesPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const canView = can(session?.user, 'employees.view');
  const canCreate = can(session?.user, 'employees.create');

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState<number | ''>('');
  const [filterDivisionId, setFilterDivisionId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | ''>('');
  const [perPage, setPerPage] = useState(10);

  const listParams = {
    page,
    per_page: perPage,
    q: q.trim() || undefined,
    company_id: filterCompanyId === '' ? undefined : Number(filterCompanyId),
    division_id: filterDivisionId === '' ? undefined : Number(filterDivisionId),
    status: filterStatus,
  };

  const companiesQuery = useCompaniesQuery(canView);
  const divisionsQuery = useDivisionsQuery(
    filterCompanyId === '' ? undefined : Number(filterCompanyId),
    canView,
  );
  const employeesQuery = useEmployeesQuery(listParams, canView);
  const deleteEmployee = useDeleteEmployeeMutation();

  const companies = companiesQuery.data ?? [];
  const filterDivisions = divisionsQuery.data ?? [];
  const employees = employeesQuery.data?.employees ?? [];
  const paginationMeta = employeesQuery.data?.meta;
  const lastPage = typeof paginationMeta?.last_page === 'number' ? paginationMeta.last_page : 1;
  const hasActiveFilters =
    q !== ''
    || filterCompanyId !== ''
    || filterDivisionId !== ''
    || filterStatus !== ''
    || page !== 1;

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Employees" description="Employee directory and org placement." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const handleDeactivate = async (row: Employee) => {
    const ok = await confirm({
      title: 'Deactivate employee',
      description: `Deactivate ${row.full_name} (${row.employee_code})?`,
      confirmLabel: 'Deactivate',
      confirmColor: 'error',
    });
    if (!ok) return;
    try {
      await deleteEmployee.mutateAsync(row.id);
      toast.success('Employee deactivated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: AppTableColumn<Employee>[] = [
    {
      key: 'index',
      header: '#',
      width: 56,
      render: (_row, index) => (page - 1) * perPage + index + 1,
    },
    {
      key: 'code',
      header: 'Code',
      render: (row) => (
        <Link
          component={RouterLink}
          to={`/employees/${row.id}`}
          underline="hover"
          color="inherit"
          sx={{ fontWeight: 600 }}
        >
          {row.employee_code}
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Box>
          <Link
            component={RouterLink}
            to={`/employees/${row.id}`}
            underline="hover"
            color="inherit"
            sx={{ display: 'block' }}
          >
            {row.full_name}
          </Link>
          <Typography variant="caption" color="text.secondary">
            {row.myanmar_name ?? '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'company',
      header: 'Company / Division',
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.company?.name ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.division?.name ?? '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'designation',
      header: 'Designation / Department',
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.designation?.name ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.department?.name ?? '—'}
          </Typography>
        </Box>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => statusChip(row.status) },
    {
      key: 'service',
      header: 'Service Years',
      render: (row) => String(row.service_years ?? 0),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
          {row.profile_incomplete ? (
            <Tooltip title={missingSectionsLabel(row.missing_sections)}>
              <IconButton size="small" color="warning" aria-label="Incomplete profile">
                <ErrorOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          <IconButton
            size="small"
            onClick={() => navigate(`/employees/${row.id}`)}
            aria-label="View"
          >
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
          <PermissionGate permission="employees.deactivate">
            <IconButton
              size="small"
              color="error"
              onClick={() => void handleDeactivate(row)}
              aria-label="Deactivate"
            >
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </PermissionGate>
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Employees"
        description="Directory, org placement, and inheritance overrides."
        action={
          canCreate ? (
            <Button
              component={RouterLink}
              to="/employees/new"
              variant="contained"
              startIcon={<AddRoundedIcon />}
            >
              Add employee
            </Button>
          ) : null
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          label="Search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="Company"
          value={filterCompanyId}
          onChange={(e) => {
            setFilterCompanyId(e.target.value === '' ? '' : Number(e.target.value));
            setFilterDivisionId('');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          {companies.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Division"
          value={filterDivisionId}
          onChange={(e) => {
            setFilterDivisionId(e.target.value === '' ? '' : Number(e.target.value));
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
          disabled={filterCompanyId === ''}
        >
          <MenuItem value="">All</MenuItem>
          {filterDivisions.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as EmployeeStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          {EMPLOYEE_STATUS_OPTIONS.map((value) => (
            <MenuItem key={value} value={value}>
              {employeeStatusMeta(value).label}
            </MenuItem>
          ))}
        </TextField>
        <Tooltip title="Clear filters">
          <span>
            <IconButton
              aria-label="Clear filters"
              sx={{
                alignSelf: { md: 'center' },
                color: hasActiveFilters ? 'warning.main' : 'action.active',
              }}
              onClick={() => {
                setQ('');
                setFilterCompanyId('');
                setFilterDivisionId('');
                setFilterStatus('');
                setPage(1);
              }}
              disabled={
                !hasActiveFilters
              }
            >
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {employeesQuery.isError ? <RbacQueryError error={employeesQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={employees}
        getRowKey={(row) => row.id}
        isLoading={employeesQuery.isLoading}
        footer={
          paginationMeta && paginationMeta.total > 0 ? (
            <AppPagination
              page={page}
              lastPage={lastPage}
              perPage={perPage}
              total={paginationMeta.total}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
            />
          ) : undefined
        }
        emptyState={
          <EmptyState title="No employees" description="Create the first employee for a company." />
        }
      />
    </Stack>
  );
}
