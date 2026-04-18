import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // setupFiles: './src/setupTests.ts',
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
});
