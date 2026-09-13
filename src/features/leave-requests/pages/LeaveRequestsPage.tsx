import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppPagination } from '@/components/common/AppPagination';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import {
  useCompaniesQuery,
  useDepartmentsQuery,
  useDivisionsQuery,
} from '@/features/organization/hooks/useOrganizationQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  RbacQueryError,
} from '@/features/rbac/components/RbacShared';
import {
  useApproveLeaveRequestMutation,
  useLeaveRequestQuery,
  useLeaveRequestsQuery,
  useRejectLeaveRequestMutation,
} from '../hooks/useLeaveRequestQueries';
import {
  LEAVE_REQUEST_STATUS_OPTIONS,
  type LeaveRequest,
  type LeaveRequestStatus,
} from '../types/leave-request.type';

function statusColor(
  status: LeaveRequestStatus,
): 'default' | 'warning' | 'success' | 'error' | 'info' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'cancelled':
      return 'default';
    default:
      return 'info';
  }
}

function formatDateRange(row: LeaveRequest): string {
  if (row.start_date === row.end_date) {
    return row.start_date;
  }
  return `${row.start_date} → ${row.end_date}`;
}

function sessionLabel(session: string): string {
  switch (session) {
    case 'am':
      return 'Morning (AM)';
    case 'pm':
      return 'Afternoon (PM)';
    case 'full':
      return 'Full day';
    default:
      return session;
  }
}

function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function LeaveRequestsPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'leaves.view');
  const canApprove = can(session?.user, 'leaves.approve');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [q, setQ] = useState('');
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [divisionId, setDivisionId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [status, setStatus] = useState<LeaveRequestStatus | ''>('pending');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');

  const companiesQuery = useCompaniesQuery(canView);
  const divisionsQuery = useDivisionsQuery(
    companyId === '' ? undefined : companyId,
    canView,
  );
  const departmentsQuery = useDepartmentsQuery(
    divisionId === '' ? undefined : divisionId,
    canView && divisionId !== '',
  );

  const listParams = {
    page,
    per_page: perPage,
    q: q.trim() || undefined,
    company_id: companyId === '' ? undefined : companyId,
    division_id: divisionId === '' ? undefined : divisionId,
    department_id: departmentId === '' ? undefined : departmentId,
    status: status || undefined,
  };

  const recordsQuery = useLeaveRequestsQuery(listParams, canView);
  const detailQuery = useLeaveRequestQuery(
    selectedId ?? undefined,
    canView && selectedId !== null,
  );
  const approveMutation = useApproveLeaveRequestMutation();
  const rejectMutation = useRejectLeaveRequestMutation();

  const records = recordsQuery.data?.records ?? [];
  const meta = recordsQuery.data?.meta;
  const detail = detailQuery.data;
  const isDetailLoading =
    selectedId !== null
    && (detail == null || detail.id !== selectedId)
    && !detailQuery.isError;

  const columns = useMemo<AppTableColumn<LeaveRequest>[]>(
    () => [
      {
        key: 'employee',
        header: 'Employee',
        render: (row) => (
          <Stack spacing={0.25}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.employee?.full_name ?? `Employee #${row.employee_id}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.employee?.employee_code}
              {row.employee?.department?.name
                ? ` · ${row.employee.department.name}`
                : ''}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (row) => row.leave_type?.name ?? '—',
      },
      {
        key: 'dates',
        header: 'Dates',
        render: (row) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">{formatDateRange(row)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.requested_days} day{row.requested_days === 1 ? '' : 's'} ·{' '}
              {row.start_session}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <Chip
            size="small"
            label={row.status_label}
            color={statusColor(row.status)}
            variant="outlined"
          />
        ),
      },
      {
        key: 'submitted',
        header: 'Submitted',
        render: (row) =>
          row.submitted_at
            ? new Date(row.submitted_at).toLocaleString()
            : '—',
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => (
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedId(row.id);
                setRejectOpen(false);
                setDecisionNote('');
              }}
            >
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  async function handleApprove() {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      title: 'Approve leave request?',
      description: `${detail.employee?.full_name ?? 'Employee'} · ${detail.leave_type?.name ?? 'Leave'} · ${formatDateRange(detail)}`,
      confirmLabel: 'Approve',
      confirmColor: 'primary',
    });
    if (!ok) {
      return;
    }

    try {
      await approveMutation.mutateAsync(detail.id);
      toast.success('Leave request approved.');
      setSelectedId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to approve leave request.'));
    }
  }

  async function handleReject() {
    if (!detail) {
      return;
    }
    const note = decisionNote.trim();
    if (note.length < 3) {
      toast.error('Enter a rejection reason (at least 3 characters).');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: detail.id,
        decisionNote: note,
      });
      toast.success('Leave request rejected.');
      setRejectOpen(false);
      setDecisionNote('');
      setSelectedId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to reject leave request.'));
    }
  }

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Leave requests"
          description="Review and decide employee leave applications."
        />
        <ForbiddenAlert />
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Leave requests"
        description="Inbox for pending and decided leave applications."
        action={
          <Button
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void recordsQuery.refetch()}
            disabled={recordsQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      {recordsQuery.isError ? (
        <RbacQueryError error={recordsQuery.error} />
      ) : null}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        <TextField
          size="small"
          label="Search"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as LeaveRequestStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          {LEAVE_REQUEST_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Company"
          value={companyId}
          onChange={(event) => {
            setCompanyId(
              event.target.value === '' ? '' : Number(event.target.value),
            );
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
            setDivisionId(
              event.target.value === '' ? '' : Number(event.target.value),
            );
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
            setDepartmentId(
              event.target.value === '' ? '' : Number(event.target.value),
            );
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
      </Stack>

      <AppTable
        columns={columns}
        rows={records}
        getRowKey={(row) => row.id}
        isLoading={recordsQuery.isLoading}
        emptyState={
          <EmptyState
            title="No leave requests"
            description="Try another status or clear filters."
          />
        }
        footer={
          meta ? (
            <AppPagination
              page={meta.current_page}
              lastPage={meta.last_page}
              perPage={meta.per_page}
              total={meta.total}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
            />
          ) : null
        }
      />

      <AppModal
        open={selectedId !== null}
        onClose={() => {
          setSelectedId(null);
          setRejectOpen(false);
          setDecisionNote('');
        }}
        title="Leave request details"
        description={
          !isDetailLoading && detail
            ? `Request #${detail.id} · ${detail.creation_source === 'employee' ? 'Employee request' : 'Admin on behalf'}`
            : isDetailLoading
              ? 'Loading request…'
              : undefined
        }
        maxWidth="lg"
        showCloseButton
        actions={
          !isDetailLoading && detail?.status === 'pending' && canApprove ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setRejectOpen(true)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckRoundedIcon />}
                onClick={() => void handleApprove()}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Approve
              </Button>
            </Stack>
          ) : undefined
        }
      >
        {isDetailLoading ? (
          <Stack
            spacing={1.5}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 280,
              py: 4,
            }}
          >
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary">
              Loading leave request…
            </Typography>
          </Stack>
        ) : detailQuery.isError ? (
          <RbacQueryError error={detailQuery.error} />
        ) : detail ? (
          <Stack spacing={2}>
            <Chip
              size="small"
              label={detail.status_label}
              color={statusColor(detail.status)}
              sx={{ alignSelf: 'flex-start' }}
            />

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <DetailSectionCard title="Employee info">
                <Stack
                  component={Link}
                  href={`/employees/${detail.employee_id}`}
                  target="_blank"
                  rel="noreferrer"
                  underline="none"
                  color="inherit"
                  direction="row"
                  spacing={1.5}
                  sx={{
                    mb: 1.5,
                    alignItems: 'center',
                    borderRadius: 1,
                    p: 0.5,
                    mx: -0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Avatar
                    src={detail.employee?.avatar_url ?? undefined}
                    alt={detail.employee?.full_name ?? 'Employee'}
                    sx={{ width: 48, height: 48 }}
                  >
                    {initials(detail.employee?.full_name)}
                  </Avatar>
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="body1" noWrap sx={{ fontWeight: 600 }}>
                      {detail.employee?.full_name ?? '—'}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack spacing={1}>
                  <DetailField
                    label="Employee code"
                    value={detail.employee?.employee_code}
                  />
                  <DetailField
                    label="Work email"
                    value={detail.employee?.email}
                  />
                  <DetailField
                    label="Position"
                    value={detail.employee?.designation?.name}
                  />
                  <DetailField
                    label="Myanmar name"
                    value={detail.employee?.myanmar_name}
                  />
                  <DetailField
                    label="Company"
                    value={detail.employee?.company?.name}
                  />
                  <DetailField
                    label="Department"
                    value={detail.employee?.department?.name}
                  />
                </Stack>
              </DetailSectionCard>

              <DetailSectionCard title="Leave info">
                <Stack spacing={1}>
                  <DetailField
                    label="Leave type"
                    value={detail.leave_type?.name}
                  />
                  <DetailField
                    label="Session"
                    value={sessionLabel(detail.start_session)}
                  />
                  <DetailField label="Start date" value={detail.start_date} />
                  <DetailField label="End date" value={detail.end_date} />
                  <DetailField
                    label="Requested days"
                    value={detail.requested_days}
                  />
                  <DetailField
                    label="Document required"
                    value={detail.leave_type?.requires_document ? 'Yes' : 'No'}
                  />
                  <DetailField
                    label="Submitted"
                    value={
                      detail.submitted_at
                        ? new Date(detail.submitted_at).toLocaleString()
                        : null
                    }
                  />
                </Stack>
              </DetailSectionCard>
            </Box>

            <DetailSectionCard title="Reason">
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {detail.reason?.trim() ? detail.reason : '—'}
              </Typography>
            </DetailSectionCard>

            {detail.approvers.length > 0 ? (
              <DetailSectionCard title="Approvers">
                <Stack spacing={2}>
                  {detail.approvers.map((approver) => (
                    <Stack key={approver.id} spacing={1}>
                      <Stack
                        component={Link}
                        href={`/employees/${approver.id}`}
                        target="_blank"
                        rel="noreferrer"
                        underline="none"
                        color="inherit"
                        direction="row"
                        spacing={1.25}
                        sx={{
                          alignItems: 'center',
                          borderRadius: 1,
                          p: 0.5,
                          mx: -0.5,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Avatar
                          src={approver.avatar_url ?? undefined}
                          alt={approver.full_name}
                          sx={{ width: 32, height: 32 }}
                        >
                          {initials(approver.full_name)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {approver.full_name}
                        </Typography>
                      </Stack>
                      <Stack spacing={1}>
                        <DetailField
                          label="Employee code"
                          value={approver.employee_code}
                        />
                        <DetailField
                          label="Work email"
                          value={approver.email}
                        />
                        <DetailField
                          label="Position"
                          value={approver.designation?.name}
                        />
                        <DetailField
                          label="Department"
                          value={approver.department?.name}
                        />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </DetailSectionCard>
            ) : null}

            {detail.documents.length > 0 ? (
              <DetailSectionCard title="Documents">
                <Stack spacing={0.75}>
                  {detail.documents.map((doc) =>
                    doc.url ? (
                      <Link
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        underline="hover"
                      >
                        {doc.original_name}
                      </Link>
                    ) : (
                      <Typography key={doc.id} variant="body2">
                        {doc.original_name}
                      </Typography>
                    ),
                  )}
                </Stack>
              </DetailSectionCard>
            ) : null}

            {detail.status !== 'pending' ? (
              <DetailSectionCard title="Decision">
                <Stack spacing={1}>
                  <DetailField label="Status" value={detail.status_label} />
                  <DetailField
                    label="Decided by"
                    value={detail.decided_by?.name}
                  />
                  <DetailField
                    label="Decided at"
                    value={
                      detail.decided_at
                        ? new Date(detail.decided_at).toLocaleString()
                        : null
                    }
                  />
                  <DetailField
                    label="Decision note"
                    value={detail.decision_note}
                  />
                  {detail.status === 'cancelled' ? (
                    <>
                      <DetailField
                        label="Cancelled at"
                        value={
                          detail.cancelled_at
                            ? new Date(detail.cancelled_at).toLocaleString()
                            : null
                        }
                      />
                      <DetailField
                        label="Cancellation reason"
                        value={detail.cancellation_reason}
                      />
                    </>
                  ) : null}
                </Stack>
              </DetailSectionCard>
            ) : null}
          </Stack>
        ) : null}
      </AppModal>

      <AppModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject leave request"
        description="A rejection reason is required."
        actions={
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => void handleReject()}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
          </Stack>
        }
      >
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Reason"
          value={decisionNote}
          onChange={(event) => setDecisionNote(event.target.value)}
        />
      </AppModal>
    </Stack>
  );
}

function DetailSectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flexShrink: 0, minWidth: 120 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ flex: 1, textAlign: 'left', wordBreak: 'break-word', fontWeight: 500 }}
      >
        {value === null || value === undefined || value === '' ? '—' : value}
      </Typography>
    </Stack>
  );
}
