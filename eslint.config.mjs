import { defineConfig, globalIgnores } from "eslint/config";
import { configs as tseslintConfigs } from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import testingLibrary from "eslint-plugin-testing-library";
import unicorn from "eslint-plugin-unicorn";

const eslintConfig = defineConfig([
  globalIgnores([".next/", "node_modules/", "coverage/"]),
  {
    // Type-aware linting for application source. Tests are excluded because
    // projectService resolves against tsconfig and would be slow/error on
    // files outside the project; tests get a non-type-aware block below.
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/__tests__/**"],
    extends: [tseslintConfigs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...reactHooksPlugin.configs["recommended-latest"].rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/prop-types": "off",
      "react/button-has-type": "error",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  // SonarJS analyzers: reproduce the SonarCloud rule classes locally so the
  // leak period stays clean going forward.
  sonarjs.configs.recommended,
  {
    // Redundant with @typescript-eslint/no-unused-vars, which honors the
    // project's ^_ "intentionally unused" naming convention.
    rules: {
      "sonarjs/no-unused-vars": "off",
      "sonarjs/unused-import": "off",
    },
  },
  // Targeted modern-JS rules only (the full unicorn preset is noisy).
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    plugins: { unicorn },
    rules: {
      "unicorn/prefer-string-replace-all": "error",
      "unicorn/prefer-string-raw": "error",
      "unicorn/prefer-export-from": "error",
      "unicorn/no-array-push-push": "error",
    },
  },
  // Test files: non-type-aware TypeScript + targeted React Testing Library
  // rules (only the classes SonarCloud flags — the full preset is noisy).
  // Several rules are relaxed here because they misfire on legitimate test
  // patterns (mock typing, deliberate boolean inputs, mock-factory nesting,
  // instance-capturing test doubles, props destructured only to omit them).
  {
    files: ["src/__tests__/**/*.{ts,tsx}"],
    extends: [tseslintConfigs.recommended],
    plugins: { "testing-library": testingLibrary },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "sonarjs/no-redundant-boolean": "off",
      "sonarjs/no-nested-functions": "off",
      "testing-library/no-unnecessary-act": "error",
      "testing-library/prefer-find-by": "error",
    },
  },
  security.configs.recommended,
]);

export default eslintConfig;
