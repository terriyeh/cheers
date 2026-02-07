/**
 * Unit tests for chat types and validation
 * Tests message structure, validation logic, and conversation state
 */

import { vi } from 'vitest';
import {
  validateResponse,
  validateUserMessage,
  MAX_RESPONSE_LENGTH,
  type ChatMessage,
  type ConversationState,
  type ResponseValidationResult,
} from '../../../src/types/chat';

describe('ChatMessage structure', () => {
  describe('Pet messages', () => {
    it('should accept pet message with text only', () => {
      const message: ChatMessage = {
        sender: 'pet',
        text: 'What went well today?',
      };

      expect(message.sender).toBe('pet');
      expect(message.text).toBe('What went well today?');
      expect(message.lineNumber).toBeUndefined();
    });

    it('should accept pet message with optional lineNumber', () => {
      const message: ChatMessage = {
        sender: 'pet',
        text: 'What are you grateful for?',
        lineNumber: 10,
      };

      expect(message.sender).toBe('pet');
      expect(message.text).toBe('What are you grateful for?');
      expect(message.lineNumber).toBe(10);
    });
  });

  describe('User messages', () => {
    it('should accept user message with text and lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'I completed my project!',
        lineNumber: 5,
      };

      expect(message.sender).toBe('user');
      expect(message.text).toBe('I completed my project!');
      expect(message.lineNumber).toBe(5);
    });

    it('should accept user message without lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Just testing',
      };

      expect(message.sender).toBe('user');
      expect(message.text).toBe('Just testing');
      expect(message.lineNumber).toBeUndefined();
    });

    it('should accept user message with zero lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Response to first question',
        lineNumber: 0,
      };

      expect(message.lineNumber).toBe(0);
    });
  });

  describe('Message content variations', () => {
    it('should accept message with newlines', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Line 1\nLine 2\nLine 3',
        lineNumber: 5,
      };

      expect(message.text).toContain('\n');
      expect(message.text.split('\n')).toHaveLength(3);
    });

    it('should accept message with special characters', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'I love coding! @#$%^&*() <3',
        lineNumber: 5,
      };

      expect(message.text).toContain('!');
      expect(message.text).toContain('&');
    });

    it('should accept message with unicode characters', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: '今日はいい日でした。 감사합니다! 😊',
        lineNumber: 5,
      };

      expect(message.text).toBeTruthy();
    });

    it('should accept very long message text', () => {
      const longText = 'a'.repeat(5000);
      const message: ChatMessage = {
        sender: 'user',
        text: longText,
        lineNumber: 5,
      };

      expect(message.text.length).toBe(5000);
    });
  });
});

describe('validateResponse', () => {
  describe('Valid responses', () => {
    it('should accept normal response text', () => {
      const result = validateResponse('I had a great day!');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept response with leading/trailing whitespace', () => {
      const result = validateResponse('  Valid response  ');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept response at maximum length', () => {
      const maxLengthText = 'a'.repeat(MAX_RESPONSE_LENGTH);
      const result = validateResponse(maxLengthText);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept response with newlines', () => {
      const result = validateResponse('Line 1\nLine 2\nLine 3');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept response with markdown formatting', () => {
      const result = validateResponse('**Bold** and *italic* text');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept response with special characters', () => {
      const result = validateResponse('Email: test@example.com, Phone: 555-1234');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept response with unicode characters', () => {
      const result = validateResponse('今日はいい日でした 😊');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept response with quotes', () => {
      const result = validateResponse('She said "hello" to me');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Empty responses', () => {
    it('should reject empty string', () => {
      const result = validateResponse('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const result = validateResponse('   ');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should reject string with only newlines', () => {
      const result = validateResponse('\n\n\n');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should reject string with only tabs', () => {
      const result = validateResponse('\t\t\t');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should reject mixed whitespace', () => {
      const result = validateResponse('  \n\t  \n  ');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });
  });

  describe('Length validation', () => {
    it('should reject response exceeding maximum length', () => {
      const tooLongText = 'a'.repeat(MAX_RESPONSE_LENGTH + 1);
      const result = validateResponse(tooLongText);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(`Response exceeds ${MAX_RESPONSE_LENGTH} characters`);
    });

    it('should reject response significantly over limit', () => {
      const tooLongText = 'a'.repeat(MAX_RESPONSE_LENGTH + 1000);
      const result = validateResponse(tooLongText);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
      expect(result.error).toContain(MAX_RESPONSE_LENGTH.toString());
    });

    it('should handle whitespace in length calculation', () => {
      // Create string that's valid after trim but over limit before trim
      const paddedText = ' '.repeat(100) + 'a'.repeat(MAX_RESPONSE_LENGTH) + ' '.repeat(100);
      const result = validateResponse(paddedText);

      // Should be valid because trimmed length is exactly at limit
      expect(result.valid).toBe(true);
    });
  });

  describe('Trimming behavior', () => {
    it('should validate trimmed text, not original', () => {
      const result = validateResponse('  Valid response  ');

      // If this passes validation, trimming happened correctly
      expect(result.valid).toBe(true);
    });

    it('should consider trimmed length for empty check', () => {
      const result = validateResponse('   ');

      // Whitespace-only should fail after trimming
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should consider trimmed length for max length check', () => {
      const paddedText = '  ' + 'a'.repeat(MAX_RESPONSE_LENGTH) + '  ';
      const result = validateResponse(paddedText);

      // Should pass because trimmed length is at limit
      expect(result.valid).toBe(true);
    });
  });
});

describe('ConversationState structure', () => {
  describe('Empty conversation', () => {
    it('should accept conversation with no messages', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 0,
        totalQuestions: 5,
        isActive: false,
      };

      expect(state.messages).toHaveLength(0);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.totalQuestions).toBe(5);
      expect(state.isActive).toBe(false);
    });

    it('should accept conversation before starting', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isActive: false,
      };

      expect(state.isActive).toBe(false);
      expect(state.messages).toHaveLength(0);
    });
  });

  describe('Active conversation', () => {
    it('should accept conversation with single question', () => {
      const state: ConversationState = {
        messages: [
          {
            sender: 'pet',
            text: 'What went well today?',
            lineNumber: 5,
          },
        ],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isActive: true,
      };

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].sender).toBe('pet');
      expect(state.isActive).toBe(true);
    });

    it('should accept conversation with question and response', () => {
      const state: ConversationState = {
        messages: [
          {
            sender: 'pet',
            text: 'What went well today?',
            lineNumber: 5,
          },
          {
            sender: 'user',
            text: 'I completed my project!',
            lineNumber: 5,
          },
        ],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isActive: true,
      };

      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].sender).toBe('pet');
      expect(state.messages[1].sender).toBe('user');
    });

    it('should accept conversation with multiple Q&A pairs', () => {
      const state: ConversationState = {
        messages: [
          { sender: 'pet', text: 'Question 1?', lineNumber: 5 },
          { sender: 'user', text: 'Answer 1', lineNumber: 5 },
          { sender: 'pet', text: 'Question 2?', lineNumber: 10 },
          { sender: 'user', text: 'Answer 2', lineNumber: 10 },
          { sender: 'pet', text: 'Question 3?', lineNumber: 15 },
        ],
        currentQuestionIndex: 2,
        totalQuestions: 3,
        isActive: true,
      };

      expect(state.messages).toHaveLength(5);
      expect(state.currentQuestionIndex).toBe(2);
    });
  });

  describe('Conversation progress tracking', () => {
    it('should track first question', () => {
      const state: ConversationState = {
        messages: [{ sender: 'pet', text: 'Q1', lineNumber: 0 }],
        currentQuestionIndex: 0,
        totalQuestions: 5,
        isActive: true,
      };

      expect(state.currentQuestionIndex).toBe(0);
      expect(state.totalQuestions).toBe(5);
    });

    it('should track middle question', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 2,
        totalQuestions: 5,
        isActive: true,
      };

      expect(state.currentQuestionIndex).toBe(2);
      const progress = (state.currentQuestionIndex + 1) / state.totalQuestions;
      expect(progress).toBe(0.6); // 60% complete (3 of 5)
    });

    it('should track last question', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 4,
        totalQuestions: 5,
        isActive: true,
      };

      expect(state.currentQuestionIndex).toBe(4);
      expect(state.currentQuestionIndex).toBe(state.totalQuestions - 1);
    });

    it('should handle single-question conversation', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 0,
        totalQuestions: 1,
        isActive: true,
      };

      expect(state.currentQuestionIndex).toBe(0);
      expect(state.totalQuestions).toBe(1);
    });
  });

  describe('Conversation completion', () => {
    it('should mark conversation as inactive after completion', () => {
      const state: ConversationState = {
        messages: [
          { sender: 'pet', text: 'Q1', lineNumber: 5 },
          { sender: 'user', text: 'A1', lineNumber: 5 },
        ],
        currentQuestionIndex: 1,
        totalQuestions: 1,
        isActive: false,
      };

      expect(state.isActive).toBe(false);
      expect(state.currentQuestionIndex).toBeGreaterThanOrEqual(state.totalQuestions - 1);
    });

    it('should allow clearing messages after completion', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 3,
        totalQuestions: 3,
        isActive: false,
      };

      expect(state.messages).toHaveLength(0);
      expect(state.isActive).toBe(false);
    });
  });
});

describe('Integration scenarios', () => {
  describe('Pet asks question flow', () => {
    it('should create valid pet message from template question', () => {
      // Simulate template question (from parser)
      const templateQuestion = {
        prompt: 'What went well today?',
        lineNumber: 5,
        index: 0,
      };

      // Create pet message
      const petMessage: ChatMessage = {
        sender: 'pet',
        text: templateQuestion.prompt,
        lineNumber: templateQuestion.lineNumber,
      };

      expect(petMessage.sender).toBe('pet');
      expect(petMessage.text).toBe('What went well today?');
      expect(petMessage.lineNumber).toBe(5);
    });

    it('should add pet message to conversation state', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isActive: true,
      };

      // Pet asks first question
      state.messages.push({
        sender: 'pet',
        text: 'What went well today?',
        lineNumber: 5,
      });

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].sender).toBe('pet');
    });
  });

  describe('User submits response flow', () => {
    it('should validate response before creating message', () => {
      const userInput = 'I completed my project!';

      // Validate first
      const validation = validateResponse(userInput);
      expect(validation.valid).toBe(true);

      // Only create message if valid
      if (validation.valid) {
        const userMessage: ChatMessage = {
          sender: 'user',
          text: userInput.trim(),
          lineNumber: 5,
        };

        expect(userMessage.sender).toBe('user');
        expect(userMessage.text).toBe('I completed my project!');
      }
    });

    it('should reject invalid response before creating message', () => {
      const userInput = '';

      // Validate first
      const validation = validateResponse(userInput);
      expect(validation.valid).toBe(false);
      expect(validation.error).toBeTruthy();

      // Should NOT create message
      // Test passes if we don't proceed with message creation
    });

    it('should add user message to conversation state', () => {
      const state: ConversationState = {
        messages: [
          { sender: 'pet', text: 'What went well?', lineNumber: 5 },
        ],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isActive: true,
      };

      const userInput = 'I completed my project!';
      const validation = validateResponse(userInput);

      if (validation.valid) {
        state.messages.push({
          sender: 'user',
          text: userInput.trim(),
          lineNumber: 5,
        });
      }

      expect(state.messages).toHaveLength(2);
      expect(state.messages[1].sender).toBe('user');
      expect(state.messages[1].text).toBe('I completed my project!');
    });
  });

  describe('Response insertion data preparation', () => {
    it('should extract lineNumber from user message', () => {
      const userMessage: ChatMessage = {
        sender: 'user',
        text: 'I completed my project!',
        lineNumber: 5,
      };

      // Response writer needs: text + lineNumber
      const insertionData = {
        text: userMessage.text,
        lineNumber: userMessage.lineNumber!,
      };

      expect(insertionData.text).toBe('I completed my project!');
      expect(insertionData.lineNumber).toBe(5);
    });

    it('should handle multiple responses with different line numbers', () => {
      const responses: ChatMessage[] = [
        { sender: 'user', text: 'Answer 1', lineNumber: 5 },
        { sender: 'user', text: 'Answer 2', lineNumber: 12 },
        { sender: 'user', text: 'Answer 3', lineNumber: 20 },
      ];

      const insertionQueue = responses.map((msg) => ({
        text: msg.text,
        lineNumber: msg.lineNumber!,
      }));

      expect(insertionQueue).toHaveLength(3);
      expect(insertionQueue[0].lineNumber).toBe(5);
      expect(insertionQueue[1].lineNumber).toBe(12);
      expect(insertionQueue[2].lineNumber).toBe(20);
    });
  });

  describe('Conversation clearing after completion', () => {
    it('should clear messages when conversation ends', () => {
      const state: ConversationState = {
        messages: [
          { sender: 'pet', text: 'Q1', lineNumber: 5 },
          { sender: 'user', text: 'A1', lineNumber: 5 },
          { sender: 'pet', text: 'Q2', lineNumber: 10 },
          { sender: 'user', text: 'A2', lineNumber: 10 },
        ],
        currentQuestionIndex: 2,
        totalQuestions: 2,
        isActive: false,
      };

      // Clear messages
      state.messages = [];

      expect(state.messages).toHaveLength(0);
      expect(state.isActive).toBe(false);
    });

    it('should reset to initial state after clearing', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 0,
        totalQuestions: 0,
        isActive: false,
      };

      expect(state.messages).toHaveLength(0);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.totalQuestions).toBe(0);
      expect(state.isActive).toBe(false);
    });
  });

  describe('Progress calculation', () => {
    it('should calculate 0% progress at start', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 0,
        totalQuestions: 5,
        isActive: true,
      };

      const progressPercent = (state.currentQuestionIndex / state.totalQuestions) * 100;
      expect(progressPercent).toBe(0);
    });

    it('should calculate 50% progress at midpoint', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 2,
        totalQuestions: 5,
        isActive: true,
      };

      const progressPercent = ((state.currentQuestionIndex + 1) / state.totalQuestions) * 100;
      expect(progressPercent).toBe(60); // Question 3 of 5 = 60%
    });

    it('should calculate 100% progress at completion', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 4,
        totalQuestions: 5,
        isActive: false,
      };

      const progressPercent = ((state.currentQuestionIndex + 1) / state.totalQuestions) * 100;
      expect(progressPercent).toBe(100);
    });

    it('should display question count correctly', () => {
      const state: ConversationState = {
        messages: [],
        currentQuestionIndex: 2,
        totalQuestions: 5,
        isActive: true,
      };

      const displayText = `Question ${state.currentQuestionIndex + 1} of ${state.totalQuestions}`;
      expect(displayText).toBe('Question 3 of 5');
    });
  });

  describe('Error recovery scenarios', () => {
    it('should handle validation failure gracefully', () => {
      const userInput = ''; // Invalid
      const validation = validateResponse(userInput);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();

      // UI should show error, not create message
      const errorMessage = validation.error;
      expect(errorMessage).toBe('Response cannot be empty');
    });

    it('should handle missing lineNumber', () => {
      const userMessage: ChatMessage = {
        sender: 'user',
        text: 'Response without lineNumber',
      };

      // Check if lineNumber exists before using
      if (userMessage.lineNumber === undefined) {
        // Handle error: cannot insert response without lineNumber
        expect(userMessage.lineNumber).toBeUndefined();
      }
    });

    it('should handle interrupted conversation state', () => {
      const state: ConversationState = {
        messages: [
          { sender: 'pet', text: 'Q1', lineNumber: 5 },
          // User closed view before responding
        ],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isActive: false, // Marked as inactive
      };

      // Should be able to detect incomplete conversation
      const hasUnansweredQuestion =
        state.messages.length > 0 &&
        state.messages[state.messages.length - 1].sender === 'pet';

      expect(hasUnansweredQuestion).toBe(true);
      expect(state.isActive).toBe(false);
    });
  });
});

describe('Constants', () => {
  it('should have MAX_RESPONSE_LENGTH set to 5000', () => {
    expect(MAX_RESPONSE_LENGTH).toBe(5000);
  });

  it('should export MAX_RESPONSE_LENGTH as const', () => {
    // This test verifies the constant is exported and accessible
    const limit = MAX_RESPONSE_LENGTH;
    expect(limit).toBeGreaterThan(0);
    expect(typeof limit).toBe('number');
  });
});

describe('Type safety', () => {
  it('should enforce sender type to be pet or user', () => {
    // This is a compile-time test - if code compiles, test passes
    const petMessage: ChatMessage = {
      sender: 'pet',
      text: 'Test',
    };

    const userMessage: ChatMessage = {
      sender: 'user',
      text: 'Test',
    };

    expect(petMessage.sender).toBe('pet');
    expect(userMessage.sender).toBe('user');

    // TypeScript would prevent: sender: 'invalid'
  });

  it('should make lineNumber optional', () => {
    // Messages can exist without lineNumber
    const messageWithoutLine: ChatMessage = {
      sender: 'pet',
      text: 'Test',
    };

    const messageWithLine: ChatMessage = {
      sender: 'user',
      text: 'Test',
      lineNumber: 5,
    };

    expect(messageWithoutLine.lineNumber).toBeUndefined();
    expect(messageWithLine.lineNumber).toBe(5);
  });

  it('should enforce ResponseValidationResult structure', () => {
    const validResult: ResponseValidationResult = {
      valid: true,
    };

    const invalidResult: ResponseValidationResult = {
      valid: false,
      error: 'Error message',
    };

    expect(validResult.valid).toBe(true);
    expect(validResult.error).toBeUndefined();
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toBeTruthy();
  });
});

describe('validateUserMessage', () => {
  describe('Valid user messages', () => {
    it('should accept valid user message with lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: 5,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept user message with lineNumber 0', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: 0,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept user message with large lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: 999999,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Invalid sender', () => {
    it('should reject pet message', () => {
      const message: ChatMessage = {
        sender: 'pet',
        text: 'Valid text',
        lineNumber: 5,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not a user message');
    });
  });

  describe('Invalid text content', () => {
    it('should reject user message with empty text', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: '',
        lineNumber: 5,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should reject user message with whitespace-only text', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: '   ',
        lineNumber: 5,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should reject user message with text exceeding max length', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'a'.repeat(MAX_RESPONSE_LENGTH + 1),
        lineNumber: 5,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  describe('Missing lineNumber', () => {
    it('should reject user message without lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('User message requires lineNumber for file insertion');
    });
  });

  describe('Invalid lineNumber', () => {
    it('should reject user message with negative lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: -1,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('lineNumber must be a non-negative integer');
    });

    it('should reject user message with negative lineNumber (-999)', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: -999,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('lineNumber must be a non-negative integer');
    });

    it('should reject user message with float lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: 5.5,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('lineNumber must be a non-negative integer');
    });

    it('should reject user message with NaN lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: NaN,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('lineNumber must be a non-negative integer');
    });

    it('should reject user message with Infinity lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: 'Valid response',
        lineNumber: Infinity,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('lineNumber must be a non-negative integer');
    });
  });

  describe('Edge cases', () => {
    it('should validate text before checking lineNumber', () => {
      // Empty text should be caught before missing lineNumber
      const message: ChatMessage = {
        sender: 'user',
        text: '',
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      // Should fail on text validation, not lineNumber
      expect(result.error).toBe('Response cannot be empty');
    });

    it('should handle combined invalid text and invalid lineNumber', () => {
      const message: ChatMessage = {
        sender: 'user',
        text: '',
        lineNumber: -1,
      };

      const result = validateUserMessage(message);
      expect(result.valid).toBe(false);
      // Should fail on text validation first
      expect(result.error).toBe('Response cannot be empty');
    });
  });
});
