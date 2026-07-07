import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Override when the default API port is taken locally, e.g.
      // VITE_PROXY_TARGET=http://localhost:8081 npm run dev
      "/api": process.env.VITE_PROXY_TARGET ?? "http://localhost:8080"
    }
  }
});
