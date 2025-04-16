// @ts-check

import eslint from '@eslint/js';
import eslintConfigPrettier from "eslint-config-prettier/flat";
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
          parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
          },
        },
      },
    eslintConfigPrettier,
  );
