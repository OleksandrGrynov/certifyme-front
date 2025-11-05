import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "", // залишаємо порожнім
  plugins: [react()],
  build: {
    outDir: "dist", // ⚡ обов'язково
  },
});
