/**
 * Chat system types for template-based journaling
 *
 * This is NOT an AI chat system - it's a structured template-based journaling interface
 * where the pet asks predefined questions from templates and users respond.
 *
 * Session-only design:
 * - Messages exist only during active conversation (no persistence)
 * - Cleared after user completes or closes the chat
 * - Responses are written to file immediately, not stored long-term
 */

/**
 * Maximum allowed length for user responses
 *
 * Security rationale:
 * - Prevents memory exhaustion from malicious/accidental large inputs
 * - 5000 chars allows ~800-1000 words (sufficient for journaling)
 * - Protects file I/O operations from excessive data
 * - UI can validate before submission, providing better UX
 */
export const MAX_RESPONSE_LENGTH = 5000;

/**
 * Message sender type - either the pet companion or the user
 */
export type MessageSender = 'pet' | 'user';

/**
 * Individual message in the conversation
 *
 * Design notes:
 * - lineNumber is optional to support different use cases:
 *   - Pet messages: may or may not have lineNumber (depends on template)
 *   - User messages: MUST have lineNumber for insertion (validated by validateUserMessage)
 * - lineNumber is 0-indexed and points to the opening ``` fence in the file
 * - Used by ResponseWriter to calculate exact insertion point
 */
export interface ChatMessage {
  /** Who sent this message */
  sender: MessageSender;

  /** The message content */
  text: string;

  /**
   * Zero-indexed line number of the opening ``` fence
   * Required for user responses (validated at insertion time)
   * Optional for pet messages (may be displayed without insertion)
   */
  lineNumber?: number;
}

/**
 * Current state of an active conversation
 *
 * Session-only design:
 * - No persistence - cleared when conversation ends
 * - Messages array can be cleared without losing data (responses already in file)
 * - isActive tracks whether conversation is currently happening
 *
 * Progress tracking:
 * - currentQuestionIndex is 0-based (Question 1 = index 0)
 * - totalQuestions is from template.questions.length
 * - UI calculates progress: (currentQuestionIndex + 1) / totalQuestions * 100
 */
export interface ConversationState {
  /** All messages in this session (pet questions + user responses) */
  messages: ChatMessage[];

  /** Current question index (0-based) */
  currentQuestionIndex: number;

  /** Total number of questions in the template */
  totalQuestions: number;

  /** Whether conversation is currently active */
  isActive: boolean;
}

/**
 * Result of validating a user response
 *
 * Forward-compatible design:
 * - Optional error field allows adding validation types later
 * - Could add: warnings, sanitized text, metadata, etc.
 */
export interface ResponseValidationResult {
  /** Whether the response passes validation */
  valid: boolean;

  /** Error message if validation failed */
  error?: string;
}

/**
 * Validates a user response before accepting it
 *
 * Validation rules:
 * 1. Must not be empty after trimming whitespace
 * 2. Must not exceed MAX_RESPONSE_LENGTH after trimming
 *
 * Security considerations:
 * - Trimming prevents whitespace-only attacks
 * - Length check prevents memory/file system abuse
 * - Empty check prevents meaningless data in journals
 *
 * @param response - Raw user input to validate
 * @returns Validation result with success flag and optional error
 */
export function validateResponse(response: string): ResponseValidationResult {
  // Trim whitespace for validation (spaces, tabs, newlines)
  const trimmed = response.trim();

  // Check for empty response after trimming
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Response cannot be empty',
    };
  }

  // Check length after trimming
  if (trimmed.length > MAX_RESPONSE_LENGTH) {
    return {
      valid: false,
      error: `Response exceeds ${MAX_RESPONSE_LENGTH} characters`,
    };
  }

  // Valid response
  return {
    valid: true,
  };
}

/**
 * Validates a user message before file insertion
 *
 * User messages MUST have:
 * 1. Valid response text (via validateResponse)
 * 2. Valid lineNumber (non-negative integer)
 *
 * Security considerations:
 * - Ensures lineNumber exists before file insertion (prevents undefined errors)
 * - Validates lineNumber is non-negative integer (prevents out-of-bounds access)
 * - Reuses text validation from validateResponse (DRY principle)
 *
 * @param message - User message to validate
 * @returns Validation result with error if invalid
 */
export function validateUserMessage(message: ChatMessage): ResponseValidationResult {
  if (message.sender !== 'user') {
    return { valid: false, error: 'Not a user message' };
  }

  // Validate text content
  const textValidation = validateResponse(message.text);
  if (!textValidation.valid) {
    return textValidation;
  }

  // Validate lineNumber exists and is valid
  if (message.lineNumber === undefined) {
    return {
      valid: false,
      error: 'User message requires lineNumber for file insertion',
    };
  }

  if (!Number.isInteger(message.lineNumber) || message.lineNumber < 0) {
    return {
      valid: false,
      error: 'lineNumber must be a non-negative integer',
    };
  }

  return { valid: true };
}
