import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import {
  Box,
  Button,
  ButtonGroup,
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
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
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
import { useCompaniesQuery } from '@/features/organization/hooks/useOrganizationQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
  RoleActiveChip,
} from '@/features/rbac/components/RbacShared';
import {
  useCreateHolidayCalendarMutation,
  useCreateHolidayMutation,
  useDeleteHolidayCalendarMutation,
  useDeleteHolidayMutation,
  useHolidayCalendarsQuery,
  useHolidaysQuery,
  useUpdateHolidayCalendarMutation,
  useUpdateHolidayMutation,
} from '../hooks/useHolidaysQueries';
import type { Holiday, HolidayCalendar, HolidayType } from '../types/holidays.type';

type HolidaysTab = 'calendars' | 'dates';
type HolidayView = 'calendar' | 'list';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'company', label: 'Company' },
  { value: 'special', label: 'Special' },
];

type FormState = {
  company_id: number | '';
  name: string;
  code: string;
  is_active: boolean;
  holiday_calendar_id: number | '';
  date: string;
  end_date: string;
  type: HolidayType;
  notes: string;
};

const emptyForm: FormState = {
  company_id: '',
  name: '',
  code: '',
  is_active: true,
  holiday_calendar_id: '',
  date: '',
  end_date: '',
  type: 'public',
  notes: '',
};

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildMonthCells(year: number, month: number): Array<number | null> {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: mondayOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function holidayColors(type: HolidayType) {
  if (type === 'company') {
    return { backgroundColor: 'success.light', color: 'success.contrastText' };
  }
  if (type === 'special') {
    return { backgroundColor: 'warning.light', color: 'warning.contrastText' };
  }
  return { backgroundColor: 'primary.light', color: 'primary.contrastText' };
}

export function HolidaysPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'holidays.view');
  const canManage = can(session?.user, 'holidays.manage');

  const [tab, setTab] = useState<HolidaysTab>('calendars');
  const [filterCompanyId, setFilterCompanyId] = useState<number | ''>('');
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | ''>('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [holidayView, setHolidayView] = useState<HolidayView>('calendar');
  const [typeFilter, setTypeFilter] = useState<HolidayType | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const companiesQuery = useCompaniesQuery(canView);
  const calendarsQuery = useHolidayCalendarsQuery(
    filterCompanyId === '' ? undefined : filterCompanyId,
    canView,
  );

  const calendarsForFilter = useMemo(() => {
    const rows = calendarsQuery.data ?? [];
    if (filterCompanyId === '') {
      return rows;
    }
    return rows.filter((row) => row.company_id === filterCompanyId);
  }, [calendarsQuery.data, filterCompanyId]);

  const holidaysQuery = useHolidaysQuery(
    selectedCalendarId === ''
      ? null
      : {
          holiday_calendar_id: selectedCalendarId,
          year: Number(year) || new Date().getFullYear(),
          type: typeFilter || undefined,
        },
    canView && tab === 'dates' && selectedCalendarId !== '',
  );

  const holidaysByDate = useMemo(
    () => new Map((holidaysQuery.data ?? []).map((holiday) => [holiday.date, holiday])),
    [holidaysQuery.data],
  );
  const monthCells = useMemo(
    () => buildMonthCells(Number(year) || new Date().getFullYear(), month),
    [month, year],
  );

  const createCalendar = useCreateHolidayCalendarMutation();
  const updateCalendar = useUpdateHolidayCalendarMutation();
  const deleteCalendar = useDeleteHolidayCalendarMutation();
  const createHoliday = useCreateHolidayMutation();
  const updateHoliday = useUpdateHolidayMutation();
  const deleteHoliday = useDeleteHolidayMutation();

  const isSaving =
    createCalendar.isPending ||
    updateCalendar.isPending ||
    createHoliday.isPending ||
    updateHoliday.isPending;

  const tabTitle = tab === 'calendars' ? 'Calendar' : 'Holiday';

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Holidays" description="Holiday calendars and dated exceptions." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      company_id: filterCompanyId,
      holiday_calendar_id: selectedCalendarId,
      date: formatDateKey(Number(year) || new Date().getFullYear(), month, 1),
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openCreateHolidayAt = (date: string) => {
    if (!canManage || selectedCalendarId === '') {
      return;
    }
    setEditingId(null);
    setForm({
      ...emptyForm,
      holiday_calendar_id: selectedCalendarId,
      date,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const moveMonth = (offset: number) => {
    const currentYear = Number(year) || new Date().getFullYear();
    const next = new Date(currentYear, month - 1 + offset, 1);
    setYear(String(next.getFullYear()));
    setMonth(next.getMonth() + 1);
  };

  const goToToday = () => {
    const today = new Date();
    setYear(String(today.getFullYear()));
    setMonth(today.getMonth() + 1);
  };

  const openEditCalendar = (row: HolidayCalendar) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      company_id: row.company_id,
      name: row.name,
      code: row.code ?? '',
      is_active: row.is_active,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditHoliday = (row: Holiday) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      holiday_calendar_id: row.holiday_calendar_id,
      name: row.name,
      date: row.date,
      end_date: '',
      type: row.type,
      notes: row.notes ?? '',
      is_active: true,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    const nextErrors = validateRequiredFields(
      {
        company_id: form.company_id,
        name: form.name,
        holiday_calendar_id: form.holiday_calendar_id,
        date: form.date,
      },
      [
        { key: 'company_id', label: 'Company', when: tab === 'calendars' },
        { key: 'name', label: 'Name' },
        { key: 'holiday_calendar_id', label: 'Calendar', when: tab === 'dates' },
        { key: 'date', label: 'Date', when: tab === 'dates' },
      ],
    );

    if (tab === 'dates' && form.end_date && form.end_date < form.date) {
      nextErrors.end_date = 'End date must be on or after the start date.';
    }

    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    try {
      if (tab === 'calendars') {
        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateCalendar.mutateAsync({ id: editingId, payload });
        } else {
          await createCalendar.mutateAsync(payload);
        }
      }

      if (tab === 'dates') {
        if (editingId) {
          await updateHoliday.mutateAsync({
            id: editingId,
            payload: {
              holiday_calendar_id: Number(form.holiday_calendar_id),
              name: form.name.trim(),
              date: form.date,
              type: form.type,
              notes: form.notes.trim() || null,
            },
          });
        } else {
          await createHoliday.mutateAsync({
            holiday_calendar_id: Number(form.holiday_calendar_id),
            name: form.name.trim(),
            date: form.date,
            end_date: form.end_date || null,
            type: form.type,
            notes: form.notes.trim() || null,
          });
        }
      }

      setFormOpen(false);
      toast.success(editingId ? `${tabTitle} updated.` : `${tabTitle} created.`);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleDeleteCalendar = async (row: HolidayCalendar) => {
    if ((row.policies_count ?? 0) > 0) {
      toast.error('Unlink this calendar from policies before deleting.');
      return;
    }
    const ok = await confirm({
      title: 'Delete holiday calendar?',
      description: 'Soft-deleted and hidden from lists.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }
    try {
      await deleteCalendar.mutateAsync(row.id);
      if (selectedCalendarId === row.id) {
        setSelectedCalendarId('');
      }
      toast.success('Calendar deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    const ok = await confirm({
      title: 'Delete holiday?',
      description: 'Soft-deleted and hidden from lists.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) {
      return false;
    }
    try {
      await deleteHoliday.mutateAsync(id);
      toast.success('Holiday deleted.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      return false;
    }
  };

  const calendarColumns: AppTableColumn<HolidayCalendar>[] = [
    {
      key: 'name',
      header: 'Calendar',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code ?? '—'} · {row.company?.name ?? `Company #${row.company_id}`}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'policies',
      header: 'Policies',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.policies_count ?? 0}
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
        <PermissionGate permission="holidays.manage">
          <IconButton size="small" onClick={() => openEditCalendar(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDeleteCalendar(row)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const holidayColumns: AppTableColumn<Holiday>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.date}
        </Typography>
      ),
    },
    {
      key: 'name',
      header: 'Holiday',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.name}</Typography>
          {row.notes ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
              {row.notes}
            </Typography>
          ) : null}
        </Stack>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {row.type}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="holidays.manage">
          <IconButton size="small" onClick={() => openEditHoliday(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDeleteHoliday(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Holidays"
        description="Company holiday calendars and dated exceptions (not weekly offs)."
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
        onChange={(_, value: HolidaysTab) => setTab(value)}
        variant="scrollable"
      >
        <Tab value="calendars" label="Calendars" />
        <Tab value="dates" label="Holiday dates" />
      </Tabs>

      {tab === 'calendars' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(12, minmax(0, 1fr))' },
            gap: 2,
            alignItems: 'center',
            minHeight: 56,
          }}
        >
          <TextField
            select
            label="Company filter"
            value={filterCompanyId}
            onChange={(event) =>
              setFilterCompanyId(event.target.value === '' ? '' : Number(event.target.value))
            }
            fullWidth
            sx={{ gridColumn: { md: 'span 4' } }}
          >
            <MenuItem value="">All companies</MenuItem>
            {(companiesQuery.data ?? []).map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(12, minmax(0, 1fr))' },
            gap: 2,
            alignItems: 'center',
            minHeight: 56,
          }}
        >
          <Box
            sx={{
              gridColumn: { md: 'span 8' },
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'minmax(0, 4fr) minmax(110px, 2fr) minmax(140px, 2fr)',
              },
              gap: 2,
            }}
          >
            <TextField
              select
              label="Calendar"
              value={selectedCalendarId}
              onChange={(event) =>
                setSelectedCalendarId(event.target.value === '' ? '' : Number(event.target.value))
              }
              fullWidth
            >
              <MenuItem value="">Select calendar</MenuItem>
              {calendarsForFilter.map((calendar) => (
                <MenuItem key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Year"
              type="number"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
            <TextField
              select
              label="Type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as HolidayType | '')}
            >
              <MenuItem value="">All types</MenuItem>
              {HOLIDAY_TYPES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box
            sx={{
              gridColumn: { md: 'span 4' },
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
            }}
          >
            <ButtonGroup size="small" aria-label="Holiday view">
              <Button
                variant={holidayView === 'calendar' ? 'contained' : 'outlined'}
                startIcon={<CalendarMonthRoundedIcon />}
                onClick={() => setHolidayView('calendar')}
              >
                Calendar
              </Button>
              <Button
                variant={holidayView === 'list' ? 'contained' : 'outlined'}
                startIcon={<ViewListRoundedIcon />}
                onClick={() => setHolidayView('list')}
              >
                List
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
      )}

      {tab === 'calendars' && calendarsQuery.isError ? (
        <RbacQueryError error={calendarsQuery.error} />
      ) : null}
      {tab === 'dates' && holidaysQuery.isError ? (
        <RbacQueryError error={holidaysQuery.error} />
      ) : null}

      {tab === 'calendars' ? (
        <AppTable
          columns={calendarColumns}
          rows={calendarsForFilter}
          getRowKey={(row) => row.id}
          isLoading={calendarsQuery.isLoading}
          emptyState={
            <EmptyState title="No calendars" description="Add a company holiday calendar." />
          }
        />
      ) : null}

      {tab === 'dates' ? (
        selectedCalendarId === '' ? (
          <EmptyState title="Select a calendar" description="Choose a calendar to manage dates." />
        ) : holidayView === 'calendar' ? (
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <IconButton size="small" aria-label="Previous month" onClick={() => moveMonth(-1)}>
                  <ChevronLeftRoundedIcon />
                </IconButton>
                <Typography variant="h3" sx={{ minWidth: { sm: 210 }, textAlign: 'center' }}>
                  {MONTH_NAMES[month - 1]} {year}
                </Typography>
                <IconButton size="small" aria-label="Next month" onClick={() => moveMonth(1)}>
                  <ChevronRightRoundedIcon />
                </IconButton>
              </Stack>
              <Button size="small" onClick={goToToday}>
                Today
              </Button>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
                  minWidth: 700,
                  borderTop: '1px solid',
                  borderLeft: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {WEEKDAY_LABELS.map((label, index) => (
                  <Box
                    key={label}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      borderRight: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: index >= 5 ? 'action.hover' : 'background.paper',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      {label}
                    </Typography>
                  </Box>
                ))}
                {monthCells.map((day, index) => {
                  if (day === null) {
                    return (
                      <Box
                        key={`blank-${index}`}
                        sx={{
                          minHeight: 112,
                          borderRight: '1px solid',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'action.hover',
                          opacity: 0.45,
                        }}
                      />
                    );
                  }

                  const date = formatDateKey(
                    Number(year) || new Date().getFullYear(),
                    month,
                    day,
                  );
                  const holiday = holidaysByDate.get(date);
                  const isWeekend = index % 7 >= 5;

                  return (
                    <Button
                      key={date}
                      onClick={() =>
                        holiday ? openEditHoliday(holiday) : openCreateHolidayAt(date)
                      }
                      disabled={!canManage}
                      sx={{
                        minHeight: 112,
                        p: 1,
                        borderRadius: 0,
                        borderRight: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        textTransform: 'none',
                        color: 'text.primary',
                        backgroundColor: isWeekend ? 'action.hover' : 'background.paper',
                      }}
                    >
                      <Stack
                        spacing={0.75}
                        sx={{
                          width: '100%',
                          minWidth: 0,
                          height: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, textAlign: 'center' }}
                        >
                          {day}
                        </Typography>
                        {holiday ? (
                          <Box
                            sx={{
                              ...holidayColors(holiday.type),
                              alignSelf: 'center',
                              display: 'inline-flex',
                              width: 'fit-content',
                              maxWidth: '100%',
                              height: 24,
                              px: 0.75,
                              alignItems: 'center',
                              borderRadius: 1,
                              overflow: 'hidden',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                lineHeight: 1.2,
                                textAlign: 'center',
                                minWidth: 0,
                              }}
                            >
                              {holiday.name}
                            </Typography>
                          </Box>
                        ) : null}
                      </Stack>
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <Stack
              direction="row"
              spacing={2}
              useFlexGap
              sx={{ flexWrap: 'wrap' }}
            >
              {HOLIDAY_TYPES.map((item) => (
                <Stack
                  key={item.value}
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: 'center' }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 0.5,
                      ...holidayColors(item.value),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        ) : (
          <AppTable
            columns={holidayColumns}
            rows={holidaysQuery.data ?? []}
            getRowKey={(row) => row.id}
            isLoading={holidaysQuery.isLoading}
            emptyState={
              <EmptyState title="No holidays" description={`No holidays for ${year}.`} />
            }
          />
        )
      ) : null}

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? `Edit ${tabTitle}` : `Add ${tabTitle}`}
        actions={
          <>
            {tab === 'dates' && editingId && canManage ? (
              <Button
                color="error"
                startIcon={<DeleteRoundedIcon />}
                disabled={deleteHoliday.isPending}
                onClick={() => {
                  void handleDeleteHoliday(editingId).then((deleted) => {
                    if (deleted) {
                      setFormOpen(false);
                    }
                  });
                }}
              >
                Delete
              </Button>
            ) : null}
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

          {tab === 'calendars' ? (
            <>
              <TextField
                select
                label="Company"
                value={form.company_id}
                onChange={(event) => {
                  setFieldErrors((current) => clearFieldError(current, 'company_id'));
                  setForm((current) => ({
                    ...current,
                    company_id: event.target.value === '' ? '' : Number(event.target.value),
                  }));
                }}
                required
                fullWidth
                error={Boolean(fieldErrors.company_id)}
                helperText={fieldErrors.company_id}
              >
                {(companiesQuery.data ?? []).map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
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
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                fullWidth
                helperText="Optional · unique within company"
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
            </>
          ) : null}

          {tab === 'dates' ? (
            <>
              <TextField
                select
                label="Calendar"
                value={form.holiday_calendar_id}
                onChange={(event) => {
                  setFieldErrors((current) => clearFieldError(current, 'holiday_calendar_id'));
                  setForm((current) => ({
                    ...current,
                    holiday_calendar_id:
                      event.target.value === '' ? '' : Number(event.target.value),
                  }));
                }}
                required
                fullWidth
                error={Boolean(fieldErrors.holiday_calendar_id)}
                helperText={fieldErrors.holiday_calendar_id}
              >
                {calendarsForFilter.map((calendar) => (
                  <MenuItem key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </MenuItem>
                ))}
              </TextField>
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Date"
                  type="date"
                  value={form.date}
                  onChange={(event) => {
                    setFieldErrors((current) => clearFieldError(current, 'date'));
                    setForm((current) => ({ ...current, date: event.target.value }));
                  }}
                  required
                  fullWidth
                  error={Boolean(fieldErrors.date)}
                  helperText={fieldErrors.date}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                {!editingId ? (
                  <TextField
                    label="End date (optional)"
                    type="date"
                    value={form.end_date}
                    onChange={(event) => {
                      setFieldErrors((current) => clearFieldError(current, 'end_date'));
                      setForm((current) => ({ ...current, end_date: event.target.value }));
                    }}
                    fullWidth
                    error={Boolean(fieldErrors.end_date)}
                    helperText={fieldErrors.end_date || 'Creates one row per day'}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                ) : null}
              </Stack>
              <TextField
                select
                label="Type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as HolidayType,
                  }))
                }
                fullWidth
              >
                {HOLIDAY_TYPES.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                fullWidth
                multiline
                minRows={2}
              />
            </>
          ) : null}
        </Stack>
      </AppModal>
    </Stack>
  );
}
