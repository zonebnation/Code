import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'monaco-editor': resolve(__dirname, 'node_modules/monaco-editor')
    },
  },
  server: {
    host: true, // Needed for mobile testing
  },
  optimizeDeps: {
    include: ['yjs', 'y-websocket'], // Removed monaco-editor from here
    exclude: ['@capacitor/core', '@capacitor/filesystem', 'events'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: ['@capacitor/core', '@capacitor/filesystem', 'events'],
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'yjs-editor': ['yjs', 'y-websocket'],
        }
      }
    }
  }
});