import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { AppModal } from '@/components/common/AppModal';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useCreateEmployeeAssetMutation,
  useDeleteEmployeeAssetMutation,
  useEmployeeAssetsQuery,
  useUpdateEmployeeAssetMutation,
} from '../hooks/useEmployeeExtensionQueries';
import type {
  AssetCategory,
  EmployeeAsset,
  EmployeeAssetPayload,
  EmployeeAssetStatus,
} from '../types/employee-extension.type';

const categories: Array<{ value: AssetCategory; label: string }> = [
  { value: 'it_electronics', label: 'IT & Electronics' },
  { value: 'vehicles_housing', label: 'Vehicles & Housing' },
  { value: 'access_cards', label: 'Access & Cards' },
  { value: 'software_digital', label: 'Software & Digital' },
  { value: 'equipment_uniform', label: 'Equipment & Uniform' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'others', label: 'Others' },
];

const statuses: Array<{ value: EmployeeAssetStatus; label: string }> = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'returned', label: 'Returned' },
  { value: 'lost', label: 'Lost' },
  { value: 'damaged', label: 'Damaged' },
];

type AssetDraft = {
  category: AssetCategory | '';
  name: string;
  identifier: string;
  assigned_at: string;
  returned_at: string;
  status: EmployeeAssetStatus;
  notes: string;
};

const emptyDraft = (): AssetDraft => ({
  category: '',
  name: '',
  identifier: '',
  assigned_at: new Date().toISOString().slice(0, 10),
  returned_at: '',
  status: 'assigned',
  notes: '',
});

function toDraft(asset: EmployeeAsset): AssetDraft {
  return {
    category: asset.category,
    name: asset.name,
    identifier: asset.identifier ?? '',
    assigned_at: asset.assigned_at,
    returned_at: asset.returned_at ?? '',
    status: asset.status,
    notes: asset.notes ?? '',
  };
}

function statusColor(status: EmployeeAssetStatus) {
  if (status === 'assigned') return 'success';
  if (status === 'returned') return 'default';
  if (status === 'lost') return 'error';
  return 'warning';
}

type Props = {
  employeeId: number;
  canManage: boolean;
};

export function EmployeeAssetsTab({ employeeId, canManage }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const assetsQuery = useEmployeeAssetsQuery(employeeId);
  const createAsset = useCreateEmployeeAssetMutation(employeeId);
  const updateAsset = useUpdateEmployeeAssetMutation(employeeId);
  const deleteAsset = useDeleteEmployeeAssetMutation(employeeId);
  const [editingAsset, setEditingAsset] = useState<EmployeeAsset | null>(null);
  const [draft, setDraft] = useState<AssetDraft>(emptyDraft);
  const [modalOpen, setModalOpen] = useState(false);

  const saving = createAsset.isPending || updateAsset.isPending;

  const openCreate = () => {
    setEditingAsset(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  };

  const openEdit = (asset: EmployeeAsset) => {
    setEditingAsset(asset);
    setDraft(toDraft(asset));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!draft.category || !draft.name.trim() || !draft.assigned_at) {
      toast.error('Category, asset name, and assigned date are required.');
      return;
    }
    if (draft.status === 'returned' && !draft.returned_at) {
      toast.error('Returned date is required when the asset is returned.');
      return;
    }

    const payload: EmployeeAssetPayload = {
      category: draft.category,
      name: draft.name.trim(),
      identifier: draft.identifier.trim() || null,
      assigned_at: draft.assigned_at,
      returned_at: draft.status === 'returned' ? draft.returned_at : null,
      status: draft.status,
      notes: draft.notes.trim() || null,
    };

    try {
      if (editingAsset) {
        await updateAsset.mutateAsync({ assetId: editingAsset.id, payload });
        toast.success('Employee asset updated.');
      } else {
        await createAsset.mutateAsync(payload);
        toast.success('Asset assigned to employee.');
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (asset: EmployeeAsset) => {
    const accepted = await confirm({
      title: 'Delete employee asset?',
      description: `Delete “${asset.name}” from this employee's asset history?`,
      confirmLabel: 'Delete',
    });
    if (!accepted) return;

    try {
      await deleteAsset.mutateAsync(asset.id);
      toast.success('Employee asset deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <Card variant="outlined">
        <CardHeader
          title="Employee assets"
          subheader="Company assets assigned to this employee and their return status."
          action={
            canManage ? (
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={openCreate}>
                Assign asset
              </Button>
            ) : null
          }
          sx={{
            pb: 0,
            '& .MuiCardHeader-title': { fontSize: '1rem', fontWeight: 600 },
          }}
        />
        <CardContent>
          {assetsQuery.isLoading ? <AppLoader label="Loading assets…" /> : null}
          {assetsQuery.isError ? (
            <Typography color="error" variant="body2">
              {getApiErrorMessage(assetsQuery.error)}
            </Typography>
          ) : null}
          {assetsQuery.isSuccess && (assetsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No employee assets"
              description="No company assets have been assigned to this employee."
            />
          ) : null}
          {assetsQuery.isSuccess && (assetsQuery.data?.length ?? 0) > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Identifier</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell>Returned</TableCell>
                    <TableCell>Status</TableCell>
                    {canManage ? <TableCell align="right">Actions</TableCell> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(assetsQuery.data ?? []).map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {asset.name}
                        </Typography>
                        {asset.notes ? (
                          <Typography variant="caption" color="text.secondary">
                            {asset.notes}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{asset.category_label}</TableCell>
                      <TableCell>{asset.identifier ?? '—'}</TableCell>
                      <TableCell>{asset.assigned_at}</TableCell>
                      <TableCell>{asset.returned_at ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={asset.status_label}
                          color={statusColor(asset.status)}
                        />
                      </TableCell>
                      {canManage ? (
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(asset)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={deleteAsset.isPending}
                              onClick={() => void handleDelete(asset)}
                            >
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <AppModal
        open={modalOpen}
        title={editingAsset ? 'Edit employee asset' : 'Assign employee asset'}
        description="Record the company asset and its assignment status."
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : editingAsset ? 'Save changes' : 'Assign asset'}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              required
              fullWidth
              label="Category"
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as AssetCategory,
                }))
              }
            >
              {categories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              required
              fullWidth
              label="Asset name"
              placeholder="e.g. MacBook Pro, Toyota Vios"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Identifier"
              placeholder="Asset code, serial, plate number, IMEI"
              value={draft.identifier}
              onChange={(event) =>
                setDraft((current) => ({ ...current, identifier: event.target.value }))
              }
            />
            <TextField
              select
              required
              fullWidth
              label="Status"
              value={draft.status}
              onChange={(event) => {
                const status = event.target.value as EmployeeAssetStatus;
                setDraft((current) => ({
                  ...current,
                  status,
                  returned_at: status === 'returned' ? current.returned_at : '',
                }));
              }}
            >
              {statuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              required
              fullWidth
              type="date"
              label="Assigned date"
              value={draft.assigned_at}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) =>
                setDraft((current) => ({ ...current, assigned_at: event.target.value }))
              }
            />
            <TextField
              required={draft.status === 'returned'}
              disabled={draft.status !== 'returned'}
              fullWidth
              type="date"
              label="Returned date"
              value={draft.returned_at}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) =>
                setDraft((current) => ({ ...current, returned_at: event.target.value }))
              }
            />
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Notes"
            value={draft.notes}
            onChange={(event) =>
              setDraft((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </Stack>
      </AppModal>
    </>
  );
}
