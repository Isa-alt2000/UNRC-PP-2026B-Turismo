import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    // Mientras no haya pruebas, `npm run check` no debe fallar por eso.
    passWithNoTests: true,
    // Valores ficticios para que las pruebas no dependan del .env de cada quien.
    env: { VITE_API_PREFIX: '/prueba' },
    coverage: { provider: 'v8', reporter: ['text', 'lcov'], include: ['src/**'] },
  },
})
