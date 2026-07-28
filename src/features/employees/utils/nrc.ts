import type { NrcCitizenship, NrcOption } from '../types/employee.type';

export const NRC_CITIZENSHIP_OPTIONS: Array<{
  value: NrcCitizenship;
  label: string;
}> = [
  { value: 'N', label: 'N (နိုင်)' },
  { value: 'E', label: 'E (ဧည့်)' },
  { value: 'P', label: 'P (ပြု)' },
  { value: 'T', label: 'T (သ)' },
  { value: 'C', label: 'C (စ)' },
];

export function formatNrcPreview(parts: {
  code: string;
  townshipCode: string;
  citizenship: string;
  serial: string;
}) {
  const { code, townshipCode, citizenship, serial } = parts;
  if (!code || !townshipCode || !citizenship || !serial) {
    return '';
  }

  return `${code}/${townshipCode}(${citizenship})${serial}`;
}

export function parseNrcValue(nrcNumber: string | null | undefined) {
  const value = nrcNumber?.trim() ?? '';
  const match = value.match(/^([^/]+)\/([^(]+)\(([A-Z])\)([0-9]+)$/i);

  if (!match) {
    return null;
  }

  return {
    code: match[1].trim(),
    townshipCode: match[2].trim(),
    citizenship: match[3].trim().toUpperCase() as NrcCitizenship,
    serial: match[4].trim(),
  };
}

export function nrcTownshipsByCode(options: NrcOption[], code: string) {
  return options.filter((option) => option.code === code);
}
