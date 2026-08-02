import * as XLSX from 'xlsx';
import type { AttendanceRecord } from '../types/attendance.type';
import {
  attendanceSourceLabel,
  attendanceStatusMeta,
  formatMinutes,
  localTimeFromIso,
} from './attendance';

export type AttendanceExportColumnId =
  | 'work_date'
  | 'status'
  | 'leave'
  | 'check_in_time'
  | 'check_out_time'
  | 'check_in_location'
  | 'check_out_location'
  | 'worked_minutes'
  | 'late_minutes'
  | 'early_leave_minutes'
  | 'overtime_minutes'
  | 'source'
  | 'is_voided'
  | 'void_reason';

export type AttendanceExportColumn = {
  id: AttendanceExportColumnId;
  label: string;
};

export const ATTENDANCE_EXPORT_COLUMNS: AttendanceExportColumn[] = [
  { id: 'work_date', label: 'Work date' },
  { id: 'status', label: 'Status' },
  { id: 'leave', label: 'Leave' },
  { id: 'check_in_time', label: 'Check-in time' },
  { id: 'check_out_time', label: 'Check-out time' },
  { id: 'check_in_location', label: 'Check-in location' },
  { id: 'check_out_location', label: 'Check-out location' },
  { id: 'worked_minutes', label: 'Worked' },
  { id: 'late_minutes', label: 'Late' },
  { id: 'early_leave_minutes', label: 'Early leave' },
  { id: 'overtime_minutes', label: 'Overtime' },
  { id: 'source', label: 'Source' },
  { id: 'is_voided', label: 'Voided' },
  { id: 'void_reason', label: 'Void reason' },
];

export const ALL_ATTENDANCE_EXPORT_COLUMN_IDS: AttendanceExportColumnId[] =
  ATTENDANCE_EXPORT_COLUMNS.map((column) => column.id);

function leaveLabel(record: AttendanceRecord): string {
  if (record.leave_duration === 'full_day') return 'Full-day leave';
  if (record.leave_session_label) return record.leave_session_label;
  return '';
}

function cellValue(
  record: AttendanceRecord,
  columnId: AttendanceExportColumnId,
): string | number {
  switch (columnId) {
    case 'work_date':
      return record.work_date;
    case 'status':
      return attendanceStatusMeta(record.status).label;
    case 'leave':
      return leaveLabel(record);
    case 'check_in_time':
      return localTimeFromIso(record.check_in_at, record.timezone);
    case 'check_out_time':
      return localTimeFromIso(record.check_out_at, record.timezone);
    case 'check_in_location':
      return record.check_in_location?.name ?? '';
    case 'check_out_location':
      return record.check_out_location?.name ?? '';
    case 'worked_minutes':
      return formatMinutes(record.worked_minutes);
    case 'late_minutes':
      return formatMinutes(record.late_minutes);
    case 'early_leave_minutes':
      return formatMinutes(record.early_leave_minutes);
    case 'overtime_minutes':
      return formatMinutes(record.overtime_minutes);
    case 'source':
      return attendanceSourceLabel(record.source);
    case 'is_voided':
      return record.is_voided ? 'Yes' : 'No';
    case 'void_reason':
      return record.void_reason ?? '';
    default:
      return '';
  }
}

function sanitizeFilenamePart(value: string): string {
  return value.trim().replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(0, 60);
}

export function buildAttendanceExportRows(
  records: AttendanceRecord[],
  columnIds: AttendanceExportColumnId[],
): Array<Record<string, string | number>> {
  const columns = ATTENDANCE_EXPORT_COLUMNS.filter((column) =>
    columnIds.includes(column.id),
  );

  return records.map((record) => {
    const row: Record<string, string | number> = {};
    for (const column of columns) {
      row[column.label] = cellValue(record, column.id);
    }
    return row;
  });
}

export function downloadAttendanceExcel(options: {
  records: AttendanceRecord[];
  columnIds: AttendanceExportColumnId[];
  employeeName: string;
  dateFrom: string;
  dateTo: string;
}): void {
  const rows = buildAttendanceExportRows(options.records, options.columnIds);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  const filename = [
    'attendance',
    sanitizeFilenamePart(options.employeeName) || 'employee',
    options.dateFrom,
    options.dateTo,
  ].join('_');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
