import { adminApiBaseUrl } from '@/config/env';

export type ApiSuccessEnvelope<T> = {
  success: true;
  message: string | null;
  data: T;
  meta: Record<string, unknown>;
};

export type ApiErrorEnvelope = {
  success?: false;
  message?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
  meta?: Record<string, unknown>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorEnvelope | null;

  constructor(status: number, message: string, body: ApiErrorEnvelope | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /** When true, send body as FormData (multipart) without JSON Content-Type. */
  formData?: boolean;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${adminApiBaseUrl}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccessEnvelope<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const isFormData = options.formData === true || options.body instanceof FormData;

  if (options.body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  });

  const text = await response.text();
  let json: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;

  if (text) {
    try {
      json = JSON.parse(text) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
    } catch {
      json = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      json && typeof json === 'object' && 'message' in json && typeof json.message === 'string'
        ? json.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, json as ApiErrorEnvelope | null);
  }

  return json as ApiSuccessEnvelope<T>;
}
