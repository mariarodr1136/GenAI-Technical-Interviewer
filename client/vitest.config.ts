import react from "@vitejs/plugin-react";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  // Cast bridges the Vite version skew between @vitejs/plugin-react (Vite 8)
  // and the Vite types bundled with Vitest 3.
  plugins: [react()] as ViteUserConfig["plugins"],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"]
  }
});
