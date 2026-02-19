import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import obfuscator from 'rollup-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    obfuscator({
      compact: true,
      controlFlowFlattening: false, // High risk of bugs
      deadCodeInjection: false, // High risk of bugs
      debugProtection: false, // Can annoy legitimate debugging
      disableConsoleOutput: false, // Keep console for now
      selfDefending: false,
      stringArray: true, // Good for basic hiding
      rotateStringArray: true,
      shuffleStringArray: true,
      splitStrings: false, // Can break logic sometimes
      sourcemap: false
    }),
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.logs for debugging
        drop_debugger: false,
      },
      format: {
        comments: false, // Remove comments
      },
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
