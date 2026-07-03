import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    // mkcert is a dev-only plugin for local HTTPS — excluded from production builds
    plugins: [react(), ...(isDev ? [mkcert()] : [])],
    server: {
      https: false,
      watch: {
        usePolling: true, // Ensures Vite detects file changes in Docker dev mode
      },
      host: '0.0.0.0',   // Allows access from outside the container
      port: 5180,
      allowedHosts: [
        'apps.homelab1367.internal',
      ],
      proxy: {
        '/socket.io/': {
          target: 'http://backend:5555',
          ws: true,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: 'http://backend:5555',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
});