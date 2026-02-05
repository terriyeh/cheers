# GitHub Actions Workflows

## Claude Code Review

Automated code review using Claude AI that runs on every pull request.

### How It Works

1. **Triggers**: Automatically runs when:
   - A PR is opened, reopened, or updated
   - Someone comments with `@claude` on the PR
2. **Review Process**: Runs three parallel reviews using Claude API:
   - **Code Quality**: Code smells, error handling, maintainability
   - **Security**: Vulnerabilities, secrets, input validation
   - **Testing**: Coverage, test quality, edge cases
3. **Results**: Posts a comprehensive review comment on the PR
4. **Gating**: Fails the workflow if CRITICAL issues are found

### Manual Triggering

You can manually trigger a review at any time by commenting on the PR:

```
@claude
```

or

```
@claude please review
```

The workflow will:
- React with 👀 to acknowledge your comment
- Run a fresh review
- Update or create a new review comment

### Setup

The workflow requires the `CLAUDE_CODE_OAUTH_TOKEN` secret to be configured in your GitHub repository:

1. Go to your repository **Settings** → **Secrets and variables** → **Actions**
2. Verify `CLAUDE_CODE_OAUTH_TOKEN` is set with your Claude API key
3. The workflow will automatically use this token for API calls

### Review Output

The workflow posts a comment on your PR with:

```markdown
## 🤖 Claude Code Review

### ⚠️ Issues Found
- Critical: 0
- High: 2

---

## ✓ Code Quality Review
[Detailed feedback...]

---

## ✓ Security Review
[Detailed feedback...]

---

## ✓ Testing Review
[Detailed feedback...]
```

### Issue Priorities

- **CRITICAL**: Must be fixed before merge (blocks workflow)
- **HIGH**: Should be fixed before merge
- **MEDIUM**: Consider fixing
- **LOW**: Optional improvements

### Customization

To modify the review criteria, edit:
- `.github/scripts/claude-review.js` - Review prompts and logic
- `.github/workflows/claude-review.yml` - Workflow configuration

### Model Used

Currently uses `claude-sonnet-4-20250514` for optimal balance of:
- Speed: Fast review turnaround
- Quality: Comprehensive analysis
- Cost: Efficient token usage

To use a different model, update the `model` field in `claude-review.js:22`.

### Troubleshooting

**Workflow fails with authentication error:**
- Verify `CLAUDE_OAUTH_TOKEN` is correctly set in repository secrets
- Check the token has not expired

**Review is incomplete:**
- Check if the diff is too large (>15KB is truncated)
- Review the workflow logs for API errors

**False positives:**
- Reviews are AI-generated and may need human judgment
- Use review comments to discuss findings with the team
