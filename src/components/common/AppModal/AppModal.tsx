import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';
import type { ReactNode } from 'react';

export type AppModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  onClose: () => void;
};

export function AppModal({
  actions,
  children,
  description,
  maxWidth = 'sm',
  onClose,
  open,
  title,
}: AppModalProps) {
  return (
    <Dialog fullWidth maxWidth={maxWidth} onClose={onClose} open={open}>
      <DialogTitle>
        <Stack spacing={0.75}>
          <Typography variant="h3">{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Stack>
      </DialogTitle>

      {children ? <DialogContent>{children}</DialogContent> : null}
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
}
