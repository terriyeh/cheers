/**
 * Test helper utilities
 * Provides common testing utilities and assertion helpers
 */

import { vi } from 'vitest';
import type { PetState } from '../../src/types/pet';

/**
 * Wait for a specific number of milliseconds (with fake timers)
 */
export function advanceTime(ms: number): void {
  vi.advanceTimersByTime(ms);
}

/**
 * Wait for all timers to complete
 */
export function advanceAllTimers(): void {
  vi.runAllTimers();
}

/**
 * Create a spy for console methods
 */
export function spyOnConsole(method: 'log' | 'error' | 'warn' = 'error'): any {
  return vi.spyOn(console, method).mockImplementation(() => {});
}

/**
 * Restore a console spy
 */
export function restoreConsoleSpy(spy: any): void {
  spy.mockRestore();
}

/**
 * Assert that an element has a specific data attribute value
 */
export function assertDataAttribute(
  element: Element | null,
  attribute: string,
  expectedValue: string
): void {
  if (!element) {
    throw new Error('Element is null');
  }

  const actualValue = element.getAttribute(`data-${attribute}`);
  if (actualValue !== expectedValue) {
    throw new Error(
      `Expected data-${attribute} to be "${expectedValue}", but got "${actualValue}"`
    );
  }
}

/**
 * Assert that an element has specific text content
 */
export function assertTextContent(
  element: Element | null,
  expectedText: string
): void {
  if (!element) {
    throw new Error('Element is null');
  }

  if (element.textContent !== expectedText) {
    throw new Error(
      `Expected text content to be "${expectedText}", but got "${element.textContent}"`
    );
  }
}

/**
 * Find element by class name with error handling
 */
export function findByClass(
  container: Element | Document,
  className: string
): Element | null {
  return container.querySelector(`.${className}`);
}

/**
 * Find all elements by class name
 */
export function findAllByClass(
  container: Element | Document,
  className: string
): Element[] {
  return Array.from(container.querySelectorAll(`.${className}`));
}

/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement(
  container: Element | Document,
  selector: string,
  timeout: number = 1000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = container.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
    }, timeout);

    const observer = new MutationObserver(() => {
      const element = container.querySelector(selector);
      if (element) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(
      container instanceof Document ? container.body : container,
      {
        childList: true,
        subtree: true,
      }
    );
  });
}

/**
 * Create a mock DOM element with specified attributes
 */
export function createMockElement(
  tag: string,
  attributes?: Record<string, string>,
  textContent?: string
): HTMLElement {
  const element = document.createElement(tag);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

/**
 * Assert that all state indicators are synchronized
 */
export function assertStateSynchronization(
  container: Element,
  expectedState: PetState
): void {
  const vaultPalContainer = container.querySelector('.obsidian-pets-container');
  const spriteContainer = container.querySelector('.pet-sprite-container');
  const sprite = container.querySelector('.pet-sprite');

  if (!vaultPalContainer) {
    throw new Error('obsidian-pets-container not found');
  }

  if (!spriteContainer) {
    throw new Error('pet-sprite-container not found');
  }

  if (!sprite) {
    throw new Error('pet-sprite not found');
  }

  const containerState = vaultPalContainer.getAttribute('data-pet-state');
  const spriteContainerState = spriteContainer.getAttribute('data-state');
  const ariaLabel = sprite.getAttribute('aria-label');

  if (containerState !== expectedState) {
    throw new Error(
      `Container data-pet-state is "${containerState}", expected "${expectedState}"`
    );
  }

  if (spriteContainerState !== expectedState) {
    throw new Error(
      `Sprite container data-state is "${spriteContainerState}", expected "${expectedState}"`
    );
  }

  if (ariaLabel !== `Pet is ${expectedState}`) {
    throw new Error(
      `Sprite aria-label is "${ariaLabel}", expected "Pet is ${expectedState}"`
    );
  }
}

/**
 * Create a mock state change listener
 */
export function createMockListener(): any {
  return vi.fn();
}

/**
 * Assert that a listener was called with specific event data
 */
export function assertListenerCalledWith(
  listener: any,
  previousState: PetState,
  newState: PetState
): void {
  const calls = listener.mock.calls;
  const matchingCall = calls.find(
    (call: any[]) =>
      call[0].previousState === previousState && call[0].newState === newState
  );

  if (!matchingCall) {
    throw new Error(
      `Listener was not called with previousState: ${previousState}, newState: ${newState}`
    );
  }
}

/**
 * Get call count for a mock function
 */
export function getCallCount(mockFn: any): number {
  return mockFn.mock.calls.length;
}

/**
 * Clear all mock function calls
 */
export function clearMockCalls(mockFn: any): void {
  mockFn.mockClear();
}

/**
 * Create a delay promise (for real async testing, not fake timers)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that no timers are pending
 */
export function assertNoTimersPending(): void {
  const pendingTimers = vi.getTimerCount();
  if (pendingTimers > 0) {
    throw new Error(`Expected no pending timers, but found ${pendingTimers}`);
  }
}

/**
 * Get the number of pending timers
 */
export function getPendingTimerCount(): number {
  return vi.getTimerCount();
}

/**
 * Assert that element exists in DOM
 */
export function assertElementExists(
  element: Element | null,
  description?: string
): asserts element is Element {
  if (!element) {
    throw new Error(
      description
        ? `Expected element to exist: ${description}`
        : 'Expected element to exist'
    );
  }
}

/**
 * Assert that element does not exist in DOM
 */
export function assertElementNotExists(
  element: Element | null,
  description?: string
): void {
  if (element) {
    throw new Error(
      description
        ? `Expected element not to exist: ${description}`
        : 'Expected element not to exist'
    );
  }
}
