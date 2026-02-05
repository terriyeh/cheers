#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PR_NUMBER = process.env.PR_NUMBER;
const PR_TITLE = process.env.PR_TITLE;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

/**
 * Call Claude API with streaming support
 */
async function callClaude(prompt, maxTokens = 4096) {
  const data = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API request failed: ${res.statusCode} - ${body}`));
          return;
        }

        try {
          const response = JSON.parse(body);
          const content = response.content?.[0]?.text || '';
          resolve(content);
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Run comprehensive code review
 */
async function runReview() {
  console.log('📋 Reading changes...');

  // Read changed files and diff
  const changedFiles = fs.readFileSync('changed_files.txt', 'utf8').trim();
  const diff = fs.readFileSync('changes.diff', 'utf8');

  if (!changedFiles) {
    console.log('ℹ️  No files changed');
    fs.writeFileSync('review-result.md', 'No files changed in this PR.');
    return;
  }

  console.log(`📝 Reviewing ${changedFiles.split('\n').length} changed files...`);

  // Prepare review prompts for parallel execution
  const reviewPrompts = [
    {
      name: 'Code Quality',
      prompt: `Review the following code changes for code quality issues:

**Changed Files:**
${changedFiles}

**Diff:**
\`\`\`diff
${diff.substring(0, 15000)}
\`\`\`

Analyze for:
1. Code smells and anti-patterns
2. Error handling completeness
3. Naming conventions and clarity
4. Code organization and maintainability
5. Performance concerns

Provide specific, actionable feedback with file:line references. Categorize issues as CRITICAL, HIGH, MEDIUM, or LOW priority.`
    },
    {
      name: 'Security',
      prompt: `Review the following code changes for security vulnerabilities:

**Changed Files:**
${changedFiles}

**Diff:**
\`\`\`diff
${diff.substring(0, 15000)}
\`\`\`

Analyze for:
1. Security vulnerabilities (OWASP Top 10)
2. Exposed secrets or credentials
3. Input validation and sanitization
4. Authentication and authorization issues
5. Dependency vulnerabilities

Provide specific, actionable feedback with file:line references. Categorize issues as CRITICAL, HIGH, MEDIUM, or LOW priority.`
    },
    {
      name: 'Testing',
      prompt: `Review the following code changes for testing quality:

**Changed Files:**
${changedFiles}

**Diff:**
\`\`\`diff
${diff.substring(0, 15000)}
\`\`\`

Analyze for:
1. Test coverage adequacy
2. Test quality and assertions
3. Edge case handling
4. Performance implications
5. Missing test scenarios

Provide specific, actionable feedback with file:line references. Categorize issues as CRITICAL, HIGH, MEDIUM, or LOW priority.`
    }
  ];

  // Run reviews in parallel
  console.log('🔍 Running parallel reviews...');
  const reviews = await Promise.all(
    reviewPrompts.map(async ({ name, prompt }) => {
      try {
        console.log(`  ⏳ ${name} review...`);
        const result = await callClaude(prompt);
        console.log(`  ✓ ${name} review complete`);
        return { name, result, success: true };
      } catch (err) {
        console.error(`  ❌ ${name} review failed:`, err.message);
        return { name, result: `Failed to complete review: ${err.message}`, success: false };
      }
    })
  );

  // Format results
  console.log('📊 Formatting results...');
  let markdown = `### PR #${PR_NUMBER}: ${PR_TITLE}\n\n`;
  markdown += `**Files Changed:** ${changedFiles.split('\n').length}\n\n`;
  markdown += `---\n\n`;

  for (const { name, result, success } of reviews) {
    markdown += `## ${success ? '✓' : '❌'} ${name} Review\n\n`;
    markdown += `${result}\n\n`;
    markdown += `---\n\n`;
  }

  // Count critical issues
  const criticalCount = (markdown.match(/CRITICAL/g) || []).length;
  const highCount = (markdown.match(/HIGH/g) || []).length;

  if (criticalCount > 0 || highCount > 0) {
    markdown = `### ⚠️ Issues Found\n\n` +
      `- **Critical:** ${criticalCount}\n` +
      `- **High:** ${highCount}\n\n` +
      markdown;
  } else {
    markdown = `### ✅ No Critical Issues Found\n\n${markdown}`;
  }

  // Write results
  fs.writeFileSync('review-result.md', markdown);
  console.log('✅ Review complete!');

  if (criticalCount > 0) {
    console.log(`⚠️  Found ${criticalCount} CRITICAL issues`);
  }
}

// Run the review
runReview().catch(err => {
  console.error('❌ Review failed:', err);
  fs.writeFileSync('review-result.md', `## ❌ Review Failed\n\n${err.message}`);
  process.exit(1);
});
