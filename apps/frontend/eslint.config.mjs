import { createVueConfig } from '@casbin-admin/eslint-config/vue';

export default createVueConfig({
  ignores: ['**/dist-ssr/**'],
  rules: {
    'vue/multi-word-component-names': 'off',
  },
});
