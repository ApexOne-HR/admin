import type { ChipProps } from '@mui/material';
import type { EmployeeStatus } from '../types/employee.type';

export type EmploymentExceptionStatus = '' | 'terminated' | 'dismissed';

const STATUS_META: Record<
  EmployeeStatus,
  { label: string; color: ChipProps['color'] }
> = {
  offer: { label: 'Offer', color: 'info' },
  probation: { label: 'Probation', color: 'warning' },
  permanent: { label: 'Permanent', color: 'success' },
  terminated: { label: 'Terminated', color: 'error' },
  resigned: { label: 'Resigned', color: 'default' },
  dismissed: { label: 'Dismissed', color: 'error' },
};

export const EMPLOYEE_STATUS_OPTIONS: EmployeeStatus[] = [
  'offer',
  'probation',
  'permanent',
  'terminated',
  'resigned',
  'dismissed',
];

export function employeeStatusMeta(status: EmployeeStatus) {
  return STATUS_META[status] ?? { label: status, color: 'default' as const };
}

export function deriveEmployeeStatus(input: {
  status?: EmployeeStatus | null;
  date_of_joining?: string | null;
  permanent_date?: string | null;
  date_of_resignation?: string | null;
}): EmployeeStatus {
  if (input.date_of_resignation) {
    return 'resigned';
  }

  if (input.status === 'terminated' || input.status === 'dismissed') {
    return input.status;
  }

  if (input.permanent_date) {
    return 'permanent';
  }

  if (input.date_of_joining) {
    return 'probation';
  }

  return 'offer';
}
