import type { VaultPalQuestion, ParseResult } from '../types/template';

/**
 * Maximum allowed template size (1MB = 1,000,000 characters)
 * Prevents memory exhaustion attacks and DoS via large template files
 *
 * Rationale: Daily notes typically range from 1KB-100KB. 1MB provides
 * generous headroom while preventing abuse. Parsing performance is O(n)
 * with n=1M taking ~5-10ms on modern hardware.
 */
const MAX_TEMPLATE_SIZE = 1_000_000;

/**
 * Maximum prompt length (1000 characters)
 * Prevents abuse, UI overflow, and excessively long LLM prompts
 *
 * Rationale: Most questions are 10-100 characters. 1000 characters
 * allows detailed questions while preventing abuse. This aligns with
 * typical LLM prompt best practices for focused questions.
 */
const MAX_PROMPT_LENGTH = 1000;

/**
 * Parse VaultPal questions from a daily note template
 *
 * @param content - Template file content
 * @returns Parse result with questions and warnings
 *
 * @example
 * const template = `
 * # Daily Note
 *
 * \`\`\`vaultpal
 * journal What went well today?
 * \`\`\`
 * `;
 *
 * const result = parseTemplate(template);
 * // result.questions = [{ prompt: "What went well today?", lineNumber: 3, index: 0 }]
 * // result.warnings = []
 */
export function parseTemplate(content: string): ParseResult {
  const questions: VaultPalQuestion[] = [];
  const warnings: Array<{ line: number; message: string }> = [];

  // Input validation
  if (!content || typeof content !== 'string') {
    return { questions: [], warnings: [] };
  }

  if (content.length > MAX_TEMPLATE_SIZE) {
    warnings.push({
      line: 0,
      message: `⚠️ VaultPal: Invalid Syntax. Template exceeds maximum allowed size (${MAX_TEMPLATE_SIZE} characters).`
    });
    return { questions: [], warnings };
  }

  // Split into lines (handle both \n and \r\n)
  const lines = content.split(/\r?\n/);

  let inVaultPalBlock = false;
  let blockStartLine = -1;
  let promptLine = '';
  let blockHasError = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Opening fence
    if (line === '```vaultpal') {
      if (inVaultPalBlock) {
        // Nested block detected - mark current block as invalid
        warnings.push({
          line: blockStartLine,
          message: '⚠️ VaultPal: Invalid Syntax. Nested vaultpal block detected.'
        });
        blockHasError = true;
        continue; // Don't start a new block, skip this line
      }
      inVaultPalBlock = true;
      blockStartLine = i;
      promptLine = '';
      blockHasError = false;
      continue;
    }

    // Closing fence
    if (line === '```' && inVaultPalBlock) {
      // Only process if block has no errors
      if (!blockHasError) {
        // Validate and extract prompt
        const validation = validatePromptLine(promptLine);

        if (validation.valid && validation.prompt) {
          questions.push({
            prompt: validation.prompt,
            lineNumber: blockStartLine,
            index: questions.length
          });
        } else if (validation.error) {
          warnings.push({
            line: blockStartLine,
            message: validation.error
          });
        }
      }

      inVaultPalBlock = false;
      blockStartLine = -1;
      promptLine = '';
      blockHasError = false;
      continue;
    }

    // Inside vaultpal block - capture journal line
    if (inVaultPalBlock && !blockHasError) {
      if (line.startsWith('journal')) {
        // Check for multiple journal lines
        if (promptLine) {
          // Already have a journal line - this is an error
          warnings.push({
            line: blockStartLine,
            message: '⚠️ VaultPal: Invalid Syntax. Multiple journal lines found.'
          });
          blockHasError = true;
        } else {
          promptLine = line;
        }
      }
    }
  }

  // Handle unclosed block
  if (inVaultPalBlock) {
    warnings.push({
      line: blockStartLine,
      message: '⚠️ VaultPal: Invalid Syntax. Unclosed vaultpal block.'
    });
  }

  return { questions, warnings };
}

/**
 * Validate and extract prompt from a "journal" line
 *
 * @param line - The line to validate (e.g., 'journal What are you grateful for?')
 * @returns Validation result with extracted prompt or error
 */
function validatePromptLine(line: string): {
  valid: boolean;
  prompt?: string;
  error?: string;
} {
  if (!line) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Missing "journal" field.'
    };
  }

  // Match: "journal Question text here" (space-separated, no quotes needed)
  // Use \s* and .* to also catch "journal" alone or "journal " with no text
  const match = line.match(/^journal\s*(.*)$/);

  if (!match) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Malformed "journal" field.'
    };
  }

  const prompt = match[1].trim();

  // Validate prompt
  if (prompt.length === 0) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Empty question.'
    };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `⚠️ VaultPal: Invalid Syntax. Question is too long (${prompt.length} characters, max ${MAX_PROMPT_LENGTH}).`
    };
  }

  // Check for emojis
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  if (emojiRegex.test(prompt)) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Question cannot contain emoji characters.'
    };
  }

  return {
    valid: true,
    prompt
  };
}
