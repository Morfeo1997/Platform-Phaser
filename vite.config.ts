import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
  react(),
  tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        // Separa Phaser en su propio chunk para mejor caching
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
})
