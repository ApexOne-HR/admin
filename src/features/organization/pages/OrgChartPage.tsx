import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  GlobalStyles,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppLoader } from '@/components/common/AppLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { can } from '@/features/auth/services/auth.service';
import { ForbiddenAlert, RbacQueryError } from '@/features/rbac/components/RbacShared';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useCompaniesQuery,
  useDepartmentsQuery,
  useDivisionsQuery,
  useOrgChartQuery,
} from '../hooks/useOrganizationQueries';
import type {
  OrgChartDepartmentNode,
  OrgChartDivisionNode,
  OrgChartEmployeeNode,
} from '../types/org-chart.type';

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const orgTreeSx = {
  minWidth: 'max-content',
  '& ul': {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    m: 0,
    pt: 3,
    pl: 0,
  },
  '& li': {
    position: 'relative',
    listStyle: 'none',
    textAlign: 'center',
    px: 1,
    pt: 3,
  },
  '& li::before, & li::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: '50%',
    width: '50%',
    height: 24,
    borderTop: '2px solid',
    borderColor: 'divider',
  },
  '& li::after': {
    right: 'auto',
    left: '50%',
    borderLeft: '2px solid',
    borderColor: 'divider',
  },
  '& li:only-child::before, & li:only-child::after': {
    display: 'none',
  },
  '& li:only-child': {
    pt: 0,
  },
  '& li:first-of-type::before, & li:last-of-type::after': {
    border: 0,
  },
  '& li:last-of-type::before': {
    borderRight: '2px solid',
    borderColor: 'divider',
    borderRadius: '0 6px 0 0',
  },
  '& li:first-of-type::after': {
    borderRadius: '6px 0 0 0',
  },
  '& ul ul::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '50%',
    height: 24,
    borderLeft: '2px solid',
    borderColor: 'divider',
  },
  '& > ul': {
    pt: 0,
  },
  '& > ul::before': {
    display: 'none',
  },
} as const;

function EmployeeBranch({ employee }: { employee: OrgChartEmployeeNode }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = employee.children.length > 0;

  return (
    <Box component="li">
      <Paper
        variant="outlined"
        sx={{
          p: 1.25,
          width: 230,
          mx: 'auto',
          textAlign: 'left',
          borderColor: employee.reporting_cycle ? 'warning.main' : 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: 'primary.main' }}>
            {initials(employee.full_name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component={RouterLink}
              to={`/employees/${employee.id}`}
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {employee.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {employee.employee_code}
              {employee.designation ? ` · ${employee.designation.name}` : ''}
            </Typography>
          </Box>
          {employee.reporting_cycle ? (
            <Tooltip title="A reporting cycle was detected and cut at this node.">
              <WarningAmberRoundedIcon color="warning" fontSize="small" />
            </Tooltip>
          ) : null}
          {hasChildren ? (
            <IconButton
              className="org-chart-no-print"
              size="small"
              onClick={() => setExpanded((current) => !current)}
              aria-label={expanded ? 'Collapse reports' : 'Expand reports'}
            >
              {expanded ? (
                <ExpandLessRoundedIcon fontSize="small" />
              ) : (
                <ExpandMoreRoundedIcon fontSize="small" />
              )}
            </IconButton>
          ) : null}
        </Stack>
      </Paper>

      {hasChildren && expanded ? (
        <Box component="ul">
          {employee.children.map((child) => (
            <EmployeeBranch key={child.id} employee={child} />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function DepartmentTree({ department }: { department: OrgChartDepartmentNode }) {
  const [expanded, setExpanded] = useState(false);
  const hasEmployees = department.employees.length > 0;

  return (
    <Box component="li">
      <Card
        variant="outlined"
        sx={{
          width: 260,
          mx: 'auto',
          borderTop: '3px solid',
          borderTopColor: 'info.main',
          textAlign: 'left',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 1.5, py: 1.25, alignItems: 'center' }}
        >
          <ApartmentRoundedIcon color={department.is_unassigned ? 'disabled' : 'info'} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {department.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {department.employee_count} employee{department.employee_count === 1 ? '' : 's'}
            </Typography>
          </Box>
          <IconButton
            className="org-chart-no-print"
            size="small"
            onClick={() => setExpanded((current) => !current)}
            aria-label={expanded ? 'Collapse department' : 'Expand department'}
            disabled={!hasEmployees}
          >
            {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </IconButton>
        </Stack>
      </Card>

      {hasEmployees && expanded ? (
        <Box component="ul">
          {department.employees.map((employee) => (
            <EmployeeBranch key={employee.id} employee={employee} />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function DivisionTree({ division }: { division: OrgChartDivisionNode }) {
  const [expanded, setExpanded] = useState(true);
  const hasDepartments = division.departments.length > 0;

  return (
    <Box component="li">
      <Card
        variant="outlined"
        sx={{
          width: 280,
          mx: 'auto',
          borderTop: '3px solid',
          borderTopColor: 'secondary.main',
          textAlign: 'left',
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ p: 1.5, alignItems: 'center' }}>
          <CorporateFareRoundedIcon color={division.is_unassigned ? 'disabled' : 'secondary'} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
              {division.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {division.employee_count} employee{division.employee_count === 1 ? '' : 's'}
            </Typography>
          </Box>
          <IconButton
            className="org-chart-no-print"
            size="small"
            onClick={() => setExpanded((current) => !current)}
            aria-label={expanded ? 'Collapse division' : 'Expand division'}
            disabled={!hasDepartments}
          >
            {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </IconButton>
        </Stack>
      </Card>

      {hasDepartments && expanded ? (
        <Box component="ul">
          {division.departments.map((department) => (
            <DepartmentTree
              key={department.id ?? `unassigned-${division.id ?? 'company'}`}
              department={department}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

export function OrgChartPage() {
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const { session } = useAdminSession();
  const allowed = can(session?.user, 'employees.view');
  const companiesQuery = useCompaniesQuery(allowed);
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [divisionId, setDivisionId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const previousDocumentTitle = useRef<string | null>(null);
  const divisionsQuery = useDivisionsQuery(
    companyId === '' ? undefined : companyId,
    allowed && companyId !== '',
  );
  const departmentsQuery = useDepartmentsQuery(
    divisionId === '' ? undefined : divisionId,
    allowed && divisionId !== '',
  );
  const chartQuery = useOrgChartQuery(
    companyId === '' ? undefined : companyId,
    divisionId === '' ? undefined : divisionId,
    departmentId === '' ? undefined : departmentId,
    allowed && companyId !== '',
  );

  useEffect(() => {
    if (companyId === '' && (companiesQuery.data?.length ?? 0) > 0) {
      setCompanyId(companiesQuery.data?.[0]?.id ?? '');
    }
  }, [companiesQuery.data, companyId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPreparingPdf(false);
      fullscreenRef.current?.style.removeProperty('--org-chart-print-scale');
      if (previousDocumentTitle.current !== null) {
        document.title = previousDocumentTitle.current;
        previousDocumentTitle.current = null;
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement === fullscreenRef.current) {
      await document.exitFullscreen();
      return;
    }

    await fullscreenRef.current?.requestFullscreen();
  };

  const exportPdf = () => {
    if (!chartQuery.data || isPreparingPdf) return;

    previousDocumentTitle.current = document.title;
    document.title = `${chartQuery.data.company.name} - Organization Chart`;
    setIsPreparingPdf(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const chartWidth = fullscreenRef.current?.scrollWidth ?? 1000;
        const scale = Math.min(1, 1000 / chartWidth);
        fullscreenRef.current?.style.setProperty(
          '--org-chart-print-scale',
          String(scale),
        );
        window.print();
      });
    });
  };

  if (!allowed) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Organization chart" description="Company reporting structure." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <GlobalStyles
        styles={{
          '@page': {
            size: 'landscape',
            margin: '10mm',
          },
          '@media print': {
            'body *': {
              visibility: 'hidden',
            },
            '#org-chart-print-area, #org-chart-print-area *': {
              visibility: 'visible',
            },
            '#org-chart-print-area': {
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'max-content',
              minWidth: '100%',
              overflow: 'visible !important',
              padding: '0 !important',
              background: '#fff',
              zoom: 'var(--org-chart-print-scale, 1)',
            },
            '.org-chart-no-print': {
              display: 'none !important',
            },
            '.org-chart-print-heading': {
              display: 'block !important',
            },
          },
        }}
      />
      <PageHeader
        title="Organization chart"
        description="Company → division → department → employee reporting lines."
      />

      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <TextField
              select
              label="Company"
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value === '' ? '' : Number(event.target.value));
                setDivisionId('');
                setDepartmentId('');
              }}
              sx={{ minWidth: { xs: '100%', md: 280 } }}
              disabled={companiesQuery.isLoading}
            >
              {(companiesQuery.data ?? []).map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Division"
              value={divisionId}
              onChange={(event) => {
                setDivisionId(event.target.value === '' ? '' : Number(event.target.value));
                setDepartmentId('');
              }}
              sx={{ minWidth: { xs: '100%', md: 280 } }}
              disabled={companyId === '' || divisionsQuery.isLoading}
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
              label="Department"
              value={departmentId}
              onChange={(event) =>
                setDepartmentId(event.target.value === '' ? '' : Number(event.target.value))
              }
              sx={{ minWidth: { xs: '100%', md: 280 } }}
              disabled={divisionId === '' || departmentsQuery.isLoading}
            >
              <MenuItem value="">All departments</MenuItem>
              {(departmentsQuery.data ?? []).map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
            {chartQuery.data ? (
              <Chip
                icon={<PersonOutlineRoundedIcon />}
                label={`${chartQuery.data.employee_count} employees`}
                variant="outlined"
              />
            ) : null}
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfRoundedIcon />}
              disabled={!chartQuery.data || isPreparingPdf}
              onClick={exportPdf}
              sx={{ ml: { md: 'auto' } }}
            >
              {isPreparingPdf ? 'Preparing…' : 'Export PDF'}
            </Button>
            <Button
              variant="outlined"
              startIcon={
                isFullscreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />
              }
              disabled={!chartQuery.data}
              onClick={() => void toggleFullscreen()}
            >
              {isFullscreen ? 'Exit full screen' : 'Full screen'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {companiesQuery.isLoading || chartQuery.isLoading ? (
        <AppLoader label="Loading organization chart…" />
      ) : null}

      {companiesQuery.isError ? <RbacQueryError error={companiesQuery.error} /> : null}
      {chartQuery.isError ? (
        <Typography color="error" variant="body2">
          {getApiErrorMessage(chartQuery.error)}
        </Typography>
      ) : null}

      {companiesQuery.isSuccess && companiesQuery.data.length === 0 ? (
        <EmptyState
          title="No accessible companies"
          description="No company is available within your organization scope."
        />
      ) : null}

      {chartQuery.data ? (
        <Box
          id="org-chart-print-area"
          ref={fullscreenRef}
          sx={{
            position: 'relative',
            overflow: 'auto',
            pb: 2,
            '&:fullscreen': {
              bgcolor: 'background.default',
              minHeight: '100%',
              p: 3,
            },
          }}
        >
          <Box className="org-chart-print-heading" sx={{ display: 'none', mb: 3 }}>
            <Typography variant="h4">{chartQuery.data.company.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Organization chart
              {divisionId !== ''
                ? ` · ${divisionsQuery.data?.find((division) => division.id === divisionId)?.name ?? 'Selected division'}`
                : ' · All divisions'}
              {departmentId !== ''
                ? ` · ${departmentsQuery.data?.find((department) => department.id === departmentId)?.name ?? 'Selected department'}`
                : divisionId !== ''
                  ? ' · All departments'
                  : ''}
              {` · Exported ${new Date().toLocaleDateString()}`}
            </Typography>
          </Box>
          {isFullscreen ? (
            <Stack
              className="org-chart-no-print"
              direction="row"
              spacing={1}
              sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 10,
              }}
            >
              <Button
                variant="contained"
                startIcon={<PictureAsPdfRoundedIcon />}
                disabled={isPreparingPdf}
                onClick={exportPdf}
              >
                {isPreparingPdf ? 'Preparing…' : 'Export PDF'}
              </Button>
              <Button
                variant="contained"
                startIcon={<FullscreenExitRoundedIcon />}
                onClick={() => void toggleFullscreen()}
              >
                Exit full screen
              </Button>
            </Stack>
          ) : null}
          {chartQuery.data.divisions.length > 0 ? (
            <Box sx={orgTreeSx}>
              <Box component="ul">
                <Box component="li">
                  <Paper
                    variant="outlined"
                    sx={{
                      px: 3,
                      py: 2,
                      width: 300,
                      mx: 'auto',
                      borderTop: '4px solid',
                      borderTopColor: 'primary.main',
                      textAlign: 'left',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: 'center', justifyContent: 'center' }}
                    >
                      <BusinessRoundedIcon color="primary" />
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Company
                        </Typography>
                        <Typography variant="h6">{chartQuery.data.company.name}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                  <Box component="ul">
                    {chartQuery.data.divisions.map((division) => (
                      <DivisionTree
                        key={division.id ?? 'unassigned-company'}
                        division={division}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                minWidth: 360,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <EmptyState
                title="No divisions"
                description="No divisions are available for the selected filters."
              />
            </Box>
          )}
        </Box>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <AccountTreeRoundedIcon fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary">
          Employees are nested under their manager only when both are in the same department.
        </Typography>
      </Stack>
    </Stack>
  );
}
