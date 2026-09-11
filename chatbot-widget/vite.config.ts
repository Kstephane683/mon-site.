import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'EperfChatWidget',
      fileName: 'chatbot-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'chatbot-widget.[ext]',
      },
    },
  },
});
