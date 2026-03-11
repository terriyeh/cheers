/**
 * Minimal stub for Stats.svelte — allows PetView tests to mount without
 * requiring the real Stats.svelte implementation. The stub renders a single
 * sentinel div so tests can verify the panel exists in the DOM.
 *
 * Ring geometry is tested separately via stats-utils.test.ts.
 * This stub intentionally does NOT replicate Stats.svelte reactive logic.
 *
 * `lastInstance` is exported so PetView tests can inspect $set call arguments
 * after updateStatsComponent() runs, without accessing PetView private fields.
 */

import { vi } from 'vitest';

/** The most recently constructed MockStatsComponent. Reset on each new onOpen(). */
export let lastInstance: MockStatsComponent | null = null;

export default class MockStatsComponent {
  private container: HTMLElement;
  public $set: ReturnType<typeof vi.fn>;
  public $destroy: () => void;
  public $on: ReturnType<typeof vi.fn>;

  constructor(options: { target: HTMLElement; props: any }) {
    this.container = document.createElement('div');
    this.container.className = 'vp-stats';
    options.target.appendChild(this.container);

    this.$set = vi.fn();
    this.$on = vi.fn();
    this.$destroy = () => {
      this.container.remove();
    };

    // Expose this instance so tests can inspect $set calls
    lastInstance = this;
  }
}
