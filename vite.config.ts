import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GH_PAGES=1 builds for https://<user>.github.io/ai-roi-simulator/
export default defineConfig({
  base: process.env.GH_PAGES ? '/ai-roi-simulator/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
