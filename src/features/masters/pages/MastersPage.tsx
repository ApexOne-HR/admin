import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppModal } from '@/components/common/AppModal';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import {
  clearFieldError,
  hasFieldErrors,
  validateRequiredFields,
  type FieldErrors,
} from '@/components/common/form';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { useCompaniesQuery } from '@/features/organization/hooks/useOrganizationQueries';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  ForbiddenAlert,
  PermissionGate,
  RbacQueryError,
  RoleActiveChip,
} from '@/features/rbac/components/RbacShared';
import {
  useCreateLocationMutation,
  useCreatePolicyMutation,
  useCreateWorkScheduleMutation,
  useDeleteLocationMutation,
  useDeletePolicyMutation,
  useDeleteWorkScheduleMutation,
  useLocationsQuery,
  usePoliciesQuery,
  useUpdateLocationMutation,
  useUpdatePolicyMutation,
  useUpdateWorkScheduleMutation,
  useWorkSchedulesQuery,
} from '../hooks/useMastersQueries';
import type { Location, Policy, WorkSchedule, WorkingDay } from '../types/masters.type';

type MastersTab = 'locations' | 'schedules' | 'policies';

const WEEK_DAYS: { value: WorkingDay; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

type FormState = {
  company_id: number | '';
  name: string;
  code: string;
  address: string;
  latitude: string;
  longitude: string;
  geofence_radius_m: string;
  check_in_time: string;
  check_out_time: string;
  break_start_time: string;
  break_end_time: string;
  working_days: WorkingDay[];
  late_grace_minutes: string;
  early_leave_grace_minutes: string;
  ot_allowed: boolean;
  is_sandwich_leave_applicable: boolean;
  work_schedule_id: number | '';
  is_active: boolean;
};

const emptyForm: FormState = {
  company_id: '',
  name: '',
  code: '',
  address: '',
  latitude: '',
  longitude: '',
  geofence_radius_m: '100',
  check_in_time: '09:00',
  check_out_time: '18:00',
  break_start_time: '',
  break_end_time: '',
  working_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  late_grace_minutes: '15',
  early_leave_grace_minutes: '0',
  ot_allowed: true,
  is_sandwich_leave_applicable: false,
  work_schedule_id: '',
  is_active: true,
};

export function MastersPage() {
  const { session } = useAdminSession();
  const toast = useToast();
  const confirm = useConfirm();
  const canView = can(session?.user, 'organizations.view');
  const canManage = can(session?.user, 'organizations.manage');

  const [tab, setTab] = useState<MastersTab>('locations');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const companiesQuery = useCompaniesQuery(canView);
  const locationsQuery = useLocationsQuery(undefined, canView);
  const schedulesQuery = useWorkSchedulesQuery(undefined, canView);
  const policiesQuery = usePoliciesQuery(undefined, canView);

  const createLocation = useCreateLocationMutation();
  const updateLocation = useUpdateLocationMutation();
  const deleteLocation = useDeleteLocationMutation();
  const createSchedule = useCreateWorkScheduleMutation();
  const updateSchedule = useUpdateWorkScheduleMutation();
  const deleteSchedule = useDeleteWorkScheduleMutation();
  const createPolicy = useCreatePolicyMutation();
  const updatePolicy = useUpdatePolicyMutation();
  const deletePolicy = useDeletePolicyMutation();

  const isSaving =
    createLocation.isPending ||
    updateLocation.isPending ||
    createSchedule.isPending ||
    updateSchedule.isPending ||
    createPolicy.isPending ||
    updatePolicy.isPending;

  const tabTitle = useMemo(() => {
    const map: Record<MastersTab, string> = {
      locations: 'Location',
      schedules: 'Work schedule',
      policies: 'Policy',
    };
    return map[tab];
  }, [tab]);

  const schedulesForCompany = useMemo(
    () =>
      (schedulesQuery.data ?? []).filter(
        (item) => form.company_id === '' || item.company_id === form.company_id,
      ),
    [schedulesQuery.data, form.company_id],
  );

  if (!canView) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Masters" description="Locations, work schedules, and policies." />
        <ForbiddenAlert />
      </Stack>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditLocation = (row: Location) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      company_id: row.company_id,
      name: row.name,
      code: row.code ?? '',
      address: row.address ?? '',
      latitude: row.latitude?.toString() ?? '',
      longitude: row.longitude?.toString() ?? '',
      geofence_radius_m: String(row.geofence_radius_m ?? 100),
      is_active: row.is_active,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditSchedule = (row: WorkSchedule) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      company_id: row.company_id,
      name: row.name,
      code: row.code ?? '',
      check_in_time: row.check_in_time?.slice(0, 5) || '09:00',
      check_out_time: row.check_out_time?.slice(0, 5) || '18:00',
      break_start_time: row.break_start_time?.slice(0, 5) || '',
      break_end_time: row.break_end_time?.slice(0, 5) || '',
      working_days: row.working_days?.length ? row.working_days : emptyForm.working_days,
      is_active: row.is_active,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditPolicy = (row: Policy) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      company_id: row.company_id,
      name: row.name,
      code: row.code ?? '',
      late_grace_minutes: String(row.late_grace_minutes ?? 15),
      early_leave_grace_minutes: String(row.early_leave_grace_minutes ?? 0),
      ot_allowed: row.ot_allowed,
      is_sandwich_leave_applicable: row.is_sandwich_leave_applicable,
      work_schedule_id: row.work_schedule_id ?? '',
      is_active: row.is_active,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    const nextErrors = validateRequiredFields(
      {
        company_id: form.company_id,
        name: form.name,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
      },
      [
        { key: 'company_id', label: 'Company' },
        { key: 'name', label: 'Name' },
        { key: 'check_in_time', label: 'Check-in', when: tab === 'schedules' },
        { key: 'check_out_time', label: 'Check-out', when: tab === 'schedules' },
      ],
    );

    if (
      tab === 'schedules' &&
      form.check_in_time &&
      form.check_out_time &&
      form.check_out_time <= form.check_in_time
    ) {
      nextErrors.check_out_time = 'Check-out must be after check-in.';
    }

    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    try {
      if (tab === 'locations') {
        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          latitude: form.latitude === '' ? null : Number(form.latitude),
          longitude: form.longitude === '' ? null : Number(form.longitude),
          geofence_radius_m: Number(form.geofence_radius_m) || 100,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateLocation.mutateAsync({ id: editingId, payload });
        } else {
          await createLocation.mutateAsync(payload);
        }
      }

      if (tab === 'schedules') {
        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          check_in_time: form.check_in_time,
          check_out_time: form.check_out_time,
          break_start_time: form.break_start_time || null,
          break_end_time: form.break_end_time || null,
          working_days: form.working_days,
          is_active: form.is_active,
        };
        if (editingId) {
          await updateSchedule.mutateAsync({ id: editingId, payload });
        } else {
          await createSchedule.mutateAsync(payload);
        }
      }

      if (tab === 'policies') {
        const payload = {
          company_id: Number(form.company_id),
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          late_grace_minutes: Number(form.late_grace_minutes) || 0,
          early_leave_grace_minutes: Number(form.early_leave_grace_minutes) || 0,
          ot_allowed: form.ot_allowed,
          is_sandwich_leave_applicable: form.is_sandwich_leave_applicable,
          work_schedule_id: form.work_schedule_id === '' ? null : Number(form.work_schedule_id),
          is_active: form.is_active,
        };
        if (editingId) {
          await updatePolicy.mutateAsync({ id: editingId, payload });
        } else {
          await createPolicy.mutateAsync(payload);
        }
      }

      setFormOpen(false);
      toast.success(editingId ? `${tabTitle} updated.` : `${tabTitle} created.`);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: `Delete ${tabTitle.toLowerCase()}?`,
      description: 'Soft-deleted and hidden from lists.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }
    try {
      if (tab === 'locations') await deleteLocation.mutateAsync(id);
      if (tab === 'schedules') await deleteSchedule.mutateAsync(id);
      if (tab === 'policies') await deletePolicy.mutateAsync(id);
      toast.success(`${tabTitle} deleted.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const locationColumns: AppTableColumn<Location>[] = [
    {
      key: 'name',
      header: 'Location',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code ?? '—'} · {row.company?.name ?? `Company #${row.company_id}`}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'geo',
      header: 'Geofence',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.latitude != null && row.longitude != null
            ? `${row.latitude}, ${row.longitude} · ${row.geofence_radius_m}m`
            : '—'}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditLocation(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const scheduleColumns: AppTableColumn<WorkSchedule>[] = [
    {
      key: 'name',
      header: 'Schedule',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code ?? '—'} · {row.company?.name ?? `Company #${row.company_id}`}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'hours',
      header: 'Hours',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.check_in_time} – {row.check_out_time}
        </Typography>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {(row.working_days ?? []).join(', ') || '—'}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditSchedule(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const policyColumns: AppTableColumn<Policy>[] = [
    {
      key: 'name',
      header: 'Policy',
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {row.code ?? '—'} · {row.company?.name ?? `Company #${row.company_id}`}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'rules',
      header: 'Rules',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          Late {row.late_grace_minutes}m · Early {row.early_leave_grace_minutes}m
          {row.ot_allowed ? ' · OT' : ''}
        </Typography>
      ),
    },
    {
      key: 'schedule',
      header: 'Schedule hint',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.work_schedule?.name ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RoleActiveChip active={row.is_active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <PermissionGate permission="organizations.manage">
          <IconButton size="small" onClick={() => openEditPolicy(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  const activeQuery =
    tab === 'locations' ? locationsQuery : tab === 'schedules' ? schedulesQuery : policiesQuery;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Masters"
        description="Locations (WHERE), work schedules (WHEN), policies (RULES). Assign Company/Division defaults next (F7)."
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Add {tabTitle}
            </Button>
          ) : null
        }
      />

      <Tabs value={tab} onChange={(_, value: MastersTab) => setTab(value)} variant="scrollable">
        <Tab value="locations" label="Locations" />
        <Tab value="schedules" label="Work schedules" />
        <Tab value="policies" label="Policies" />
      </Tabs>

      {activeQuery.isError ? <RbacQueryError error={activeQuery.error} /> : null}

      {tab === 'locations' ? (
        <AppTable
          columns={locationColumns}
          rows={locationsQuery.data ?? []}
          getRowKey={(row) => row.id}
          isLoading={locationsQuery.isLoading}
          emptyState={<EmptyState title="No locations" description="Add HQ / branch sites for check-in." />}
        />
      ) : null}

      {tab === 'schedules' ? (
        <AppTable
          columns={scheduleColumns}
          rows={schedulesQuery.data ?? []}
          getRowKey={(row) => row.id}
          isLoading={schedulesQuery.isLoading}
          emptyState={<EmptyState title="No schedules" description="Add standard / night shifts." />}
        />
      ) : null}

      {tab === 'policies' ? (
        <AppTable
          columns={policyColumns}
          rows={policiesQuery.data ?? []}
          getRowKey={(row) => row.id}
          isLoading={policiesQuery.isLoading}
          emptyState={<EmptyState title="No policies" description="Add attendance rule packs." />}
        />
      ) : null}

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? `Edit ${tabTitle}` : `Add ${tabTitle}`}
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={isSaving} onClick={() => void handleSave()}>
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          {formError ? (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          ) : null}

          <TextField
            select
            label="Company"
            value={form.company_id}
            onChange={(event) => {
              setFieldErrors((current) => clearFieldError(current, 'company_id'));
              setForm((current) => ({
                ...current,
                company_id: event.target.value === '' ? '' : Number(event.target.value),
                work_schedule_id: '',
              }));
            }}
            required
            fullWidth
            error={Boolean(fieldErrors.company_id)}
            helperText={fieldErrors.company_id}
          >
            {(companiesQuery.data ?? []).map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Name"
            value={form.name}
            onChange={(event) => {
              setFieldErrors((current) => clearFieldError(current, 'name'));
              setForm((current) => ({ ...current, name: event.target.value }));
            }}
            required
            fullWidth
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
          />
          <TextField
            label="Code"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            fullWidth
            helperText="Optional · unique within company"
          />

          {tab === 'locations' ? (
            <>
              <TextField
                label="Address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
                fullWidth
                multiline
                minRows={2}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Latitude"
                  value={form.latitude}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, latitude: event.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Longitude"
                  value={form.longitude}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, longitude: event.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Geofence (m)"
                  value={form.geofence_radius_m}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, geofence_radius_m: event.target.value }))
                  }
                  fullWidth
                />
              </Stack>
            </>
          ) : null}

          {tab === 'schedules' ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Check-in"
                  type="time"
                  value={form.check_in_time}
                  onChange={(event) => {
                    setFieldErrors((current) => clearFieldError(current, 'check_in_time'));
                    setForm((current) => ({ ...current, check_in_time: event.target.value }));
                  }}
                  required
                  fullWidth
                  error={Boolean(fieldErrors.check_in_time)}
                  helperText={fieldErrors.check_in_time}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Check-out"
                  type="time"
                  value={form.check_out_time}
                  onChange={(event) => {
                    setFieldErrors((current) => clearFieldError(current, 'check_out_time'));
                    setForm((current) => ({ ...current, check_out_time: event.target.value }));
                  }}
                  required
                  fullWidth
                  error={Boolean(fieldErrors.check_out_time)}
                  helperText={fieldErrors.check_out_time}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Break start"
                  type="time"
                  value={form.break_start_time}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, break_start_time: event.target.value }))
                  }
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Break end"
                  type="time"
                  value={form.break_end_time}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, break_end_time: event.target.value }))
                  }
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <FormGroup row>
                {WEEK_DAYS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        size="small"
                        checked={form.working_days.includes(day.value)}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            working_days: current.working_days.includes(day.value)
                              ? current.working_days.filter((item) => item !== day.value)
                              : [...current.working_days, day.value],
                          }))
                        }
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>
            </>
          ) : null}

          {tab === 'policies' ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Late grace (minutes)"
                  value={form.late_grace_minutes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, late_grace_minutes: event.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Early leave grace (minutes)"
                  value={form.early_leave_grace_minutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      early_leave_grace_minutes: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </Stack>
              <TextField
                select
                label="Schedule hint (optional)"
                value={form.work_schedule_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    work_schedule_id:
                      event.target.value === '' ? '' : Number(event.target.value),
                  }))
                }
                fullWidth
                helperText="Times still live on the schedule — this is only a hint"
              >
                <MenuItem value="">None</MenuItem>
                {schedulesForCompany.map((schedule) => (
                  <MenuItem key={schedule.id} value={schedule.id}>
                    {schedule.name}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.ot_allowed}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ot_allowed: event.target.checked }))
                    }
                  />
                }
                label="OT allowed"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_sandwich_leave_applicable}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_sandwich_leave_applicable: event.target.checked,
                      }))
                    }
                  />
                }
                label="Sandwich leave applicable"
              />
            </>
          ) : null}

          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
              />
            }
            label="Active"
          />
        </Stack>
      </AppModal>
    </Stack>
  );
}
