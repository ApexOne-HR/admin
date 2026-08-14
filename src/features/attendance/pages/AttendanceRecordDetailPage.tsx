import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { AppLoader } from '@/components/common/AppLoader';
import { AppModal } from '@/components/common/AppModal';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import { useLocationsQuery } from '@/features/masters/hooks/useMastersQueries';
import {
  ForbiddenAlert,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useAttendanceRecordQuery,
  useRestoreAttendanceRecordMutation,
  useUpdateAttendanceRecordMutation,
  useVoidAttendanceRecordMutation,
} from '../hooks/useAttendanceQueries';
import type {
  AttendanceEntryType,
  AttendanceRecord,
  AttendanceUpdatePayload,
} from '../types/attendance.type';
import {
  attendanceEntryTypeFromRecord,
  attendanceEntryTypeOptionsForUi,
  attendanceSourceLabel,
  attendanceStatusMeta,
  formatAttendanceDateTime,
  formatMinutes,
  localTimeFromIso,
} from '../utils/attendance';
import { resolveAttendanceDetailBack } from '../utils/attendanceNavigation';

function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
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
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 500, wordBreak: 'break-word' }}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Typography>
    </Box>
  );
}

function sectionTitle(icon: ReactNode, label: string) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {icon}
      <Box component="span">{label}</Box>
    </Stack>
  );
}

function SectionCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function coordinates(latitude: string | null, longitude: string | null): string {
  return latitude && longitude ? `${latitude}, ${longitude}` : '—';
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

function draftFromRecord(record: AttendanceRecord) {
  const attendanceType = attendanceEntryTypeFromRecord(record);
  const requiresPunch =
    attendanceType !== 'absent' && attendanceType !== 'full_day_leave';

  return {
    attendanceType,
    checkInTime: requiresPunch
      ? localTimeFromIso(record.check_in_at, record.timezone)
      : '',
    checkOutTime: requiresPunch
      ? localTimeFromIso(record.check_out_at, record.timezone)
      : '',
    checkInLocationId: record.check_in_location_id ?? ('' as number | ''),
    checkOutLocationId: record.check_out_location_id ?? ('' as number | ''),
    reason: '',
  };
}

export function AttendanceRecordDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const recordId = Number(id);
  const toast = useToast();
  const { session } = useAdminSession();
  const canView = can(session?.user, 'attendance.view');
  const canManage = can(session?.user, 'attendance.manage');
  const recordQuery = useAttendanceRecordQuery(
    Number.isInteger(recordId) && recordId > 0 ? recordId : undefined,
    canView,
  );
  const updateRecord = useUpdateAttendanceRecordMutation(recordId);
  const voidRecord = useVoidAttendanceRecordMutation(recordId);
  const restoreRecord = useRestoreAttendanceRecordMutation(recordId);

  const [correctOpen, setCorrectOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    attendanceType: 'present' as AttendanceEntryType,
    checkInTime: '09:00',
    checkOutTime: '17:00',
    checkInLocationId: '' as number | '',
    checkOutLocationId: '' as number | '',
    reason: '',
  });

  const record = recordQuery.data;
  const backLink = resolveAttendanceDetailBack(
    location.state,
    record?.employee_id,
  );
  const locationsQuery = useLocationsQuery(
    record?.company_id,
    canManage && correctOpen && Boolean(record?.company_id),
  );

  useEffect(() => {
    if (record && correctOpen) {
      setDraft(draftFromRecord(record));
      setFormError(null);
    }
  }, [record, correctOpen]);

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Attendance record" description="Attendance record details." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  if (recordQuery.isLoading) {
    return <AppLoader label="Loading attendance record..." />;
  }

  if (recordQuery.isError || !record) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Attendance record"
          description="Attendance record details."
          action={
            <Button
              component={RouterLink}
              to={backLink.returnTo}
              startIcon={<ArrowBackRoundedIcon />}
            >
              Back
            </Button>
          }
        />
        <RbacQueryError error={recordQuery.error ?? new Error('Attendance record not found.')} />
      </Stack>
    );
  }

  const statusMeta = attendanceStatusMeta(record.status);
  const locations = (locationsQuery.data ?? []).filter((location) => location.is_active);
  const requiresPunch =
    draft.attendanceType !== 'absent' && draft.attendanceType !== 'full_day_leave';
  const saving =
    updateRecord.isPending || voidRecord.isPending || restoreRecord.isPending;

  const openCorrect = () => {
    setDraft(draftFromRecord(record));
    setFormError(null);
    setCorrectOpen(true);
  };

  const changeAttendanceType = (nextType: AttendanceEntryType) => {
    const times = defaultTimes(nextType);
    setDraft((current) => ({
      ...current,
      attendanceType: nextType,
      checkInTime:
        nextType === 'absent' || nextType === 'full_day_leave' ? '' : times.checkIn,
      checkOutTime:
        nextType === 'absent' || nextType === 'full_day_leave' ? '' : times.checkOut,
      checkInLocationId:
        nextType === 'absent' || nextType === 'full_day_leave'
          ? ''
          : current.checkInLocationId,
      checkOutLocationId:
        nextType === 'absent' || nextType === 'full_day_leave'
          ? ''
          : current.checkOutLocationId,
    }));
  };

  const handleCorrect = async () => {
    setFormError(null);
    if (!draft.reason.trim()) {
      setFormError('A correction reason is required.');
      return;
    }
    if (requiresPunch && !draft.checkInTime) {
      setFormError('Check-in time is required for worked attendance.');
      return;
    }

    const payload: AttendanceUpdatePayload = {
      attendance_type: draft.attendanceType,
      reason: draft.reason.trim(),
    };

    if (requiresPunch) {
      payload.check_in_time = draft.checkInTime;
      payload.check_out_time = draft.checkOutTime || null;
      payload.check_in_location_id =
        draft.checkInLocationId === '' ? null : draft.checkInLocationId;
      payload.check_out_location_id =
        draft.checkOutTime === '' || draft.checkOutLocationId === ''
          ? null
          : draft.checkOutLocationId;
    }

    try {
      await updateRecord.mutateAsync(payload);
      toast.success('Attendance record corrected.');
      setCorrectOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleVoid = async () => {
    if (!voidReason.trim()) {
      toast.error('A void reason is required.');
      return;
    }

    try {
      await voidRecord.mutateAsync({ reason: voidReason.trim() });
      toast.success('Attendance record voided.');
      setVoidOpen(false);
      setVoidReason('');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRestore = async () => {
    if (!restoreReason.trim()) {
      toast.error('A restore reason is required.');
      return;
    }

    try {
      await restoreRecord.mutateAsync({ reason: restoreReason.trim() });
      toast.success('Attendance record restored.');
      setRestoreOpen(false);
      setRestoreReason('');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={`${record.employee?.full_name ?? 'Employee'} · ${record.work_date}`}
        description={`Attendance record #${record.id}`}
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {canManage && !record.is_voided ? (
              <>
                <Button variant="outlined" onClick={openCorrect} disabled={saving}>
                  Correct
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    setVoidReason('');
                    setVoidOpen(true);
                  }}
                  disabled={saving}
                >
                  Void
                </Button>
              </>
            ) : null}
            {canManage && record.is_voided ? (
              <Button
                color="success"
                variant="outlined"
                onClick={() => {
                  setRestoreReason('');
                  setRestoreOpen(true);
                }}
                disabled={saving}
              >
                Restore
              </Button>
            ) : null}
            <Button
              component={RouterLink}
              to={backLink.returnTo}
              startIcon={<ArrowBackRoundedIcon />}
            >
              {backLink.returnLabel}
            </Button>
          </Stack>
        }
      />

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        {record.status === 'incomplete' ? (
          <Tooltip title="Missing check-out">
            <Chip label={statusMeta.label} color={statusMeta.color} />
          </Tooltip>
        ) : (
          <Chip label={statusMeta.label} color={statusMeta.color} />
        )}
        {record.leave_duration ? (
          <Chip
            color="info"
            variant="outlined"
            label={
              record.leave_duration === 'full_day'
                ? 'Full-day leave'
                : record.leave_session_label
            }
          />
        ) : null}
        {record.absence_session_label && record.absence_session !== 'full' ? (
          <Chip color="warning" variant="outlined" label={record.absence_session_label} />
        ) : null}
        <Chip label={attendanceSourceLabel(record.source)} variant="outlined" />
        {record.is_voided ? <Chip label="Voided" color="error" /> : null}
      </Stack>

      <SectionCard
        title={sectionTitle(
          <BadgeOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />,
          'Employee and work date',
        )}
      >
        <DetailGrid>
          <DetailField label="Employee code" value={record.employee?.employee_code} />
          <DetailField label="Employee" value={record.employee?.full_name} />
          <DetailField label="Work date" value={record.work_date} />
          <DetailField label="Company" value={record.company?.name} />
          <DetailField label="Division" value={record.division?.name} />
          <DetailField label="Department" value={record.department?.name} />
          <DetailField label="Policy" value={record.policy?.name} />
          <DetailField label="Work schedule" value={record.work_schedule?.name} />
          <DetailField label="Work location" value={record.work_location?.name} />
        </DetailGrid>
      </SectionCard>

      <SectionCard
        title={sectionTitle(
          <LoginOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />,
          'Check in and check out',
        )}
      >
        <DetailGrid>
          <DetailField
            label="Check in"
            value={formatAttendanceDateTime(record.check_in_at, record.timezone)}
          />
          <DetailField
            label="Check out"
            value={formatAttendanceDateTime(record.check_out_at, record.timezone)}
          />
          <DetailField label="Check-in location" value={record.check_in_location?.name} />
          <DetailField label="Check-out location" value={record.check_out_location?.name} />
          <DetailField
            label="Check-in coordinates"
            value={coordinates(record.check_in_latitude, record.check_in_longitude)}
          />
          <DetailField
            label="Check-out coordinates"
            value={coordinates(record.check_out_latitude, record.check_out_longitude)}
          />
        </DetailGrid>
      </SectionCard>

      <SectionCard
        title={sectionTitle(
          <AccessTimeOutlinedIcon fontSize="small" sx={{ color: 'success.main' }} />,
          'Calculated attendance',
        )}
      >
        <DetailGrid>
          <DetailField
            label="Status"
            value={
              record.status === 'incomplete' ? (
                <Tooltip title="Missing check-out">
                  <Chip
                    size="small"
                    label={statusMeta.label}
                    color={statusMeta.color}
                    variant="outlined"
                  />
                </Tooltip>
              ) : (
                <Chip
                  size="small"
                  label={statusMeta.label}
                  color={statusMeta.color}
                  variant="outlined"
                />
              )
            }
          />
          <DetailField
            label="Leave duration"
            value={
              record.leave_duration === 'full_day'
                ? 'Full day'
                : record.leave_duration === 'half_day'
                  ? 'Half day'
                  : null
            }
          />
          <DetailField label="Leave session" value={record.leave_session_label} />
          <DetailField label="Absence session" value={record.absence_session_label} />
          <DetailField label="Worked" value={formatMinutes(record.worked_minutes)} />
          <DetailField label="Late" value={formatMinutes(record.late_minutes)} />
          <DetailField label="Early leave" value={formatMinutes(record.early_leave_minutes)} />
          <DetailField label="Overtime" value={formatMinutes(record.overtime_minutes)} />
        </DetailGrid>
      </SectionCard>

      <SectionCard
        title={sectionTitle(
          <InfoOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />,
          'Record information',
        )}
      >
        <DetailGrid>
          <DetailField label="Source" value={record.source_label} />
          <DetailField label="Created by" value={record.creator?.name} />
          <DetailField label="Updated by" value={record.updater?.name} />
          <DetailField
            label="Created at"
            value={formatAttendanceDateTime(record.created_at, record.timezone)}
          />
          <DetailField
            label="Updated at"
            value={formatAttendanceDateTime(record.updated_at, record.timezone)}
          />
          <DetailField label="Voided by" value={record.voider?.name} />
          <DetailField
            label="Voided at"
            value={formatAttendanceDateTime(record.voided_at, record.timezone)}
          />
          <DetailField label="Void reason" value={record.void_reason} />
        </DetailGrid>
      </SectionCard>

      <AppModal
        open={correctOpen}
        title="Correct attendance"
        description="Update attendance type and punches. A reason is required."
        onClose={() => setCorrectOpen(false)}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setCorrectOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleCorrect()}
              disabled={saving}
            >
              {updateRecord.isPending ? 'Saving…' : 'Save correction'}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            select
            required
            fullWidth
            label="Attendance type"
            value={draft.attendanceType}
            onChange={(event) =>
              changeAttendanceType(event.target.value as AttendanceEntryType)
            }
          >
            {attendanceEntryTypeOptionsForUi(draft.attendanceType).map((option) => (
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
                  label="Check-in time"
                  value={draft.checkInTime}
                  slotProps={{ inputLabel: { shrink: true } }}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      checkInTime: event.target.value,
                    }))
                  }
                />
                <TextField
                  fullWidth
                  type="time"
                  label="Check-out time"
                  value={draft.checkOutTime}
                  slotProps={{ inputLabel: { shrink: true } }}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      checkOutTime: event.target.value,
                    }))
                  }
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Check-in location"
                  value={draft.checkInLocationId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      checkInLocationId:
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                    }))
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
                  value={draft.checkOutLocationId}
                  disabled={!draft.checkOutTime}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      checkOutLocationId:
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                    }))
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
            required
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            value={draft.reason}
            onChange={(event) =>
              setDraft((current) => ({ ...current, reason: event.target.value }))
            }
          />
        </Stack>
      </AppModal>

      <AppModal
        open={voidOpen}
        title="Void attendance"
        description="The record is retained but excluded from normal totals."
        onClose={() => setVoidOpen(false)}
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setVoidOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => void handleVoid()}
              disabled={saving}
            >
              {voidRecord.isPending ? 'Voiding…' : 'Void record'}
            </Button>
          </>
        }
      >
        <TextField
          required
          fullWidth
          multiline
          minRows={3}
          label="Reason"
          value={voidReason}
          onChange={(event) => setVoidReason(event.target.value)}
          sx={{ mt: 1 }}
        />
      </AppModal>

      <AppModal
        open={restoreOpen}
        title="Restore attendance"
        description="Clear the void marker and return this record to active use."
        onClose={() => setRestoreOpen(false)}
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setRestoreOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              color="success"
              variant="contained"
              onClick={() => void handleRestore()}
              disabled={saving}
            >
              {restoreRecord.isPending ? 'Restoring…' : 'Restore record'}
            </Button>
          </>
        }
      >
        <TextField
          required
          fullWidth
          multiline
          minRows={3}
          label="Reason"
          value={restoreReason}
          onChange={(event) => setRestoreReason(event.target.value)}
          sx={{ mt: 1 }}
        />
      </AppModal>
    </Stack>
  );
}
