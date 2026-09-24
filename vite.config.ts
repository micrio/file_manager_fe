import react from "@vitejs/plugin-react-swc"
import dotEnv from "dotenv";
import path from "path"
import { defineConfig } from "vite"

dotEnv.config();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': { ...process.env },
  }
});
