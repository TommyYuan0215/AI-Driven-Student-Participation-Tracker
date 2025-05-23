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
    allowedHosts: [
      'ai-driven-student-participation-tracker.onrender.com'
    ],
    proxy: {
      // '/database': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/tracking': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/tracking_session': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/credential': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/usermanagement': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/contentmanagement': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/settings': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/report_generator': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
});