# Issue #13 Test Scenarios Quick Reference

## Test Scenario Matrix

### Unit Tests: PetView.openDailyNote()

| # | Scenario | Expected Behavior | Error? |
|---|----------|-------------------|--------|
| 1 | Note doesn't exist | Create new note, open in workspace | No |
| 2 | Note already exists | Open existing note | No |
| 3 | Daily Notes plugin disabled | Show error notice, abort operation | Yes |
| 4 | Note creation throws error | Show error notice, log error | Yes |
| 5 | Template not found | Create note without template | No |
| 6 | Multiple rapid calls | Handle gracefully, no crash | No |
| 7 | Workspace.getLeaf returns null | Handle gracefully, no crash | No |
| 8 | Unknown error type | Show generic error message | Yes |

### Integration Tests: Command and Button

| # | Scenario | Expected Behavior | Error? |
|---|----------|-------------------|--------|
| 9 | Command registered | Command appears in Command Palette | No |
| 10 | Command executed | Opens/creates daily note | No |
| 11 | Pet View open | Command calls PetView.openDailyNote() | No |
| 12 | Pet View closed | Command uses fallback behavior | No |
| 13 | Button added to view | Button appears in view header | No |
| 14 | Button clicked | Calls openDailyNote() method | No |
| 15 | Command + Button consistency | Both show same errors | Yes/No |
| 16 | Plugin disabled | Both show same error message | Yes |

## Error Messages to Test

### Daily Notes Plugin Not Enabled
```
"Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins."
```

### Note Creation Failed
```
"Failed to create daily note: [error message]"
```

## Mock Configurations

### Success Path Mock Setup
```typescript
vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
vi.mocked(getAllDailyNotes).mockReturnValue({});
vi.mocked(getDailyNote).mockReturnValue(null);
vi.mocked(createDailyNote).mockResolvedValue(mockTFile);
```

### Error Path Mock Setup (Plugin Disabled)
```typescript
vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);
```

### Error Path Mock Setup (Creation Fails)
```typescript
vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
vi.mocked(getAllDailyNotes).mockReturnValue({});
vi.mocked(getDailyNote).mockReturnValue(null);
vi.mocked(createDailyNote).mockRejectedValue(new Error('Disk full'));
```

### Existing Note Mock Setup
```typescript
vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
vi.mocked(getAllDailyNotes).mockReturnValue({ '2026-02-06': existingNote });
vi.mocked(getDailyNote).mockReturnValue(existingNote);
```

## Test Assertions Checklist

### For Success Scenarios
- [ ] Method executes without throwing
- [ ] Correct library functions called
- [ ] File opened in workspace
- [ ] No error notices shown
- [ ] No console errors logged

### For Error Scenarios
- [ ] Error notice shown with correct message
- [ ] Error logged to console
- [ ] No file operations attempted
- [ ] Graceful degradation (no crash)
- [ ] User receives actionable feedback

### For Command Tests
- [ ] Command registered with correct ID
- [ ] Command name is user-friendly
- [ ] Command callback is function
- [ ] Command persists after view close
- [ ] Command works with/without view

### For Button Tests
- [ ] Button added via addAction
- [ ] Icon is 'calendar-plus'
- [ ] Tooltip matches command name
- [ ] Click triggers openDailyNote
- [ ] Button appears after onOpen

## Implementation Checklist

### Step 1: Add Method to PetView
- [ ] Import dependencies from obsidian-daily-notes-interface
- [ ] Import Notice from obsidian
- [ ] Add public async openDailyNote() method
- [ ] Check if plugin is loaded
- [ ] Get all daily notes
- [ ] Check if today's note exists
- [ ] Create note if needed
- [ ] Open in workspace
- [ ] Handle errors with try-catch

### Step 2: Add Command to Plugin
- [ ] Add command in main.ts onload()
- [ ] Use ID 'open-daily-note'
- [ ] Use name "Open Today's Daily Note"
- [ ] Get active PetView
- [ ] Call PetView.openDailyNote() if exists
- [ ] Implement fallback if no view

### Step 3: Add Button to View
- [ ] Call addAction in PetView.onOpen()
- [ ] Use icon 'calendar-plus'
- [ ] Use tooltip "Open Today's Daily Note"
- [ ] Call openDailyNote() on click

### Step 4: Run Tests
- [ ] Run unit tests - all 27 should pass
- [ ] Run integration tests - all 29 should pass
- [ ] Run full test suite
- [ ] Check test coverage

## Quick Test Commands

```bash
# Run all tests for Issue #13
npm test -- tests/unit/PetViewDailyNote.test.ts tests/integration/DailyNoteCommand.test.ts

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- -t "should create new daily note"
```

## Expected Test Results (After Implementation)

### Before Implementation (RED)
```
Unit Tests:     27 failed, 0 passed
Integration:    29 failed, 0 passed
Total:          56 failed, 0 passed
Status:         ❌ RED PHASE
```

### After Implementation (GREEN)
```
Unit Tests:     0 failed, 27 passed
Integration:    0 failed, 29 passed
Total:          0 failed, 56 passed
Status:         ✅ GREEN PHASE
```

## Key Implementation Details

### Method Signature
```typescript
public async openDailyNote(): Promise<void>
```

### Dependencies to Import
```typescript
import {
  appHasDailyNotesPluginLoaded,
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
} from 'obsidian-daily-notes-interface';
import { Notice } from 'obsidian';
```

### Button Registration
```typescript
this.addAction('calendar-plus', 'Open Today\'s Daily Note', () => {
  this.openDailyNote();
});
```

### Command Registration
```typescript
this.addCommand({
  id: 'open-daily-note',
  name: 'Open Today\'s Daily Note',
  callback: () => {
    const petView = this.getActivePetView();
    if (petView) {
      petView.openDailyNote();
    } else {
      this.openDailyNoteDirectly();
    }
  },
});
```

## Test Coverage Goals

- **Unit Test Coverage:** 100% of openDailyNote() method
- **Integration Coverage:** All user interaction paths
- **Error Coverage:** All error scenarios
- **Edge Case Coverage:** Race conditions, null values, missing data

## Notes

- Tests use Vitest with jsdom environment
- Mocks configured in vitest.config.ts
- All async operations properly awaited
- Timers not needed for these tests (no state transitions)
- Tests are deterministic and repeatable
