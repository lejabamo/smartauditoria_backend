import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Permitir conexiones desde otros equipos
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // Optimizaciones de build para producción
    target: 'es2015',
    minify: 'esbuild',
    // Code splitting optimizado
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'query-vendor': ['@tanstack/react-query'],
          'utils-vendor': ['axios', 'date-fns', 'yup'],
        },
        // Nombres de archivos optimizados
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Optimización de assets
    assetsInlineLimit: 4096, // Inline assets < 4kb
    chunkSizeWarningLimit: 1000,
    // Generar source maps solo en desarrollo
    sourcemap: false,
    // Optimizar CSS
    cssCodeSplit: true,
    cssMinify: true,
  },
  // Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@tanstack/react-query',
      'axios',
    ],
  },
})
