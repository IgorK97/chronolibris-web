import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
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
  server: {
    // https: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7016',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://10.8.1.1:9000',
        rewrite: (path) => path.replace(/^\/storage/, ''),
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
