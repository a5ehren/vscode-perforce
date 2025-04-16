// @ts-check

import eslint from '@eslint/js';
import eslintConfigPrettier from "eslint-config-prettier/flat";
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          parser: tsParser,
          ecmaVersion: 'latest',
          sourceType: 'commonjs',
          project: './tsconfig.json',
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-base-to-string": "warn",
      },
    },
    eslintConfigPrettier,
  );
