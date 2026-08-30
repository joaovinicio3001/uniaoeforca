import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    setupFiles: ["__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      // Neutraliza o guard "server-only" nos testes de unidade (lógica pura).
      "server-only": resolve(__dirname, "__tests__/stubs/server-only.ts"),
    },
  },
});
