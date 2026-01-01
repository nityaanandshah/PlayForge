import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // Production build optimizations
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging (optional - set to false for smaller builds)
    sourcemap: false,
    
    // Minification
    minify: 'esbuild',
    
    // Target modern browsers for smaller bundle
    target: 'es2015',
    
    // Chunk size warning limit (in KB)
    chunkSizeWarningLimit: 1000,
    
    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'http-vendor': ['axios'],
          'state-vendor': ['zustand'],
        },
        
        // Naming pattern for chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Asset inline limit (in bytes) - files smaller than this will be inlined as base64
    assetsInlineLimit: 4096,
    
    // Clear output directory before build
    emptyOutDir: true,
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand', 'lucide-react'],
  },

  // Preview server configuration (for testing production builds locally)
  preview: {
    port: 4173,
    strictPort: true,
  },
})


