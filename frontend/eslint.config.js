import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Cada capa declara lo que NO puede importar: las dependencias solo van hacia capas inferiores.
const prohibir = (...capas) => ({
  'no-restricted-imports': [
    'error',
    { patterns: capas.map((capa) => ({ group: [`@/${capa}`, `@/${capa}/*`] })) },
  ],
})

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Apaga las reglas de estilo que chocan con Prettier; el formato lo revisa npm run format:check.
      prettier,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  {
    files: ['src/config/**'],
    rules: prohibir('components', 'pages', 'routes', 'stores', 'hooks', 'lib'),
  },
  { files: ['src/lib/**'], rules: prohibir('components', 'pages', 'routes', 'stores', 'hooks') },
  { files: ['src/stores/**'], rules: prohibir('components', 'pages', 'routes', 'hooks') },
  { files: ['src/hooks/**'], rules: prohibir('components', 'pages', 'routes') },
  {
    files: ['src/components/ui/**'],
    // ui no conoce el negocio. Agrega aquí cada carpeta de dominio nueva.
    rules: prohibir(
      'pages',
      'routes',
      'stores',
      'hooks',
      'lib/api',
      'components/layouts',
      'components/shared',
      'components/inicio',
      'components/gustos',
      'components/recomendaciones'
    ),
  },
  {
    files: ['src/components/**'],
    ignores: ['src/components/ui/**'],
    rules: prohibir('pages', 'routes'),
  },
  { files: ['tests/**'], rules: { 'react-refresh/only-export-components': 'off' } },
])
