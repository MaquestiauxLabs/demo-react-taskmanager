import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["tests/integration/**", "tests/routes/**"],
    clearMocks: true,
  },
});
