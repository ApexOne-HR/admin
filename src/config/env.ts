import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().url(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  throw new Error(`Invalid admin environment configuration: ${message}`);
}

export const env = {
  /** Laravel API origin, e.g. http://localhost:8000 (Admin routes under /api/admin) */
  apiBaseUrl: parsedEnv.data.VITE_API_BASE_URL.replace(/\/$/, ''),
} as const;

export const adminApiBaseUrl = `${env.apiBaseUrl}/api/admin`;
