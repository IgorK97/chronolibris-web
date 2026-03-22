import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
// import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'fs';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // basicSsl()
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
    port: 5173,
    https: {
      // Указываем пути к созданным файлам
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
        target: 'http://127.0.0.1:9000',
        rewrite: (path) => path.replace(/^\/storage/, ''),
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
