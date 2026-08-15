import { z } from 'zod';

const EnvSchema = z.object({
  TEST_ENV: z.enum(['hosted', 'local']).default('hosted'),
  BASE_URL: z.string().url().optional(),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('password'),
});

/**
 * The single place `process.env` is read in this project. Parsing through zod means a typo'd
 * or malformed value (e.g. `TEST_ENV=hosed`) fails immediately with a clear error, instead of
 * silently falling back to a default and producing a confusing failure somewhere else later.
 */
export const env = EnvSchema.parse(process.env);
