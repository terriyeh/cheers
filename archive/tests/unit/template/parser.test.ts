/**
 * Unit tests for Template Parser
 * Tests line-by-line parsing, validation, edge cases, and performance
 */

import { vi } from 'vitest';
import { parseTemplate } from '../../../src/template/parser';
import {
  validTemplates,
  invalidTemplates,
  edgeCaseTemplates,
  lineNumberTemplates,
  performanceTemplates,
  realWorldTemplates,
} from '../../fixtures/templates';

describe('Template Parser', () => {
  describe('basic parsing', () => {
    it('should parse single vaultpal block', () => {
      const result = parseTemplate(validTemplates.singleQuestion);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('What went well today?');
      expect(result.questions[0].lineNumber).toBe(2);
      expect(result.questions[0].index).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should parse multiple vaultpal blocks in order', () => {
      const result = parseTemplate(validTemplates.multipleQuestions);

      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].prompt).toBe('What went well today?');
      expect(result.questions[1].prompt).toBe('What could be improved?');
      expect(result.questions[2].prompt).toBe('What are you grateful for?');
      expect(result.questions[0].index).toBe(0);
      expect(result.questions[1].index).toBe(1);
      expect(result.questions[2].index).toBe(2);
    });

    it('should return empty array for template with no vaultpal blocks', () => {
      const template = `# Daily Note

Just some regular markdown content.

\`\`\`javascript
console.log('not a vaultpal block');
\`\`\`
`;

      const result = parseTemplate(template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should parse questions with markdown context', () => {
      const result = parseTemplate(validTemplates.questionWithMarkdown);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('What did you learn today?');
      expect(result.warnings).toHaveLength(0);
    });

    it('should ignore other code blocks and parse only vaultpal blocks', () => {
      const result = parseTemplate(validTemplates.questionsWithOtherCodeBlocks);

      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].prompt).toBe('Your question here');
      expect(result.questions[1].prompt).toBe('Another question');
    });

    it('should parse question with special characters', () => {
      const result = parseTemplate(validTemplates.questionWithSpecialCharacters);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe("What's your goal for tomorrow?");
    });

    it('should parse question with unicode characters', () => {
      const result = parseTemplate(validTemplates.questionWithUnicodeCharacters);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Comment s\'est passée votre journée?');
    });

    it('should parse minimal template', () => {
      const result = parseTemplate(validTemplates.minimalTemplate);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Q');
    });

    it('should handle extra whitespace around blocks', () => {
      const result = parseTemplate(validTemplates.questionWithExtraWhitespace);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('What went well?');
    });

    it('should parse journal with standard space separator', () => {
      const result = parseTemplate(validTemplates.questionWithNoSpaceAfterJournal);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Question without space');
    });
  });

  describe('validation - missing or invalid prompt', () => {
    it('should warn on missing prompt field', () => {
      const result = parseTemplate(invalidTemplates.missingPrompt.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.missingPrompt.expectedError);
      expect(result.warnings[0].line).toBe(0);
    });

    it('should warn on empty prompt', () => {
      const result = parseTemplate(invalidTemplates.emptyPrompt.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.emptyPrompt.expectedError);
    });

    it('should warn on invalid syntax with single quotes', () => {
      const result = parseTemplate(invalidTemplates.invalidSyntaxSingleQuotes.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.invalidSyntaxSingleQuotes.expectedError);
    });

    it('should warn on invalid syntax with no quotes', () => {
      const result = parseTemplate(invalidTemplates.invalidSyntaxNoQuotes.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.invalidSyntaxNoQuotes.expectedError);
    });

    it('should warn on invalid syntax with missing closing quote', () => {
      const result = parseTemplate(invalidTemplates.invalidSyntaxMissingClosingQuote.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.invalidSyntaxMissingClosingQuote.expectedError);
    });

    it('should warn on empty block', () => {
      const result = parseTemplate(invalidTemplates.emptyBlock.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.emptyBlock.expectedError);
    });

    it('should warn on block with only whitespace', () => {
      const result = parseTemplate(invalidTemplates.onlyWhitespace.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.onlyWhitespace.expectedError);
    });
  });

  describe('validation - prompt length', () => {
    it('should warn on prompt exceeding max length', () => {
      const result = parseTemplate(invalidTemplates.promptTooLong.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.promptTooLong.expectedError);
      expect(result.warnings[0].message).toContain('1001');
    });

    it('should accept prompt at exact max length', () => {
      const result = parseTemplate(edgeCaseTemplates.exactMaxPromptLength);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toHaveLength(1000);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accept short prompts', () => {
      const result = parseTemplate(validTemplates.minimalTemplate);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Q');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validation - block structure', () => {
    it('should warn on unclosed vaultpal block', () => {
      const result = parseTemplate(invalidTemplates.unclosedBlock.template);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain(invalidTemplates.unclosedBlock.expectedError);
      expect(result.warnings[0].line).toBe(0);
    });

    it('should warn on nested vaultpal blocks', () => {
      const result = parseTemplate(invalidTemplates.nestedBlocks.template);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining(invalidTemplates.nestedBlocks.expectedError),
        })
      );
    });

    it('should handle multiple unclosed blocks', () => {
      const result = parseTemplate(edgeCaseTemplates.multipleUnclosedBlocks);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('Unclosed'))).toBe(true);
    });

    it('should handle block without content', () => {
      const result = parseTemplate(edgeCaseTemplates.blockWithoutContent);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('edge cases - line endings and whitespace', () => {
    it('should handle CRLF line endings', () => {
      const result = parseTemplate(edgeCaseTemplates.crlfLineEndings);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Test CRLF');
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle mixed line endings', () => {
      const result = parseTemplate(edgeCaseTemplates.mixedLineEndings);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Mixed');
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle empty input', () => {
      const result = parseTemplate(edgeCaseTemplates.emptyInput);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle whitespace-only input', () => {
      const result = parseTemplate(edgeCaseTemplates.whitespaceOnly);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle null input gracefully', () => {
      const result = parseTemplate(null as any);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle undefined input gracefully', () => {
      const result = parseTemplate(undefined as any);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle non-string input gracefully', () => {
      const result = parseTemplate(123 as any);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('edge cases - size limits', () => {
    it('should handle template at max size', () => {
      const result = parseTemplate(edgeCaseTemplates.maxSizeTemplate);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject template exceeding size limit', () => {
      const result = parseTemplate(edgeCaseTemplates.overSizeTemplate);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('exceeds');
      expect(result.warnings[0].message).toContain('1000000');
      expect(result.warnings[0].line).toBe(0);
    });
  });

  describe('edge cases - prompt field handling', () => {
    it('should handle prompt on multiple lines by reading first line only', () => {
      const result = parseTemplate(edgeCaseTemplates.promptOnMultipleLines);

      // Line-by-line parser reads only first line with "journal"
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('This is');
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject block when multiple journal lines exist', () => {
      const result = parseTemplate(edgeCaseTemplates.multiplePromptFields);

      // Should reject the block entirely
      expect(result.questions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Multiple journal lines');
    });

    it('should handle prompt with embedded newline by reading first line only', () => {
      const result = parseTemplate(edgeCaseTemplates.promptWithNewlines);

      // Line-by-line parser reads only first line
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Question with');
      expect(result.warnings).toHaveLength(0);
    });

    it('should only match lowercase "journal" (case sensitive)', () => {
      const result = parseTemplate(edgeCaseTemplates.caseVariations);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('Lowercase works');
    });
  });

  describe('line number accuracy', () => {
    it('should report correct line number for first line', () => {
      const result = parseTemplate(lineNumberTemplates.firstLine);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].lineNumber).toBe(0);
    });

    it('should report correct line number with preceding content', () => {
      const result = parseTemplate(lineNumberTemplates.withPrecedingLines);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].lineNumber).toBe(3);
    });

    it('should report correct line numbers for multiple blocks with gaps', () => {
      const result = parseTemplate(lineNumberTemplates.multipleWithGaps);

      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].lineNumber).toBe(4);
      expect(result.questions[1].lineNumber).toBe(11);
    });

    it('should report correct line number for deeply nested content', () => {
      const result = parseTemplate(lineNumberTemplates.deeplyNested);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].lineNumber).toBe(11);
    });

    it('should report correct line number in warnings', () => {
      const template = `# Header
Content
More content
\`\`\`vaultpal
journal 
\`\`\`
`;

      const result = parseTemplate(template);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].line).toBe(3);
    });

    it('should report correct line number for unclosed block warning', () => {
      const template = `# Header
Content
\`\`\`vaultpal
journal Test
`;

      const result = parseTemplate(template);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].line).toBe(2);
    });
  });

  describe('index assignment', () => {
    it('should assign sequential indices starting from 0', () => {
      const result = parseTemplate(validTemplates.multipleQuestions);

      expect(result.questions[0].index).toBe(0);
      expect(result.questions[1].index).toBe(1);
      expect(result.questions[2].index).toBe(2);
    });

    it('should maintain correct indices when some blocks are invalid', () => {
      const template = `\`\`\`vaultpal
journal Valid 1
\`\`\`

\`\`\`vaultpal
journal 
\`\`\`

\`\`\`vaultpal
journal Valid 2
\`\`\`
`;

      const result = parseTemplate(template);

      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].index).toBe(0);
      expect(result.questions[1].index).toBe(1);
    });
  });

  describe('real-world templates', () => {
    it('should parse daily note template', () => {
      const result = parseTemplate(realWorldTemplates.dailyNote);

      expect(result.questions).toHaveLength(4);
      expect(result.questions[0].prompt).toBe('What are your top 3 priorities today?');
      expect(result.questions[1].prompt).toBe('What went well today?');
      expect(result.questions[2].prompt).toBe('What could be improved?');
      expect(result.questions[3].prompt).toBe('What are you grateful for?');
      expect(result.warnings).toHaveLength(0);
    });

    it('should parse weekly review template', () => {
      const result = parseTemplate(realWorldTemplates.weeklyReview);

      expect(result.questions).toHaveLength(4);
      expect(result.questions[0].prompt).toBe('What were your biggest wins this week?');
      expect(result.questions[1].prompt).toBe('What challenges did you face?');
      expect(result.questions[2].prompt).toBe('What did you learn?');
      expect(result.questions[3].prompt).toBe('What are your goals for next week?');
      expect(result.warnings).toHaveLength(0);
    });

    it('should parse mood tracker template', () => {
      const result = parseTemplate(realWorldTemplates.moodTracker);

      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].prompt).toBe('How are you feeling today? (1-10)');
      expect(result.questions[1].prompt).toBe('What influenced your mood?');
      expect(result.questions[2].prompt).toBe('What would make tomorrow better?');
      expect(result.warnings).toHaveLength(0);
    });

    it('should parse journal with mixed content', () => {
      const result = parseTemplate(realWorldTemplates.journalWithMixedContent);

      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].prompt).toBe('How did you sleep last night?');
      expect(result.questions[1].prompt).toBe('What was the highlight of your day?');
      expect(result.questions[2].prompt).toBe('What are you looking forward to tomorrow?');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('performance', () => {
    it('should parse small template quickly', () => {
      const start = performance.now();
      const result = parseTemplate(performanceTemplates.small);
      const duration = performance.now() - start;

      expect(result.questions).toHaveLength(1);
      expect(duration).toBeLessThan(5);
    });

    it('should parse medium template quickly', () => {
      const start = performance.now();
      const result = parseTemplate(performanceTemplates.medium);
      const duration = performance.now() - start;

      expect(result.questions).toHaveLength(10);
      expect(duration).toBeLessThan(10);
    });

    it('should parse large template in reasonable time', () => {
      const start = performance.now();
      const result = parseTemplate(performanceTemplates.large);
      const duration = performance.now() - start;

      expect(result.questions).toHaveLength(100);
      expect(duration).toBeLessThan(50);
    });

    it('should handle many small blocks efficiently', () => {
      const start = performance.now();
      const result = parseTemplate(performanceTemplates.manySmallBlocks);
      const duration = performance.now() - start;

      expect(result.questions).toHaveLength(50);
      expect(duration).toBeLessThan(25);
    });

    it('should handle long markdown with few questions efficiently', () => {
      const start = performance.now();
      const result = parseTemplate(performanceTemplates.longMarkdownWithFewQuestions);
      const duration = performance.now() - start;

      expect(result.questions).toHaveLength(2);
      expect(duration).toBeLessThan(20);
    });
  });

  describe('return value structure', () => {
    it('should return object with questions and warnings arrays', () => {
      const result = parseTemplate(validTemplates.singleQuestion);

      expect(result).toHaveProperty('questions');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.questions)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should return question objects with correct structure', () => {
      const result = parseTemplate(validTemplates.singleQuestion);

      expect(result.questions[0]).toHaveProperty('prompt');
      expect(result.questions[0]).toHaveProperty('lineNumber');
      expect(result.questions[0]).toHaveProperty('index');
      expect(typeof result.questions[0].prompt).toBe('string');
      expect(typeof result.questions[0].lineNumber).toBe('number');
      expect(typeof result.questions[0].index).toBe('number');
    });

    it('should return warning objects with correct structure', () => {
      const result = parseTemplate(invalidTemplates.emptyPrompt.template);

      expect(result.warnings[0]).toHaveProperty('line');
      expect(result.warnings[0]).toHaveProperty('message');
      expect(typeof result.warnings[0].line).toBe('number');
      expect(typeof result.warnings[0].message).toBe('string');
    });
  });

  describe('parsing consistency', () => {
    it('should return same result for identical input', () => {
      const template = validTemplates.multipleQuestions;
      const result1 = parseTemplate(template);
      const result2 = parseTemplate(template);

      expect(result1).toEqual(result2);
    });

    it('should be pure function (no side effects)', () => {
      const template = validTemplates.singleQuestion;
      const originalTemplate = template;

      parseTemplate(template);

      expect(template).toBe(originalTemplate);
    });

    it('should handle repeated parsing', () => {
      const template = validTemplates.singleQuestion;

      for (let i = 0; i < 10; i++) {
        const result = parseTemplate(template);
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].prompt).toBe('What went well today?');
      }
    });
  });
});
