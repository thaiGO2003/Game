import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Disable hot updates and auto full-reload during dev.
    hmr: false,
    watch: {
      ignored: ["**/*"]
    }
  }
});
