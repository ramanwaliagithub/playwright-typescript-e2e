export type TestEnvironment = 'hosted' | 'local';

interface EnvironmentConfig {
  baseURL: string;
  retries: number;
  actionTimeout: number;
  navigationTimeout: number;
}

const environments: Record<TestEnvironment, EnvironmentConfig> = {
  // RBP's public demo instance — shared with other automation learners, so we're
  // more tolerant of transient slowness/flakiness than we'd be locally.
  hosted: {
    baseURL: 'https://automationintesting.online',
    retries: 2,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  // RBP running locally via Docker Compose (see SETUP.md for how to bring it up).
  local: {
    baseURL: 'http://localhost',
    retries: 0,
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
};

function resolveEnvironment(): TestEnvironment {
  const raw = process.env['TEST_ENV'];
  return raw === 'local' ? 'local' : 'hosted';
}

export const currentEnvironment = resolveEnvironment();
export const environmentConfig = environments[currentEnvironment];
