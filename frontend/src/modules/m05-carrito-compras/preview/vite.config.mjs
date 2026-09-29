import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const frontendDirectory = fileURLToPath(new URL('../../../../', import.meta.url))
const sourceDirectory = fileURLToPath(new URL('../../../', import.meta.url))
const previewDirectory = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root: frontendDirectory,
  publicDir: false,
  cacheDir: fileURLToPath(new URL('./.vite-cache', import.meta.url)),
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': sourceDirectory } },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api') },
  build: {
    rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) },
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: false,
    write: false,
  },
  server: {
    fs: { allow: [frontendDirectory, previewDirectory] },
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
})
