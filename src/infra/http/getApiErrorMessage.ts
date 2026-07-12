import { ApiError } from '@/infra/http/apiClient';

/** Shared API error message for forms and query errors. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.body?.errors) {
      const firstFieldErrors = Object.values(error.body.errors)[0];
      if (firstFieldErrors?.[0]) {
        return firstFieldErrors[0];
      }
    }

    if (error.status === 429) {
      return 'Too many attempts. Please wait and try again.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
