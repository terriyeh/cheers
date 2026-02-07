import type { TFile } from 'obsidian';
import type { VaultPalQuestion, ParseResult } from '../types/template';
import { parseTemplate } from './parser';

/**
 * Cached parse result with metadata
 */
interface CachedResult {
  questions: VaultPalQuestion[];
  warnings: ParseResult['warnings'];
  mtime: number; // File modification timestamp
}

/**
 * Template parser with caching
 *
 * Caches parsed results and only re-parses when template file changes.
 * Uses file.stat.mtime for change detection.
 */
export class TemplateCache {
  private cache = new Map<string, CachedResult>();
  private readonly MAX_CACHE_ENTRIES = 100;

  /**
   * Get questions from template with caching
   *
   * @param file - Template file
   * @param readFile - Function to read file content
   * @returns Parse result (from cache or fresh parse)
   *
   * @example
   * const cache = new TemplateCache();
   * const result = await cache.getQuestions(
   *   templateFile,
   *   (f) => app.vault.read(f)
   * );
   */
  async getQuestions(
    file: TFile,
    readFile: (file: TFile) => Promise<string>
  ): Promise<ParseResult> {
    const cached = this.cache.get(file.path);
    const currentMtime = file.stat.mtime;

    // Cache hit - file hasn't changed
    if (cached && cached.mtime === currentMtime) {
      return {
        questions: cached.questions,
        warnings: cached.warnings
      };
    }

    // Cache miss or stale - parse template
    const content = await readFile(file);
    const result = parseTemplate(content);

    // Evict oldest entry if cache is full
    this.evictLRU();

    // Update cache
    this.cache.set(file.path, {
      questions: result.questions,
      warnings: result.warnings,
      mtime: currentMtime
    });

    return result;
  }

  /**
   * Evict oldest entry if cache is at capacity
   * Prevents unbounded memory growth
   */
  private evictLRU(): void {
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear cached result for a specific file
   *
   * @param filePath - Vault-relative file path
   */
  invalidate(filePath: string): void {
    // Validate path to prevent path traversal attacks
    if (filePath.includes('..') || filePath.startsWith('/') || filePath.includes('\\')) {
      console.warn(`[VaultPal] Invalid path for cache invalidation: ${filePath}`);
      return;
    }
    this.cache.delete(filePath);
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
  }
}
