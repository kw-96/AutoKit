import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 绑定到所有网络接口
    port: 5173,      // 明确指定端口
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  define: {
    __MCP_CONFIG_NAME__: JSON.stringify('AutoKit')
  }
});