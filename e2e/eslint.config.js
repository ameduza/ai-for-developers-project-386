import eslint from '@eslint/js';
import typescriptEslint from 'typescript-eslint';

const sourceFiles = [
  'playwright.config.ts',
  'tests/**/*.ts',
  'support/**/*.ts',
];

export default typescriptEslint.config(
  {
    ignores: ['playwright-report/**', 'test-results/**'],
  },
  {
    files: sourceFiles,
    ...eslint.configs.recommended,
  },
  ...typescriptEslint.configs.recommended.map((config) => ({
    ...config,
    files: sourceFiles,
  })),
  {
    files: sourceFiles,
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
);
