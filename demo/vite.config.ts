import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 使用数组格式确保更具体的 alias 优先匹配
    // 'react-keep-alive/router' 必须在 'react-keep-alive' 之前
    alias: [
      {
        find: 'react-keep-alive/router',
        replacement: fileURLToPath(new URL('../src/router/index.ts', import.meta.url)),
      },
      {
        find: 'react-keep-alive',
        replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      },
    ],
  },
});
