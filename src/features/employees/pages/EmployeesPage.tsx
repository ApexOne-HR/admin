import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Button,
  Chip,
  IconButton,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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

function statusChip(status: EmployeeStatus) {
  const color =
    status === 'active' ? 'success' : status === 'inactive' ? 'default' : 'error';
  return <Chip size="small" label={status} color={color} />;
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
  const perPage = 15;

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
  const lastPage = useMemo(() => {
    const meta = employeesQuery.data?.meta;
    return typeof meta?.last_page === 'number' ? meta.last_page : 1;
  }, [employeesQuery.data?.meta]);

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
        <Link
          component={RouterLink}
          to={`/employees/${row.id}`}
          underline="hover"
          color="inherit"
        >
          {row.full_name}
        </Link>
      ),
    },
    { key: 'company', header: 'Company', render: (row) => row.company?.name ?? '—' },
    { key: 'division', header: 'Division', render: (row) => row.division?.name ?? '—' },
    { key: 'designation', header: 'Title', render: (row) => row.designation?.name ?? '—' },
    { key: 'status', header: 'Status', render: (row) => statusChip(row.status) },
    {
      key: 'service',
      header: 'Years',
      render: (row) => String(row.service_years ?? 0),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            onClick={() => navigate(`/employees/${row.id}`)}
            aria-label="View"
          >
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
          <PermissionGate permission="employees.update">
            <IconButton
              size="small"
              onClick={() => navigate(`/employees/${row.id}/edit`)}
              aria-label="Edit"
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </PermissionGate>
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
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="terminated">Terminated</MenuItem>
        </TextField>
      </Stack>

      {employeesQuery.isError ? <RbacQueryError error={employeesQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={employees}
        getRowKey={(row) => row.id}
        isLoading={employeesQuery.isLoading}
        emptyState={
          <EmptyState title="No employees" description="Create the first employee for a company." />
        }
      />
      {lastPage > 1 && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Typography variant="body2">
            Page {page} of {lastPage}
          </Typography>
          <Button size="small" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
