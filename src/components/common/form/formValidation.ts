export type FieldErrors = Record<string, string>;

type RequiredFieldRule = {
  key: string;
  label: string;
  /** Skip this rule when false */
  when?: boolean;
};

/** Build client-side required-field errors. Empty strings / whitespace count as missing. */
export function validateRequiredFields(
  values: Record<string, unknown>,
  fields: RequiredFieldRule[],
): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of fields) {
    if (field.when === false) {
      continue;
    }

    const value = values[field.key];
    const isEmpty =
      value === null ||
      value === undefined ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '');

    if (isEmpty) {
      errors[field.key] = `${field.label} is required.`;
    }
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Clear one field error after the user edits that field. */
export function clearFieldError(errors: FieldErrors, key: string): FieldErrors {
  if (!(key in errors)) {
    return errors;
  }

  const next = { ...errors };
  delete next[key];
  return next;
}
