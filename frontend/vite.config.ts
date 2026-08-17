import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // il backend non ha CORS: il proxy fa passare tutto dalla stessa origine
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
