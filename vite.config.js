import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Questa riga è fondamentale per GitHub Pages:
  // Usa il nome esatto della repository (case-sensitive) tra gli slash
  base: '/Media-Backlog/', 
})