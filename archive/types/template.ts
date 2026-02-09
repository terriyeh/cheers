/**
 * Represents a parsed VaultPal question from the template
 */
export interface VaultPalQuestion {
  /** The question text to display to the user */
  prompt: string;

  /**
   * Zero-indexed line number of the opening ```
   * Used by ResponseWriter to calculate insertion point
   */
  lineNumber: number;

  /**
   * Position in the questions array (0-based)
   * Used for progress tracking: "Question X of Y"
   */
  index: number;
}

/**
 * Result of parsing a template with diagnostics
 */
export interface ParseResult {
  /** Successfully parsed questions */
  questions: VaultPalQuestion[];

  /** Validation warnings (line number and message) */
  warnings: Array<{
    line: number;
    message: string;
  }>;
}

/**
 * Validation result for a single code block
 */
export interface ValidationResult {
  valid: boolean;
  prompt?: string;
  error?: string;
}
