import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState, type ReactNode } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppPagination } from '@/components/common/AppPagination';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import {
  ForbiddenAlert,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import { useAdminAuditLogsQuery } from '../hooks/useAuditQueries';
import {
  ADMIN_AUDIT_FEATURE_OPTIONS,
  type AdminAuditFeature,
  type AdminAuditLog,
} from '../types/audit.type';

function localToday(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function featureLabel(feature: string | null): string {
  if (!feature) return '—';
  return (
    ADMIN_AUDIT_FEATURE_OPTIONS.find((option) => option.value === feature)?.label
    ?? feature
  );
}

function actionLabel(action: string): string {
  const part = action.includes('.') ? action.split('.').slice(1).join('.') : action;
  return part.replaceAll('_', ' ');
}

function formatFieldLabel(key: string): string {
  return key.replaceAll('_', ' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
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

function VersionChanges({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const keys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  );

  if (keys.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No previous or updated values recorded.
      </Typography>
    );
  }

  return (
    <TableContainer
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: '22%' }}>Field</TableCell>
            <TableCell sx={{ fontWeight: 700, width: '39%' }}>Previous value</TableCell>
            <TableCell sx={{ fontWeight: 700, width: '39%' }}>Updated value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {keys.map((key) => {
            const previousValue = before?.[key];
            const updatedValue = after?.[key];
            const changed = !valuesEqual(previousValue, updatedValue);

            return (
              <TableRow
                key={key}
                sx={{
                  bgcolor: changed ? 'action.hover' : 'transparent',
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    verticalAlign: 'top',
                  }}
                >
                  {formatFieldLabel(key)}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 12,
                    verticalAlign: 'top',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: changed ? 'error.main' : 'text.secondary',
                  }}
                >
                  {formatValue(previousValue)}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 12,
                    verticalAlign: 'top',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: changed ? 'success.dark' : 'text.secondary',
                    fontWeight: changed ? 600 : 400,
                  }}
                >
                  {formatValue(updatedValue)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function AuditLogDetailModal({
  log,
  open,
  onClose,
}: {
  log: AdminAuditLog | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AppModal
      open={open}
      title="Audit log detail"
      description={log ? `${actionLabel(log.action)} · ${formatDateTime(log.created_at)}` : undefined}
      onClose={onClose}
      maxWidth="xl"
      actions={<Button onClick={onClose}>Close</Button>}
    >
      {log ? (
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            }}
          >
            <DetailField
              label="Actor"
              value={
                log.actor ? (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {log.actor.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.actor.email || '—'}
                    </Typography>
                  </Box>
                ) : (
                  '—'
                )
              }
            />
            <DetailField
              label="Feature"
              value={
                <Chip
                  size="small"
                  variant="outlined"
                  label={featureLabel(log.feature)}
                />
              }
            />
            <DetailField
              label="Action"
              value={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {actionLabel(log.action)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {log.action}
                  </Typography>
                </Box>
              }
            />
            <DetailField
              label="Subject"
              value={
                log.auditable_type_label && log.auditable_id
                  ? `${log.auditable_type_label} #${log.auditable_id}`
                  : '—'
              }
            />
            <DetailField label="When" value={formatDateTime(log.created_at)} />
            <DetailField label="Reason" value={log.reason?.trim() || '—'} />
            <DetailField label="Request ID" value={log.request_id || '—'} />
            <DetailField label="IP address" value={log.ip_address || '—'} />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              Previous version vs updated value
            </Typography>
            <VersionChanges before={log.before_values} after={log.after_values} />
          </Box>
        </Stack>
      ) : null}
    </AppModal>
  );
}

export function AuditLogsPage() {
  const { session } = useAdminSession();
  const canView = can(session?.user, 'admin_audits.view');
  const today = localToday();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [feature, setFeature] = useState<AdminAuditFeature | ''>('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const logsQuery = useAdminAuditLogsQuery(
    {
      page,
      per_page: perPage,
      feature: feature || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    },
    canView,
  );

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Audit logs"
          description="Review Admin changes by date and feature."
        />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const logs = logsQuery.data?.logs ?? [];
  const meta = logsQuery.data?.meta;

  const columns: AppTableColumn<AdminAuditLog>[] = [
    {
      key: 'created_at',
      header: 'When',
      width: 170,
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'feature',
      header: 'Feature',
      width: 130,
      render: (row) => (
        <Chip size="small" variant="outlined" label={featureLabel(row.feature)} />
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
          {actionLabel(row.action)}
        </Typography>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      width: 220,
      render: (row) =>
        row.actor ? (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.actor.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.actor.email || '—'}
            </Typography>
          </Box>
        ) : (
          '—'
        ),
    },
    {
      key: 'subject',
      header: 'Subject',
      width: 180,
      render: (row) =>
        row.auditable_type_label && row.auditable_id
          ? `${row.auditable_type_label} #${row.auditable_id}`
          : '—',
    },
    {
      key: 'actions',
      header: '',
      width: 72,
      align: 'right',
      render: (row) => (
        <Tooltip title="View detail">
          <IconButton size="small" onClick={() => setSelectedLog(row)}>
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Audit logs"
        description="Review Admin changes by date and feature."
        action={
          <Button
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void logsQuery.refetch()}
            disabled={logsQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { md: 'center' } }}
      >
        <TextField
          select
          label="Feature"
          value={feature}
          onChange={(event) => {
            setFeature(event.target.value as AdminAuditFeature | '');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All features</MenuItem>
          {ADMIN_AUDIT_FEATURE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          label="From"
          value={dateFrom}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => {
            setDateFrom(event.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          type="date"
          label="To"
          value={dateTo}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => {
            setDateTo(event.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        />
      </Stack>

      {logsQuery.isError ? <RbacQueryError error={logsQuery.error} /> : null}

      <AppTable
        columns={columns}
        rows={logs}
        getRowKey={(row) => row.id}
        isLoading={logsQuery.isLoading}
        emptyState={
          <EmptyState
            title="No audit logs"
            description="No Admin audit events match the selected date range and feature."
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
          ) : null
        }
      />

      <AuditLogDetailModal
        log={selectedLog}
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
      />
    </Stack>
  );
}
