# Test Suite Documentation

This directory contains comprehensive tests for the Cheers plugin, focusing on the Pet View Foundation (Issue #4).

## Directory Structure

```
tests/
├── README.md                       # This file
├── setup.ts                        # Global test setup and configuration
├── fixtures/                       # Test data and fixtures
│   └── petStates.ts               # Pet state constants and helpers
├── helpers/                        # Test utility functions
│   └── testHelpers.ts             # Common test helpers and assertions
├── mocks/                          # Mock implementations
│   ├── obsidian.ts                # Obsidian API mocks
│   └── Pet.svelte.ts              # Svelte component mock
├── unit/                           # Unit tests
│   ├── PetStateMachine.test.ts    # State machine tests (43 tests)
│   └── PetView.test.ts            # View lifecycle tests (43 tests)
└── integration/                    # Integration tests
    └── PetDisplay.test.ts         # End-to-end tests (34 tests)
```

## Test Files

### Unit Tests

#### `tests/unit/PetStateMachine.test.ts`
Tests the core state machine logic that manages pet states and transitions.

**Coverage:**
- ✅ Initialization and default state
- ✅ State transitions between all 7 states
- ✅ Automatic return to idle for temporary states
- ✅ Timer management and cleanup
- ✅ Event listener registration and notification
- ✅ Edge cases (rapid transitions, duplicate listeners, etc.)

**Key Test Groups:**
- `initialization` - Initial state and listener setup
- `state transitions` - Valid state changes
- `automatic return to idle` - Timer-based transitions
- `event listeners` - Listener callbacks and errors
- `cleanup` - Resource cleanup and timer cancellation
- `reset` - Reset functionality
- `edge cases` - Boundary conditions
- `state configuration verification` - Duration validation

#### `tests/unit/PetView.test.ts`
Tests the Obsidian ItemView implementation that displays the pet.

**Coverage:**
- ✅ View metadata (type, display text, icon)
- ✅ onOpen lifecycle and initialization
- ✅ onClose lifecycle and cleanup
- ✅ Svelte component integration
- ✅ State machine coordination
- ✅ Error handling
- ✅ DOM structure management

**Key Test Groups:**
- `view metadata` - View properties
- `onOpen lifecycle` - Initialization flow
- `onClose lifecycle` - Cleanup flow
- `state machine integration` - State change handling
- `state synchronization` - DOM/state consistency
- `edge cases` - Error scenarios
- `external access methods` - Public API
- `container structure` - DOM hierarchy

### Integration Tests

#### `tests/integration/PetDisplay.test.ts`
Tests the complete system working together: PetView + PetStateMachine + Svelte component.

**Coverage:**
- ✅ Complete initialization sequence
- ✅ Visual state updates (DOM, ARIA, text)
- ✅ Animation timing and durations
- ✅ Complex user interaction flows
- ✅ Multiple open/close cycles
- ✅ Accessibility compliance
- ✅ Error recovery
- ✅ Memory leak prevention

**Key Test Groups:**
- `complete initialization flow` - Full startup
- `state change visual updates` - Visual feedback
- `animation sequences` - Timing validation
- `complex interaction sequences` - Real user flows
- `rapid state transitions` - Stress testing
- `complete lifecycle scenarios` - Full sessions
- `synchronization verification` - Consistency checks
- `accessibility verification` - ARIA compliance
- `error recovery` - Graceful degradation
- `memory and performance` - Resource management

## Mocks and Fixtures

### `tests/mocks/obsidian.ts`
Provides mock implementations of Obsidian API classes:
- `App` - Application instance
- `Vault` - File system access
- `DataAdapter` - Resource path resolution
- `WorkspaceLeaf` - View container
- `ItemView` - Base view class with DOM methods

### `tests/mocks/Pet.svelte.ts`
Mock implementation of the Pet Svelte component that simulates:
- Component rendering and DOM structure
- State-dependent display
- Reactive updates via `$set`
- Cleanup via `$destroy`

### `tests/fixtures/petStates.ts`
Test data and helper functions:
- `ALL_PET_STATES` - Array of all valid states
- `TEMPORARY_STATES` - States that auto-return to idle
- `PERMANENT_STATES` - States that don't auto-return
- `STATE_DURATIONS` - Duration mapping for each state
- `STATE_TEXT_MAP` - Expected text for each state
- Helper functions for creating mock events and sequences

### `tests/helpers/testHelpers.ts`
Utility functions for testing:
- Timer manipulation (`advanceTime`, `advanceAllTimers`)
- Console spying (`spyOnConsole`, `restoreConsoleSpy`)
- DOM assertions (`assertElementExists`, `assertTextContent`)
- State synchronization validation (`assertStateSynchronization`)
- Mock creation helpers

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Running Specific Tests

```bash
# Run only unit tests
npm test tests/unit

# Run only integration tests
npm test tests/integration

# Run specific test file
npm test tests/unit/PetStateMachine.test.ts

# Run tests matching a pattern
npm test -- --grep "state transitions"
```

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run tests with stack traces
npm test -- --reporter=verbose --no-coverage

# Run a single test file in watch mode
npm run test:watch tests/unit/PetStateMachine.test.ts
```

## Writing New Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Feature Name', () => {
  let instance: YourClass;

  beforeEach(() => {
    // Setup before each test
    vi.useFakeTimers();
    instance = new YourClass();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = instance.method(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, behavior-focused test names
   ```typescript
   ✅ it('should transition to greeting state when user opens vault')
   ❌ it('test greeting')
   ```

2. **Arrange-Act-Assert Pattern**: Structure tests clearly
   ```typescript
   it('should notify listeners on state change', () => {
     // Arrange - Set up test data
     const listener = vi.fn();
     stateMachine.addListener(listener);

     // Act - Perform the action
     stateMachine.transition('greeting');

     // Assert - Verify the outcome
     expect(listener).toHaveBeenCalledTimes(1);
   });
   ```

3. **Test Behavior, Not Implementation**: Focus on what, not how
   ```typescript
   ✅ expect(stateMachine.getCurrentState()).toBe('idle')
   ❌ expect(stateMachine.currentState).toBe('idle') // accessing private field
   ```

4. **Use Fake Timers**: For time-dependent tests
   ```typescript
   beforeEach(() => {
     vi.useFakeTimers();
   });

   it('should auto-return to idle after 2 seconds', () => {
     stateMachine.transition('greeting');
     vi.advanceTimersByTime(2000);
     expect(stateMachine.getCurrentState()).toBe('idle');
   });
   ```

5. **Clean Up After Tests**: Always clean up resources
   ```typescript
   afterEach(() => {
     vi.restoreAllMocks();
     vi.clearAllTimers();
     // Clean up any test instances
   });
   ```

## Test Configuration

### `vitest.config.ts`
Main configuration file:
- Environment: jsdom (browser simulation)
- Coverage provider: v8
- Setup file: `tests/setup.ts`
- Aliases: Maps Obsidian and Svelte to mocks

### `tests/setup.ts`
Global test setup:
- Ensures window object exists
- Configures afterEach cleanup
- Global test utilities

## Coverage Goals

- **Statements**: 100% ✅
- **Branches**: >80% ✅ (currently 84.61%)
- **Functions**: 100% ✅
- **Lines**: 100% ✅

## Continuous Integration

These tests are designed to run in CI environments. They:
- ✅ Execute quickly (~2.7s total)
- ✅ Have no external dependencies
- ✅ Are deterministic (no flaky tests)
- ✅ Clean up all resources
- ✅ Provide clear failure messages

## Troubleshooting

### Tests Timing Out
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

### Memory Issues
```bash
# Run tests sequentially
npm test -- --no-threads
```

### Coverage Not Generated
```bash
# Ensure coverage provider is installed
npm install --save-dev @vitest/coverage-v8
```

### Mock Not Working
- Check alias configuration in `vitest.config.ts`
- Verify mock file path matches source file structure
- Ensure mock is TypeScript-compatible

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test Coverage Reports](../coverage/index.html) (generated after running `npm run test:coverage`)
