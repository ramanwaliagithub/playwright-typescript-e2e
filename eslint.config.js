// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'playwright-report',
      'test-results',
      'dist',
      'infra/**/.terraform/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['tests/**/*.ts', 'fixtures/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    // Enforce the Page Object / API client boundary: tests must go through
    // fixtures/pages.fixture.ts for `test`/`expect`, page objects, and the API client, never
    // touch `page.*`, `request.*`, or `@playwright/test` directly. Keeps every selector and
    // every raw HTTP call confined to pages/ and api/, not scattered across specs.
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              message: 'Import test/expect from ../fixtures/pages.fixture.js instead.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name=/^(page|request)$/]',
          message:
            'Tests must not call page.*/request.* directly — add a method to the relevant Page Object or RbpApiClient instead.',
        },
      ],
    },
  },
  prettier,
);
