import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fixed port so it matches the redirect URI registered in the Spotify
    // Developer Dashboard (http://127.0.0.1:5174/callback).
    port: 5174,
    strictPort: true,
  },
})
