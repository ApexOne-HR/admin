import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useConfirm } from '@/components/common/feedback/ConfirmProvider';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { getApiErrorMessage } from '@/infra/http/getApiErrorMessage';
import { PermissionGate, RoleActiveChip } from '@/features/rbac/components/RbacShared';
import {
  useActivateEmployeeAccountMutation,
  useDeactivateEmployeeAccountMutation,
  useResetEmployeeAccountPasswordMutation,
  useRevokeEmployeeAccountSessionsMutation,
} from '../hooks/useEmployeeQueries';
import type { Employee } from '../types/employee.type';

const cardHeaderSx = {
  pb: 0,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

type Props = {
  employee: Employee;
  canManage: boolean;
};

export function EmployeeAccountTab({ employee, canManage }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const activateAccount = useActivateEmployeeAccountMutation(employee.id);
  const deactivateAccount = useDeactivateEmployeeAccountMutation(employee.id);
  const resetPassword = useResetEmployeeAccountPasswordMutation(employee.id);
  const revokeSessions = useRevokeEmployeeAccountSessionsMutation(employee.id);

  const account = employee.account ?? null;
  const roles = employee.user?.roles ?? [];
  const busy =
    activateAccount.isPending ||
    deactivateAccount.isPending ||
    resetPassword.isPending ||
    revokeSessions.isPending;

  const handleActivate = async () => {
    try {
      await activateAccount.mutateAsync();
      toast.success('Account activated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeactivate = async () => {
    const ok = await confirm({
      title: 'Disable login account?',
      description: 'The employee will be unable to sign in. All sessions will be revoked.',
      confirmLabel: 'Disable',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }
    try {
      await deactivateAccount.mutateAsync();
      setTemporaryPassword(null);
      toast.success('Account disabled.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleResetPassword = async () => {
    const ok = await confirm({
      title: 'Issue temporary password?',
      description: 'Current sessions will be revoked. Share the new password securely once.',
      confirmLabel: 'Reset',
    });
    if (!ok) {
      return;
    }
    try {
      const result = await resetPassword.mutateAsync();
      setTemporaryPassword(result.temporaryPassword);
      toast.success('Temporary password issued.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRevokeSessions = async () => {
    const ok = await confirm({
      title: 'Revoke all sessions?',
      description: 'The employee must sign in again on every device.',
      confirmLabel: 'Revoke',
      confirmColor: 'error',
    });
    if (!ok) {
      return;
    }
    try {
      await revokeSessions.mutateAsync();
      toast.success('Sessions revoked.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ManageAccountsRoundedIcon fontSize="small" color="primary" />
            <Typography component="span" sx={{ fontWeight: 600 }}>
              Login account
            </Typography>
          </Stack>
        }
        sx={cardHeaderSx}
      />
      <CardContent>
        <Stack spacing={2}>
          {!account ? (
            <Alert severity="warning">No linked login account was found for this employee.</Alert>
          ) : (
            <>
              <Stack spacing={0.75}>
                <Typography variant="body2">
                  Mobile login identifier: <strong>{account.employee_code}</strong>
                </Typography>
                <Typography variant="body2">
                  Login email: <strong>{account.login_email ?? '—'}</strong>
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2">Status:</Typography>
                  <RoleActiveChip active={account.is_active} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {account.must_change_password
                    ? 'Must change password on next login.'
                    : 'Password change not required.'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Roles:{' '}
                  {roles.length > 0 ? roles.map((role) => role.name).join(', ') : 'Employee'}
                </Typography>
              </Stack>

              {temporaryPassword ? (
                <Alert severity="info">
                  Temporary password (share once): <strong>{temporaryPassword}</strong>
                </Alert>
              ) : null}

              <PermissionGate permission="employees.manage_account">
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: 'wrap', alignItems: { sm: 'center' } }}
                >
                  {account.is_active ? (
                    <Button
                      color="error"
                      variant="outlined"
                      disabled={!canManage || busy}
                      onClick={() => void handleDeactivate()}
                    >
                      Disable account
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      disabled={!canManage || busy}
                      onClick={() => void handleActivate()}
                    >
                      Activate account
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    disabled={!canManage || busy}
                    onClick={() => void handleResetPassword()}
                  >
                    Reset temporary password
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!canManage || busy}
                    onClick={() => void handleRevokeSessions()}
                  >
                    Revoke sessions
                  </Button>
                </Stack>
              </PermissionGate>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
