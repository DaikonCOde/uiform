import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import dts from 'vite-plugin-dts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Fork local de @laus/json-schema-form (repos hermanos bajo dev/laus/).
// En DEV apuntamos al source del fork para tener HMR en vivo al editar el motor.
const jsfForkSrc = resolve(__dirname, '../json-schema-form/src/index.ts')

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [
      react(),
      dts({
        entryRoot: 'src',
        tsconfigPath: './tsconfig.lib.json',
      }),
    ],

    // Solo en DEV (playground): consumir el fork local y la propia librería por su
    // nombre público. En BUILD NO se aliasa: @laus/json-schema-form queda externalizado
    // (ver rollupOptions.external) para no bundlearlo en el paquete publicado.
    ...(isDev
      ? {
          resolve: {
            alias: {
              '@laus/json-schema-form': jsfForkSrc,
              '@laus/uiform': resolve(__dirname, 'src/lib/index.ts'),
            },
          },
          server: {
            fs: {
              // Permitir que Vite sirva archivos del fork (fuera del root del proyecto).
              allow: [resolve(__dirname, '..')],
            },
          },
        }
      : {}),

    build: {
      lib: {
        entry: resolve(__dirname, 'src/lib/index.ts'),
        name: 'UIForm',
        formats: ['es', 'umd'],
        fileName: (format) => `uiform.${format === 'es' ? 'js' : 'umd.cjs'}`,
      },
      rollupOptions: {
        // Externalize dependencies that shouldn't be bundled
        external: ['react', 'react-dom', 'react/jsx-runtime', 'antd', '@laus/json-schema-form', 'dayjs'],
        output: {
          // Global variables to use in UMD build for externalized deps
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
            antd: 'antd',
            '@laus/json-schema-form': 'JsonSchemaForm',
            dayjs: 'dayjs',
          },
          // Preserve CSS modules
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'style.css'
            return assetInfo.name || 'asset'
          },
        },
      },
      cssCodeSplit: false,
    },
  }
})
