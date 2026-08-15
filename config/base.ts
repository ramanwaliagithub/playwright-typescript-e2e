export interface EnvironmentConfig {
  baseURL: string;
  retries: number;
  actionTimeout: number;
  navigationTimeout: number;
}

/** Shared defaults every environment starts from — each entry in environments.ts only needs
 * to override what's actually different for it. */
export const baseEnvironmentConfig: EnvironmentConfig = {
  baseURL: 'http://localhost',
  retries: 0,
  actionTimeout: 10_000,
  navigationTimeout: 15_000,
};
