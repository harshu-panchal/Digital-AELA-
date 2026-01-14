import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";


import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.mjs'],
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // React core libraries - frequently used, should be cached
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router')
            ) {
              return 'vendor-react';
            }

            // PDF viewer libraries - heavy, rarely used together
            if (id.includes('@react-pdf-viewer') || id.includes('pdfjs-dist')) {
              return 'vendor-pdf';
            }

            // Chart.js libraries - heavy, used in analytics
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }

            // Mediasoup and WebRTC related - heavy
            // Keep mediasoup separate to avoid CommonJS/ES module conflicts
            if (id.includes('mediasoup')) {
              return 'vendor-webrtc';
            }

            // Socket.io - separate from mediasoup to avoid conflicts
            if (id.includes('socket.io')) {
              return 'vendor-socket';
            }

            // TipTap editor - medium sized
            if (id.includes('@tiptap')) {
              return 'vendor-editor';
            }

            // Framer Motion - animation library
            if (id.includes('framer-motion')) {
              return 'vendor-animations';
            }

            // i18n libraries
            if (id.includes('i18next')) {
              return 'vendor-i18n';
            }

            // Other vendor dependencies
            return 'vendor';
          }

          // Split large feature modules
          if (id.includes('/modules/admin/')) {
            return 'admin';
          }
          if (id.includes('/modules/teacher/')) {
            return 'teacher';
          }
          if (id.includes('/modules/student/')) {
            return 'student';
          }
          if (id.includes('/modules/learn-earn/')) {
            return 'learn-earn';
          }
          if (id.includes('/modules/explore-jobs/')) {
            return 'explore-jobs';
          }
          if (id.includes('/modules/recruiter/')) {
            return 'recruiter';
          }

          // Additional optimizations for lazy-loaded components
          if (id.includes('/src/components/LazyChart')) {
            return 'lazy-charts';
          }
          if (id.includes('/src/components/LazyTipTap')) {
            return 'lazy-editor';
          }
        },
        // Optimize chunk names for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
      external: [],
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto',
      defaultIsModuleExports: 'auto',
      esmExternals: true,
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext',
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'mediasoup-client',
      'socket.io-client'
    ],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
    },
    force: false,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
});
