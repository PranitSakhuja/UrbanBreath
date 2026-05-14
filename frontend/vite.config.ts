import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'

const useHttps = process.env.URBANBREATH_HTTPS === '1'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https: useHttps
      ? {
          key: fs.readFileSync('certs/dev-key.pem'),
          cert: fs.readFileSync('certs/dev-cert.pem'),
        }
      : undefined,
    port: 8443,
    proxy: {
      '/api': 'http://localhost:8001',
    },
  },
})
