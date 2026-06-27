import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve('src/shared') },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve('src/shared') },
    },
    // Emit CommonJS (.cjs). Electron's sandboxed preload (the default with
    // contextIsolation) cannot load an ESM preload; with "type": "module" an
    // unsuffixed .js would also be treated as ESM, so name it .cjs explicitly.
    build: {
      rollupOptions: {
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
      },
    },
    // PostCSS is loaded from postcss.config.cjs (tailwindcss + autoprefixer).
    // Do not override css.postcss here — an empty plugin list silently
    // disables Tailwind and the whole app renders unstyled.
  },
})
