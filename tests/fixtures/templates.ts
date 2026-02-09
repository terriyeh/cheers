/**
 * Test fixtures for template parser tests
 * Provides reusable template examples for various test scenarios
 */

/**
 * Valid template examples
 */
export const validTemplates = {
  singleQuestion: `# Daily Note

\`\`\`vaultpal
journal What went well today?
\`\`\`
`,

  multipleQuestions: `# Daily Reflection

\`\`\`vaultpal
journal What went well today?
\`\`\`

Some notes here...

\`\`\`vaultpal
journal What could be improved?
\`\`\`

More content...

\`\`\`vaultpal
journal What are you grateful for?
\`\`\`
`,

  questionWithMarkdown: `# Daily Note

Some **bold** text and *italic* content.

\`\`\`vaultpal
journal What did you learn today?
\`\`\`

More markdown:
- List item 1
- List item 2
`,

  questionsWithOtherCodeBlocks: `# Daily Note

\`\`\`javascript
console.log('Regular code block');
\`\`\`

\`\`\`vaultpal
journal Your question here
\`\`\`

\`\`\`python
print('Another code block')
\`\`\`

\`\`\`vaultpal
journal Another question
\`\`\`
`,

  questionWithSpecialCharacters: `\`\`\`vaultpal
journal What's your goal for tomorrow?
\`\`\`
`,

  questionWithUnicodeCharacters: `\`\`\`vaultpal
journal Comment s'est passée votre journée?
\`\`\`
`,

  minimalTemplate: `\`\`\`vaultpal
journal Q
\`\`\`
`,

  questionWithExtraWhitespace: `

\`\`\`vaultpal
  journal What went well?
\`\`\`

`,

  questionWithNoSpaceAfterJournal: `\`\`\`vaultpal
journal Question without space
\`\`\`
`,
};

/**
 * Invalid template examples with expected errors
 */
export const invalidTemplates = {
  missingPrompt: {
    template: `\`\`\`vaultpal
something: "else"
\`\`\`
`,
    expectedError: 'Missing "journal"',
  },

  emptyPrompt: {
    template: `\`\`\`vaultpal
journal
\`\`\`
`,
    expectedError: 'Empty question',
  },

  invalidSyntaxSingleQuotes: {
    template: `\`\`\`vaultpal
something else
\`\`\`
`,
    expectedError: 'Missing "journal"',
  },

  invalidSyntaxNoQuotes: {
    template: `\`\`\`vaultpal
other text
\`\`\`
`,
    expectedError: 'Missing "journal"',
  },

  invalidSyntaxMissingClosingQuote: {
    template: `\`\`\`vaultpal
invalid content
\`\`\`
`,
    expectedError: 'Missing "journal"',
  },

  unclosedBlock: {
    template: `\`\`\`vaultpal
journal What went well?
`,
    expectedError: 'Unclosed',
  },

  nestedBlocks: {
    template: `\`\`\`vaultpal
journal First question
\`\`\`vaultpal
journal Nested?
\`\`\`
\`\`\`
`,
    expectedError: 'Nested vaultpal block',
  },

  promptTooLong: {
    template: `\`\`\`vaultpal
journal ${'a'.repeat(1001)}
\`\`\`
`,
    expectedError: 'too long',
  },

  emptyBlock: {
    template: `\`\`\`vaultpal
\`\`\`
`,
    expectedError: 'Missing "journal"',
  },

  onlyWhitespace: {
    template: `\`\`\`vaultpal


\`\`\`
`,
    expectedError: 'Missing "journal"',
  },
};

/**
 * Edge case templates
 */
export const edgeCaseTemplates = {
  crlfLineEndings: "```vaultpal\r\njournal Test CRLF\r\n```",

  mixedLineEndings: "```vaultpal\njournal Mixed\r\n```",

  emptyInput: '',

  whitespaceOnly: '   \n\n   \t\t  \n   ',

  maxSizeTemplate: 'a'.repeat(1_000_000),

  overSizeTemplate: 'a'.repeat(1_000_001),

  exactMaxPromptLength: `\`\`\`vaultpal
journal ${'a'.repeat(1000)}
\`\`\`
`,

  multipleUnclosedBlocks: `\`\`\`vaultpal
journal First

\`\`\`vaultpal
journal Second
`,

  blockWithoutContent: '```vaultpal\n```',

  promptOnMultipleLines: `\`\`\`vaultpal
journal This is
on multiple lines
\`\`\`
`,

  multiplePromptFields: `\`\`\`vaultpal
journal First prompt
journal Second prompt
\`\`\`
`,

  promptWithNewlines: `\`\`\`vaultpal
journal Question with\nnewlines
\`\`\`
`,

  caseVariations: `\`\`\`vaultpal
Prompt: "Capital P"
\`\`\`

\`\`\`vaultpal
PROMPT: "All caps"
\`\`\`

\`\`\`vaultpal
journal Lowercase works
\`\`\`
`,
};

/**
 * Line number test templates
 * These templates are designed to test accurate line number tracking
 */
export const lineNumberTemplates = {
  firstLine: `\`\`\`vaultpal
journal Line 0
\`\`\`
`,

  withPrecedingLines: `# Title
Some content
More content
\`\`\`vaultpal
journal Line 3
\`\`\`
`,

  multipleWithGaps: `# Start

Gap 1

\`\`\`vaultpal
journal Question 1
\`\`\`

Gap 2
Gap 3

\`\`\`vaultpal
journal Question 2
\`\`\`

End
`,

  deeplyNested: `# Level 1
## Level 2
### Level 3
#### Level 4

Some content here
- List item
- Another item

More content

\`\`\`vaultpal
journal Deep question
\`\`\`
`,
};

/**
 * Performance test templates
 */
export const performanceTemplates = {
  small: validTemplates.singleQuestion,

  medium: Array(10).fill(validTemplates.singleQuestion).join('\n\n'),

  large: Array(100).fill(validTemplates.singleQuestion).join('\n\n'),

  manySmallBlocks: Array(50).fill(`\`\`\`vaultpal
journal Q
\`\`\`
`).join('\n'),

  longMarkdownWithFewQuestions: `${Array(100).fill('# Heading\n\nContent paragraph with some text.\n').join('\n')}

\`\`\`vaultpal
journal Question 1
\`\`\`

${Array(100).fill('More content here.\n').join('\n')}

\`\`\`vaultpal
journal Question 2
\`\`\`
`,
};

/**
 * Real-world example templates
 */
export const realWorldTemplates = {
  dailyNote: `# {{date:YYYY-MM-DD}}

## Morning Reflection
\`\`\`vaultpal
journal What are your top 3 priorities today?
\`\`\`

## Tasks
- [ ] Task 1
- [ ] Task 2

## Evening Reflection
\`\`\`vaultpal
journal What went well today?
\`\`\`

\`\`\`vaultpal
journal What could be improved?
\`\`\`

\`\`\`vaultpal
journal What are you grateful for?
\`\`\`

## Notes
`,

  weeklyReview: `# Weekly Review - Week {{date:WW}}

## Wins
\`\`\`vaultpal
journal What were your biggest wins this week?
\`\`\`

## Challenges
\`\`\`vaultpal
journal What challenges did you face?
\`\`\`

## Lessons
\`\`\`vaultpal
journal What did you learn?
\`\`\`

## Next Week
\`\`\`vaultpal
journal What are your goals for next week?
\`\`\`
`,

  moodTracker: `# Mood Tracker - {{date:YYYY-MM-DD}}

\`\`\`vaultpal
journal How are you feeling today? (1-10)
\`\`\`

\`\`\`vaultpal
journal What influenced your mood?
\`\`\`

\`\`\`vaultpal
journal What would make tomorrow better?
\`\`\`
`,

  journalWithMixedContent: `# Journal Entry - {{date:YYYY-MM-DD}}

Weather: Sunny ☀️
Mood: 😊

## Morning
Woke up at 7am. Had breakfast.

\`\`\`vaultpal
journal How did you sleep last night?
\`\`\`

## Afternoon
Worked on project X.

\`\`\`javascript
// Some code I wrote today
function example() {
  return true;
}
\`\`\`

## Evening
\`\`\`vaultpal
journal What was the highlight of your day?
\`\`\`

## Before Bed
\`\`\`vaultpal
journal What are you looking forward to tomorrow?
\`\`\`
`,
};
