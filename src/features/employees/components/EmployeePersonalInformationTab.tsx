import EditRoundedIcon from '@mui/icons-material/EditRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useEmployeeNrcOptionsQuery,
  useUpdateEmployeeMutation,
} from '../hooks/useEmployeeQueries';
import type { Employee, EmployeeGender, NrcCitizenship } from '../types/employee.type';
import {
  NRC_CITIZENSHIP_OPTIONS,
  formatNrcPreview,
  nrcTownshipsByCode,
  parseNrcValue,
} from '../utils/nrc';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

type PersonalDraft = {
  date_of_birth: string;
  gender: EmployeeGender | '';
  nrc_code: string;
  nrc_township_code: string;
  nrc_township_name: string;
  nrc_citizenship: NrcCitizenship | '';
  nrc_number_serial: string;
  passport_number: string;
  ssb_number: string;
  personal_email: string;
  personal_phone: string;
  is_foreigner: boolean;
  income_tax_applicable: boolean;
  current_address: string;
  permanent_address: string;
};

function toDraft(employee: Employee): PersonalDraft {
  const parsedNrc = parseNrcValue(employee.nrc_number);

  return {
    date_of_birth: employee.date_of_birth ?? '',
    gender: employee.gender ?? '',
    nrc_code: parsedNrc?.code ?? '',
    nrc_township_code: parsedNrc?.townshipCode ?? '',
    nrc_township_name: '',
    nrc_citizenship: parsedNrc?.citizenship ?? '',
    nrc_number_serial: parsedNrc?.serial ?? '',
    passport_number: employee.passport_number ?? '',
    ssb_number: employee.ssb_number ?? '',
    personal_email: employee.personal_email ?? '',
    personal_phone: employee.personal_phone ?? '',
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
  const nrcOptionsQuery = useEmployeeNrcOptionsQuery();
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

  const nrcCodeOptions = useMemo(
    () => Array.from(new Set((nrcOptionsQuery.data ?? []).map((option) => option.code))),
    [nrcOptionsQuery.data],
  );
  const townshipOptions = useMemo(
    () => nrcTownshipsByCode(nrcOptionsQuery.data ?? [], draft.nrc_code),
    [draft.nrc_code, nrcOptionsQuery.data],
  );
  const nrcPreview = formatNrcPreview({
    code: draft.nrc_code,
    townshipCode: draft.nrc_township_code,
    citizenship: draft.nrc_citizenship,
    serial: draft.nrc_number_serial,
  });

  const handleSave = async () => {
    if (!draft.is_foreigner && !nrcPreview) {
      toast.error('Please complete NRC code, township, type, and number.');
      return;
    }

    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        payload: {
          date_of_birth: draft.date_of_birth || null,
          gender: draft.gender || null,
          nrc_number: draft.is_foreigner ? null : nrcPreview || null,
          passport_number: draft.passport_number.trim() || null,
          ssb_number: draft.ssb_number.trim() || null,
          personal_email: draft.personal_email.trim() || null,
          personal_phone: draft.personal_phone.trim() || null,
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
                select
                label="Gender"
                size="small"
                value={draft.gender}
                onChange={(e) =>
                  patchDraft({ gender: e.target.value as EmployeeGender | '' })
                }
                fullWidth
              >
                <MenuItem value="">Not set</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
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
            <FormCell>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.is_foreigner}
                    onChange={(e) =>
                      patchDraft(
                        e.target.checked
                          ? {
                              is_foreigner: true,
                              nrc_code: '',
                              nrc_township_code: '',
                              nrc_township_name: '',
                              nrc_citizenship: '',
                              nrc_number_serial: '',
                            }
                          : { is_foreigner: false },
                      )
                    }
                  />
                }
                label="Foreigner"
              />
            </FormCell>
            {!draft.is_foreigner ? (
              <>
                <FormCell span={3}>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      width: { xs: '100%', md: '75%' },
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '1fr 2fr 1fr 2fr',
                      },
                    }}
                  >
                    <TextField
                      select
                      label="NRC code"
                      size="small"
                      value={draft.nrc_code}
                      onChange={(e) =>
                        patchDraft({
                          nrc_code: e.target.value,
                          nrc_township_code: '',
                          nrc_township_name: '',
                        })
                      }
                      fullWidth
                      disabled={nrcOptionsQuery.isLoading}
                    >
                      {nrcCodeOptions.map((code) => (
                        <MenuItem key={code} value={code}>
                          {code}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="NRC township"
                      size="small"
                      value={draft.nrc_township_code}
                      onChange={(e) => {
                        const selected = townshipOptions.find(
                          (option) => option.township_code === e.target.value,
                        );
                        patchDraft({
                          nrc_township_code: e.target.value,
                          nrc_township_name: selected?.township_name_mm ?? '',
                        });
                      }}
                      fullWidth
                      disabled={!draft.nrc_code}
                    >
                      {townshipOptions.map((option) => (
                        <MenuItem key={option.id} value={option.township_code}>
                          {option.township_code} / {option.township_name_mm}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="NRC type"
                      size="small"
                      value={draft.nrc_citizenship}
                      onChange={(e) =>
                        patchDraft({ nrc_citizenship: e.target.value as NrcCitizenship | '' })
                      }
                      fullWidth
                    >
                      {NRC_CITIZENSHIP_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="NRC number"
                      size="small"
                      value={draft.nrc_number_serial}
                      onChange={(e) =>
                        patchDraft({
                          nrc_number_serial: e.target.value.replace(/\D/g, '').slice(0, 6),
                        })
                      }
                      fullWidth
                    />
                  </Box>
                </FormCell>
              </>
            ) : null}
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
            <FormCell>{null}</FormCell>
            <FormCell>
              <TextField
                label="Personal email"
                size="small"
                value={draft.personal_email}
                onChange={(e) => patchDraft({ personal_email: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>
              <TextField
                label="Personal phone"
                size="small"
                value={draft.personal_phone}
                onChange={(e) => patchDraft({ personal_phone: e.target.value })}
                fullWidth
              />
            </FormCell>
            <FormCell>{null}</FormCell>
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
              <ViewField
                label="Gender"
                value={
                  employee.gender === 'male'
                    ? 'Male'
                    : employee.gender === 'female'
                      ? 'Female'
                      : employee.gender === 'other'
                        ? 'Other'
                        : null
                }
              />
            </FormCell>
            <FormCell>
              <ViewField label="Passport" value={employee.passport_number} />
            </FormCell>
            <FormCell>
              <ViewField label="SSB number" value={employee.ssb_number} />
            </FormCell>
            <FormCell>
              <ViewField label="Personal email" value={employee.personal_email} />
            </FormCell>
            <FormCell>
              <ViewField label="Personal phone" value={employee.personal_phone} />
            </FormCell>
            <FormCell>{null}</FormCell>
            <FormCell>
              <ViewField label="Foreigner" value={employee.is_foreigner ? 'Yes' : 'No'} />
            </FormCell>
            <FormCell>
              <ViewField
                label="Income tax applicable"
                value={employee.income_tax_applicable ? 'Yes' : 'No'}
              />
            </FormCell>
            <FormCell>
              <ViewField label="NRC" value={employee.nrc_number} />
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
