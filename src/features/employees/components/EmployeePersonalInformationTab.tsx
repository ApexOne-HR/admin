import EditRoundedIcon from '@mui/icons-material/EditRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import { useUpdateEmployeeMutation } from '../hooks/useEmployeeQueries';
import type { Employee } from '../types/employee.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

type PersonalDraft = {
  date_of_birth: string;
  nrc_number: string;
  passport_number: string;
  ssb_number: string;
  is_foreigner: boolean;
  income_tax_applicable: boolean;
  current_address: string;
  permanent_address: string;
};

function toDraft(employee: Employee): PersonalDraft {
  return {
    date_of_birth: employee.date_of_birth ?? '',
    nrc_number: employee.nrc_number ?? '',
    passport_number: employee.passport_number ?? '',
    ssb_number: employee.ssb_number ?? '',
    is_foreigner: employee.is_foreigner,
    income_tax_applicable: employee.income_tax_applicable,
    current_address: employee.current_address ?? '',
    permanent_address: employee.permanent_address ?? '',
  };
}

function FormGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        alignItems: 'start',
      }}
    >
      {children}
    </Box>
  );
}

function FormCell({
  children,
  span = 1,
}: {
  children: ReactNode;
  span?: 1 | 2 | 3;
}) {
  return (
    <Box
      sx={{
        gridColumn: {
          xs: '1 / -1',
          md: span === 1 ? 'auto' : `span ${span}`,
        },
        minWidth: 0,
      }}
    >
      {children}
    </Box>
  );
}

function ViewField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word', fontWeight: 500 }}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Typography>
    </Box>
  );
}

type Props = {
  employee: Employee;
  canEdit: boolean;
};

export function EmployeePersonalInformationTab({ employee, canEdit }: Props) {
  const toast = useToast();
  const updateEmployee = useUpdateEmployeeMutation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PersonalDraft>(() => toDraft(employee));

  useEffect(() => {
    if (!editing) {
      setDraft(toDraft(employee));
    }
  }, [employee, editing]);

  const patchDraft = (patch: Partial<PersonalDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        payload: {
          date_of_birth: draft.date_of_birth || null,
          nrc_number: draft.nrc_number.trim() || null,
          passport_number: draft.passport_number.trim() || null,
          ssb_number: draft.ssb_number.trim() || null,
          is_foreigner: draft.is_foreigner,
          income_tax_applicable: draft.income_tax_applicable,
          current_address: draft.current_address.trim() || null,
          permanent_address: draft.permanent_address.trim() || null,
        },
      });
      toast.success('Personal information saved.');
      setEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleCancel = () => {
    setDraft(toDraft(employee));
    setEditing(false);
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />
            <Box component="span">Demographics</Box>
          </Stack>
        }
        sx={cardHeaderSx}
        action={
          canEdit ? (
            editing ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleCancel} disabled={updateEmployee.isPending}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={updateEmployee.isPending}
                  onClick={() => void handleSave()}
                >
                  {updateEmployee.isPending ? 'Saving…' : 'Save'}
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
        {editing ? (
          <FormGrid>
            <FormCell>
              <TextField
                label="Date of birth"
                type="date"
                size="small"
                value={draft.date_of_birth}
                onChange={(e) => patchDraft({ date_of_birth: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FormCell>
            <FormCell>
              <TextField
                label="NRC"
                size="small"
                value={draft.nrc_number}
                onChange={(e) => patchDraft({ nrc_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Passport"
                size="small"
                value={draft.passport_number}
                onChange={(e) => patchDraft({ passport_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="SSB number"
                size="small"
                value={draft.ssb_number}
                onChange={(e) => patchDraft({ ssb_number: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.is_foreigner}
                    onChange={(e) => patchDraft({ is_foreigner: e.target.checked })}
                  />
                }
                label="Foreigner"
              />
            </FormCell>
            <FormCell>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.income_tax_applicable}
                    onChange={(e) => patchDraft({ income_tax_applicable: e.target.checked })}
                  />
                }
                label="Income tax applicable"
              />
            </FormCell>
            <FormCell span={3}>
              <TextField
                label="Current address (optional)"
                size="small"
                value={draft.current_address}
                onChange={(e) => patchDraft({ current_address: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </FormCell>
            <FormCell span={3}>
              <TextField
                label="Permanent address (optional)"
                size="small"
                value={draft.permanent_address}
                onChange={(e) => patchDraft({ permanent_address: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </FormCell>
          </FormGrid>
        ) : (
          <FormGrid>
            <FormCell>
              <ViewField label="Date of birth" value={employee.date_of_birth} />
            </FormCell>
            <FormCell>
              <ViewField label="NRC" value={employee.nrc_number} />
            </FormCell>
            <FormCell>
              <ViewField label="Passport" value={employee.passport_number} />
            </FormCell>
            <FormCell>
              <ViewField label="SSB number" value={employee.ssb_number} />
            </FormCell>
            <FormCell>
              <ViewField label="Foreigner" value={employee.is_foreigner ? 'Yes' : 'No'} />
            </FormCell>
            <FormCell>
              <ViewField
                label="Income tax applicable"
                value={employee.income_tax_applicable ? 'Yes' : 'No'}
              />
            </FormCell>
            <FormCell span={3}>
              <ViewField label="Current address" value={employee.current_address} />
            </FormCell>
            <FormCell span={3}>
              <ViewField label="Permanent address" value={employee.permanent_address} />
            </FormCell>
          </FormGrid>
        )}
      </CardContent>
    </Card>
  );
}
