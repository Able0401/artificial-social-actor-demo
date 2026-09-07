/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// VITE_BASE_PATH lets the same build run at the domain root (Vercel,
// Netlify: "/") or under a sub-path (GitHub Pages: "/<repo>/").
// No API key is read here; the visitor supplies it in the app.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'
  return {
    base,
    plugins: [react()],
  }
})
