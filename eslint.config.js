import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const NO_AUTH_MESSAGE =
  'Страница подписки, лендинг и общий код работают без авторизации (спека, раздел 6.1)';

export default tseslint.config(
  { ignores: ['dist', 'public', 'docs'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: [
      'src/features/subscribe/**/*.{ts,tsx}',
      'src/pages/LandingPage.tsx',
      'src/pages/NotFoundPage.tsx',
      'src/shared/**/*.{ts,tsx}',
    ],
    ignores: ['src/shared/api/authedApi.ts', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['oidc-client-ts', 'react-oidc-context', '@tanstack/react-query'].map((name) => ({
            name,
            message: NO_AUTH_MESSAGE,
          })),
          patterns: [{ group: ['**/authedApi', '**/auth/*', '**/features/auth'], message: NO_AUTH_MESSAGE }],
        },
      ],
    },
  },
);
