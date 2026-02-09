/**
 * Integration tests for Issue #11 Chat UI Preparation
 * Tests pet interactivity, button functionality, and state management workflows
 */

import { vi } from 'vitest';
import { PetView, VIEW_TYPE_PET } from '../../src/views/PetView';
import { WorkspaceLeaf, Notice } from '../mocks/obsidian';

describe('Chat UI Preparation Integration', () => {
  let petView: PetView;
  let leaf: WorkspaceLeaf;
  let mockActionButtons: any[];

  beforeEach(() => {
    vi.useFakeTimers();
    leaf = new WorkspaceLeaf();
    petView = new PetView(leaf);

    // Track button creation
    mockActionButtons = [];
    petView.addAction = vi.fn((icon: string, title: string, callback: () => void) => {
      mockActionButtons.push({ icon, title, callback });
      return document.createElement('div');
    });
  });

  afterEach(async () => {
    await petView.onClose();
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('full petting workflow', () => {
    it('should complete full petting cycle from idle state', async () => {
      await petView.onOpen();

      // Start in idle state
      expect(petView.getCurrentState()).toBe('idle');

      // Pet sprite wrapper is interactive in idle state
      const wrapper = petView.containerEl.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('0');
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');

      // Transition to petting state (simulating user click)
      petView.transitionState('petting', 'idle');
      expect(petView.getCurrentState()).toBe('petting');

      // Heart overlay should appear
      const heartOverlay = petView.containerEl.querySelector('.heart-overlay');
      expect(heartOverlay).toBeTruthy();

      // After 2s, should return to idle
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('idle');

      // Heart overlay should disappear
      const heartOverlayAfter = petView.containerEl.querySelector('.heart-overlay');
      expect(heartOverlayAfter).toBeFalsy();
    });

    it('should complete full petting cycle from greeting state', async () => {
      await petView.onOpen();

      // Transition to greeting state
      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      // Pet sprite wrapper is interactive in greeting state
      const wrapper = petView.containerEl.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('0');
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');

      // Transition to petting state (simulating user click)
      petView.transitionState('petting', 'greeting');
      expect(petView.getCurrentState()).toBe('petting');

      // After 2s, should return to greeting
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('greeting');
    });

    it('should prevent petting during talking state', async () => {
      await petView.onOpen();

      // Transition to talking state (conversation active)
      petView.transitionState('talking');
      expect(petView.getCurrentState()).toBe('talking');

      // Pet sprite wrapper should be non-interactive
      const wrapper = petView.containerEl.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.style.cursor).toBe('not-allowed');

      // Heart overlay should not be present
      const heartOverlay = petView.containerEl.querySelector('.heart-overlay');
      expect(heartOverlay).toBeFalsy();
    });

    it('should prevent petting during listening state', async () => {
      await petView.onOpen();

      // Transition to listening state (conversation active)
      petView.transitionState('listening');
      expect(petView.getCurrentState()).toBe('listening');

      // Pet sprite wrapper should be non-interactive
      const wrapper = petView.containerEl.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.style.cursor).toBe('not-allowed');
    });
  });

  describe('state synchronization during petting', () => {
    it('should maintain state sync throughout petting workflow', async () => {
      await petView.onOpen();

      // Verify initial sync
      expect(petView.getCurrentState()).toBe('idle');
      const container = petView.containerEl.querySelector('.vault-pal-container');
      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(container?.getAttribute('data-pet-state')).toBe('idle');
      expect(component?.getAttribute('data-state')).toBe('idle');

      // Transition to petting
      petView.transitionState('petting', 'idle');

      // Verify sync during petting
      expect(petView.getCurrentState()).toBe('petting');
      expect(container?.getAttribute('data-pet-state')).toBe('petting');
      expect(component?.getAttribute('data-state')).toBe('petting');

      // Verify heart overlay is present
      const heartOverlay = petView.containerEl.querySelector('.heart-overlay');
      expect(heartOverlay).toBeTruthy();

      // After auto-transition
      vi.advanceTimersByTime(2000);

      // Verify sync after return to idle
      expect(petView.getCurrentState()).toBe('idle');
      expect(container?.getAttribute('data-pet-state')).toBe('idle');
      expect(component?.getAttribute('data-state')).toBe('idle');

      // Verify heart overlay is gone
      const heartOverlayAfter = petView.containerEl.querySelector('.heart-overlay');
      expect(heartOverlayAfter).toBeFalsy();
    });

    it('should maintain state sync when petting from greeting', async () => {
      await petView.onOpen();

      // Transition to greeting
      petView.transitionState('greeting');
      const container = petView.containerEl.querySelector('.vault-pal-container');
      const component = petView.containerEl.querySelector('.pet-sprite-container');

      // Verify initial greeting sync
      expect(petView.getCurrentState()).toBe('greeting');
      expect(container?.getAttribute('data-pet-state')).toBe('greeting');
      expect(component?.getAttribute('data-state')).toBe('greeting');

      // Pet during greeting
      petView.transitionState('petting', 'greeting');

      // Verify sync during petting
      expect(petView.getCurrentState()).toBe('petting');
      expect(container?.getAttribute('data-pet-state')).toBe('petting');
      expect(component?.getAttribute('data-state')).toBe('petting');

      // After auto-transition back to greeting
      vi.advanceTimersByTime(2000);

      // Verify sync after return to greeting
      expect(petView.getCurrentState()).toBe('greeting');
      expect(container?.getAttribute('data-pet-state')).toBe('greeting');
      expect(component?.getAttribute('data-state')).toBe('greeting');
    });
  });

  describe('action buttons', () => {
    it('should have daily note action button present', async () => {
      await petView.onOpen();

      // Issue #47: Single smart button for daily notes
      expect(mockActionButtons.length).toBeGreaterThanOrEqual(1);

      // Daily note button exists
      const dailyNoteBtn = mockActionButtons.find((btn) => btn.icon === 'calendar-plus');
      expect(dailyNoteBtn).toBeTruthy();
    });

    it('should have correct button icon and title', async () => {
      await petView.onOpen();

      // Issue #47: Find daily note button
      const dailyNoteBtn = mockActionButtons.find((btn) => btn.icon === 'calendar-plus');

      expect(dailyNoteBtn).toBeTruthy();
      expect(dailyNoteBtn?.icon).toBe('calendar-plus');
      expect(dailyNoteBtn?.title).toBe('Daily Note');
    });
  });

  describe('event listener cleanup', () => {
    it('should clean up pet event listeners on view close', async () => {
      await petView.onOpen();

      // Verify component exists with event listeners
      const componentBefore = petView.containerEl.querySelector('.pet-sprite-container');
      expect(componentBefore).toBeTruthy();

      // Close the view
      await petView.onClose();

      // Component should be destroyed (including all event listeners)
      const componentAfter = petView.containerEl.querySelector('.pet-sprite-container');
      expect(componentAfter).toBeNull();

      // State machine should be cleaned up
      expect(petView.getCurrentState()).toBeNull();
    });

    it('should not crash if petting attempted after view close', async () => {
      await petView.onOpen();

      // Transition to petting
      petView.transitionState('petting', 'idle');
      expect(petView.getCurrentState()).toBe('petting');

      // Close view during petting animation
      await petView.onClose();

      // Advance timers (timer should be cancelled)
      vi.advanceTimersByTime(2000);

      // Should not crash, getCurrentState should return null
      expect(petView.getCurrentState()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should maintain accessibility during state transitions', async () => {
      await petView.onOpen();

      // Idle state - accessible
      let wrapper = petView.containerEl.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('role')).toBe('button');
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Kit');
      expect(wrapper.getAttribute('tabindex')).toBe('0');

      // Talking state - not accessible for petting
      petView.transitionState('talking');
      wrapper = petView.containerEl.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Kit (currently busy)');
      expect(wrapper.getAttribute('tabindex')).toBe('-1');

      // Back to idle - accessible again
      petView.transitionState('idle');
      wrapper = petView.containerEl.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');
      expect(wrapper.getAttribute('tabindex')).toBe('0');
    });

    it('should have aria-hidden on heart overlay', async () => {
      await petView.onOpen();

      petView.transitionState('petting', 'idle');

      const heartOverlay = petView.containerEl.querySelector('.heart-overlay') as HTMLElement;
      expect(heartOverlay).toBeTruthy();
      expect(heartOverlay.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
