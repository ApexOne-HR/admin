import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  Link,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppLoader } from '@/components/common/AppLoader';
import { AppModal } from '@/components/common/AppModal';
import { AppPagination } from '@/components/common/AppPagination';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import {
  useAttendanceRecordsQuery,
  useBulkCreateAttendanceRecordsMutation,
  useCreateAttendanceRecordMutation,
} from '@/features/attendance/hooks/useAttendanceQueries';
import type {
  AttendanceBulkCreatePayload,
  AttendanceCreatePayload,
  AttendanceEntryType,
  AttendanceRecord,
} from '@/features/attendance/types/attendance.type';
import {
  ATTENDANCE_ENTRY_TYPE_OPTIONS,
  attendanceSourceLabel,
  attendanceStatusMeta,
  formatAttendanceDateTime,
  formatMinutes,
  localTimeFromIso,
} from '@/features/attendance/utils/attendance';
import { employeeAttendanceReturnState } from '@/features/attendance/utils/attendanceNavigation';
import { holidayKeys } from '@/features/holidays/hooks/useHolidaysQueries';
import * as holidaysService from '@/features/holidays/services/holidays.service';
import {
  useLocationsQuery,
  usePolicyQuery,
  useWorkScheduleQuery,
} from '@/features/masters/hooks/useMastersQueries';
import type { WorkingDay } from '@/features/masters/types/masters.type';
import { ForbiddenAlert } from '@/features/rbac/components/RbacShared';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

type HistoryScope = 'month' | 'all' | 'calendar';

type Props = {
  employeeId: number;
  companyId: number;
  employeeName: string;
  /** Employee-level schedule override only. */
  workScheduleId?: number | null;
  /** Resolved employee/division/company schedule from effective defaults. */
  effectiveWorkScheduleId?: number | null;
  policyId?: number | null;
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function localToday(): string {
  const today = new Date();
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
}

function currentMonthRange(): { from: string; to: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(lastDay)}`,
  };
}

function monthRangeFrom(year: number, month: number): { from: string; to: string } {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(lastDay)}`,
  };
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

/** Monday-first calendar cells for a month (null = padding). */
function buildCalendarCells(year: number, month: number): Array<string | null> {
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  // JS: 0=Sun … 6=Sat → Monday-first index 0=Mon … 6=Sun
  const mondayIndex = (first.getDay() + 6) % 7;
  const cells: Array<string | null> = Array.from({ length: mondayIndex }, () => null);
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(`${year}-${pad2(month)}-${pad2(day)}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function datesInclusive(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const result: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor <= end) {
    result.push(
      `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function weekdayKey(date: string): (typeof WEEKDAY_KEYS)[number] {
  return WEEKDAY_KEYS[new Date(`${date}T12:00:00`).getDay()];
}

function defaultTimes(type: AttendanceEntryType) {
  if (type === 'morning_leave') {
    return { checkIn: '13:00', checkOut: '17:00' };
  }
  if (type === 'evening_leave') {
    return { checkIn: '09:00', checkOut: '12:00' };
  }
  return { checkIn: '09:00', checkOut: '17:00' };
}

export function EmployeeAttendanceTab({
  employeeId,
  companyId,
  employeeName,
  workScheduleId = null,
  effectiveWorkScheduleId = null,
  policyId = null,
}: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, token } = useAdminSession();
  const canView = can(session?.user, 'attendance.view');
  const canManage = can(session?.user, 'attendance.manage');
  const canViewOrg = can(session?.user, 'organizations.view');
  const canViewHolidays = can(session?.user, 'holidays.view');

  const [scope, setScope] = useState<HistoryScope>('calendar');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const initialMonth = useMemo(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  }, []);
  const [calendarYear, setCalendarYear] = useState(initialMonth.year);
  const [calendarMonth, setCalendarMonth] = useState(initialMonth.month);

  const monthRange = useMemo(() => currentMonthRange(), []);
  const calendarRange = useMemo(
    () => monthRangeFrom(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
  );
  const today = localToday();
  const listParams = useMemo(() => {
    if (scope === 'calendar') {
      return {
        page: 1,
        per_page: 100,
        employee_id: employeeId,
        date_from: calendarRange.from,
        date_to: calendarRange.to,
      };
    }

    return {
      page,
      per_page: perPage,
      employee_id: employeeId,
      date_from: scope === 'month' ? monthRange.from : undefined,
      date_to: scope === 'month' ? monthRange.to : undefined,
    };
  }, [
    calendarRange.from,
    calendarRange.to,
    employeeId,
    monthRange.from,
    monthRange.to,
    page,
    perPage,
    scope,
  ]);

  const recordsQuery = useAttendanceRecordsQuery(listParams, canView);
  const createRecord = useCreateAttendanceRecordMutation();
  const bulkCreate = useBulkCreateAttendanceRecordsMutation(employeeId);
  const locationsQuery = useLocationsQuery(
    companyId,
    canManage && (createOpen || bulkOpen),
  );
  const needsScheduleContext =
    canViewOrg && (bulkOpen || scope === 'calendar');
  const policyQuery = usePolicyQuery(
    policyId,
    needsScheduleContext && Boolean(policyId),
  );
  const policy = policyQuery.data ?? null;
  // Match API: employee override → policy schedule → division/company effective default.
  const resolvedScheduleId =
    workScheduleId
    ?? policy?.work_schedule_id
    ?? effectiveWorkScheduleId
    ?? null;
  const scheduleQuery = useWorkScheduleQuery(
    resolvedScheduleId,
    needsScheduleContext && Boolean(resolvedScheduleId),
  );
  const workSchedule = scheduleQuery.data ?? null;
  const holidayCalendarId = policy?.holiday_calendar_id ?? null;

  const workingDays = useMemo(() => {
    if (!workSchedule) return null;
    if (workSchedule.working_days?.length) {
      return new Set<WorkingDay>(workSchedule.working_days);
    }
    const fromDays = (workSchedule.days ?? [])
      .filter((day) => day.is_working)
      .map((day) => day.day);
    return fromDays.length > 0 ? new Set<WorkingDay>(fromDays) : null;
  }, [workSchedule]);

  const [workDate, setWorkDate] = useState(localToday);
  const [attendanceType, setAttendanceType] =
    useState<AttendanceEntryType>('present');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [checkInLocationId, setCheckInLocationId] = useState<number | ''>('');
  const [checkOutLocationId, setCheckOutLocationId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [rangeFrom, setRangeFrom] = useState(monthRange.from);
  const [rangeTo, setRangeTo] = useState(
    monthRange.to > localToday() ? localToday() : monthRange.to,
  );
  const [bulkType, setBulkType] = useState<AttendanceEntryType>('present');
  const [bulkCheckIn, setBulkCheckIn] = useState('09:00');
  const [bulkCheckOut, setBulkCheckOut] = useState('17:00');
  const [bulkCheckInLocationId, setBulkCheckInLocationId] = useState<number | ''>(
    '',
  );
  const [bulkCheckOutLocationId, setBulkCheckOutLocationId] = useState<
    number | ''
  >('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSkipped, setBulkSkipped] = useState<
    Array<{ date: string; reason: string }>
  >([]);

  const holidayYears = useMemo(() => {
    const years = new Set<number>();
    if (bulkOpen) {
      if (rangeFrom) years.add(Number(rangeFrom.slice(0, 4)));
      if (rangeTo) years.add(Number(rangeTo.slice(0, 4)));
    }
    if (scope === 'calendar') {
      years.add(calendarYear);
    }
    if (years.size === 0) years.add(new Date().getFullYear());
    return [...years].sort((a, b) => a - b);
  }, [bulkOpen, calendarYear, rangeFrom, rangeTo, scope]);

  const holidayQueries = useQueries({
    queries: holidayYears.map((year) => ({
      queryKey: holidayKeys.holidays({
        holiday_calendar_id: holidayCalendarId ?? 0,
        year,
      }),
      enabled:
        canViewHolidays
        && (bulkOpen || scope === 'calendar')
        && Boolean(token)
        && Boolean(holidayCalendarId),
      queryFn: () =>
        holidaysService.listHolidays(token as string, {
          holiday_calendar_id: holidayCalendarId as number,
          year,
        }),
    })),
  });

  const holidayDates = useMemo(() => {
    const dates = new Set<string>();
    for (const query of holidayQueries) {
      for (const holiday of query.data ?? []) {
        dates.add(holiday.date);
      }
    }
    return dates;
  }, [holidayQueries]);

  const holidayNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const query of holidayQueries) {
      for (const holiday of query.data ?? []) {
        names.set(holiday.date, holiday.name);
      }
    }
    return names;
  }, [holidayQueries]);

  if (!canView) {
    return <ForbiddenAlert />;
  }

  const records = recordsQuery.data?.records ?? [];
  const meta = recordsQuery.data?.meta;
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records) {
      map.set(record.work_date, record);
    }
    return map;
  }, [records]);
  const calendarCells = useMemo(
    () => buildCalendarCells(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
  );
  const locations = (locationsQuery.data ?? []).filter((location) => location.is_active);
  const requiresPunch =
    attendanceType !== 'absent' && attendanceType !== 'full_day_leave';
  const bulkRequiresPunch =
    bulkType !== 'absent' && bulkType !== 'full_day_leave';

  const resetCreateForm = () => {
    setWorkDate(localToday());
    setAttendanceType('present');
    setCheckInTime('09:00');
    setCheckOutTime('17:00');
    setCheckInLocationId('');
    setCheckOutLocationId('');
    setReason('');
    setFormError(null);
  };

  const openCreateForDate = (date: string) => {
    resetCreateForm();
    setWorkDate(date);
    setCreateOpen(true);
  };

  const resetBulkForm = () => {
    setBulkDates([]);
    setRangeFrom(monthRange.from);
    setRangeTo(monthRange.to > localToday() ? localToday() : monthRange.to);
    setBulkType('present');
    setBulkCheckIn('09:00');
    setBulkCheckOut('17:00');
    setBulkCheckInLocationId('');
    setBulkCheckOutLocationId('');
    setBulkReason('');
    setBulkError(null);
    setBulkSkipped([]);
  };

  const changeCreateType = (nextType: AttendanceEntryType) => {
    const times = defaultTimes(nextType);
    setAttendanceType(nextType);
    setCheckInTime(times.checkIn);
    setCheckOutTime(times.checkOut);
    if (nextType === 'absent' || nextType === 'full_day_leave') {
      setCheckInLocationId('');
      setCheckOutLocationId('');
    }
  };

  const changeBulkType = (nextType: AttendanceEntryType) => {
    const times = defaultTimes(nextType);
    setBulkType(nextType);
    setBulkCheckIn(times.checkIn);
    setBulkCheckOut(times.checkOut);
    if (nextType === 'absent' || nextType === 'full_day_leave') {
      setBulkCheckInLocationId('');
      setBulkCheckOutLocationId('');
    }
  };

  const applyRangeHelper = () => {
    const allDates = datesInclusive(rangeFrom, rangeTo);
    if (allDates.length === 0) {
      setBulkError(
        rangeFrom > today || rangeTo > today
          ? 'Future dates are not allowed.'
          : 'Choose a valid date range (from ≤ to).',
      );
      return;
    }

    if (!canViewOrg) {
      setBulkError(
        'Organizations view permission is required to skip off-days from the work schedule.',
      );
      return;
    }

    if (policyId && policyQuery.isLoading) {
      setBulkError('Loading policy… try again in a moment.');
      return;
    }

    if (!resolvedScheduleId) {
      setBulkError(
        'This employee has no effective work schedule, so working days cannot be determined.',
      );
      return;
    }

    if (scheduleQuery.isLoading || !workSchedule) {
      setBulkError(
        scheduleQuery.isLoading
          ? 'Loading work schedule… try again in a moment.'
          : 'Unable to load the employee work schedule for off-day filtering.',
      );
      return;
    }

    if (!workingDays || workingDays.size === 0) {
      setBulkError('The work schedule has no working days configured.');
      return;
    }

    if (
      holidayCalendarId
      && canViewHolidays
      && holidayQueries.some((query) => query.isLoading)
    ) {
      setBulkError('Loading holidays… try again in a moment.');
      return;
    }

    const eligibleDates = allDates.filter((date) => {
      if (date > today) return false;
      if (!workingDays.has(weekdayKey(date))) return false;
      if (holidayDates.has(date)) return false;
      return true;
    });

    if (eligibleDates.length === 0) {
      setBulkError(
        'No working days in this range after skipping off-days, holidays, and future dates.',
      );
      return;
    }
    if (eligibleDates.length > 62) {
      setBulkError('Date range cannot exceed 62 working days.');
      return;
    }

    const skippedCount = allDates.filter((date) => date <= today).length
      - eligibleDates.length;
    setBulkError(null);
    setBulkDates((current) =>
      [...new Set([...current, ...eligibleDates])].sort((a, b) =>
        a.localeCompare(b),
      ),
    );
    if (skippedCount > 0) {
      toast.success(
        `Added ${eligibleDates.length} working day${eligibleDates.length === 1 ? '' : 's'} (skipped ${skippedCount} off-day/holiday).`,
      );
    }
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!workDate) {
      setFormError('Work date is required.');
      return;
    }
    if (workDate > today) {
      setFormError('Future attendance records are not allowed.');
      return;
    }
    if (requiresPunch && !checkInTime) {
      setFormError('Check-in time is required for worked attendance.');
      return;
    }

    const payload: AttendanceCreatePayload = {
      employee_id: employeeId,
      work_date: workDate,
      attendance_type: attendanceType,
      reason: reason.trim() || null,
    };

    if (requiresPunch) {
      payload.check_in_time = checkInTime;
      payload.check_out_time = checkOutTime || null;
      payload.check_in_location_id =
        checkInLocationId === '' ? null : checkInLocationId;
      payload.check_out_location_id =
        checkOutTime === '' || checkOutLocationId === ''
          ? null
          : checkOutLocationId;
    }

    try {
      const record = await createRecord.mutateAsync(payload);
      const [year, month] = record.work_date.split('-').map(Number);
      toast.success('Attendance record created.');
      setCreateOpen(false);
      resetCreateForm();
      setScope('calendar');
      if (Number.isFinite(year) && Number.isFinite(month)) {
        setCalendarYear(year);
        setCalendarMonth(month);
      }
      setPage(1);
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to create attendance record.'));
    }
  };

  const handleBulkCreate = async () => {
    setBulkError(null);
    setBulkSkipped([]);

    if (bulkDates.length === 0) {
      setBulkError('Add at least one work date.');
      return;
    }
    if (bulkDates.length > 62) {
      setBulkError('You can create at most 62 dates at once.');
      return;
    }
    if (bulkRequiresPunch && !bulkCheckIn) {
      setBulkError('Check-in time is required for worked attendance.');
      return;
    }

    const payload: AttendanceBulkCreatePayload = {
      dates: bulkDates,
      attendance_type: bulkType,
      reason: bulkReason.trim() || null,
    };

    if (bulkRequiresPunch) {
      payload.check_in_time = bulkCheckIn;
      payload.check_out_time = bulkCheckOut || null;
      payload.check_in_location_id =
        bulkCheckInLocationId === '' ? null : bulkCheckInLocationId;
      payload.check_out_location_id =
        bulkCheckOut === '' || bulkCheckOutLocationId === ''
          ? null
          : bulkCheckOutLocationId;
    }

    try {
      const result = await bulkCreate.mutateAsync(payload);
      const createdCount = result.created.length;
      const skippedCount = result.skipped.length;

      if (createdCount > 0) {
        toast.success(
          `Created ${createdCount} record${createdCount === 1 ? '' : 's'}${
            skippedCount > 0 ? `, skipped ${skippedCount}` : ''
          }.`,
        );
      } else {
        toast.error(
          skippedCount > 0
            ? `No records created. ${skippedCount} date${skippedCount === 1 ? '' : 's'} skipped.`
            : 'No records created.',
        );
      }

      setBulkSkipped(result.skipped);
      if (skippedCount === 0) {
        setBulkOpen(false);
        resetBulkForm();
      }
    } catch (error) {
      setBulkError(
        getApiErrorMessage(error, 'Unable to bulk create attendance records.'),
      );
    }
  };

  const columns: AppTableColumn<AttendanceRecord>[] = [
    {
      key: 'work_date',
      header: 'Date',
      render: (row) => (
        <Link
          component={RouterLink}
          to={`/attendance/${row.id}`}
          state={employeeAttendanceReturnState(employeeId)}
          underline="hover"
          color="inherit"
          sx={{ fontWeight: 600 }}
        >
          {row.work_date}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const metaStatus = attendanceStatusMeta(row.status);
        return (
          <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
            <Chip
              size="small"
              label={metaStatus.label}
              color={metaStatus.color}
              variant="outlined"
            />
            {row.is_voided ? <Chip size="small" label="Voided" color="error" /> : null}
          </Stack>
        );
      },
    },
    {
      key: 'check_in',
      header: 'Check-in',
      render: (row) => (
        <Box>
          <Typography variant="body2">
            {formatAttendanceDateTime(row.check_in_at, row.timezone)}
          </Typography>
          <Typography
            variant="caption"
            color={row.check_in_location ? 'text.secondary' : 'text.disabled'}
            sx={{ display: 'block' }}
          >
            {row.check_in_location?.name ?? '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'check_out',
      header: 'Check-out',
      render: (row) => (
        <Box>
          <Typography variant="body2">
            {formatAttendanceDateTime(row.check_out_at, row.timezone)}
          </Typography>
          <Typography
            variant="caption"
            color={row.check_out_location ? 'text.secondary' : 'text.disabled'}
            sx={{ display: 'block' }}
          >
            {row.check_out_location?.name ?? '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'worked',
      header: 'Worked',
      render: (row) => formatMinutes(row.worked_minutes),
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
            onClick={() =>
              navigate(`/attendance/${row.id}`, {
                state: employeeAttendanceReturnState(employeeId),
              })
            }
          >
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <Card variant="outlined">
        <CardHeader
          title={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <EventNoteOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Attendance
              </Typography>
            </Stack>
          }
          sx={cardHeaderSx}
          action={
            canManage ? (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => {
                    resetCreateForm();
                    setCreateOpen(true);
                  }}
                >
                  Create
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlaylistAddRoundedIcon />}
                  onClick={() => {
                    resetBulkForm();
                    setBulkOpen(true);
                  }}
                >
                  Bulk create
                </Button>
              </Stack>
            ) : undefined
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Tabs
                value={scope}
                onChange={(_event, value: HistoryScope) => {
                  setScope(value);
                  setPage(1);
                  if (value === 'calendar') {
                    setCalendarYear(initialMonth.year);
                    setCalendarMonth(initialMonth.month);
                  }
                }}
                sx={{
                  minHeight: 36,
                  '& .MuiTabs-indicator': {
                    height: 2,
                  },
                  '& .MuiTab-root': {
                    minHeight: 36,
                    py: 0.5,
                    px: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  },
                }}
              >
                <Tab value="month" label="This month" />
                <Tab value="all" label="All" />
                <Tab value="calendar" label="Calendar" />
              </Tabs>
              {scope === 'calendar' ? (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    aria-label="Previous month"
                    onClick={() => {
                      const next = shiftMonth(calendarYear, calendarMonth, -1);
                      setCalendarYear(next.year);
                      setCalendarMonth(next.month);
                    }}
                  >
                    <ChevronLeftRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 140, textAlign: 'center', fontWeight: 600 }}
                  >
                    {formatMonthLabel(calendarYear, calendarMonth)}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Next month"
                    onClick={() => {
                      const next = shiftMonth(calendarYear, calendarMonth, 1);
                      setCalendarYear(next.year);
                      setCalendarMonth(next.month);
                    }}
                  >
                    <ChevronRightRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ px: { sm: 0.5 } }}>
                  {scope === 'month'
                    ? `${monthRange.from} – ${monthRange.to}`
                    : 'All history'}
                </Typography>
              )}
            </Stack>

            <Divider />

            {recordsQuery.isError ? (
              <Alert severity="error">
                {getApiErrorMessage(
                  recordsQuery.error,
                  'Unable to load attendance records.',
                )}
              </Alert>
            ) : null}

            {!recordsQuery.isError && scope === 'calendar' ? (
              <Stack spacing={1.5}>
                {recordsQuery.isLoading ? (
                  <AppLoader label="Loading calendar…" />
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                      gap: 0.75,
                    }}
                  >
                    {WEEKDAY_LABELS.map((label) => (
                      <Typography
                        key={label}
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 700,
                          textAlign: 'center',
                          py: 0.5,
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                        }}
                      >
                        {label}
                      </Typography>
                    ))}
                    {calendarCells.map((date, index) => {
                      if (!date) {
                        return (
                          <Box
                            key={`pad-${index}`}
                            sx={{
                              minHeight: { xs: 64, sm: 88 },
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              opacity: 0.35,
                            }}
                          />
                        );
                      }

                      const record = recordsByDate.get(date);
                      const isToday = date === today;
                      const statusMeta = record
                        ? attendanceStatusMeta(record.status)
                        : null;
                      const dayNumber = Number(date.slice(8, 10));
                      const holidayName = holidayNames.get(date);
                      const isHoliday = Boolean(holidayName);
                      const isOffDay = Boolean(
                        workingDays && !workingDays.has(weekdayKey(date)),
                      );
                      const mutedDay = !record && (isHoliday || isOffDay);
                      const canCreateOnDate =
                        canManage
                        && !record
                        && !isHoliday
                        && !isOffDay
                        && date <= today;
                      const handleDayClick = () => {
                        if (record) {
                          navigate(`/attendance/${record.id}`, {
                            state: employeeAttendanceReturnState(employeeId),
                          });
                          return;
                        }
                        if (canCreateOnDate) {
                          openCreateForDate(date);
                        }
                      };
                      const dayCell = (
                        <Box
                          component={record || canCreateOnDate ? 'button' : 'div'}
                          type={record || canCreateOnDate ? 'button' : undefined}
                          onClick={
                            record || canCreateOnDate ? handleDayClick : undefined
                          }
                          sx={{
                            width: '100%',
                            minHeight: { xs: 64, sm: 88 },
                            p: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: isToday ? 'primary.main' : 'divider',
                            bgcolor: mutedDay
                              ? 'action.hover'
                              : 'background.paper',
                            textAlign: 'left',
                            cursor:
                              record || canCreateOnDate ? 'pointer' : 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75,
                            transition: 'background-color 120ms ease, border-color 120ms ease',
                            '&:hover':
                              record || canCreateOnDate
                                ? { bgcolor: 'action.hover', borderColor: 'primary.light' }
                                : undefined,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: isToday ? 700 : 600,
                              color: isToday ? 'primary.main' : 'text.secondary',
                            }}
                          >
                            {dayNumber}
                          </Typography>
                          {record && statusMeta ? (
                            <Stack spacing={0.5} sx={{ mt: 'auto' }}>
                              <Chip
                                size="small"
                                label={statusMeta.label}
                                color={statusMeta.color}
                                variant="outlined"
                                sx={{
                                  height: 22,
                                  alignSelf: 'flex-start',
                                  '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                                }}
                              />
                              {record.is_voided ? (
                                <Chip
                                  size="small"
                                  label="Voided"
                                  color="error"
                                  sx={{
                                    height: 20,
                                    alignSelf: 'flex-start',
                                    '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' },
                                  }}
                                />
                              ) : null}
                            </Stack>
                          ) : isHoliday ? (
                            <Tooltip title={holidayName ?? 'Holiday'}>
                              <Box sx={{ mt: 'auto', alignSelf: 'flex-start', maxWidth: '100%' }}>
                                <Chip
                                  size="small"
                                  label={holidayName ?? 'Holiday'}
                                  color="secondary"
                                  variant="outlined"
                                  sx={{
                                    height: 22,
                                    maxWidth: '100%',
                                    '& .MuiChip-label': {
                                      px: 0.75,
                                      fontSize: '0.7rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    },
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          ) : isOffDay ? (
                            <Chip
                              size="small"
                              label="Off day"
                              variant="outlined"
                              sx={{
                                mt: 'auto',
                                height: 22,
                                alignSelf: 'flex-start',
                                color: 'text.secondary',
                                borderColor: 'divider',
                                '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ mt: 'auto' }}
                            >
                              —
                            </Typography>
                          )}
                        </Box>
                      );

                      if (!record) {
                        if (canCreateOnDate) {
                          return (
                            <Tooltip
                              key={date}
                              arrow
                              enterDelay={200}
                              title="Create attendance"
                            >
                              <Box sx={{ width: '100%' }}>{dayCell}</Box>
                            </Tooltip>
                          );
                        }

                        return <Box key={date}>{dayCell}</Box>;
                      }

                      const checkInTimeLabel =
                        localTimeFromIso(record.check_in_at, record.timezone) || '—';
                      const checkOutTimeLabel =
                        localTimeFromIso(record.check_out_at, record.timezone) || '—';
                      const checkInLocationLabel =
                        record.check_in_location?.name ?? '—';
                      const checkOutLocationLabel =
                        record.check_out_location?.name ?? '—';

                      return (
                        <Tooltip
                          key={date}
                          arrow
                          enterDelay={200}
                          title={
                            <Stack spacing={0.5} sx={{ py: 0.25 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {date}
                                {statusMeta ? ` · ${statusMeta.label}` : ''}
                              </Typography>
                              <Typography variant="caption">
                                Check-in: {checkInTimeLabel}
                              </Typography>
                              <Typography variant="caption">
                                Check-out: {checkOutTimeLabel}
                              </Typography>
                              <Typography variant="caption">
                                Check-in location: {checkInLocationLabel}
                              </Typography>
                              <Typography variant="caption">
                                Check-out location: {checkOutLocationLabel}
                              </Typography>
                            </Stack>
                          }
                        >
                          <Box sx={{ width: '100%' }}>{dayCell}</Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              </Stack>
            ) : null}

            {!recordsQuery.isError && scope !== 'calendar' ? (
              <AppTable
                columns={columns}
                rows={records}
                getRowKey={(row) => row.id}
                isLoading={recordsQuery.isLoading}
                loadingLabel="Loading attendance"
                emptyState={
                  <EmptyState
                    title="No attendance records"
                    description={
                      scope === 'month'
                        ? 'No records for this month yet.'
                        : 'No attendance records for this employee.'
                    }
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
                      onPerPageChange={(next) => {
                        setPerPage(next);
                        setPage(1);
                      }}
                    />
                  ) : undefined
                }
              />
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <AppModal
        open={createOpen}
        title="Create attendance"
        description={`Manual attendance for ${employeeName}.`}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => setCreateOpen(false)} disabled={createRecord.isPending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleCreate()}
              disabled={createRecord.isPending}
            >
              {createRecord.isPending ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            required
            fullWidth
            type="date"
            label="Work date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: today },
            }}
          />
          <TextField
            select
            required
            fullWidth
            label="Type"
            value={attendanceType}
            onChange={(event) =>
              changeCreateType(event.target.value as AttendanceEntryType)
            }
          >
            {ATTENDANCE_ENTRY_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {requiresPunch ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Check-in"
                  value={checkInTime}
                  onChange={(event) => setCheckInTime(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="Check-out"
                  value={checkOutTime}
                  onChange={(event) => setCheckOutTime(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Check-in location"
                  value={checkInLocationId}
                  onChange={(event) =>
                    setCheckInLocationId(
                      event.target.value === '' ? '' : Number(event.target.value),
                    )
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Check-out location"
                  value={checkOutLocationId}
                  disabled={!checkOutTime}
                  onChange={(event) =>
                    setCheckOutLocationId(
                      event.target.value === '' ? '' : Number(event.target.value),
                    )
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </>
          ) : null}
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Stack>
      </AppModal>

      <AppModal
        open={bulkOpen}
        title="Bulk create attendance"
        description={`Create Present/Absent for multiple dates for ${employeeName}. Off-days and holidays are skipped when adding a range. Soft-skipped dates are reported after submit.`}
        onClose={() => setBulkOpen(false)}
        maxWidth="lg"
        actions={
          <>
            <Button onClick={() => setBulkOpen(false)} disabled={bulkCreate.isPending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleBulkCreate()}
              disabled={bulkCreate.isPending}
            >
              {bulkCreate.isPending ? 'Creating…' : 'Create selected dates'}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {bulkError ? <Alert severity="error">{bulkError}</Alert> : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              type="date"
              label="Range from"
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: today },
              }}
            />
            <TextField
              fullWidth
              type="date"
              label="Range to"
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: today },
              }}
            />
            <Button variant="outlined" onClick={applyRangeHelper} sx={{ flexShrink: 0 }}>
              Add range
            </Button>
          </Stack>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {bulkDates.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No dates selected yet.
              </Typography>
            ) : (
              bulkDates.map((date) => (
                <Chip
                  key={date}
                  label={date}
                  onDelete={() =>
                    setBulkDates((current) => current.filter((item) => item !== date))
                  }
                />
              ))
            )}
          </Box>

          <Divider />

          <TextField
            select
            required
            fullWidth
            label="Type"
            value={bulkType}
            onChange={(event) =>
              changeBulkType(event.target.value as AttendanceEntryType)
            }
          >
            {ATTENDANCE_ENTRY_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {bulkRequiresPunch ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Check-in"
                  value={bulkCheckIn}
                  onChange={(event) => setBulkCheckIn(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="Check-out"
                  value={bulkCheckOut}
                  onChange={(event) => setBulkCheckOut(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Check-in location"
                  value={bulkCheckInLocationId}
                  onChange={(event) =>
                    setBulkCheckInLocationId(
                      event.target.value === '' ? '' : Number(event.target.value),
                    )
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Check-out location"
                  value={bulkCheckOutLocationId}
                  disabled={!bulkCheckOut}
                  onChange={(event) =>
                    setBulkCheckOutLocationId(
                      event.target.value === '' ? '' : Number(event.target.value),
                    )
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </>
          ) : null}

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Reason"
            value={bulkReason}
            onChange={(event) => setBulkReason(event.target.value)}
          />

          {bulkSkipped.length > 0 ? (
            <Alert severity="warning">
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Skipped dates
              </Typography>
              <Stack spacing={0.5}>
                {bulkSkipped.map((item) => (
                  <Typography key={item.date} variant="body2">
                    {item.date}: {item.reason}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          ) : null}
        </Stack>
      </AppModal>
    </Stack>
  );
}
