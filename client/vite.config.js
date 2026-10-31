import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            'codemirror-core': ['@uiw/react-codemirror'],
            'codemirror-langs': [
              '@codemirror/lang-javascript',
              '@codemirror/lang-python',
              '@codemirror/lang-java',
              '@codemirror/lang-cpp',
              '@codemirror/lang-sql',
              '@codemirror/lang-html',
              '@codemirror/lang-css',
            ],
            icons: ['lucide-react'],
          },
        },
      },
    },
  };
});
