import { baseConfig } from "@x402a/config/vitest.config.base";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: ["node_modules/", "dist/", "tests/", "**/*.test.ts", "**/*.config.ts"],
        thresholds: {
          branches: 80, // Higher threshold than base (75)
        },
      },
    },
  })
);
