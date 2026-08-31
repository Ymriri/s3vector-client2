import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { s3vRelayPlugin } from './vite.relay';

// Test timeout for AntD-heavy jsdom suites on a busy machine.
const testConfig = {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  testTimeout: 20000,
  // Serial file execution: the AntD-heavy suites flake under parallel load.
  fileParallelism: false,
};

export default defineConfig(({ mode }) => {
  if (mode === 'test') {
    return {
      plugins: [react()],
      resolve: { alias: { '@': path.resolve(__dirname, './src') } },
      test: testConfig,
    };
  }
  return {
    plugins: [react(), s3vRelayPlugin()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    test: testConfig,
  };
});
