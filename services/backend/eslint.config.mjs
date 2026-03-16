import globals from 'globals';
import { createNodeConfig } from '@casbin-admin/eslint-config/node';

export default createNodeConfig({
  ignores: ['logs/**', 'uploads/**'],
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
  },
  extraConfigs: [
    {
      files: ['**/*.spec.ts', 'test/**/*.ts'],
      languageOptions: {
        globals: {
          ...globals.jest,
        },
      },
    },
  ],
});
