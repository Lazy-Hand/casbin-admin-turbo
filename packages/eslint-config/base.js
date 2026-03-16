import { globalIgnores } from 'eslint/config';
import pluginOxlint from 'eslint-plugin-oxlint';
import skipFormatting from 'eslint-config-prettier/flat';

export const commonTypeScriptRules = {
  '@typescript-eslint/no-explicit-any': 'off',
};

export const commonIgnores = ['**/node_modules/**', '**/.pnpm/**', '**/dist/**', '**/coverage/**'];

export const withCommonIgnores = (ignores = []) =>
  globalIgnores([...new Set([...commonIgnores, ...ignores])]);

export const withOxlint = (configPath = '.oxlintrc.json') =>
  pluginOxlint.buildFromOxlintConfigFile(configPath);

export { skipFormatting };
