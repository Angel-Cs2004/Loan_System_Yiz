import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': 'http://127.0.0.1:8000',
      '/users': 'http://127.0.0.1:8000',
      '/prestamos': 'http://127.0.0.1:8000',
    },
  },
})
