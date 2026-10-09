import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8001',
      // Shared read-only pages are rendered by the backend (a regex: '/s' alone would match /src).
      '^/s/': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8001',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
