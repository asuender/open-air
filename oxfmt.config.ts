import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  sortPackageJson: false,
  ignorePatterns: ["build", "coverage", "pnpm-lock.yaml"],
});
