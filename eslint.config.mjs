import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/mockServiceWorker.js']),

  ...nextVitals,
  ...nextTs,
  // eslint-config-next already registers the jsx-a11y plugin; enable the full
  // recommended rule set on top of it (re-adding the plugin would collide).
  { rules: jsxA11y.flatConfigs.recommended.rules },

  // Type-aware strictness for app code
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  // Config files: no type-aware linting
  {
    files: ['*.config.{js,mjs,ts}', 'vitest.setup.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Layer rule: HeroUI is only reachable through the local ui seam.
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['components/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@heroui/*'],
              message: 'Import UI primitives from @/components/ui (the local seam over HeroUI).',
            },
            {
              group: ['@phosphor-icons/*'],
              message: 'Import icons from @/components/ui (the local icon seam).',
            },
          ],
        },
      ],
    },
  },

  prettier,
]);
