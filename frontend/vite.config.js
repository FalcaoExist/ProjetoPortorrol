import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  port: 5173, // use Vite default (5173)
    strictPort: true, // se 3000 estiver ocupada, ele vai falhar em vez de escolher outra
    host: true,
    proxy: {
      // during dev, forward /api to the backend
      '/api': {
        // try the Docker service name first (works when frontend is in Docker Compose)
        target: 'http://backend:8000',
        changeOrigin: true,
  // remove the /api prefix (do not replace with '/'; that can create '//' and 404)
  rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          // if that fails (e.g. running frontend locally), fall back to host.docker.internal
          proxy.on('error', (err) => {
            console.warn('Proxy to backend failed, falling back to host.docker.internal:', err && err.message)
            proxy.options.target = 'http://host.docker.internal:8000'
          })
        }
      }
    }
  }
})

