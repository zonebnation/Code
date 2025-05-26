import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true, // Needed for mobile testing
  },
  optimizeDeps: {
    include: ['yjs', 'y-monaco', 'y-websocket'], // Explicitly include these packages
    exclude: ['@capacitor/core', '@capacitor/filesystem', 'events'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
    }
  },
  build: {
    rollupOptions: {
      external: ['@capacitor/core', '@capacitor/filesystem', 'events']
    }
  }
});