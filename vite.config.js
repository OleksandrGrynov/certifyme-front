import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist', // обов’язково вказати для Vercel
  },
  base: '/', // потрібно для React Router, інакше 404 при оновленні сторінки
})
