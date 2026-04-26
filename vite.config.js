import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Usa './' per far funzionare correttamente i percorsi sia su Capacitor (Android) che su web/GitHub Pages
  base: './', 
})