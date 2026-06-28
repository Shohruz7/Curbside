import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// basic Vite + React setup
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // @curbside/shared is a local file: dependency that resolves to ../shared,
    // which lives outside this project root. Allow Vite's dev server to read it.
    fs: {
      allow: [".."]
    }
  },
  // Pre-bundle the linked shared package so dev reloads stay fast.
  optimizeDeps: {
    include: ["@curbside/shared"]
  }
});
