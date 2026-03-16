import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import {
  commonTypeScriptRules,
  skipFormatting,
  withCommonIgnores,
  withOxlint,
} from './base.js';

export const createVueConfig = ({
  files = ['**/*.{vue,ts,mts,tsx}'],
  ignores = [],
  oxlintConfigPath = '.oxlintrc.json',
  rules = {},
  extraConfigs = [],
} = {}) =>
  defineConfigWithVueTs(
    {
      name: 'workspace/files-to-lint',
      files,
    },
    withCommonIgnores(ignores),
    ...pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,
    ...withOxlint(oxlintConfigPath),
    {
      rules: {
        ...commonTypeScriptRules,
        ...rules,
      },
    },
    skipFormatting,
    ...extraConfigs,
  );
