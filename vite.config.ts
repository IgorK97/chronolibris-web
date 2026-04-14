import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      injectRegister: 'auto',
      manifest: {
        name: 'Chronolibris',
        start_url: '/',
        short_name: 'Chronolibris',
        description: 'Your Awesome History Library App',
        theme_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),

    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@api': path.resolve(__dirname, './src/api'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@app': path.resolve(__dirname, './src/app'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
  optimizeDeps: {
    include: ['.json', '.js'],
  },
  server: {
    host: true,
    port: 5173,
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, './certs/localhost+2-key.pem')
      ),
      cert: fs.readFileSync(path.resolve(__dirname, './certs/localhost+2.pem')),
    },
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7016',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'https://127.0.0.1:9000',
        rewrite: (path) => path.replace(/^\/storage/, ''),
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, './certs/localhost+2-key.pem')
      ),
      cert: fs.readFileSync(path.resolve(__dirname, './certs/localhost+2.pem')),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:7016',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'https://localhost:9000',
        rewrite: (path) => path.replace(/^\/storage/, ''),
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
