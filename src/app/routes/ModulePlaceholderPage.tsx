import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { AppButton } from '@/components/common/AppButton';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

type ModulePlaceholderPageProps = {
  title: string;
  description: string;
};

type PreviewRow = {
  name: string;
  email: string;
  status: 'Active' | 'Pending' | 'Review';
  createdAt: string;
};

const metricCards = [
  {
    label: 'Total Users',
    value: '628',
    icon: GroupRoundedIcon,
    color: 'text-brand-700 bg-brand-50',
  },
  {
    label: 'Companies',
    value: '385',
    icon: BusinessRoundedIcon,
    color: 'text-success-700 bg-success-50',
  },
  {
    label: 'Properties',
    value: '789',
    icon: HomeRoundedIcon,
    color: 'text-warning-700 bg-warning-50',
  },
  {
    label: 'Verified',
    value: '243',
    icon: VerifiedRoundedIcon,
    color: 'text-brand-700 bg-brand-50',
  },
];

const previewRows: PreviewRow[] = [
  {
    name: 'Kay Thiri Aung',
    email: 'kaythiri@example.com',
    status: 'Active',
    createdAt: 'May 30, 2026',
  },
  {
    name: 'Golden Palace Myanmar',
    email: 'goldenpalace@example.com',
    status: 'Pending',
    createdAt: 'May 30, 2026',
  },
  {
    name: 'Thin Thin Maw',
    email: 'thinthin@example.com',
    status: 'Review',
    createdAt: 'May 29, 2026',
  },
];

const previewColumns: AppTableColumn<PreviewRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
          Demo record
        </Typography>
      </Stack>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => (
      <Typography variant="body2" color="text.secondary">
        {row.email}
      </Typography>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Chip
        color={row.status === 'Active' ? 'success' : row.status === 'Pending' ? 'warning' : 'default'}
        label={row.status}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (row) => (
      <Typography variant="body2" color="text.secondary">
        {row.createdAt}
      </Typography>
    ),
  },
];

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={title}
        description={description}
        action={
          <AppButton startIcon={<AddRoundedIcon />} variant="contained">
            Add New
          </AppButton>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                      {metric.label}
                    </Typography>
                    <Typography variant="h2" sx={{ mt: 0.5 }}>
                      {metric.value}
                    </Typography>
                  </div>
                  <div className={`grid h-10 w-10 place-items-center rounded-full ${metric.color}`}>
                    <Icon fontSize="small" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <TextField label="Search by name or email..." size="small" />
            <TextField defaultValue="all" label="Type" select size="small">
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="individual">Individual</MenuItem>
              <MenuItem value="company">Company</MenuItem>
            </TextField>
            <TextField defaultValue="all" label="Status" select size="small">
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
            <TextField defaultValue="all" label="Verification" select size="small">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
          </div>
        </CardContent>
      </Card>

      <AppTable
        columns={previewColumns}
        rows={previewRows}
        getRowKey={(row) => row.email}
      />
    </Stack>
  );
}
