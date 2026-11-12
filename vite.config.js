import { defineConfig } from 'vite';
import { mockApiPlugin } from './server/mockApi.js';

export default defineConfig({
  plugins: [mockApiPlugin()],
  esbuild: { jsx: 'automatic' },
});
