import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: false,
    proxy: {
      '/credential': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/database': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/test': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/usermanagement': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});