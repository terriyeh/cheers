/**
 * Test fixtures for pet states
 * Provides reusable test data and helper functions
 */

import type { PetState, StateChangeEvent } from '../../src/types/pet';
import { calculateMovementDuration as utilCalculateMovementDuration } from '../../src/utils/animation';

/**
 * All valid pet states
 */
export const ALL_PET_STATES: PetState[] = [
  'walking',
  'celebration',
  'petting',
];

/**
 * States that auto-return to walking
 */
export const TEMPORARY_STATES: PetState[] = [
  'celebration',
  'petting',
];

/**
 * States that do not auto-return to walking
 */
export const PERMANENT_STATES: PetState[] = ['walking'];

/**
 * State durations in milliseconds
 * Note: walking duration is 0 (continuous), celebration and petting have fixed durations
 */
export const STATE_DURATIONS: Record<PetState, number> = {
  walking: 0, // Continuous until interrupted
  celebration: 1800, // 1.8 seconds (matches fireworks animation)
  petting: 2000, // 2 seconds
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
 * Calculate horizontal movement duration based on speed (0-100) and container width
 * Now maintains constant speed in px/s regardless of container size
 * Linear scaling: speed 0% = 33s (slowest), speed 100% = 6s (fastest)
 * @param speed - Movement speed (0-100)
 * @param containerWidth - Container width in pixels (defaults to reference width of 800px)
 */
export function calculateMovementDuration(speed: number, containerWidth: number = 800): number {
  // Delegate to centralized utility
  return utilCalculateMovementDuration(speed, containerWidth);
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
    { state: 'walking', duration: 0, description: 'Pet walks continuously' },
    {
      state: 'celebration',
      duration: 1800,
      description: 'User completes task',
    },
    { state: 'walking', duration: 0, description: 'Return to walking' },
    { state: 'petting', duration: 2000, description: 'User pets companion' },
    { state: 'walking', duration: 0, description: 'Return to walking' },
  ];
}
