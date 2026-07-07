import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'metronome-click.wav'],
      manifest: {
        name: 'Suzuki Cello School',
        short_name: 'Suzuki Cello',
        description: 'Practice portal for Suzuki cello students',
        theme_color: '#b4552d',
        background_color: '#faf6ef',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webp,png,woff2,wav}'],
        navigateFallback: 'index.html',
        // API and media requests must always hit the network.
        navigateFallbackDenylist: [/^\/api\//, /^\/src\//],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/media': {
        target: 'https://suzuki-cello-school.pages.dev',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
})
