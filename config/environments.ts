import { env } from './env.js';
import { baseEnvironmentConfig, type EnvironmentConfig } from './base.js';

export type TestEnvironment = 'hosted' | 'local';

const overrides: Record<TestEnvironment, Partial<EnvironmentConfig>> = {
  // RBP's public demo instance — shared with other automation learners, so we're
  // more tolerant of transient slowness/flakiness than we'd be locally.
  hosted: {
    baseURL: 'https://automationintesting.online',
    retries: 2,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  // RBP running locally via Docker Compose (see SETUP.md for how to bring it up) — already
  // matches every base default except baseURL, so there's nothing else to override.
  local: {
    baseURL: 'http://localhost',
  },
};

function layer(override: Partial<EnvironmentConfig>): EnvironmentConfig {
  return { ...baseEnvironmentConfig, ...override };
}

const environments: Record<TestEnvironment, EnvironmentConfig> = {
  hosted: layer(overrides.hosted),
  local: layer(overrides.local),
};

export const currentEnvironment: TestEnvironment = env.TEST_ENV;
export const environmentConfig = environments[currentEnvironment];
