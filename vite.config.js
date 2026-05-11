import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/media': {
        target: 'https://suzuki-cello-school.pages.dev',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
