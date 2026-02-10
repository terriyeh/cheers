/**
 * Test fixtures for pet states
 * Provides reusable test data and helper functions
 */

import type { PetState, StateChangeEvent } from '../../src/types/pet';

/**
 * All valid pet states
 */
export const ALL_PET_STATES: PetState[] = [
  'walking',
  'running',
  'greeting',
  'celebration',
  'petting',
  'sleeping',
];

/**
 * States that auto-return to walking
 */
export const TEMPORARY_STATES: PetState[] = [
  'greeting',
  'celebration',
  'petting',
  'sleeping',
];

/**
 * States that do not auto-return to walking
 */
export const PERMANENT_STATES: PetState[] = ['walking', 'running'];

/**
 * State durations in milliseconds
 * Note: walking and running durations are calculated based on speed settings
 */
export const STATE_DURATIONS: Record<PetState, number> = {
  walking: 1400, // Default for speed=60 (2 - 60/60 = 1.4s)
  running: 400, // Default for speed=100 (1 - (100-60)/40 * 0.6 = 0.4s)
  greeting: 2000,
  celebration: 3000,
  petting: 2000, // Reduced from 5s - less awkward pause
  sleeping: 2000,
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
 * Check if a state should auto-return to walking
 */
export function shouldAutoReturnToWalking(state: PetState): boolean {
  return TEMPORARY_STATES.includes(state);
}

/**
 * Get the duration for a specific state
 */
export function getStateDuration(state: PetState): number {
  return STATE_DURATIONS[state];
}

/**
 * Calculate walking state duration based on speed (0-60)
 * Formula: duration = 2 - (speed / 60)
 */
export function calculateWalkingDuration(speed: number): number {
  const clampedSpeed = Math.max(0, Math.min(60, speed));
  return 2 - (clampedSpeed / 60);
}

/**
 * Calculate running state duration based on speed (61-100)
 * Formula: duration = 1 - ((speed - 60) / 40) * 0.6
 */
export function calculateRunningDuration(speed: number): number {
  const clampedSpeed = Math.max(61, Math.min(100, speed));
  return 1 - ((clampedSpeed - 60) / 40) * 0.6;
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
    { state: 'walking', duration: 1400, description: 'Return to walking' },
    {
      state: 'celebration',
      duration: 3000,
      description: 'User completes task',
    },
    { state: 'petting', duration: 2000, description: 'User pets companion' },
    { state: 'sleeping', duration: 2000, description: 'Pet goes to sleep' },
  ];
}
