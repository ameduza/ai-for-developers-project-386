import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import typescriptEslint from "typescript-eslint";

const sourceFiles = ["src/**/*.{ts,tsx}"];

export default typescriptEslint.config(
  {
    ignores: [
      "dist/**",
      "src/lib/api/generated/**",
      "**/*.cjs",
      "**/*.js",
      "**/*.mjs",
    ],
  },
  {
    files: sourceFiles,
    ...eslint.configs.recommended,
  },
  ...typescriptEslint.configs.recommended.map((config) => ({
    ...config,
    files: config.files ?? sourceFiles,
  })),
  {
    files: sourceFiles,
    languageOptions: {
      globals: {
        clearTimeout: "readonly",
        console: "readonly",
        document: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
);
