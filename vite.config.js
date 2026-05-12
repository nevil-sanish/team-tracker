import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    // SECURITY: Disable source maps in production to prevent
    // exposing source code and potential secret references
    sourcemap: mode !== 'production' ? 'inline' : false,
  },
}))
