import type { MarkdownPostProcessorContext } from 'obsidian';

/**
 * Process vaultpal code blocks for inline validation
 *
 * Shows validation errors directly in the note (like DataView does)
 * Registered via: registerMarkdownCodeBlockProcessor('vaultpal', ...)
 *
 * @param source - Code block content
 * @param el - Container element to render into
 * @param ctx - Markdown context
 */
export function processVaultPalBlock(
  source: string,
  el: HTMLElement,
  _ctx: MarkdownPostProcessorContext
): void {
  // Validate syntax
  const validation = validateBlockSyntax(source);

  if (!validation.valid) {
    // Show error inline
    const errorDiv = el.createDiv({ cls: 'vault-pal-error' });
    errorDiv.createDiv({
      text: validation.error || 'Unknown error',
      cls: 'vault-pal-error-message'
    });

    if (validation.hint) {
      errorDiv.createDiv({
        text: validation.hint,
        cls: 'vault-pal-error-hint'
      });
    }

    return;
  }

  // Valid block - show preview (just the prompt text)
  // SECURITY: Obsidian's text parameter safely escapes HTML (equivalent to textContent)
  const previewDiv = el.createDiv({ cls: 'vault-pal-preview' });
  previewDiv.createDiv({
    text: validation.prompt,
    cls: 'vault-pal-preview-content'
  });
}

/**
 * Validate vaultpal code block syntax
 */
function validateBlockSyntax(source: string): {
  valid: boolean;
  prompt?: string;
  error?: string;
  hint?: string;
} {
  const lines = source.trim().split(/\r?\n/);

  // Check for nested blocks
  const nestedBlockCount = (source.match(/```vaultpal/g) || []).length;
  if (nestedBlockCount > 0) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Nested vaultpal block detected.',
      hint: 'Close the previous block before starting a new one.'
    };
  }

  // Find all lines with "journal"
  const journalLines = lines.filter(line => line.trim().startsWith('journal'));

  if (journalLines.length === 0) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Missing "journal" field.',
      hint: 'Try this: journal What are you grateful for today?'
    };
  }

  // Check for multiple journal lines
  if (journalLines.length > 1) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Multiple journal lines found.',
      hint: 'Use only one journal keyword per block.'
    };
  }

  const promptLine = journalLines[0];

  // Extract prompt - space-separated, no quotes needed
  // Use \s* and .* to also catch "journal" alone or "journal " with no text
  const match = promptLine.trim().match(/^journal\s*(.*)$/);

  if (!match) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Malformed "journal" field.',
      hint: 'Try this: journal What are you grateful for today?'
    };
  }

  const prompt = match[1].trim();

  if (prompt.length === 0) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Empty question.',
      hint: 'Add your question after "journal" (1-1000 characters).\nTry this: journal What are you grateful for today?'
    };
  }

  if (prompt.length > 1000) {
    return {
      valid: false,
      error: `⚠️ VaultPal: Invalid Syntax. Question is too long (${prompt.length} characters, max 1000).`,
      hint: 'Shorten your question to 1000 characters or less.'
    };
  }

  // Check for emojis (common mistake)
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  if (emojiRegex.test(prompt)) {
    return {
      valid: false,
      error: '⚠️ VaultPal: Invalid Syntax. Question cannot contain emoji characters.',
      hint: 'Try this: journal What are you grateful for today?'
    };
  }

  return {
    valid: true,
    prompt
  };
}
