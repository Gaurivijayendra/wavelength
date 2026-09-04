import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forwards to a local serverless-style handler for the Spotify proxy
    // (see api/ and README) once the live API is wired up. Unused while
    // running against mock data.
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
