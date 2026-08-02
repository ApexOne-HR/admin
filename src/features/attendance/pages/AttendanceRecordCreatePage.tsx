import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useDeferredValue, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import { useEmployeesQuery } from '@/features/employees/hooks/useEmployeeQueries';
import type { Employee } from '@/features/employees/types/employee.type';
import { useLocationsQuery } from '@/features/masters/hooks/useMastersQueries';
import { useCompaniesQuery } from '@/features/organization/hooks/useOrganizationQueries';
import { ForbiddenAlert } from '@/features/rbac/components/RbacShared';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import { useCreateAttendanceRecordMutation } from '../hooks/useAttendanceQueries';
import type {
  AttendanceCreatePayload,
  AttendanceEntryType,
} from '../types/attendance.type';
import { ATTENDANCE_ENTRY_TYPE_OPTIONS } from '../utils/attendance';

function localToday(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
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

function employeeOptionLabel(employee: Employee): string {
  const email = employee.email?.trim();
  return email
    ? `${employee.employee_code} · ${employee.full_name} · ${email}`
    : `${employee.employee_code} · ${employee.full_name}`;
}

export function AttendanceRecordCreatePage() {
  const { session } = useAdminSession();
  const navigate = useNavigate();
  const toast = useToast();
  const canCreate = can(session?.user, 'attendance.manage');
  const createRecord = useCreateAttendanceRecordMutation();
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeInput, setEmployeeInput] = useState('');
  const deferredEmployeeQ = useDeferredValue(employeeInput.trim());
  const [workDate, setWorkDate] = useState(localToday());
  const [attendanceType, setAttendanceType] =
    useState<AttendanceEntryType>('present');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [checkInLocationId, setCheckInLocationId] = useState<number | ''>('');
  const [checkOutLocationId, setCheckOutLocationId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const companiesQuery = useCompaniesQuery(canCreate);
  const employeesQuery = useEmployeesQuery(
    {
      company_id: companyId === '' ? undefined : companyId,
      q: deferredEmployeeQ || undefined,
      page: 1,
      per_page: 50,
    },
    canCreate && companyId !== '',
  );
  const locationsQuery = useLocationsQuery(
    companyId === '' ? undefined : companyId,
    canCreate && companyId !== '',
  );

  if (!canCreate) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Create attendance"
          description="Create a manual attendance record."
        />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const employees = employeesQuery.data?.employees ?? [];
  const employeeOptions =
    selectedEmployee && !employees.some((employee) => employee.id === selectedEmployee.id)
      ? [selectedEmployee, ...employees]
      : employees;
  const locations = (locationsQuery.data ?? []).filter((location) => location.is_active);
  const requiresPunch =
    attendanceType !== 'absent' && attendanceType !== 'full_day_leave';

  const changeAttendanceType = (nextType: AttendanceEntryType) => {
    const times = defaultTimes(nextType);
    setAttendanceType(nextType);
    setCheckInTime(times.checkIn);
    setCheckOutTime(times.checkOut);

    if (nextType === 'absent' || nextType === 'full_day_leave') {
      setCheckInLocationId('');
      setCheckOutLocationId('');
    }
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (companyId === '' || !selectedEmployee || workDate === '') {
      setFormError('Company, employee, and work date are required.');
      return;
    }
    if (requiresPunch && checkInTime === '') {
      setFormError('Check-in time is required for worked attendance.');
      return;
    }

    const payload: AttendanceCreatePayload = {
      employee_id: selectedEmployee.id,
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
      toast.success('Attendance record created.');
      navigate(`/attendance/${record.id}`);
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to create attendance record.'));
    }
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Create attendance"
        description="Create attendance for today or a past working date."
        action={
          <Button
            component={RouterLink}
            to="/attendance"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Back
          </Button>
        }
      />

      {formError ? <Alert severity="error">{formError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Employee and date
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr)',
                },
                alignItems: 'start',
              }}
            >
              <TextField
                select
                required
                fullWidth
                label="Company"
                value={companyId}
                helperText=" "
                onChange={(event) => {
                  setCompanyId(
                    event.target.value === '' ? '' : Number(event.target.value),
                  );
                  setSelectedEmployee(null);
                  setEmployeeInput('');
                  setCheckInLocationId('');
                  setCheckOutLocationId('');
                }}
              >
                {(companiesQuery.data ?? []).map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                fullWidth
                disabled={companyId === ''}
                options={employeeOptions}
                value={selectedEmployee}
                inputValue={employeeInput}
                loading={employeesQuery.isFetching}
                filterOptions={(options) => options}
                getOptionLabel={employeeOptionLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_event, value) => {
                  setSelectedEmployee(value);
                  if (value) {
                    setEmployeeInput(employeeOptionLabel(value));
                  }
                }}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input' || reason === 'clear') {
                    setEmployeeInput(value);
                    if (reason === 'clear') {
                      setSelectedEmployee(null);
                    }
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props as typeof props & {
                    key?: string | number;
                  };
                  return (
                    <Box
                      component="li"
                      key={key ?? option.id}
                      {...optionProps}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start !important',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.employee_code} · {option.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email?.trim() || 'No email'}
                      </Typography>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Employee"
                    placeholder="Search name, code, or email"
                    helperText={
                      companyId === ''
                        ? 'Select a company first'
                        : 'Search by employee name, code, or email'
                    }
                  />
                )}
              />
              <TextField
                required
                fullWidth
                type="date"
                label="Work date"
                value={workDate}
                onChange={(event) => setWorkDate(event.target.value)}
                helperText=" "
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: localToday() },
                }}
              />
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Attendance
            </Typography>
            <TextField
              select
              required
              fullWidth
              label="Attendance type"
              value={attendanceType}
              onChange={(event) =>
                changeAttendanceType(event.target.value as AttendanceEntryType)
              }
              sx={{ maxWidth: { md: 'calc(50% - 8px)' } }}
            >
              {ATTENDANCE_ENTRY_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            {requiresPunch ? (
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  alignItems: 'start',
                }}
              >
                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Check-in time"
                  value={checkInTime}
                  onChange={(event) => setCheckInTime(event.target.value)}
                  helperText=" "
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="Check-out time"
                  value={checkOutTime}
                  onChange={(event) => setCheckOutTime(event.target.value)}
                  helperText="Leave empty to create an Incomplete record"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  select
                  fullWidth
                  label="Check-in location (optional)"
                  value={checkInLocationId}
                  disabled={companyId === ''}
                  onChange={(event) => {
                    const value =
                      event.target.value === '' ? '' : Number(event.target.value);
                    setCheckInLocationId(value);
                    if (checkOutLocationId === '') {
                      setCheckOutLocationId(value);
                    }
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} · {location.address ?? 'No address'}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Check-out location (optional)"
                  value={checkOutLocationId}
                  disabled={companyId === '' || checkOutTime === ''}
                  onChange={(event) =>
                    setCheckOutLocationId(
                      event.target.value === '' ? '' : Number(event.target.value),
                    )
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} · {location.address ?? 'No address'}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            ) : (
              <Alert severity="info">
                Punch time and location are not recorded for absent or full-day leave.
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Reason / note (optional)"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />

            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button component={RouterLink} to="/attendance">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleSubmit()}
                disabled={createRecord.isPending}
              >
                {createRecord.isPending ? 'Creating...' : 'Create attendance'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
