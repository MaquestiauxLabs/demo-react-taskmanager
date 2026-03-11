/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/integration/**", "tests/routes/**"],
    clearMocks: true,
  },
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html"],
    include: ["services/**/*.ts", "utils/**/*.ts"],
    exclude: [
      "**/node_modules/**",
      "**/tests/**",
      "**/*.config.ts",
      "**/*.config.js",
      "server.ts",
      "**/prisma/**",
      "**/dist/**",
      "**/configs/**",
      "**/constants/**",
      "**/controllers/**",
      "**/helpers/**",
      "**/middlewares/**",
      "**/routes/**",
      "**/scripts/**",
    ],
  },
});
