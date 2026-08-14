import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { useFiscalYearsQuery } from '@/features/fiscal/hooks/useFiscalQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useEmployeeLeaveAllocationsQuery,
  useSyncEmployeeLeaveAllocationsMutation,
  useUpdateEmployeeLeaveAllocationMutation,
} from '../hooks/useEmployeeExtensionQueries';
import type { EmployeeLeaveAllocation } from '../types/employee-extension.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

type Props = {
  employeeId: number;
  companyId: number;
  canEdit: boolean;
};

export function EmployeeLeaveAllocationsTab({ employeeId, companyId, canEdit }: Props) {
  const toast = useToast();
  const yearsQuery = useFiscalYearsQuery(companyId);
  const years = yearsQuery.data ?? [];
  const activeYear = useMemo(() => years.find((y) => y.is_active), [years]);
  const [fiscalYearId, setFiscalYearId] = useState<number | ''>('');
  const [editing, setEditing] = useState(false);

  const selectedYearId = fiscalYearId === '' ? activeYear?.id : fiscalYearId;

  const allocationsQuery = useEmployeeLeaveAllocationsQuery(
    employeeId,
    selectedYearId,
    Boolean(selectedYearId),
  );
  const syncAllocations = useSyncEmployeeLeaveAllocationsMutation(employeeId);
  const updateAllocation = useUpdateEmployeeLeaveAllocationMutation(employeeId);

  const handleSync = async () => {
    try {
      await syncAllocations.mutateAsync(
        selectedYearId ? Number(selectedYearId) : undefined,
      );
      toast.success('Leave allocations synced from package.');
      if (fiscalYearId === '' && activeYear) {
        setFiscalYearId(activeYear.id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
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

  const columns: AppTableColumn<EmployeeLeaveAllocation>[] = [
    {
      key: 'type',
      header: 'Leave type',
      render: (row) => row.leave_type?.name ?? `Type #${row.leave_type_id}`,
    },
    {
      key: 'service',
      header: 'Service years',
      render: (row) => (row.service_years == null ? '—' : String(row.service_years)),
    },
    {
      key: 'entitlement',
      header: 'Entitlement',
      render: (row) => {
        if (row.entitlement_days == null) {
          return String(row.total_days);
        }
        if (row.entitlement_days === row.total_days) {
          return String(row.entitlement_days);
        }
        return `${row.entitlement_days} → ${row.total_days} prorated`;
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

  return (
    <Card variant="outlined">
      <CardHeader
        title="Leave balances"
        sx={cardHeaderSx}
        action={
          canEdit ? (
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
          ) : null
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
            {editing ? (
              <Button
                variant="outlined"
                startIcon={<SyncRoundedIcon />}
                disabled={syncAllocations.isPending || !selectedYearId}
                onClick={() => void handleSync()}
              >
                {syncAllocations.isPending ? 'Syncing…' : 'Sync from leave package'}
              </Button>
            ) : null}
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
              columns={columns}
              rows={allocationsQuery.data ?? []}
              getRowKey={(row) => row.id}
              emptyState={
                <EmptyState
                  title="No leave allocations"
                  description={
                    editing
                      ? 'Sync from the effective leave package to generate balances.'
                      : 'No leave balances for this fiscal year.'
                  }
                />
              }
            />
          )}

          {editing ? (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Sync uses the employee’s effective leave package (override → division → company)
                for the selected fiscal year. Totals follow service-year ranges on the package and joining-year
                proration. Existing used/pending days are preserved.
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
