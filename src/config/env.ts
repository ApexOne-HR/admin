import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().url(),
  VITE_DEMO_ADMIN_EMAIL: z.string().trim().email().optional(),
  VITE_DEMO_ADMIN_PASSWORD: z.string().trim().min(1).optional(),
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
  demoAdminEmail: parsedEnv.data.VITE_DEMO_ADMIN_EMAIL ?? 'admin@example.com',
  demoAdminPassword: parsedEnv.data.VITE_DEMO_ADMIN_PASSWORD ?? 'password',
} as const;

export const adminApiBaseUrl = `${env.apiBaseUrl}/api/admin`;
