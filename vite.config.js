import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/salonDeChocolat/' : '/',  // ✅ dev에서는 '/', build에서는 '/salonDeChocolat/'
}))