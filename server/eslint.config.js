import eslint from '@eslint/js';
import typescriptEslint from 'typescript-eslint';

const sourceFiles = ['src/**/*.ts'];

export default typescriptEslint.config(
  {
    ignores: ['dist/**'],
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
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
);
