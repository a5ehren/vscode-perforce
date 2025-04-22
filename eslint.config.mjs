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
                ecmaVersion: "latest",
                sourceType: "commonjs",
                project: "./tsconfig.json",
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-base-to-string": "warn",
        },
    },
    // Add relaxed rules for test files
    {
        files: ["src/test/**"],
        rules: {
            // Relax rules that are commonly problematic in test files
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/unbound-method": "off",
            "@typescript-eslint/no-empty-function": "off",
            // Tests often use require() for mocking/stubbing
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    eslintConfigPrettier,
);
