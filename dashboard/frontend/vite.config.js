import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["airona-dev.mindglowing.art", "localhost", "127.0.0.1"],
    proxy: {
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/guilds": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
