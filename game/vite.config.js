import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Enable HMR and watch files for changes.
    hmr: true,
    watch: {
      usePolling: true // Useful for some Windows environments
    }
  }
});
