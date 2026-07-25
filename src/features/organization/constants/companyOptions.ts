/** Supported company currencies (ISO 4217). */
export const COMPANY_CURRENCIES = [
  { value: 'MMK', label: 'MMK — Myanmar Kyat' },
  { value: 'CNY', label: 'CNY — Chinese Yuan' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'THB', label: 'THB — Thai Baht' },
] as const;

export type CompanyCurrency = (typeof COMPANY_CURRENCIES)[number]['value'];

/**
 * Company timezones — value is IANA id (API), label is region name (UI).
 */
export const COMPANY_TIMEZONES = [
  { value: 'Asia/Yangon', label: 'Myanmar' },
  { value: 'Asia/Shanghai', label: 'China' },
  { value: 'Asia/Bangkok', label: 'Thailand' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'UTC', label: 'UTC' },
] as const;

export type CompanyTimezone = (typeof COMPANY_TIMEZONES)[number]['value'];

export const COMPANY_CURRENCY_VALUES = COMPANY_CURRENCIES.map((item) => item.value);
export const COMPANY_TIMEZONE_VALUES = COMPANY_TIMEZONES.map((item) => item.value);
