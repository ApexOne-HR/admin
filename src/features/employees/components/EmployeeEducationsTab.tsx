import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useEmployeeEducationsQuery,
  useSyncEmployeeEducationsMutation,
} from '../hooks/useEmployeeExtensionQueries';
import type {
  DegreeLevel,
  EmployeeEducationDraft,
} from '../types/employee-extension.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

const emptyEducation = (): EmployeeEducationDraft => ({
  degree_level: '',
  field_of_study: '',
  institution_name: '',
  passing_year: '',
});

function toDrafts(
  rows: Array<{
    degree_level: string;
    field_of_study: string | null;
    institution_name: string | null;
    passing_year: number | null;
  }>,
): EmployeeEducationDraft[] {
  return rows.map((row) => ({
    degree_level: (row.degree_level as DegreeLevel) || '',
    field_of_study: row.field_of_study ?? '',
    institution_name: row.institution_name ?? '',
    passing_year: row.passing_year ?? '',
  }));
}

type Props = {
  employeeId: number;
  canEdit: boolean;
};

export function EmployeeEducationsTab({ employeeId, canEdit }: Props) {
  const toast = useToast();
  const educationsQuery = useEmployeeEducationsQuery(employeeId);
  const syncEducations = useSyncEmployeeEducationsMutation(employeeId);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<EmployeeEducationDraft[]>([]);

  useEffect(() => {
    if (educationsQuery.isSuccess) {
      setDrafts(toDrafts(educationsQuery.data ?? []));
    }
  }, [educationsQuery.data, educationsQuery.isSuccess]);

  if (educationsQuery.isLoading) {
    return (
      <Card variant="outlined">
        <CardHeader title="Education" sx={cardHeaderSx} />
        <CardContent>
          <AppLoader label="Loading education…" />
        </CardContent>
      </Card>
    );
  }

  if (educationsQuery.isError) {
    return (
      <Card variant="outlined">
        <CardHeader title="Education" sx={cardHeaderSx} />
        <CardContent>
          <Typography color="error" variant="body2">
            {getApiErrorMessage(educationsQuery.error)}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    const cleaned = drafts.filter(
      (row) =>
        row.degree_level
        || row.field_of_study.trim()
        || row.institution_name.trim()
        || row.passing_year !== '',
    );

    for (const row of cleaned) {
      if (!row.degree_level) {
        toast.error('Each education row needs a degree level.');
        return;
      }
    }

    try {
      await syncEducations.mutateAsync(cleaned);
      toast.success('Education records saved.');
      setEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleCancel = () => {
    setDrafts(toDrafts(educationsQuery.data ?? []));
    setEditing(false);
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Education"
        sx={cardHeaderSx}
        action={
          canEdit ? (
            editing ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleCancel} disabled={syncEducations.isPending}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={syncEducations.isPending}
                  onClick={() => void handleSave()}
                >
                  {syncEducations.isPending ? 'Saving…' : 'Save'}
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
              title="No education records"
              description={
                editing ? 'Add academic history for this employee.' : 'No education on file.'
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
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr)) auto' },
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <TextField
                    select
                    label="Degree level"
                    size="small"
                    value={row.degree_level}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, degree_level: e.target.value as DegreeLevel | '' };
                      setDrafts(next);
                    }}
                    fullWidth
                  >
                    <MenuItem value="Diploma">Diploma</MenuItem>
                    <MenuItem value="Bachelor">Bachelor</MenuItem>
                    <MenuItem value="Master">Master</MenuItem>
                    <MenuItem value="Doctorate">Doctorate</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                  <TextField
                    label="Field of study"
                    size="small"
                    value={row.field_of_study}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, field_of_study: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <TextField
                    label="Institution"
                    size="small"
                    value={row.institution_name}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, institution_name: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <TextField
                    label="Passing year"
                    size="small"
                    type="number"
                    value={row.passing_year}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = {
                        ...row,
                        passing_year: e.target.value === '' ? '' : Number(e.target.value),
                      };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDrafts(drafts.filter((_, i) => i !== index))}
                    aria-label="Remove education"
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
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
                  <ViewField label="Degree level" value={row.degree_level || '—'} />
                  <ViewField label="Field of study" value={row.field_of_study || '—'} />
                  <ViewField label="Institution" value={row.institution_name || '—'} />
                  <ViewField
                    label="Passing year"
                    value={row.passing_year === '' ? '—' : String(row.passing_year)}
                  />
                </Box>
              ))}

          {editing ? (
            <Button
              startIcon={<AddRoundedIcon />}
              onClick={() => setDrafts([...drafts, emptyEducation()])}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add education
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
        {value}
      </Typography>
    </Box>
  );
}
