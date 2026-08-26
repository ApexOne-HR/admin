import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { AppModal } from '@/components/common/AppModal';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { useFiscalYearsQuery } from '@/features/fiscal/hooks/useFiscalQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useCancelEmployeeLeaveApplicationMutation,
  useCreateEmployeeLeaveApplicationMutation,
  useEmployeeLeaveAllocationsQuery,
  useEmployeeLeaveApplicationsQuery,
  useUpdateEmployeeLeaveAllocationMutation,
} from '../hooks/useEmployeeExtensionQueries';
import type {
  EmployeeLeaveAllocation,
  EmployeeLeaveApplication,
} from '../types/employee-extension.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

function countLeaveDays(start: string, end: string, session: 'full' | 'am' | 'pm'): number {
  if (!start || !end || start > end) {
    return 0;
  }
  if (start === end) {
    return session === 'full' ? 1 : 0.5;
  }
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
}

type Props = {
  employeeId: number;
  companyId: number;
  canEdit: boolean;
  canManageLeave: boolean;
};

export function EmployeeLeaveAllocationsTab({
  employeeId,
  companyId,
  canEdit,
  canManageLeave,
}: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const yearsQuery = useFiscalYearsQuery(companyId);
  const years = yearsQuery.data ?? [];
  const activeYear = useMemo(() => years.find((y) => y.is_active), [years]);
  const [fiscalYearId, setFiscalYearId] = useState<number | ''>('');
  const [editing, setEditing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [session, setSession] = useState<'full' | 'am' | 'pm'>('full');
  const [reason, setReason] = useState('');

  const selectedYearId = fiscalYearId === '' ? activeYear?.id : fiscalYearId;

  const allocationsQuery = useEmployeeLeaveAllocationsQuery(
    employeeId,
    selectedYearId,
    Boolean(selectedYearId),
  );
  const applicationsQuery = useEmployeeLeaveApplicationsQuery(
    employeeId,
    selectedYearId,
    Boolean(selectedYearId),
  );
  const updateAllocation = useUpdateEmployeeLeaveAllocationMutation(employeeId);
  const createLeave = useCreateEmployeeLeaveApplicationMutation(employeeId);
  const cancelLeave = useCancelEmployeeLeaveApplicationMutation(employeeId);

  const allocations = allocationsQuery.data ?? [];
  const selectedType = allocations.find((row) => row.leave_type_id === leaveTypeId);
  const isRange = Boolean(startDate && endDate && startDate !== endDate);
  const previewDays = countLeaveDays(startDate, endDate, isRange ? 'full' : session);

  const openCreate = () => {
    setLeaveTypeId(allocations[0]?.leave_type_id ?? '');
    setStartDate('');
    setEndDate('');
    setSession('full');
    setReason('');
    setFormOpen(true);
  };

  const handleTotalChange = async (row: EmployeeLeaveAllocation, value: string) => {
    const total = Number(value);
    if (Number.isNaN(total) || total < 0) {
      toast.error('Total days must be a non-negative number.');
      return;
    }
    try {
      await updateAllocation.mutateAsync({
        allocationId: row.id,
        payload: { total_days: total },
      });
      toast.success('Allocation updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleSaveLeave = async () => {
    if (leaveTypeId === '' || !startDate || !endDate) {
      toast.error('Leave type and dates are required.');
      return;
    }
    try {
      await createLeave.mutateAsync({
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        start_session: isRange ? 'full' : session,
        reason: reason.trim() || null,
      });
      toast.success('Leave recorded.');
      setFormOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleCancelLeave = async (row: EmployeeLeaveApplication) => {
    const ok = await confirm({
      title: 'Cancel this leave?',
      description: 'Used days will be returned to the balance.',
      confirmLabel: 'Cancel leave',
    });
    if (!ok) {
      return;
    }
    try {
      await cancelLeave.mutateAsync(row.id);
      toast.success('Leave cancelled.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const balanceColumns: AppTableColumn<EmployeeLeaveAllocation>[] = [
    {
      key: 'type',
      header: 'Leave type',
      render: (row) => row.leave_type?.name ?? `Type #${row.leave_type_id}`,
    },
    {
      key: 'entitlement',
      header: 'Entitlement',
      render: (row) => {
        if (row.entitlement_days == null) {
          return String(row.total_days);
        }
        if (row.mid_year_applied) {
          if (row.entitlement_days === row.total_days) {
            return `${row.entitlement_days} (mid-year)`;
          }
          return `${row.entitlement_days} → ${row.total_days} mid-year`;
        }
        if (row.entitlement_days === row.total_days) {
          return String(row.entitlement_days);
        }
        return `${row.entitlement_days} → ${row.total_days}`;
      },
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) =>
        editing ? (
          <TextField
            size="small"
            type="number"
            defaultValue={row.total_days}
            onBlur={(e) => {
              if (Number(e.target.value) !== row.total_days) {
                void handleTotalChange(row, e.target.value);
              }
            }}
            sx={{ width: 100 }}
            slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
          />
        ) : (
          String(row.total_days)
        ),
    },
    { key: 'used', header: 'Used', render: (row) => String(row.used_days) },
    { key: 'pending', header: 'Pending', render: (row) => String(row.pending_days) },
    { key: 'remaining', header: 'Remaining', render: (row) => String(row.remaining_days) },
  ];

  const applicationColumns: AppTableColumn<EmployeeLeaveApplication>[] = [
    {
      key: 'dates',
      header: 'Dates',
      render: (row) =>
        row.start_date === row.end_date
          ? row.start_date
          : `${row.start_date} → ${row.end_date}`,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => row.leave_type?.name ?? `Type #${row.leave_type_id}`,
    },
    {
      key: 'days',
      header: 'Days',
      render: (row) =>
        `${row.requested_days}${row.start_session === 'am' ? ' AM' : row.start_session === 'pm' ? ' PM' : ''}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Chip
          size="small"
          label={row.status}
          color={row.status === 'approved' ? 'success' : 'default'}
        />
      ),
    },
    {
      key: 'by',
      header: 'By',
      render: (row) => row.created_by?.name ?? '—',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        canManageLeave && row.status === 'approved' ? (
          <Button size="small" color="error" onClick={() => void handleCancelLeave(row)}>
            Cancel
          </Button>
        ) : null,
    },
  ];

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardHeader
          title="Leave balances"
          sx={cardHeaderSx}
          action={
            <Stack direction="row" spacing={1}>
              {canManageLeave ? (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  disabled={!selectedYearId || allocations.length === 0}
                  onClick={openCreate}
                >
                  Add leave
                </Button>
              ) : null}
              {canEdit ? (
                editing ? (
                  <Button size="small" onClick={() => setEditing(false)}>
                    Done
                  </Button>
                ) : (
                  <Button
                    size="small"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )
              ) : null}
            </Stack>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              sx={{ alignItems: 'center' }}
            >
              <TextField
                select
                size="small"
                label="Fiscal year"
                value={selectedYearId ?? ''}
                onChange={(e) =>
                  setFiscalYearId(e.target.value === '' ? '' : Number(e.target.value))
                }
                sx={{ minWidth: 220 }}
              >
                {years.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name}
                    {year.is_active ? ' (active)' : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {!selectedYearId ? (
              <EmptyState
                title="No fiscal year"
                description="Create and activate a fiscal year for this company first."
              />
            ) : allocationsQuery.isLoading ? (
              <AppLoader label="Loading leave balances…" />
            ) : allocationsQuery.isError ? (
              <Typography color="error" variant="body2">
                {getApiErrorMessage(allocationsQuery.error)}
              </Typography>
            ) : (
              <AppTable
                columns={balanceColumns}
                rows={allocations}
                getRowKey={(row) => row.id}
                emptyState={
                  <EmptyState
                    title="No leave allocations"
                    description="Balances appear after the employee is saved with a joining date and leave package (or company/division default)."
                  />
                }
              />
            )}

            {editing ? (
              <Typography variant="caption" color="text.secondary">
                Edit total days to override the package entitlement. Used and pending days are kept.
              </Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Leave recorded" sx={cardHeaderSx} />
        <CardContent>
          {!selectedYearId ? (
            <EmptyState title="No fiscal year" description="Select a fiscal year to see leave records." />
          ) : applicationsQuery.isLoading ? (
            <AppLoader label="Loading leave records…" />
          ) : applicationsQuery.isError ? (
            <Typography color="error" variant="body2">
              {getApiErrorMessage(applicationsQuery.error)}
            </Typography>
          ) : (
            <AppTable
              columns={applicationColumns}
              rows={applicationsQuery.data ?? []}
              getRowKey={(row) => row.id}
              emptyState={
                <EmptyState
                  title="No leave recorded"
                  description="Add leave to record time off against the balance."
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="sm"
        title="Add leave"
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={createLeave.isPending}
              onClick={() => void handleSaveLeave()}
            >
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            label="Leave type"
            value={leaveTypeId}
            onChange={(e) =>
              setLeaveTypeId(e.target.value === '' ? '' : Number(e.target.value))
            }
            fullWidth
            helperText={
              selectedType
                ? `${selectedType.remaining_days} days remaining`
                : 'Choose a type from this fiscal year'
            }
          >
            {allocations.map((row) => (
              <MenuItem key={row.id} value={row.leave_type_id}>
                {row.leave_type?.name ?? `Type #${row.leave_type_id}`}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          <TextField
            select
            label="Day unit"
            value={isRange ? 'full' : session}
            onChange={(e) => setSession(e.target.value as 'full' | 'am' | 'pm')}
            disabled={isRange || !selectedType?.leave_type?.allow_half_day}
            fullWidth
            helperText={
              isRange
                ? 'Multi-day leave is always full day'
                : selectedType?.leave_type?.allow_half_day
                  ? undefined
                  : 'This type does not allow half day'
            }
          >
            <MenuItem value="full">Full day</MenuItem>
            <MenuItem value="am">Morning (AM)</MenuItem>
            <MenuItem value="pm">Evening (PM)</MenuItem>
          </TextField>
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <Typography variant="body2" color="text.secondary">
            Days to record: {previewDays || '—'} (saved as approved, no approval step)
          </Typography>
        </Stack>
      </AppModal>
    </Stack>
  );
}
