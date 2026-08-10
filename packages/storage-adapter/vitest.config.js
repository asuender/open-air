import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["./test/**/*.ts", "./**/*.{test,spec}.{ts,tsx}"],
  },
});
