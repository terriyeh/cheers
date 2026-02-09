/**
 * Unit tests for TemplateCache
 * Tests caching behavior, change detection, and invalidation
 */

import { vi } from 'vitest';
import { TemplateCache } from '../../../src/template/cache';
import type { TFile } from 'obsidian';
import { validTemplates } from '../../fixtures/templates';

describe('TemplateCache', () => {
  let cache: TemplateCache;
  let mockReadFile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cache = new TemplateCache();
    mockReadFile = vi.fn();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('basic caching', () => {
    it('should cache parsed results', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      // First call - should parse
      const result1 = await cache.getQuestions(mockFile, mockReadFile);

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(result1.questions).toHaveLength(1);
      expect(result1.questions[0].prompt).toBe('What went well today?');

      // Second call - should use cache
      const result2 = await cache.getQuestions(mockFile, mockReadFile);

      expect(mockReadFile).toHaveBeenCalledTimes(1); // Not called again
      expect(result2.questions).toHaveLength(1);
      expect(result2.questions[0].prompt).toBe('What went well today?');
    });

    it('should cache results for multiple files independently', async () => {
      const mockFile1 = {
        path: 'template1.md',
        stat: { mtime: 1000 },
      } as TFile;

      const mockFile2 = {
        path: 'template2.md',
        stat: { mtime: 2000 },
      } as TFile;

      mockReadFile.mockResolvedValueOnce(`\`\`\`vaultpal
journal Question 1
\`\`\`
`);
      mockReadFile.mockResolvedValueOnce(`\`\`\`vaultpal
journal Question 2
\`\`\`
`);

      const result1 = await cache.getQuestions(mockFile1, mockReadFile);
      const result2 = await cache.getQuestions(mockFile2, mockReadFile);

      expect(result1.questions[0].prompt).toBe('Question 1');
      expect(result2.questions[0].prompt).toBe('Question 2');
      expect(mockReadFile).toHaveBeenCalledTimes(2);

      // Fetch again - should use cache
      await cache.getQuestions(mockFile1, mockReadFile);
      await cache.getQuestions(mockFile2, mockReadFile);

      expect(mockReadFile).toHaveBeenCalledTimes(2); // Still 2
    });

    it('should cache warnings along with questions', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      const invalidTemplate = `\`\`\`vaultpal
journal 
\`\`\`
`;

      mockReadFile.mockResolvedValue(invalidTemplate);

      const result1 = await cache.getQuestions(mockFile, mockReadFile);
      expect(result1.warnings).toHaveLength(1);
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      // Second call - warnings should be cached too
      const result2 = await cache.getQuestions(mockFile, mockReadFile);
      expect(result2.warnings).toHaveLength(1);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('change detection', () => {
    it('should re-parse when file mtime changes', async () => {
      let mtime = 1000;
      const mockFile = {
        path: 'template.md',
        get stat() {
          return { mtime };
        },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      // First call
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      // File changes (mtime updated)
      mtime = 2000;

      // Second call - should re-parse
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });

    it('should not re-parse when mtime is unchanged', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      // Multiple calls with same mtime
      await cache.getQuestions(mockFile, mockReadFile);
      await cache.getQuestions(mockFile, mockReadFile);
      await cache.getQuestions(mockFile, mockReadFile);

      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle mtime changing multiple times', async () => {
      let mtime = 1000;
      const mockFile = {
        path: 'template.md',
        get stat() {
          return { mtime };
        },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      // Initial parse
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      // First change
      mtime = 2000;
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(2);

      // Second change
      mtime = 3000;
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(3);

      // No change
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(3);
    });

    it('should detect different content when mtime changes', async () => {
      let mtime = 1000;
      const mockFile = {
        path: 'template.md',
        get stat() {
          return { mtime };
        },
      } as TFile;

      mockReadFile.mockResolvedValueOnce(`\`\`\`vaultpal
journal Original question
\`\`\`
`);

      const result1 = await cache.getQuestions(mockFile, mockReadFile);
      expect(result1.questions[0].prompt).toBe('Original question');

      // File modified with new content
      mtime = 2000;
      mockReadFile.mockResolvedValueOnce(`\`\`\`vaultpal
journal Updated question
\`\`\`
`);

      const result2 = await cache.getQuestions(mockFile, mockReadFile);
      expect(result2.questions[0].prompt).toBe('Updated question');
    });
  });

  describe('invalidation', () => {
    it('should clear cached result on invalidate', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      // Invalidate cache
      cache.invalidate('template.md');

      // Should re-parse
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });

    it('should only invalidate specified file', async () => {
      const mockFile1 = {
        path: 'template1.md',
        stat: { mtime: 1000 },
      } as TFile;

      const mockFile2 = {
        path: 'template2.md',
        stat: { mtime: 2000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      await cache.getQuestions(mockFile1, mockReadFile);
      await cache.getQuestions(mockFile2, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(2);

      // Invalidate only template1
      cache.invalidate('template1.md');

      // template1 should re-parse, template2 should use cache
      await cache.getQuestions(mockFile1, mockReadFile);
      await cache.getQuestions(mockFile2, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(3); // Only 1 more call
    });

    it('should not throw when invalidating non-existent file', () => {
      expect(() => cache.invalidate('nonexistent.md')).not.toThrow();
    });

    it('should handle invalidating same file multiple times', () => {
      expect(() => {
        cache.invalidate('template.md');
        cache.invalidate('template.md');
        cache.invalidate('template.md');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cached results', async () => {
      const mockFile1 = {
        path: 'template1.md',
        stat: { mtime: 1000 },
      } as TFile;

      const mockFile2 = {
        path: 'template2.md',
        stat: { mtime: 2000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      await cache.getQuestions(mockFile1, mockReadFile);
      await cache.getQuestions(mockFile2, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(2);

      // Clear all cache
      cache.clear();

      // Both should re-parse
      await cache.getQuestions(mockFile1, mockReadFile);
      await cache.getQuestions(mockFile2, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(4);
    });

    it('should not throw when clearing empty cache', () => {
      expect(() => cache.clear()).not.toThrow();
    });

    it('should handle clearing cache multiple times', () => {
      expect(() => {
        cache.clear();
        cache.clear();
        cache.clear();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle file with zero mtime', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 0 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      const result = await cache.getQuestions(mockFile, mockReadFile);
      expect(result.questions).toHaveLength(1);
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      // Should use cache
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle very large mtime values', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: Number.MAX_SAFE_INTEGER },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      const result = await cache.getQuestions(mockFile, mockReadFile);
      expect(result.questions).toHaveLength(1);
    });

    it('should handle file path with special characters', async () => {
      const mockFile = {
        path: 'folder/sub-folder/template (2024).md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      const result = await cache.getQuestions(mockFile, mockReadFile);
      expect(result.questions).toHaveLength(1);

      // Should use cache
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle empty template', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue('');

      const result = await cache.getQuestions(mockFile, mockReadFile);
      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);

      // Should use cache
      await cache.getQuestions(mockFile, mockReadFile);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle template with only invalid blocks', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue(`\`\`\`vaultpal
journal 
\`\`\`
`);

      const result = await cache.getQuestions(mockFile, mockReadFile);
      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);

      // Should use cache (including warnings)
      const result2 = await cache.getQuestions(mockFile, mockReadFile);
      expect(result2.warnings).toHaveLength(1);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle readFile throwing error', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockRejectedValue(new Error('File read error'));

      await expect(cache.getQuestions(mockFile, mockReadFile)).rejects.toThrow('File read error');
    });

    it('should not cache when readFile fails', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      // First call fails
      mockReadFile.mockRejectedValueOnce(new Error('File read error'));

      await expect(cache.getQuestions(mockFile, mockReadFile)).rejects.toThrow();

      // Second call succeeds
      mockReadFile.mockResolvedValueOnce(validTemplates.singleQuestion);

      const result = await cache.getQuestions(mockFile, mockReadFile);
      expect(result.questions).toHaveLength(1);
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance', () => {
    it('should provide significant performance improvement for cached results', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      // Simulate slow file read
      mockReadFile.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return validTemplates.multipleQuestions;
      });

      // First call - slow
      const start1 = performance.now();
      await cache.getQuestions(mockFile, mockReadFile);
      const duration1 = performance.now() - start1;

      // Second call - should be much faster (cached)
      const start2 = performance.now();
      await cache.getQuestions(mockFile, mockReadFile);
      const duration2 = performance.now() - start2;

      expect(duration2).toBeLessThan(duration1 / 2);
    });

    it('should handle many files efficiently', async () => {
      const files = Array.from({ length: 100 }, (_, i) => ({
        path: `template${i}.md`,
        stat: { mtime: 1000 + i },
      } as TFile));

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      // Cache all files
      for (const file of files) {
        await cache.getQuestions(file, mockReadFile);
      }

      expect(mockReadFile).toHaveBeenCalledTimes(100);

      // Retrieve all from cache - should be fast
      const start = performance.now();
      for (const file of files) {
        await cache.getQuestions(file, mockReadFile);
      }
      const duration = performance.now() - start;

      expect(mockReadFile).toHaveBeenCalledTimes(100); // No additional calls
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });

  describe('concurrent access', () => {
    it('should handle concurrent reads of same file', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      // Make multiple concurrent requests
      const results = await Promise.all([
        cache.getQuestions(mockFile, mockReadFile),
        cache.getQuestions(mockFile, mockReadFile),
        cache.getQuestions(mockFile, mockReadFile),
      ]);

      // All should return same result
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      // File should be read at least once
      expect(mockReadFile).toHaveBeenCalled();
    });

    it('should handle concurrent reads of different files', async () => {
      const files = Array.from({ length: 10 }, (_, i) => ({
        path: `template${i}.md`,
        stat: { mtime: 1000 + i },
      } as TFile));

      mockReadFile.mockResolvedValue(validTemplates.singleQuestion);

      // Make concurrent requests for different files
      const results = await Promise.all(
        files.map(file => cache.getQuestions(file, mockReadFile))
      );

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.questions).toHaveLength(1);
      });
    });
  });

  describe('memory management', () => {
    it('should allow garbage collection after clear', async () => {
      const mockFile = {
        path: 'template.md',
        stat: { mtime: 1000 },
      } as TFile;

      mockReadFile.mockResolvedValue(validTemplates.multipleQuestions);

      await cache.getQuestions(mockFile, mockReadFile);

      // Clear cache to allow garbage collection
      cache.clear();

      // Create new cache and verify it starts fresh
      const result = await cache.getQuestions(mockFile, mockReadFile);
      expect(result.questions).toHaveLength(3);
      expect(mockReadFile).toHaveBeenCalledTimes(2); // Called again after clear
    });
  });
});
