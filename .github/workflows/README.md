# GitHub Actions Workflows

## Overview

This project uses the official [Anthropic Claude Code Action](https://github.com/anthropics/claude-code-action) for automated code reviews and interactive assistance.

## Workflows

### 1. Claude Code Review (`claude-code-review.yml`)

Automated comprehensive code review that runs on every pull request.

**Triggers:**
- Pull request opened
- New commits pushed to PR

**What it does:**
- Automatically reviews all code changes
- Provides feedback on code quality, security, and testing
- Posts review as PR comment
- Updates same comment on subsequent pushes (sticky comment)

**Review Coverage:**
- **Code Quality**: Anti-patterns, error handling, maintainability
- **Security**: Vulnerabilities, secrets, input validation
- **Testing**: Coverage, test quality, edge cases

**No @claude mention needed** - runs automatically!

### 2. Claude Interactive (`claude.yml`)

Interactive Claude assistance triggered by @claude mentions.

**Triggers:**
- `@claude` in PR comments
- `@claude` in issue comments
- `@claude` in PR review comments
- `@claude` in issue titles/descriptions

**What it does:**
- Responds to your questions
- Makes code changes per your request
- Runs allowed commands (`npm run build`, `npm run test`, etc.)
- Has context about the Cheers project

**Examples:**
```
@claude Can you explain how the pet animation system works?
```
```
@claude Please refactor this function to be more maintainable
```
```
@claude Run the tests and fix any failures
```

## Setup

### Prerequisites

1. **CLAUDE_CODE_OAUTH_TOKEN** secret must be configured:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Verify `CLAUDE_CODE_OAUTH_TOKEN` is set with your Claude OAuth token

### Permissions

The workflows require these permissions:
- `contents: read` - Read repository code
- `pull-requests: read` - Read PR information
- `issues: read` - Read issue information
- `id-token: write` - Authenticate with Claude
- `actions: read` - Read CI results (for interactive Claude)

## Customization

### Modify Review Prompt

Edit the `direct_prompt` in `claude-code-review.yml` to focus on specific areas:

```yaml
direct_prompt: |
  Focus on:
  - TypeScript type safety
  - Obsidian API usage
  - Plugin performance
```

### Change Allowed Commands

Edit `allowed_tools` in `claude.yml` to allow/restrict commands:

```yaml
allowed_tools: "Bash(npm install),Bash(npm run build),Bash(npm test)"
```

### Add Custom Instructions

Edit `custom_instructions` in `claude.yml` for project-specific guidance:

```yaml
custom_instructions: |
  - Follow Obsidian plugin best practices
  - Maintain compatibility with Obsidian 1.0.0+
  - Test changes in a real vault
```

### Use Different Model

Uncomment and set the model parameter (defaults to Claude Sonnet 4):

```yaml
model: "claude-opus-4-1-20250805"
```

## Troubleshooting

**Workflow doesn't trigger:**
- Verify `CLAUDE_CODE_OAUTH_TOKEN` is set correctly
- Check workflow permissions in repository settings
- Ensure @claude mentions are spelled correctly (case-sensitive)

**Authentication errors:**
- Regenerate your Claude OAuth token
- Update the GitHub secret with new token

**Review not posting comments:**
- Check workflow logs for errors
- Verify PR has write permissions enabled
- Ensure repository allows GitHub Actions to create PR comments

## Official Documentation

For more details, see:
- [Claude Code Action on GitHub](https://github.com/anthropics/claude-code-action)
- [Anthropic API Documentation](https://docs.anthropic.com/)
