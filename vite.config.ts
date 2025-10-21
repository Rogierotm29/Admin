import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/dev': {
        target: 'https://api.caritas.automvid.store', // tu backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

