import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@astral-sh/ruff-wasm-web', '@wasm-fmt/clang-format', '@wasm-fmt/gofmt'],
  },
})
