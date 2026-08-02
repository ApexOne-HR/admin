import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import FestivalRoundedIcon from '@mui/icons-material/FestivalRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import { RbacQueryError } from '@/features/rbac/components/RbacShared';
import { useDashboardSummaryQuery } from '../hooks/useDashboardQueries';
import type {
  DashboardAttentionItem,
  DashboardAttendanceToday,
  DashboardUpcomingHoliday,
} from '../types/dashboard.type';

type QuickAction = {
  id: string;
  title: string;
  path: string;
  icon: SvgIconComponent;
  permission?: string;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-attendance',
    title: 'Create attendance',
    path: '/attendance/new',
    icon: AddRoundedIcon,
    permission: 'attendance.manage',
    color: 'primary.main',
  },
  {
    id: 'attendance',
    title: 'Attendance records',
    path: '/attendance',
    icon: FactCheckRoundedIcon,
    permission: 'attendance.view',
    color: 'info.main',
  },
  {
    id: 'employees',
    title: 'Employees',
    path: '/employees',
    icon: BadgeRoundedIcon,
    permission: 'employees.view',
    color: 'secondary.main',
  },
  {
    id: 'add-employee',
    title: 'Add employee',
    path: '/employees/new',
    icon: PersonAddAltRoundedIcon,
    permission: 'employees.create',
    color: 'success.main',
  },
  {
    id: 'org-chart',
    title: 'Org chart',
    path: '/org-chart',
    icon: AccountTreeRoundedIcon,
    permission: 'employees.view',
    color: 'warning.main',
  },
  {
    id: 'holidays',
    title: 'Holidays',
    path: '/holidays',
    icon: FestivalRoundedIcon,
    permission: 'holidays.view',
    color: 'error.main',
  },
  {
    id: 'audit-logs',
    title: 'Audit logs',
    path: '/settings/audit-logs',
    icon: HistoryRoundedIcon,
    permission: 'admin_audits.view',
    color: 'text.secondary',
  },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date(`${value}T00:00:00`),
    );
  } catch {
    return value;
  }
}

function AttendanceKpis({
  asOfDate,
  counts,
}: {
  asOfDate: string;
  counts: DashboardAttendanceToday;
}) {
  const items = [
    { label: 'Present', value: counts.present, color: 'success.main' as const },
    { label: 'Absent', value: counts.absent, color: 'error.main' as const },
    { label: 'Incomplete', value: counts.incomplete, color: 'warning.main' as const },
    { label: 'On leave', value: counts.on_leave, color: 'info.main' as const },
  ];

  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          mb: 1.5,
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Today&apos;s attendance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDate(asOfDate)} · {counts.total} records ·{' '}
          <Link component={RouterLink} to="/attendance" underline="hover">
            View all
          </Link>
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {items.map((item) => (
          <Card key={item.label} variant="outlined">
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: item.color, mt: 0.5 }}>
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

function AttentionList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: DashboardAttentionItem[];
  emptyLabel: string;
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      ) : (
        <Stack spacing={1} divider={<Divider flexItem />}>
          {items.map((item) => (
            <Stack
              key={`${item.kind}-${item.id}`}
              direction="row"
              spacing={1}
              sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Link
                  component={RouterLink}
                  to={`/attendance/${item.id}`}
                  underline="hover"
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  {item.employee?.full_name ?? `Record #${item.id}`}
                </Link>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  {item.employee?.employee_code ? `${item.employee.employee_code} · ` : ''}
                  {formatDate(item.work_date)}
                </Typography>
              </Box>
              <Tooltip title="Missing check-out">
                <Chip size="small" label={item.status_label} variant="outlined" />
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function NeedsAttentionPanel({ incomplete }: { incomplete: DashboardAttentionItem[] }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ mb: 2, alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Needs attention
          </Typography>
          <Link component={RouterLink} to="/attendance" underline="hover" variant="body2">
            Attendance
          </Link>
        </Stack>
        <AttentionList
          title="Incomplete (last 7 days)"
          items={incomplete}
          emptyLabel="No incomplete punches."
        />
      </CardContent>
    </Card>
  );
}

function UpcomingHolidaysPanel({ holidays }: { holidays: DashboardUpcomingHoliday[] }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ mb: 2, alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Upcoming holidays
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Next 3 months
            </Typography>
          </Box>
          <Link component={RouterLink} to="/holidays" underline="hover" variant="body2">
            View all
          </Link>
        </Stack>
        {holidays.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No holidays in the next 3 months.
          </Typography>
        ) : (
          <Stack spacing={1.25} divider={<Divider flexItem />}>
            {holidays.map((holiday) => (
              <Stack
                key={holiday.id}
                direction="row"
                spacing={1}
                sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {holiday.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {holiday.calendar?.company?.name
                      ? `${holiday.calendar.company.name} · `
                      : ''}
                    {holiday.calendar?.name ?? 'Calendar'}
                  </Typography>
                </Box>
                <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="body2">{formatDate(holiday.date)}</Typography>
                  <Chip size="small" label={holiday.type_label} variant="outlined" />
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { session } = useAdminSession();
  const user = session?.user;
  const summaryQuery = useDashboardSummaryQuery();
  const summary = summaryQuery.data;
  const actions = QUICK_ACTIONS.filter(
    (action) => !action.permission || can(user, action.permission),
  );

  const hasSidePanels =
    summary?.needs_attention != null || summary?.upcoming_holidays != null;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Dashboard"
        description="Quick access and today's HR operations snapshot."
      />

      {summaryQuery.isError ? <RbacQueryError error={summaryQuery.error} /> : null}

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Quick actions
        </Typography>
        {actions.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                No quick actions are available for your permissions.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: `repeat(${actions.length}, minmax(0, 1fr))`,
              },
            }}
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.id} variant="outlined" sx={{ height: '100%' }}>
                  <CardActionArea
                    component={RouterLink}
                    to={action.path}
                    sx={{ height: '100%', alignItems: 'stretch' }}
                  >
                    <CardContent
                      sx={{
                        py: 1.5,
                        px: 1.5,
                        '&:last-child': { pb: 1.5 },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center' }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'action.hover',
                            flexShrink: 0,
                          }}
                        >
                          <Icon fontSize="small" sx={{ color: action.color }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {action.title}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {summaryQuery.isLoading && !summary ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Loading dashboard summary…
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {summary?.attendance_today ? (
        <AttendanceKpis asOfDate={summary.as_of_date} counts={summary.attendance_today} />
      ) : null}

      {hasSidePanels ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            alignItems: 'start',
            gridTemplateColumns: {
              xs: '1fr',
              lg: summary?.needs_attention
                ? 'minmax(0, 1.2fr) minmax(0, 1fr)'
                : '1fr',
            },
          }}
        >
          {summary?.needs_attention ? (
            <NeedsAttentionPanel incomplete={summary.needs_attention.incomplete} />
          ) : null}

          <Stack spacing={2}>
            {summary?.upcoming_holidays ? (
              <UpcomingHolidaysPanel holidays={summary.upcoming_holidays} />
            ) : null}
          </Stack>
        </Box>
      ) : null}

      {!summaryQuery.isLoading
        && summary
        && !summary.attendance_today
        && !hasSidePanels ? (
          <EmptyState
            title="No dashboard widgets"
            description="Your account does not have permissions for attendance or holiday widgets yet."
          />
        ) : null}
    </Stack>
  );
}
