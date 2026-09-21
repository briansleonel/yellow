import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Rutas relativas: así el build funciona en cualquier hosting estático
  // (Vercel, Netlify, GitHub Pages) sin configurar nada.
  base: './',
  plugins: [react()],
})
