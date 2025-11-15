import path from "node:path";
import { baseConfig } from "@x402a/config/vitest.config.base";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", "dist", "contract"],
      coverage: {
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.{test,spec}.{ts,tsx}",
          "src/**/index.ts", // Barrel exports, no logic to test
          "src/types/**", // Type definitions only
        ],
        all: true,
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
      testTimeout: 30000, // 30 seconds for blockchain interactions
      hookTimeout: 30000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  })
);
