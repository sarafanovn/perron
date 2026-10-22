import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension'
  return {
    plugins: [react()],
    base: isExtension ? './' : '/',
    build: {
      outDir: isExtension ? 'dist-extension' : 'dist',
    },
  }
})
