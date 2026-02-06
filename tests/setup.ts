/**
 * Vitest global setup
 */

// Ensure window object exists in test environment
if (typeof window === 'undefined') {
  (global as any).window = {};
}
