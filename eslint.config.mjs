import { FlatCompat } from '@eslint/eslintrc';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // ─────────────────────────────────────────
  // Base: Next.js recommended
  // ─────────────────────────────────────────
  ...compat.extends('next/core-web-vitals'),

  // ─────────────────────────────────────────
  // TypeScript files
  // ─────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
      react: { version: 'detect' },
    },
    rules: {
      // ═══════════════════════════════════════
      // FRONT GUARD: Import Order (멱등성)
      // ═══════════════════════════════════════
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [
            { pattern: 'react', group: 'builtin', position: 'before' },
            { pattern: 'react/**', group: 'builtin', position: 'before' },
            { pattern: 'react-dom/**', group: 'builtin', position: 'before' },
            { pattern: 'next', group: 'builtin', position: 'before' },
            { pattern: 'next/**', group: 'builtin', position: 'before' },
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      // ═══════════════════════════════════════
      // FRONT GUARD: Naming Convention (멱등성)
      // ═══════════════════════════════════════
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables: camelCase or UPPER_CASE
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        // Functions: camelCase or PascalCase (components)
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        // Types/Interfaces: PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // Boolean variables: must have prefix
        {
          selector: 'variable',
          types: ['boolean'],
          format: null,
          custom: {
            match: true,
            regex: '^(is|has|should|can|will|did)[A-Z].*$',
          },
        },
      ],

      // ═══════════════════════════════════════
      // FRONT GUARD: Idempotency Rules
      // ═══════════════════════════════════════
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
          message: 'HARNESS: Math.random() is non-deterministic. Use data-based identifiers.',
        },
      ],

      // No any type
      '@typescript-eslint/no-explicit-any': 'error',

      // Prefer named exports
      'import/no-default-export': 'error',

      // ═══════════════════════════════════════
      // General Quality
      // ═══════════════════════════════════════
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/jsx-no-leaked-render': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },

  // ─────────────────────────────────────────
  // Exception: Next.js App Router pages (default export required)
  // ─────────────────────────────────────────
  {
    files: [
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/app/**/loading.tsx',
      'src/app/**/error.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/template.tsx',
      'src/app/**/default.tsx',
      'src/app/**/route.ts',
      'drizzle.config.ts',
      'next.config.ts',
      'tailwind.config.ts',
      'postcss.config.*',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },

  // ─────────────────────────────────────────
  // Ignore patterns
  // ─────────────────────────────────────────
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**', 'doc-pipeline/**'],
  },
];

export default config;
