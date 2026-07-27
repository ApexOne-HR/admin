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
  useEmployeeEmergencyContactsQuery,
  useSyncEmployeeEmergencyContactsMutation,
} from '../hooks/useEmployeeExtensionQueries';
import type { EmployeeEmergencyContactDraft } from '../types/employee-extension.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

const emptyContact = (): EmployeeEmergencyContactDraft => ({
  contact_name: '',
  relationship: '',
  phone: '',
});

function toDrafts(
  rows: Array<{ contact_name: string; relationship: string; phone: string }>,
): EmployeeEmergencyContactDraft[] {
  return rows.map((row) => ({
    contact_name: row.contact_name,
    relationship: row.relationship,
    phone: row.phone,
  }));
}

type Props = {
  employeeId: number;
  canEdit: boolean;
};

export function EmployeeEmergencyContactsTab({ employeeId, canEdit }: Props) {
  const toast = useToast();
  const contactsQuery = useEmployeeEmergencyContactsQuery(employeeId);
  const syncContacts = useSyncEmployeeEmergencyContactsMutation(employeeId);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<EmployeeEmergencyContactDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (contactsQuery.data) {
      setDrafts(toDrafts(contactsQuery.data));
      setHydrated(true);
    }
  }, [contactsQuery.data]);

  if (contactsQuery.isLoading || !hydrated) {
    return (
      <Card variant="outlined">
        <CardHeader title="Emergency" sx={cardHeaderSx} />
        <CardContent>
          <AppLoader label="Loading contacts…" />
        </CardContent>
      </Card>
    );
  }

  if (contactsQuery.isError) {
    return (
      <Card variant="outlined">
        <CardHeader title="Emergency" sx={cardHeaderSx} />
        <CardContent>
          <Typography color="error" variant="body2">
            {getApiErrorMessage(contactsQuery.error)}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    const cleaned = drafts.filter(
      (row) => row.contact_name.trim() || row.relationship.trim() || row.phone.trim(),
    );

    for (const row of cleaned) {
      if (!row.contact_name.trim() || !row.relationship.trim() || !row.phone.trim()) {
        toast.error('Each contact needs name, relationship, and phone.');
        return;
      }
    }

    try {
      await syncContacts.mutateAsync(
        cleaned.map((row) => ({
          contact_name: row.contact_name.trim(),
          relationship: row.relationship.trim(),
          phone: row.phone.trim(),
        })),
      );
      toast.success('Emergency contacts saved.');
      setEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleCancel = () => {
    setDrafts(toDrafts(contactsQuery.data ?? []));
    setEditing(false);
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Emergency"
        sx={cardHeaderSx}
        action={
          canEdit ? (
            editing ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleCancel} disabled={syncContacts.isPending}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={syncContacts.isPending}
                  onClick={() => void handleSave()}
                >
                  {syncContacts.isPending ? 'Saving…' : 'Save'}
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
              title="No emergency contacts"
              description={editing ? 'Add at least one emergency contact.' : 'No contacts on file.'}
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
                    label="Contact name"
                    size="small"
                    value={row.contact_name}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, contact_name: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <TextField
                    label="Relationship"
                    size="small"
                    value={row.relationship}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, relationship: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <TextField
                    label="Phone"
                    size="small"
                    value={row.phone}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[index] = { ...row, phone: e.target.value };
                      setDrafts(next);
                    }}
                    fullWidth
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDrafts(drafts.filter((_, i) => i !== index))}
                    aria-label="Remove contact"
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
                  <ViewField label="Contact name" value={row.contact_name} />
                  <ViewField label="Relationship" value={row.relationship} />
                  <ViewField label="Phone" value={row.phone} />
                </Box>
              ))}

          {editing ? (
            <Button
              startIcon={<AddRoundedIcon />}
              onClick={() => setDrafts([...drafts, emptyContact()])}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add contact
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
