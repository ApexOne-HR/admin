import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { AppLoader } from '@/components/common/AppLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import {
  useDeleteEmployeeAttachmentMutation,
  useDownloadEmployeeAttachmentMutation,
  useEmployeeAttachmentsQuery,
  useUploadEmployeeAttachmentMutation,
} from '../hooks/useEmployeeExtensionQueries';
import type { AttachmentCategory, EmployeeAttachment } from '../types/employee-extension.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

const CATEGORY_OPTIONS: Array<{ value: AttachmentCategory; label: string }> = [
  { value: 'cv', label: 'CV' },
  { value: 'contract', label: 'Contract' },
  { value: 'id_document', label: 'ID document' },
  { value: 'other', label: 'Other' },
];

function categoryLabel(category: string) {
  return CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  employeeId: number;
  canEdit: boolean;
};

export function EmployeeDocumentsTab({ employeeId, canEdit }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const attachmentsQuery = useEmployeeAttachmentsQuery(employeeId);
  const uploadAttachment = useUploadEmployeeAttachmentMutation(employeeId);
  const downloadAttachment = useDownloadEmployeeAttachmentMutation(employeeId);
  const deleteAttachment = useDeleteEmployeeAttachmentMutation(employeeId);

  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<AttachmentCategory>('cv');
  const [title, setTitle] = useState('');
  const [isEmployeeVisible, setIsEmployeeVisible] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  if (attachmentsQuery.isLoading) {
    return (
      <Card variant="outlined">
        <CardHeader title="Documents" sx={cardHeaderSx} />
        <CardContent>
          <AppLoader label="Loading documents…" />
        </CardContent>
      </Card>
    );
  }

  if (attachmentsQuery.isError) {
    return (
      <Card variant="outlined">
        <CardHeader title="Documents" sx={cardHeaderSx} />
        <CardContent>
          <Typography color="error" variant="body2">
            {getApiErrorMessage(attachmentsQuery.error)}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const rows = attachmentsQuery.data ?? [];

  const resetUploadForm = () => {
    setCategory('cv');
    setTitle('');
    setIsEmployeeVisible(true);
    setFile(null);
  };

  const handleCancelAdd = () => {
    setAdding(false);
    resetUploadForm();
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!file) {
      toast.error('Choose a file to upload.');
      return;
    }

    try {
      await uploadAttachment.mutateAsync({
        category,
        title: title.trim(),
        is_employee_visible: isEmployeeVisible,
        file,
      });
      toast.success('Document uploaded.');
      resetUploadForm();
      setAdding(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDownload = async (row: EmployeeAttachment) => {
    try {
      const result = await downloadAttachment.mutateAsync(row.id);
      window.open(result.download_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (row: EmployeeAttachment) => {
    const ok = await confirm({
      title: 'Delete document',
      description: `Delete ${row.title || 'this document'}?`,
      confirmLabel: 'Delete',
      confirmColor: 'error',
    });
    if (!ok) return;

    try {
      await deleteAttachment.mutateAsync(row.id);
      toast.success('Document deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <FolderOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
            <Box component="span">Documents</Box>
          </Stack>
        }
        sx={cardHeaderSx}
        action={
          canEdit && !adding ? (
            <Button
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => setAdding(true)}
            >
              Add
            </Button>
          ) : null
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {rows.length === 0 && !adding ? (
            <EmptyState
              title="No documents"
              description="No documents on file."
            />
          ) : null}

          {rows.map((row) => (
            <Box
              key={row.id}
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'minmax(0, 1.2fr) minmax(0, 1fr) auto',
                },
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.title || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(row.size_bytes)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Chip size="small" label={categoryLabel(row.category)} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={row.is_employee_visible ? 'Visible in app' : 'HR only'}
                />
              </Stack>
              <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Download"
                  onClick={() => void handleDownload(row)}
                  disabled={downloadAttachment.isPending}
                >
                  <DownloadRoundedIcon fontSize="small" />
                </IconButton>
                {canEdit ? (
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete"
                    onClick={() => void handleDelete(row)}
                    disabled={deleteAttachment.isPending}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Stack>
            </Box>
          ))}

          {adding ? (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Upload document
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                }}
              >
                <TextField
                  select
                  size="small"
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AttachmentCategory)}
                  fullWidth
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  label="Title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="File"
                  value={file?.name ?? ''}
                  placeholder="No file chosen"
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <Button component="label" size="small" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Choose
                          <input
                            hidden
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          />
                        </Button>
                      ),
                    },
                    inputLabel: { shrink: true },
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={isEmployeeVisible}
                      onChange={(e) => setIsEmployeeVisible(e.target.checked)}
                    />
                  }
                  label="Visible to employee (mobile later)"
                />
                <Box
                  sx={{
                    gridColumn: { md: 'span 2' },
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                  }}
                >
                  <Button onClick={handleCancelAdd} disabled={uploadAttachment.isPending}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => void handleUpload()}
                    disabled={uploadAttachment.isPending}
                  >
                    {uploadAttachment.isPending ? 'Uploading…' : 'Upload'}
                  </Button>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Allowed: PDF, DOC, DOCX, JPG, PNG · max 10 MB
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
