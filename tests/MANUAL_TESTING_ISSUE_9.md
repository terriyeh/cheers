# Manual Testing Guide - Issue #9: Template Parser Integration

## Syntax Research & Design Decision

Based on research of popular Obsidian plugins:

**Dataview** uses SQL-like keywords (no colons):
```dataview
TABLE time-played, rating FROM "games" WHERE rating > 7
```

**Tasks** uses natural language (no colons):
```tasks
not done
due before tomorrow
group by filename
```

**VaultPal Syntax:** Type-based keywords following Tasks pattern:
```vaultpal
journal What are you grateful for today?
```

### Future Question Types
The syntax is designed to support multiple question types:
- `journal` - Freeform text journaling (current implementation)
- `habit` - Yes/no tracking, checkbox, streaks (planned)
- `task` - Task completion tracking (planned)

This type-based approach is:
- ✅ Self-documenting (clear what type of response is expected)
- ✅ Consistent (all nouns)
- ✅ Future-proof (easy to add `mood`, `metric`, `rating`, etc.)
- ✅ Clean (no colons, space-separated like Tasks plugin)

---

## What Was Implemented

### Core Functionality
1. **Template Parser** (`src/template/parser.ts`)
   - Parses daily note templates for `vaultpal` code blocks
   - Extracts `journal` fields from blocks
   - Validates journal content (1-1000 characters, no emojis)
   - Returns questions with line positions

2. **Caching System** (`src/template/cache.ts`)
   - Caches parse results using file modification time (mtime)
   - 100x performance improvement for unchanged files
   - Automatic invalidation when template changes

3. **Inline Validator** (`src/template/validator.ts`)
   - Code block processor for live validation in notes
   - Shows errors directly in code blocks (DataView pattern)
   - Preview display for valid prompts

4. **Main Plugin Integration** (`src/main.ts`)
   - Registered `vaultpal` code block processor
   - Active in all notes with vaultpal blocks

5. **CSS Styles** (`styles.css`)
   - Error display styling (red border, error message)
   - Preview display styling (accent border, question text)
   - Theme-compatible colors

## Prerequisites for Manual Testing

1. **Obsidian Running**: Open your test vault
2. **Plugin Installed**: Vault Pal plugin enabled
3. **Daily Notes Plugin**: Enable Core Plugin "Daily Notes"
4. **Template File**: Create a daily note template

## Test Scenarios

### Scenario 1: Valid VaultPal Block in Template

**Setup:**
1. Go to Settings → Daily Notes → Template file location
2. Create/edit your daily note template file (e.g., `Templates/Daily Note.md`)
3. Add this content:

```markdown
# Daily Note for {{date}}

## Morning Reflection

```vaultpal
journal What are you grateful for today?
```

## Evening Review

```vaultpal
journal What went well today?
```
```

**Expected Result:**
- In READING mode: Code blocks should show a blue preview box displaying just the question text
- In EDITING mode: Code blocks should render with syntax highlighting

**How to Verify:**
1. Open the template file
2. Toggle between Reading and Editing modes
3. In Reading mode, you should see:
   - Full-width blue-bordered preview box
   - Just the question text (no checkmark or "Valid Question" label)
   - Example: "What are you grateful for today?"

---

### Scenario 2: Invalid VaultPal Block - Missing Prompt

**Setup:**
Add this to your template:

```markdown
```vaultpal
question: What did you learn today?
```
```

**Expected Result:**
- Full-width red error box with:
  - Message: "⚠️ VaultPal: Invalid Syntax. Missing "journal" field."
  - Hint: "Example: journal What are you grateful for today?"

---

### Scenario 3: Invalid VaultPal Block - Empty Prompt

**Setup:**
Add this to your template:

```markdown
```vaultpal
journal
```
```

**Expected Result:**
- Full-width red error box with:
  - Message: "⚠️ VaultPal: Invalid Syntax. Prompt is empty."
  - Hint: "Add your question after "journal" (1-1000 characters)"

---

### Scenario 4: Invalid VaultPal Block - Emoji in Prompt

**Setup:**
Add this to your template:

```markdown
```vaultpal
journal What made you smile today? 😊
```
```

**Expected Result:**
- Full-width red error box with:
  - Message: "⚠️ VaultPal: Invalid Syntax. Prompt contains emoji characters."
  - Hint: "Remove emojis from your question"

---

### Scenario 5: Invalid VaultPal Block - Multiple Prompts

**Setup:**
Add this to your template:

```markdown
```vaultpal
journal What's your main goal today?
journal What are you working on?
```
```

**Expected Result:**
- Red error box with message: "Multiple 'journal' fields found"
- Hint: "Use only one prompt per block, or create separate blocks"

---

### Scenario 6: Invalid VaultPal Block - Nested Blocks

**Setup:**
Add this to your template:

```markdown
```vaultpal
journal What are you focusing on?
```vaultpal
journal Nested block
```
```
```

**Expected Result:**
- Red error box with message: "Found nested vaultpal code block"
- Hint: "Close the previous block before starting a new one"

---

### Scenario 7: Valid Block in Regular Note

**Setup:**
1. Create a NEW note (not the template)
2. Add this content:

```markdown
# Testing VaultPal

```vaultpal
journal How do you feel right now?
```
```

**Expected Result:**
- In Reading mode: Blue preview box showing the question
- Same validation behavior as in template

---

### Scenario 8: Multiple Valid Blocks

**Setup:**
Add 3-4 valid vaultpal blocks to a note:

```markdown
```vaultpal
journal Question 1?
```

```vaultpal
journal Question 2?
```

```vaultpal
journal Question 3?
```
```

**Expected Result:**
- All blocks show blue previews in Reading mode
- No errors
- Each preview shows its respective question

---

## Performance Testing

### Scenario 9: Large Template File

**Setup:**
1. Create a template with 50+ vaultpal blocks
2. Open the file in Reading mode
3. Switch to Editing mode
4. Switch back to Reading mode

**Expected Result:**
- First load: Parsing takes < 100ms
- Subsequent loads: Near-instant (cached)
- No lag or stuttering
- All blocks validate correctly

---

## Edge Cases

### Scenario 10: Long Prompt (1000 characters)

**Setup:**
Create a block with exactly 1000 characters in the journal

```markdown
```vaultpal
journal [Paste 1000 characters of text here]
```
```

**Expected Result:**
- Valid (full-width blue preview)
- All text visible in preview

### Scenario 11: Long Prompt (1001 characters)

**Setup:**
Create a block with 1001 characters in the journal

**Expected Result:**
- Full-width red error box with:
  - Message: "⚠️ VaultPal: Invalid Syntax. Prompt is too long (1001 characters, max 1000)."
  - Hint: "Shorten your question to 1000 characters or less"

---

## CSS Visual Testing

### Scenario 12: Theme Compatibility

**Test in multiple themes:**
1. **Light theme**: Default Obsidian light
2. **Dark theme**: Default Obsidian dark
3. **Community theme**: Try Minimal, California Coast, or your preferred theme

**Expected Result:**
- Error boxes extend full width of the document
- Error boxes use theme's background-secondary and text-error colors (4px left border)
- Preview boxes extend full width of the document
- Preview boxes use theme's background-secondary and interactive-accent colors (4px left border)
- All text readable in all themes
- No white/black backgrounds that clash with theme

---

## Integration Testing

### Scenario 13: With Other Plugins

**Test with common plugins:**
- Calendar plugin
- Dataview plugin
- Templater plugin

**Expected Result:**
- No conflicts
- VaultPal blocks render correctly
- Other plugins' code blocks unaffected

---

## Verification Checklist

After completing all scenarios:

- [ ] Valid blocks show full-width blue preview in Reading mode
- [ ] Valid blocks show just the question text (no checkmark or title)
- [ ] Invalid blocks show full-width red error box
- [ ] Error messages start with "⚠️ VaultPal: Invalid Syntax."
- [ ] Error hints are helpful and actionable
- [ ] Error boxes extend to full document width
- [ ] Preview boxes extend to full document width
- [ ] Performance is fast (no noticeable lag)
- [ ] Works in both template files and regular notes
- [ ] Theme colors are respected (4px left border)
- [ ] No console errors in Developer Tools (Ctrl+Shift+I)
- [ ] Multiple blocks on same page work correctly
- [ ] Editing → Reading mode transition is smooth

---

## Troubleshooting

### If you don't see previews or errors:

1. **Check console** (Ctrl+Shift+I → Console tab)
   - Look for errors related to "vaultpal" or "processVaultPalBlock"

2. **Verify plugin is enabled**
   - Settings → Community Plugins → Vault Pal (should be toggled ON)

3. **Reload Obsidian**
   - Close and reopen Obsidian
   - Or use Ctrl+R to reload

4. **Check code block syntax**
   - Must use triple backticks: ```vaultpal
   - Must close with triple backticks: ```
   - Language must be exactly "vaultpal" (lowercase, no spaces)

### If blocks show as plain text:

- You're in **Editing mode** - switch to **Reading mode** (Ctrl+E or eye icon)
- Code block processors only run in Reading/Preview mode

---

## Known Limitations

1. **Only works in Reading mode** - By design, code block processors don't run in Editing mode
2. **No real-time validation while typing** - Validation happens when switching to Reading mode
3. **Template must use standard format** - `journal Question text?` on a single line

---

## Success Criteria

✅ All 12 test scenarios pass
✅ No console errors
✅ Performance is acceptable (< 100ms for first parse)
✅ Error messages are clear and helpful
✅ Theme compatibility verified
✅ No conflicts with other plugins

---

## Next Steps After Manual Testing

If all tests pass:
1. Commit changes with message: "feat: implement template parser with inline validation (Issue #9)"
2. Update Issue #9 on GitHub with test results
3. Move to Issue #10: Write Responses into Daily Note
