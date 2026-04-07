import { defineConfig, globalIgnores } from "eslint/config";
import { configs as tseslintConfigs } from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  globalIgnores([".next/", "node_modules/", "coverage/", "src/__tests__/"]),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/__tests__/**"],
    extends: [tseslintConfigs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
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
    },
    settings: {
      react: { version: "detect" },
    },
  },
  security.configs.recommended,
]);

export default eslintConfig;
