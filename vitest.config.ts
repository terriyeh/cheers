import { defineConfig } from 'vitest/config';
import path from 'path';
import type { Plugin } from 'vite';

/** Stub GIF imports in tests — esbuild handles real inlining at build time. */
const gifStub: Plugin = {
  name: 'gif-stub',
  transform(_, id) {
    if (id.endsWith('.gif')) {
      return { code: 'export default "data:image/gif;base64,stub"', map: null };
    }
  },
};

export default defineConfig({
  plugins: [gifStub],
  define: {
    __DEV__: false,
  },
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
      '../components/Stats.svelte': path.resolve(__dirname, './tests/mocks/Stats.svelte.ts'),
    },
  },
});
