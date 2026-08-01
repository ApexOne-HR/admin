import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  Alert,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import { useEmployeesQuery } from '@/features/employees/hooks/useEmployeeQueries';
import { useLocationsQuery } from '@/features/masters/hooks/useMastersQueries';
import { useCompaniesQuery } from '@/features/organization/hooks/useOrganizationQueries';
import { ForbiddenAlert } from '@/features/rbac/components/RbacShared';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import { useCreateAttendanceRecordMutation } from '../hooks/useAttendanceQueries';
import type {
  AttendanceCreatePayload,
  AttendanceEntryType,
} from '../types/attendance.type';

const ATTENDANCE_TYPE_OPTIONS: Array<{
  value: AttendanceEntryType;
  label: string;
}> = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'full_day_leave', label: 'Full-day leave' },
  { value: 'morning_leave', label: 'Morning Leave' },
  { value: 'evening_leave', label: 'Evening Leave' },
];

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

export function AttendanceRecordCreatePage() {
  const { session } = useAdminSession();
  const navigate = useNavigate();
  const toast = useToast();
  const canCreate = can(session?.user, 'attendance.manage');
  const createRecord = useCreateAttendanceRecordMutation();
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
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
      page: 1,
      per_page: 100,
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

    if (companyId === '' || employeeId === '' || workDate === '') {
      setFormError('Company, employee, and work date are required.');
      return;
    }
    if (requiresPunch && checkInTime === '') {
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
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                required
                fullWidth
                label="Company"
                value={companyId}
                onChange={(event) => {
                  setCompanyId(
                    event.target.value === '' ? '' : Number(event.target.value),
                  );
                  setEmployeeId('');
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
              <TextField
                select
                required
                fullWidth
                label="Employee"
                value={employeeId}
                disabled={companyId === ''}
                onChange={(event) =>
                  setEmployeeId(
                    event.target.value === '' ? '' : Number(event.target.value),
                  )
                }
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.employee_code} · {employee.full_name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                required
                fullWidth
                type="date"
                label="Work date"
                value={workDate}
                onChange={(event) => setWorkDate(event.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: localToday() },
                }}
              />
            </Stack>

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
            >
              {ATTENDANCE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            {requiresPunch ? (
              <>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    required
                    fullWidth
                    type="time"
                    label="Check-in time"
                    value={checkInTime}
                    onChange={(event) => setCheckInTime(event.target.value)}
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
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
                </Stack>
              </>
            ) : (
              <Alert severity="info">
                Punch time and location are not recorded for absent or full-day leave.
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              minRows={2}
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
