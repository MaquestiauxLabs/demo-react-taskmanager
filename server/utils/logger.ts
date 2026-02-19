// Using an underscore for the 'level' parameter to test our ESLint rule:
// "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
export const logMessage = (
  message: string,
  _level: "info" | "warn" | "error" = "info",
): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [LOG]: ${message}`);
};
