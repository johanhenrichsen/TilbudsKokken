import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Run `vercel dev` instead of `vite` for local development so that
    // the /api/* serverless functions are served alongside the frontend.
    // If you run plain `vite dev`, API calls will fail (no serverless runtime).
  }
})