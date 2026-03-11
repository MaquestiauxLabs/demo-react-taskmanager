import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    clearMocks: true,
    sequence: {
      concurrent: false,
    },
  },
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html"],
    reportOnFailure: false,
    include: ["services/**/*.ts", "utils/**/*.ts"],
    exclude: [
      "**/node_modules/**",
      "**/tests/**",
      "**/*.config.ts",
      "**/*.config.js",
      "**/server.ts",
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
