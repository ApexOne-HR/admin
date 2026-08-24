export function formatServiceTenure(parts: {
  service_years?: number | null;
  service_months?: number | null;
  service_days?: number | null;
}): string {
  const years = parts.service_years ?? 0;
  const months = parts.service_months ?? 0;
  const days = parts.service_days ?? 0;

  if (years === 0 && months === 0 && days === 0) {
    return '—';
  }

  const chunks: string[] = [];
  if (years > 0) {
    chunks.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (months > 0) {
    chunks.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }
  if (days > 0 || chunks.length === 0) {
    chunks.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }

  return chunks.join(' ');
}

export function formatServiceTenureShort(parts: {
  service_years?: number | null;
  service_months?: number | null;
  service_days?: number | null;
}): string {
  const years = parts.service_years ?? 0;
  const months = parts.service_months ?? 0;
  const days = parts.service_days ?? 0;

  if (years === 0 && months === 0 && days === 0) {
    return '—';
  }

  return `${years}y ${months}m ${days}d`;
}
