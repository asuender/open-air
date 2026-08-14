import baseConfig from "../../oxlint-typescript.config.ts";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseConfig],
  plugins: ["vitest"],
  env: {
    node: true,
  },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "vitest/expect-expect": "error",
    "vitest/no-commented-out-tests": "error",
    "vitest/no-conditional-expect": "error",
    "vitest/no-disabled-tests": "warn",
    "vitest/no-focused-tests": "error",
    "vitest/no-identical-title": "error",
    "vitest/no-import-node-test": "error",
    "vitest/no-interpolation-in-snapshots": "error",
    "vitest/no-mocks-import": "error",
    "vitest/no-standalone-expect": "error",
    "vitest/no-unneeded-async-expect-function": "error",
    "vitest/prefer-called-exactly-once-with": "error",
    "vitest/require-local-test-context-for-concurrent-snapshots": "error",
    "vitest/valid-describe-callback": "error",
    "vitest/valid-expect": "error",
    "vitest/valid-expect-in-promise": "error",
    "vitest/valid-title": "error",
  },
});
