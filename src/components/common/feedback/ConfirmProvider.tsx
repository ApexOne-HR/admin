import { Button } from '@mui/material';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppModal } from '@/components/common/AppModal';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Defaults to "error" for destructive actions */
  confirmColor?: 'primary' | 'error' | 'warning' | 'success' | 'inherit';
};

type ConfirmApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

const ConfirmContext = createContext<ConfirmApi | null>(null);

const defaultState: ConfirmState = {
  open: false,
  title: '',
  description: undefined,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmColor: 'error',
};

type ConfirmProviderProps = {
  children: ReactNode;
};

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [state, setState] = useState<ConfirmState>(defaultState);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((current) => ({ ...current, open: false }));
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({
        open: true,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        confirmColor: options.confirmColor ?? 'error',
      });
    });
  }, []);

  const api = useMemo<ConfirmApi>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <AppModal
        open={state.open}
        title={state.title}
        description={state.description}
        onClose={() => close(false)}
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => close(false)}>{state.cancelLabel}</Button>
            <Button
              variant="contained"
              color={state.confirmColor}
              onClick={() => close(true)}
              autoFocus
            >
              {state.confirmLabel}
            </Button>
          </>
        }
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmApi['confirm'] {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}
