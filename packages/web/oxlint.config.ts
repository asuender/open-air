import baseConfig from "../../oxlint-typescript.config.ts";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseConfig],
  plugins: ["react"],
  env: {
    browser: true,
  },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "warn",
    "react/only-export-components": [
      "error",
      {
        allowConstantExport: true,
      },
    ],
  },
});
