import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["unicorn"],
  categories: {
    correctness: "off",
  },
  env: {
    builtin: true,
  },
  ignorePatterns: ["dist", "node_modules"],
});
