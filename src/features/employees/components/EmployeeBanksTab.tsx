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
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useEmployeeBanksQuery,
  useSyncEmployeeBanksMutation,
} from '../hooks/useEmployeeExtensionQueries';
import type { EmployeeBankDraft } from '../types/employee-extension.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

const emptyBank = (): EmployeeBankDraft => ({
  bank_name: '',
  account_number: '',
  account_holder_name: '',
  is_primary: false,
});

function toDrafts(
  rows: Array<{
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_primary: boolean;
  }>,
): EmployeeBankDraft[] {
  return rows.map((row) => ({
    bank_name: row.bank_name,
    account_number: row.account_number,
    account_holder_name: row.account_holder_name,
    is_primary: row.is_primary,
  }));
}

type Props = {
  employeeId: number;
  canEdit: boolean;
};

export function EmployeeBanksTab({ employeeId, canEdit }: Props) {
  const toast = useToast();
  const banksQuery = useEmployeeBanksQuery(employeeId);
  const syncBanks = useSyncEmployeeBanksMutation(employeeId);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<EmployeeBankDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (banksQuery.data) {
      setDrafts(toDrafts(banksQuery.data));
      setHydrated(true);
    }
  }, [banksQuery.data]);

  const resetDrafts = () => {
    setDrafts(toDrafts(banksQuery.data ?? []));
  };

  if (banksQuery.isLoading || !hydrated) {
    return (
      <Card variant="outlined">
        <CardHeader title="Banks" sx={cardHeaderSx} />
        <CardContent>
          <AppLoader label="Loading banks…" />
        </CardContent>
      </Card>
    );
  }

  if (banksQuery.isError) {
    return (
      <Card variant="outlined">
        <CardHeader title="Banks" sx={cardHeaderSx} />
        <CardContent>
          <Typography color="error" variant="body2">
            {getApiErrorMessage(banksQuery.error)}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    const cleaned = drafts.filter(
      (row) =>
        row.bank_name.trim()
        || row.account_number.trim()
        || row.account_holder_name.trim(),
    );

    for (const row of cleaned) {
      if (!row.bank_name.trim() || !row.account_number.trim() || !row.account_holder_name.trim()) {
        toast.error('Each bank row needs name, account number, and holder name.');
        return;
      }
    }

    try {
      await syncBanks.mutateAsync(
        cleaned.map((row) => ({
          bank_name: row.bank_name.trim(),
          account_number: row.account_number.trim(),
          account_holder_name: row.account_holder_name.trim(),
          is_primary: row.is_primary,
        })),
      );
      toast.success('Bank accounts saved.');
      setEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleCancel = () => {
    resetDrafts();
    setEditing(false);
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Banks"
        sx={cardHeaderSx}
        action={
          canEdit ? (
            editing ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleCancel} disabled={syncBanks.isPending}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={syncBanks.isPending}
                  onClick={() => void handleSave()}
                >
                  {syncBanks.isPending ? 'Saving…' : 'Save'}
                </Button>
              </Stack>
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
          {drafts.length === 0 ? (
            <EmptyState
              title="No bank accounts"
              description={
                editing
                  ? 'Add payroll bank details for this employee.'
                  : 'No bank accounts on file.'
              }
            />
          ) : null}

          {editing
            ? drafts.map((row, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <TextField
                    label="Bank name"
                    size="small"
                    value={row.bank_name}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, bank_name: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <TextField
                    label="Account number"
                    size="small"
                    value={row.account_number}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, account_number: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <TextField
                    label="Account holder"
                    size="small"
                    value={row.account_holder_name}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, account_holder_name: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={row.is_primary}
                        onChange={(e) => {
                          const next = drafts.map((item, i) => ({
                            ...item,
                            is_primary: i === index ? e.target.checked : false,
                          }));
                          setDrafts(next);
                        }}
                      />
                    }
                    label="Primary"
                  />
                  <Box sx={{ gridColumn: { md: '3 / 4' }, justifySelf: 'end' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDrafts(drafts.filter((_, i) => i !== index))}
                      aria-label="Remove bank"
                    >
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            : drafts.map((row, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <ViewField label="Bank name" value={row.bank_name} />
                  <ViewField label="Account number" value={row.account_number} />
                  <ViewField label="Account holder" value={row.account_holder_name} />
                  <Box>
                    {row.is_primary ? (
                      <Chip size="small" color="primary" label="Primary" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Secondary
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}

          {editing ? (
            <Button
              startIcon={<AddRoundedIcon />}
              onClick={() =>
                setDrafts([
                  ...drafts,
                  { ...emptyBank(), is_primary: drafts.length === 0 },
                ])
              }
              sx={{ alignSelf: 'flex-start' }}
            >
              Add bank
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}
