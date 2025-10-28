import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Use the URL module to handle paths in ES modules
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Set alias using the modern import.meta.url
      "@": fileURLToPath(new URL("./client", import.meta.url)),
    },
  },
});