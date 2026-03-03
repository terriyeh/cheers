# Cheers! Code Block Syntax

## Design Decision

Cheers! uses **type-based keywords** for different question types in code blocks. This syntax follows the pattern established by successful Obsidian plugins like Tasks and Dataview.

## Current Syntax (v0.0.1)

### Journal Entries (Freeform Text)
```vaultpal
journal What are you grateful for today?
```

**Features:**
- Space-separated (no colons)
- No quotes needed
- 1-1000 characters
- No emojis allowed
- Self-documenting type

## Planned Future Types

### Habit Tracking
```vaultpal
habit Did you exercise today?
```
- Yes/no responses
- Streak tracking
- Checkbox visualization

### Task Management
```vaultpal
task Review pull requests
```
- Completion tracking
- Due dates
- Priority levels

### Other Potential Types
- `mood` - Mood tracking with scales
- `metric` - Numerical data (weight, sleep hours, etc.)
- `rating` - Star ratings or scales

## Design Rationale

### Why Type-Based Keywords?

1. **Self-Documenting**: The keyword immediately tells you what type of response is expected
   - `journal` → freeform text
   - `habit` → yes/no tracking
   - `task` → completion status

2. **Consistent Pattern**: All keywords are nouns, creating a predictable pattern

3. **Future-Proof**: Easy to add new types without changing the core syntax

4. **Clean Syntax**: Following popular plugin patterns (Tasks, Dataview)
   - No colons needed
   - Space-separated
   - Natural language feel

### Why Not Colons?

Research of popular Obsidian plugins shows:
- **Dataview**: Uses SQL-like keywords without colons (`TABLE`, `FROM`, `WHERE`)
- **Tasks**: Uses natural language without colons (`not done`, `due before`)
- **Codeblock Customizer**: Parameters can use `:` or `=`, but for metadata, not content

Using colons everywhere felt redundant and less natural. The space-separated approach is cleaner and matches established patterns.

### Why "Journal" Instead of "Ask" or "Prompt"?

| Keyword | Pros | Cons |
|---------|------|------|
| `ask` | Natural verb | Inconsistent with noun-based future types (`habit`, `task`) |
| `prompt` | Generic | Too generic, doesn't convey journaling context |
| `question` | Clear | Too verbose |
| `journal` | ✅ Clear purpose<br>✅ Noun consistency<br>✅ Self-documenting<br>✅ Specific to freeform reflection | None - chosen |

## Examples

### Valid Daily Note Template
```markdown
# Daily Note for {{date}}

## Morning Reflection

```vaultpal
journal What are you most excited about today?
```

```vaultpal
journal What's one thing you want to accomplish?
```

## Evening Review

```vaultpal
journal What went well today?
```

```vaultpal
journal What did you learn?
```
```

### Future Multi-Type Template (Planned)
```markdown
# Daily Check-in

```vaultpal
journal How are you feeling right now?
```

```vaultpal
habit Did you exercise today?
```

```vaultpal
habit Did you meditate?
```

```vaultpal
task Review PRs
```

```vaultpal
mood Rate your energy level (1-10)
```
```

## Error Messages

All errors use a consistent format:
```
⚠️ Cheers!: Invalid Syntax. [Specific error].
Example: journal What are you grateful for today?
```

### Common Errors
- **Missing "journal" field**: No journal line found in block
- **Question is empty**: Text after "journal" is blank
- **Question is too long**: Over 1000 characters
- **Question contains emoji**: Emojis not allowed

## Implementation Notes

- Parser: `src/template/parser.ts`
- Validator: `src/template/validator.ts` (inline error display)
- Cache: `src/template/cache.ts` (mtime-based for performance)
- Type definitions: `src/types/template.ts`

---

**Version**: 0.0.1 (Issue #9)
**Last Updated**: 2026-02-06
