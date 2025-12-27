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
    port: 5180, 
    allowedHosts: [
      'ai-driven-student-participation-tracker.onrender.com'
    ],
    proxy: {
      '/socket.io/': {
        target: 'http://localhost:5555',
        ws: true, // Proxy WebSocket connections
        changeOrigin: true,
        secure: false,
      },
      // Optionally, proxy your other backend routes as well:
      '/database': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/tracking': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/tracking_session': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/credential': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/usermanagement': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/contentmanagement': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/settings': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/report_generator': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  }
});