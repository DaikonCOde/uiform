import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Config dedicada a tests (separada de vite.config.ts, que es build de librería + dev).
// El motor @laus/json-schema-form se resuelve desde node_modules (versión estable instalada);
// no aliaseamos al fork en tests para mantener el runner aislado y reproducible.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@laus/uiform': resolve(__dirname, 'src/lib/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Todos los tests viven en ./test (espejando src/), separados del código fuente.
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    css: false,
  },
})
