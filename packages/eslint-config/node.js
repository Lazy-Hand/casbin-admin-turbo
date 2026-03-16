import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {
  commonTypeScriptRules,
  skipFormatting,
  withCommonIgnores,
  withOxlint,
} from './base.js';

export const createNodeConfig = ({
  files = ['**/*.ts'],
  ignores = [],
  oxlintConfigPath = '.oxlintrc.json',
  rules = {},
  extraConfigs = [],
} = {}) =>
  tseslint.config(
    {
      files,
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      languageOptions: {
        globals: {
          ...globals.node,
        },
      },
      rules: {
        ...commonTypeScriptRules,
        '@typescript-eslint/no-require-imports': 'off',
        ...rules,
      },
    },
    ...withOxlint(oxlintConfigPath),
    skipFormatting,
    withCommonIgnores(ignores),
    ...extraConfigs,
  );
