/**
 * Test fixtures for pet states
 * Provides reusable test data and helper functions
 */

import type { PetState, StateChangeEvent } from '../../src/types/pet';

/**
 * All valid pet states
 */
export const ALL_PET_STATES: PetState[] = [
  'idle',
  'greeting',
  'talking',
  'listening',
  'small-celebration',
  'big-celebration',
  'petting',
];

/**
 * States that auto-return to idle
 */
export const TEMPORARY_STATES: PetState[] = [
  'greeting',
  'small-celebration',
  'big-celebration',
  'petting',
];

/**
 * States that do not auto-return to idle
 */
export const PERMANENT_STATES: PetState[] = ['idle', 'talking', 'listening'];

/**
 * State durations in milliseconds
 */
export const STATE_DURATIONS: Record<PetState, number> = {
  idle: 0,
  greeting: 2000,
  talking: 0,
  listening: 0,
  'small-celebration': 3000,
  'big-celebration': 5000,
  petting: 2000,
};

/**
 * Expected state text for each state
 */
export const STATE_TEXT_MAP: Record<PetState, string> = {
  idle: 'Just hanging out...',
  greeting: 'Hello there!',
  talking: 'How was your day?',
  listening: "I'm listening...",
  'small-celebration': 'Great job!',
  'big-celebration': 'Amazing! You did it!',
  petting: 'That feels nice!',
};

/**
 * Create a mock state change event
 */
export function createMockStateChangeEvent(
  previousState: PetState,
  newState: PetState,
  timestamp?: number
): StateChangeEvent {
  return {
    previousState,
    newState,
    timestamp: timestamp ?? Date.now(),
  };
}

/**
 * Check if a state should auto-return to idle
 */
export function shouldAutoReturnToIdle(state: PetState): boolean {
  return TEMPORARY_STATES.includes(state);
}

/**
 * Get the duration for a specific state
 */
export function getStateDuration(state: PetState): number {
  return STATE_DURATIONS[state];
}

/**
 * Get expected text for a state
 */
export function getExpectedStateText(state: PetState): string {
  return STATE_TEXT_MAP[state];
}

/**
 * Generate a sequence of state transitions for testing
 */
export function generateStateSequence(length: number): PetState[] {
  const sequence: PetState[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(ALL_PET_STATES[i % ALL_PET_STATES.length]);
  }
  return sequence;
}

/**
 * Create a realistic user interaction sequence
 */
export function createUserInteractionSequence(): {
  state: PetState;
  duration: number;
  description: string;
}[] {
  return [
    { state: 'greeting', duration: 2000, description: 'Pet greets user' },
    { state: 'talking', duration: 0, description: 'Pet asks a question' },
    { state: 'listening', duration: 0, description: 'User types response' },
    { state: 'idle', duration: 0, description: 'Return to idle' },
    {
      state: 'small-celebration',
      duration: 3000,
      description: 'User completes task',
    },
    { state: 'petting', duration: 2000, description: 'User pets companion' },
  ];
}
