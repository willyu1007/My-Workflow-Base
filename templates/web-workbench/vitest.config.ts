/**
 * Test harness for the kit's components.
 *
 * Tests run against `src/`, not `dist/`: a test that only exercises built output
 * cannot run until you build, and it silently tests the previous build when you
 * forget. `dist` is verified separately by `pnpm build` + the token check.
 *
 * jsdom rather than a browser runner — these are component-behaviour tests
 * (validation, focus, disabled state, aria wiring), none of which need real
 * layout. Anything that does need layout should be a consumer-side Playwright
 * test, not a unit test pretending to measure pixels.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
