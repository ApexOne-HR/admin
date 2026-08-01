import AddRoundedIcon from '@mui/icons-material/AddRounded';
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
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import {
  useCompaniesQuery,
  useDepartmentsQuery,
  useDivisionsQuery,
} from '@/features/organization/hooks/useOrganizationQueries';
import {
  ForbiddenAlert,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import { useAttendanceRecordsQuery } from '../hooks/useAttendanceQueries';
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '../types/attendance.type';
import {
  ATTENDANCE_STATUS_OPTIONS,
  attendanceSourceLabel,
  attendanceStatusMeta,
  formatAttendanceDateTime,
  formatMinutes,
} from '../utils/attendance';

function localDate(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function defaultDateRange() {
  const today = new Date();
  const value = localDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return {
    from: value,
    to: value,
  };
}

const initialDates = defaultDateRange();

export function AttendanceRecordsPage() {
  const { session } = useAdminSession();
  const navigate = useNavigate();
  const canView = can(session?.user, 'attendance.view');
  const canCreate = can(session?.user, 'attendance.manage');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [q, setQ] = useState('');
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [divisionId, setDivisionId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState(initialDates.from);
  const [dateTo, setDateTo] = useState(initialDates.to);
  const [status, setStatus] = useState<AttendanceStatus | ''>('');

  const companiesQuery = useCompaniesQuery(canView);
  const divisionsQuery = useDivisionsQuery(
    companyId === '' ? undefined : companyId,
    canView,
  );
  const departmentsQuery = useDepartmentsQuery(
    divisionId === '' ? undefined : divisionId,
    canView && divisionId !== '',
  );
  const recordsQuery = useAttendanceRecordsQuery(
    {
      page,
      per_page: perPage,
      q: q.trim() || undefined,
      company_id: companyId === '' ? undefined : companyId,
      division_id: divisionId === '' ? undefined : divisionId,
      department_id: departmentId === '' ? undefined : departmentId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: status || undefined,
    },
    canView,
  );

  const records = recordsQuery.data?.records ?? [];
  const meta = recordsQuery.data?.meta;
  const hasCustomFilters =
    q !== ''
    || companyId !== ''
    || divisionId !== ''
    || departmentId !== ''
    || dateFrom !== initialDates.from
    || dateTo !== initialDates.to
    || status !== ''
    || page !== 1;

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Attendance" description="Employee attendance records." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const resetFilters = () => {
    setQ('');
    setCompanyId('');
    setDivisionId('');
    setDepartmentId('');
    setDateFrom(initialDates.from);
    setDateTo(initialDates.to);
    setStatus('');
    setPage(1);
  };

  const columns: AppTableColumn<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Work date',
      width: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.work_date}
        </Typography>
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <Box>
          <Link
            component={RouterLink}
            to={`/attendance/${row.id}`}
            underline="hover"
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            {row.employee?.full_name ?? '—'}
          </Link>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {row.employee?.employee_code ?? '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.company?.name ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {[row.division?.name, row.department?.name].filter(Boolean).join(' · ') || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'punches',
      header: 'Check in / out',
      render: (row) => (
        <Box>
          <Typography variant="body2">
            {formatAttendanceDateTime(row.check_in_at, row.timezone)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatAttendanceDateTime(row.check_out_at, row.timezone)}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'check_in_location',
      header: 'Check-in location',
      render: (row) => (
        <Typography variant="body2" color={row.check_in_location ? 'text.primary' : 'text.secondary'}>
          {row.check_in_location?.name ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const statusMeta = attendanceStatusMeta(row.status);
        const statusChip = (
          <Chip
            size="small"
            label={statusMeta.label}
            color={statusMeta.color}
            variant="outlined"
          />
        );

        return (
          <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
            {row.status === 'incomplete' ? (
              <Tooltip title="Missing check-out">{statusChip}</Tooltip>
            ) : statusChip}
            {row.leave_duration ? (
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={
                  row.leave_duration === 'full_day'
                    ? 'Full-day leave'
                    : row.leave_session_label
                }
              />
            ) : null}
            {row.is_voided ? <Chip size="small" label="Voided" color="error" /> : null}
          </Stack>
        );
      },
    },
    {
      key: 'minutes',
      header: 'Worked / exceptions',
      render: (row) => {
        if (row.status === 'absent' || row.leave_duration === 'full_day') {
          return <Typography color="text.secondary">—</Typography>;
        }

        return (
          <Box>
            <Typography variant="body2">{formatMinutes(row.worked_minutes)} worked</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.late_minutes > 0 ? `${row.late_minutes}m late` : 'On time'}
              {row.early_leave_minutes > 0 ? ` · ${row.early_leave_minutes}m early` : ''}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => attendanceSourceLabel(row.source),
    },
    {
      key: 'actions',
      header: '',
      width: 56,
      align: 'right',
      render: (row) => (
        <Tooltip title="View attendance">
          <IconButton
            size="small"
            aria-label="View attendance"
            onClick={() => navigate(`/attendance/${row.id}`)}
          >
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Attendance"
        description="Review and create scoped employee attendance records."
        action={
          canCreate ? (
            <Button
              component={RouterLink}
              to="/attendance/new"
              variant="contained"
              startIcon={<AddRoundedIcon />}
            >
              Create attendance
            </Button>
          ) : null
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ flexWrap: 'wrap' }}
      >
        <TextField
          size="small"
          label="Employee search"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 190 }}
        />
        <TextField
          select
          size="small"
          label="Company"
          value={companyId}
          onChange={(event) => {
            setCompanyId(event.target.value === '' ? '' : Number(event.target.value));
            setDivisionId('');
            setDepartmentId('');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All companies</MenuItem>
          {(companiesQuery.data ?? []).map((company) => (
            <MenuItem key={company.id} value={company.id}>
              {company.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Division"
          value={divisionId}
          disabled={companyId === ''}
          onChange={(event) => {
            setDivisionId(event.target.value === '' ? '' : Number(event.target.value));
            setDepartmentId('');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All divisions</MenuItem>
          {(divisionsQuery.data ?? []).map((division) => (
            <MenuItem key={division.id} value={division.id}>
              {division.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Department"
          value={departmentId}
          disabled={divisionId === ''}
          onChange={(event) => {
            setDepartmentId(event.target.value === '' ? '' : Number(event.target.value));
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All departments</MenuItem>
          {(departmentsQuery.data ?? []).map((department) => (
            <MenuItem key={department.id} value={department.id}>
              {department.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="From"
          value={dateFrom}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => {
            setDateFrom(event.target.value);
            setPage(1);
          }}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          value={dateTo}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => {
            setDateTo(event.target.value);
            setPage(1);
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AttendanceStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {ATTENDANCE_STATUS_OPTIONS.map((value) => (
            <MenuItem key={value} value={value}>
              {attendanceStatusMeta(value).label}
            </MenuItem>
          ))}
        </TextField>
        <Tooltip title="Reset filters">
          <span>
            <IconButton
              aria-label="Reset filters"
              disabled={!hasCustomFilters}
              onClick={resetFilters}
              sx={{ color: hasCustomFilters ? 'warning.main' : 'action.active' }}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {recordsQuery.isError ? <RbacQueryError error={recordsQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={records}
        getRowKey={(row) => row.id}
        isLoading={recordsQuery.isLoading}
        emptyState={
          <EmptyState
            title="No attendance records"
            description="No records match the selected filters."
          />
        }
        footer={
          meta && meta.total > 0 ? (
            <AppPagination
              page={page}
              lastPage={meta.last_page}
              perPage={perPage}
              total={meta.total}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
            />
          ) : undefined
        }
      />
    </Stack>
  );
}
