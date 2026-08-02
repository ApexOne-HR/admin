export type AttendanceDetailReturnState = {
  returnTo: string;
  returnLabel?: string;
};

export function isAttendanceDetailReturnState(
  value: unknown,
): value is AttendanceDetailReturnState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.returnTo === 'string' && candidate.returnTo.length > 0;
}

export function employeeAttendanceReturnState(
  employeeId: number,
): AttendanceDetailReturnState {
  return {
    returnTo: `/employees/${employeeId}?tab=attendance`,
    returnLabel: 'Back to employee attendance',
  };
}

export function attendanceListReturnState(): AttendanceDetailReturnState {
  return {
    returnTo: '/attendance',
    returnLabel: 'Back to attendance',
  };
}

export function resolveAttendanceDetailBack(
  locationState: unknown,
  employeeId?: number | null,
): AttendanceDetailReturnState {
  if (isAttendanceDetailReturnState(locationState)) {
    return {
      returnTo: locationState.returnTo,
      returnLabel: locationState.returnLabel ?? 'Back',
    };
  }

  if (employeeId) {
    return employeeAttendanceReturnState(employeeId);
  }

  return attendanceListReturnState();
}
