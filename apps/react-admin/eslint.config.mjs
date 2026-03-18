import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import {
  commonTypeScriptRules,
  skipFormatting,
  withCommonIgnores,
} from '@casbin-admin/eslint-config/base'

export default tseslint.config(
  withCommonIgnores(),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...commonTypeScriptRules,
    },
  },
  skipFormatting,
)
