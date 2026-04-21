import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate a browser environment for React components
    environment: 'jsdom',
    // Make describe/it/expect available globally (like Jest)
    globals: true,
    // Auto-import jest-dom matchers (toBeInTheDocument, etc.)
    setupFiles: './src/test-setup.js',
    // Exclude Playwright e2e tests from Vitest
    exclude: ['node_modules', 'e2e/**'],
    // Coverage reporting
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: ['src/main.jsx', 'src/**/*.spec.*', 'src/**/__tests__/**'],
    },
  },
})
