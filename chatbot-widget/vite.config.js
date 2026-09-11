import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: './src/main.jsx',
      name: 'EperfChatWidget',
      fileName: 'chatbot-widget',
      formats: ['iife']  // Bundle standalone pour injection dans HTML
    },
    rollupOptions: {
      output: {
        assetFileNames: 'chatbot-widget.[ext]'
      }
    }
  }
})
