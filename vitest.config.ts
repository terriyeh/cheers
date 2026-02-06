import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '*.config.*',
        'version-bump.mjs',
        'esbuild.config.mjs',
      ],
    },
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      'obsidian': path.resolve(__dirname, './tests/mocks/obsidian.ts'),
      '../components/Pet.svelte': path.resolve(__dirname, './tests/mocks/Pet.svelte.ts'),
    },
  },
});
