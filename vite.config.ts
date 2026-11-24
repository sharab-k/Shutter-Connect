import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages serves the site from /Shutter-Connect/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Shutter-Connect/' : '/',
}))
