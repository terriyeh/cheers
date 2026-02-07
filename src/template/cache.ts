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
  lastAccess: number; // Last access timestamp for LRU eviction
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

    // Runtime validation: ensure mtime is a valid number
    if (typeof currentMtime !== 'number' || !Number.isFinite(currentMtime)) {
      console.warn(`[VaultPal] Invalid mtime for file ${file.path}, bypassing cache`);
      const content = await readFile(file);
      return parseTemplate(content);
    }

    // Cache hit - file hasn't changed
    if (cached && cached.mtime === currentMtime) {
      // Update last access time for LRU tracking
      cached.lastAccess = Date.now();
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
      mtime: currentMtime,
      lastAccess: Date.now()
    });

    return result;
  }

  /**
   * Evict least recently used entry if cache is at capacity
   * Prevents unbounded memory growth
   *
   * Performance note: Uses O(n) linear search through cache entries.
   * For MAX_CACHE_ENTRIES=100, this is ~100 iterations which is acceptable
   * (<1ms on modern hardware). If cache size grows significantly, consider
   * using a doubly-linked list + hash map for O(1) LRU operations.
   */
  private evictLRU(): void {
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      // Find entry with oldest lastAccess timestamp (true LRU)
      let oldestKey: string | null = null;
      let oldestAccess = Infinity;

      for (const [key, value] of this.cache.entries()) {
        if (value.lastAccess < oldestAccess) {
          oldestAccess = value.lastAccess;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear cached result for a specific file
   *
   * @param filePath - Vault-relative file path (e.g., "templates/daily.md" or "folder/subfolder/file.md")
   *
   * Security: Validates path to prevent cache poisoning via path traversal.
   * Obsidian TFile.path is always vault-relative (no leading slash), so legitimate
   * paths look like "folder/file.md", not "/folder/file.md". We allow forward slashes
   * within the path but block absolute paths and traversal sequences.
   *
   * Note: Path validation here is defensive-in-depth. Since cache invalidation only
   * affects cache (not file system), security risk is low, but validation prevents
   * potential cache poisoning if invalidate() is called with untrusted input.
   */
  invalidate(filePath: string): void {
    // Validate path to prevent path traversal and cache poisoning
    // Block: path traversal (..), backslashes (Windows paths), leading slashes (absolute paths)
    if (
      filePath.includes('..') ||      // Path traversal (e.g., "../../../etc/passwd")
      filePath.includes('\\') ||      // Windows-style paths (e.g., "C:\path")
      filePath.startsWith('/') ||     // Absolute Unix paths (e.g., "/etc/passwd")
      /^[a-zA-Z]:/.test(filePath)     // Windows absolute paths (e.g., "C:", "D:")
    ) {
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
