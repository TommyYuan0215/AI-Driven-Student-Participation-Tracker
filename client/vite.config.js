import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: false,
    watch: {
      usePolling: true, // Ensures Vite detects file changes in Docker
    },
    host: "0.0.0.0",  // Allows access from outside the container
    port: 5173, 
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