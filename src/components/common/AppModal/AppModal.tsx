import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  showCloseButton?: boolean;
  onClose: () => void;
};

export function AppModal({
  actions,
  children,
  description,
  maxWidth = 'sm',
  onClose,
  open,
  showCloseButton = false,
  title,
}: AppModalProps) {
  return (
    <Dialog fullWidth maxWidth={maxWidth} onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          position: 'relative',
          pr: showCloseButton ? 6 : undefined,
        }}
      >
        <Stack spacing={0.75}>
          <Typography variant="h3">{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Stack>
        {showCloseButton ? (
          <IconButton
            aria-label="Close"
            onClick={onClose}
            size="small"
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </DialogTitle>

      {children ? <DialogContent>{children}</DialogContent> : null}
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
}
