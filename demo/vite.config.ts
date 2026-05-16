import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 使用数组格式确保更具体的 alias 优先匹配
    // 'react-keep-alive/router' 必须在 'react-keep-alive' 之前
    alias: [
      {
        find: 'react-keep-alive/router',
        replacement: resolve(__dirname, '../src/router/index.ts'),
      },
      {
        find: 'react-keep-alive',
        replacement: resolve(__dirname, '../src/index.ts'),
      },
    ],
  },
});
