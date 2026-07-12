import { Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';

export type AppButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadingLabel?: string;
};

export function AppButton({
  children,
  disabled,
  isLoading = false,
  loadingLabel,
  startIcon,
  ...props
}: AppButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      startIcon={isLoading ? <CircularProgress color="inherit" size={18} /> : startIcon}
      {...props}
    >
      {isLoading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}
