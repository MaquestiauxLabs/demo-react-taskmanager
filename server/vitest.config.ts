import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage",
      include: ["services/users.service.ts", "controllers/users.controller.ts"],
      exclude: ["tests/**", "**/*.config.ts"],
    },
  },
  resolve: {
    alias: {
      "@": __dirname,
      "~": path.resolve(__dirname, "./"),
    },
  },
});
