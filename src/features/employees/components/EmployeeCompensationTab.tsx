import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { AppTable, type AppTableColumn } from '@/components/common/AppTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/feedback/ToastProvider';
import {
  clearFieldError,
  hasFieldErrors,
  validateRequiredFields,
  type FieldErrors,
} from '@/components/common/form';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useAllowanceDeductionsQuery,
  useCreateEmployeeSalaryMutation,
  useCurrentEmployeeSalaryQuery,
  useEmployeeSalaryStructuresQuery,
  useUpdateEmployeeSalaryMutation,
} from '@/features/compensation/hooks/useCompensationQueries';
import type {
  SalaryStructure,
  SalaryStructureItemDraft,
} from '@/features/compensation/types/compensation.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function emptyItem(): SalaryStructureItemDraft {
  return {
    allowance_deduction_id: '',
    amount: '',
    is_fixed: true,
  };
}

type FormState = {
  basic_salary: string;
  payment_mode: 'bank' | 'cash';
  payment_duration: 'monthly' | 'bi-weekly';
  effective_date: string;
  items: SalaryStructureItemDraft[];
};

function structureToForm(structure: SalaryStructure | null | undefined): FormState {
  if (!structure) {
    return {
      basic_salary: '',
      payment_mode: 'bank',
      payment_duration: 'monthly',
      effective_date: new Date().toISOString().slice(0, 10),
      items: [],
    };
  }

  return {
    basic_salary: String(structure.basic_salary),
    payment_mode: (structure.payment_mode as 'bank' | 'cash') || 'bank',
    payment_duration: (structure.payment_duration as 'monthly' | 'bi-weekly') || 'monthly',
    effective_date: structure.effective_date,
    items: (structure.items ?? []).map((item) => ({
      allowance_deduction_id: item.allowance_deduction_id,
      amount: String(item.amount),
      is_fixed: item.is_fixed,
    })),
  };
}

type Props = {
  employeeId: number;
  companyId: number;
  canEdit: boolean;
};

export function EmployeeCompensationTab({ employeeId, companyId, canEdit }: Props) {
  const toast = useToast();
  const currentQuery = useCurrentEmployeeSalaryQuery(employeeId);
  const historyQuery = useEmployeeSalaryStructuresQuery(employeeId);
  const catalogQuery = useAllowanceDeductionsQuery(
    { company_id: companyId, active_only: true },
    true,
  );
  const createSalary = useCreateEmployeeSalaryMutation(employeeId);
  const updateSalary = useUpdateEmployeeSalaryMutation(employeeId);

  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [form, setForm] = useState<FormState>(() => structureToForm(null));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const current = currentQuery.data ?? null;
  const history = historyQuery.data ?? [];
  const catalog = catalogQuery.data ?? [];

  useEffect(() => {
    if (mode === 'view' && currentQuery.isSuccess) {
      setForm(structureToForm(current));
    }
  }, [current, currentQuery.isSuccess, mode]);

  const startEdit = () => {
    setForm(structureToForm(current));
    setFieldErrors({});
    setMode(current ? 'edit' : 'new');
  };

  const startNewVersion = () => {
    setForm({
      ...structureToForm(current),
      effective_date: new Date().toISOString().slice(0, 10),
    });
    setFieldErrors({});
    setMode('new');
  };

  const cancelEdit = () => {
    setForm(structureToForm(current));
    setFieldErrors({});
    setMode('view');
  };

  const handleSave = async () => {
    const required = validateRequiredFields(
      {
        basic_salary: form.basic_salary,
        effective_date: form.effective_date,
      },
      [
        { key: 'basic_salary', label: 'Basic salary' },
        { key: 'effective_date', label: 'Effective date' },
      ],
    );
    setFieldErrors(required);
    if (hasFieldErrors(required)) {
      return;
    }

    const items = form.items
      .filter((item) => item.allowance_deduction_id !== '' && item.amount !== '')
      .map((item) => ({
        allowance_deduction_id: Number(item.allowance_deduction_id),
        amount: Number(item.amount),
        is_fixed: item.is_fixed,
      }));

    if (items.some((item) => Number.isNaN(item.amount) || item.amount < 0)) {
      toast.error('Item amounts must be non-negative numbers.');
      return;
    }

    const payload = {
      basic_salary: Number(form.basic_salary),
      payment_mode: form.payment_mode,
      payment_duration: form.payment_duration,
      effective_date: form.effective_date,
      items,
    };

    try {
      if (mode === 'edit' && current) {
        await updateSalary.mutateAsync({ structureId: current.id, payload });
        toast.success('Current salary updated.');
      } else {
        await createSalary.mutateAsync(payload);
        toast.success('Salary structure created.');
      }
      setMode('view');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const historyColumns: AppTableColumn<SalaryStructure>[] = [
    {
      key: 'effective',
      header: 'Effective',
      render: (row) => row.effective_date,
    },
    {
      key: 'end',
      header: 'End',
      render: (row) => row.end_date ?? '—',
    },
    {
      key: 'basic',
      header: 'Basic',
      render: (row) => money(row.basic_salary),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => money(row.total_salary),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.is_current ? <Chip size="small" color="success" label="Current" /> : 'History',
    },
  ];

  if (currentQuery.isLoading || historyQuery.isLoading) {
    return (
      <Card variant="outlined">
        <CardHeader title="Salary" sx={cardHeaderSx} />
        <CardContent>
          <AppLoader label="Loading salary…" />
        </CardContent>
      </Card>
    );
  }

  if (currentQuery.isError) {
    return (
      <Card variant="outlined">
        <CardHeader title="Salary" sx={cardHeaderSx} />
        <CardContent>
          <Typography color="error" variant="body2">
            {getApiErrorMessage(currentQuery.error)}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const editing = mode !== 'view';

  return (
    <Stack spacing={2.5}>
      <Card variant="outlined">
        <CardHeader
          title="Current salary"
          sx={cardHeaderSx}
          action={
            canEdit ? (
              editing ? (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={createSalary.isPending || updateSalary.isPending}
                    onClick={() => void handleSave()}
                  >
                    Save
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1}>
                  {current ? (
                    <Button
                      size="small"
                      startIcon={<AddRoundedIcon />}
                      onClick={startNewVersion}
                    >
                      New version
                    </Button>
                  ) : null}
                  <Button size="small" startIcon={<EditRoundedIcon />} onClick={startEdit}>
                    {current ? 'Edit current' : 'Add salary'}
                  </Button>
                </Stack>
              )
            ) : null
          }
        />
        <CardContent>
          {!current && !editing ? (
            <EmptyState
              title="No salary structure"
              description="Add basic salary and line items (Skill, Lunch, Performance)."
            />
          ) : editing ? (
            <Stack spacing={2}>
              {mode === 'new' && current ? (
                <Typography variant="caption" color="text.secondary">
                  Creating a new effective date closes the previous current structure.
                </Typography>
              ) : null}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  required
                  size="small"
                  label="Basic salary"
                  type="number"
                  value={form.basic_salary}
                  error={Boolean(fieldErrors.basic_salary)}
                  helperText={fieldErrors.basic_salary}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, basic_salary: e.target.value }));
                    setFieldErrors((prev) => clearFieldError(prev, 'basic_salary'));
                  }}
                  sx={{ minWidth: 180 }}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />
                <TextField
                  select
                  size="small"
                  label="Payment mode"
                  value={form.payment_mode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      payment_mode: e.target.value as 'bank' | 'cash',
                    }))
                  }
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="bank">Bank</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Payment duration"
                  value={form.payment_duration}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      payment_duration: e.target.value as 'monthly' | 'bi-weekly',
                    }))
                  }
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="bi-weekly">Bi-weekly</MenuItem>
                </TextField>
                <TextField
                  required
                  size="small"
                  label="Effective date"
                  type="date"
                  value={form.effective_date}
                  error={Boolean(fieldErrors.effective_date)}
                  helperText={fieldErrors.effective_date}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, effective_date: e.target.value }));
                    setFieldErrors((prev) => clearFieldError(prev, 'effective_date'));
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={mode === 'edit'}
                  sx={{ minWidth: 180 }}
                />
              </Stack>

              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">Line items</Typography>
                  <Button
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }))
                    }
                  >
                    Add line
                  </Button>
                </Stack>
                {form.items.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No allowances/deductions yet.
                  </Typography>
                ) : (
                  form.items.map((item, index) => (
                    <Stack
                      key={`item-${index}`}
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      sx={{ alignItems: { md: 'center' } }}
                    >
                      <TextField
                        select
                        size="small"
                        label="Catalog item"
                        value={item.allowance_deduction_id}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : Number(e.target.value);
                          setForm((prev) => {
                            const items = [...prev.items];
                            items[index] = { ...items[index], allowance_deduction_id: value };
                            return { ...prev, items };
                          });
                        }}
                        sx={{ minWidth: 220, flex: 1 }}
                      >
                        {catalog.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.name} ({option.type})
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Amount"
                        type="number"
                        value={item.amount}
                        onChange={(e) => {
                          setForm((prev) => {
                            const items = [...prev.items];
                            items[index] = { ...items[index], amount: e.target.value };
                            return { ...prev, items };
                          });
                        }}
                        sx={{ width: 140 }}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={item.is_fixed}
                            onChange={(e) => {
                              setForm((prev) => {
                                const items = [...prev.items];
                                items[index] = { ...items[index], is_fixed: e.target.checked };
                                return { ...prev, items };
                              });
                            }}
                          />
                        }
                        label="Fixed"
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== index),
                          }))
                        }
                        aria-label="Remove line"
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))
                )}
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Basic
                  </Typography>
                  <Typography sx={{ fontWeight: 500 }}>{money(current?.basic_salary)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Allowances
                  </Typography>
                  <Typography sx={{ fontWeight: 500 }}>{money(current?.total_allowance)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Deductions
                  </Typography>
                  <Typography sx={{ fontWeight: 500 }}>{money(current?.total_deduction)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{money(current?.total_salary)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Payment
                  </Typography>
                  <Typography sx={{ fontWeight: 500 }}>
                    {current?.payment_mode} · {current?.payment_duration}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Effective
                  </Typography>
                  <Typography sx={{ fontWeight: 500 }}>{current?.effective_date}</Typography>
                </Box>
              </Box>

              {(current?.items?.length ?? 0) > 0 ? (
                <AppTable
                  columns={[
                    {
                      key: 'name',
                      header: 'Item',
                      render: (row) =>
                        row.allowance_deduction?.name ?? `#${row.allowance_deduction_id}`,
                    },
                    {
                      key: 'type',
                      header: 'Type',
                      render: (row) => row.allowance_deduction?.type ?? '—',
                    },
                    {
                      key: 'amount',
                      header: 'Amount',
                      render: (row) => money(row.amount),
                    },
                    {
                      key: 'fixed',
                      header: 'Fixed',
                      render: (row) => (row.is_fixed ? 'Yes' : 'No'),
                    },
                  ]}
                  rows={current?.items ?? []}
                  getRowKey={(row) => row.id}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No line items on this structure.
                </Typography>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Salary history" sx={cardHeaderSx} />
        <CardContent>
          <AppTable
            columns={historyColumns}
            rows={history}
            getRowKey={(row) => row.id}
            emptyState={
              <EmptyState title="No history" description="Salary versions will appear here." />
            }
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
