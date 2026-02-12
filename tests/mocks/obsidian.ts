/**
 * Mock Obsidian API for testing
 * Provides minimal implementations of Obsidian classes needed for testing
 */

import { vi } from 'vitest';

export interface TFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  stat: {
    mtime: number;
    ctime: number;
    size: number;
  };
}

export interface MarkdownPostProcessorContext {
  docId: string;
  sourcePath: string;
  frontmatter: Record<string, any> | null;
  addChild(component: any): void;
  getSectionInfo(el: HTMLElement): { lineStart: number; lineEnd: number; text: string } | null;
}

export class App {
  vault: Vault;
  workspace: any;
  plugins: {
    manifests: Record<string, { dir: string }>;
    plugins: Record<string, any>;
  };

  constructor() {
    this.vault = new Vault();
    this.workspace = {
      getLeavesOfType: vi.fn().mockReturnValue([]),
      getLeaf: vi.fn().mockReturnValue({
        openFile: vi.fn(),
      }),
    };
    this.plugins = {
      manifests: {
        'obsidian-pets': {
          dir: '.obsidian/plugins/obsidian-pets',
        },
      },
      plugins: {
        'obsidian-pets': {
          settings: {
            petName: 'Kit',
            userName: '',
            hasCompletedWelcome: false,
            movementSpeed: 50,
          },
        },
      },
    };
  }
}

export class Vault {
  adapter: DataAdapter;

  constructor() {
    this.adapter = new DataAdapter();
  }
}

export class DataAdapter {
  getResourcePath(path: string): string {
    return `app://local/${path}`;
  }
}

export class WorkspaceLeaf {
  view: any = null;
}

// Extended HTMLElement with Obsidian methods
class ObsidianHTMLElement extends HTMLElement {
  empty(): void {
    this.innerHTML = '';
  }

  createDiv(options?: { cls?: string; text?: string }): HTMLDivElement {
    const div = document.createElement('div');
    if (options?.cls) {
      div.className = options.cls;
    }
    if (options?.text) {
      div.textContent = options.text;
    }
    this.appendChild(div);
    return div;
  }

  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: { cls?: string; text?: string }
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (options?.cls) {
      el.className = options.cls;
    }
    if (options?.text) {
      el.textContent = options.text;
    }
    this.appendChild(el);
    return el;
  }
}

export class ItemView {
  app: App;
  leaf: WorkspaceLeaf;
  containerEl: any;

  constructor(leaf: WorkspaceLeaf) {
    this.leaf = leaf;
    this.app = new App();

    // Create container with Obsidian methods
    const container = document.createElement('div') as any;
    const self = this;
    container.empty = function() {
      this.innerHTML = '';
      // Recreate the expected structure after emptying
      const child0 = document.createElement('div');
      const child1 = document.createElement('div');

      // Add Obsidian methods to children
      (child0 as any).empty = function() { this.innerHTML = ''; };
      (child0 as any).createDiv = container.createDiv.bind(child0);
      (child0 as any).createEl = container.createEl.bind(child0);

      (child1 as any).empty = function() { this.innerHTML = ''; };
      (child1 as any).createDiv = container.createDiv.bind(child1);
      (child1 as any).createEl = container.createEl.bind(child1);

      this.appendChild(child0);
      this.appendChild(child1);
    };
    container.createDiv = function(options?: { cls?: string; text?: string }): HTMLDivElement {
      const div = document.createElement('div');
      if (options?.cls) {
        div.className = options.cls;
      }
      if (options?.text) {
        div.textContent = options.text;
      }

      // Add Obsidian methods to the created div
      (div as any).empty = function() { this.innerHTML = ''; };
      (div as any).createDiv = container.createDiv.bind(div);
      (div as any).createEl = container.createEl.bind(div);

      this.appendChild(div);
      return div;
    };
    container.createEl = function<K extends keyof HTMLElementTagNameMap>(
      tag: K,
      options?: { cls?: string; text?: string }
    ): HTMLElementTagNameMap[K] {
      const el = document.createElement(tag);
      if (options?.cls) {
        el.className = options.cls;
      }
      if (options?.text) {
        el.textContent = options.text;
      }

      // Add Obsidian methods to the created element
      (el as any).empty = function() { this.innerHTML = ''; };
      (el as any).createDiv = container.createDiv.bind(el);
      (el as any).createEl = container.createEl.bind(el);

      this.appendChild(el);
      return el;
    };

    this.containerEl = container;

    // Create the structure expected by PetView
    // containerEl.children[1] is where PetView mounts the component
    const child0 = document.createElement('div');
    const child1 = document.createElement('div');

    // Add Obsidian methods to children
    (child0 as any).empty = function() { this.innerHTML = ''; };
    (child0 as any).createDiv = container.createDiv.bind(child0);
    (child0 as any).createEl = container.createEl.bind(child0);

    (child1 as any).empty = function() { this.innerHTML = ''; };
    (child1 as any).createDiv = container.createDiv.bind(child1);
    (child1 as any).createEl = container.createEl.bind(child1);

    this.containerEl.appendChild(child0);
    this.containerEl.appendChild(child1);
  }

  getViewType(): string {
    return 'mock-view';
  }

  getDisplayText(): string {
    return 'Mock View';
  }

  getIcon(): string {
    return 'circle';
  }

  async onOpen(): Promise<void> {
    // Override in subclass
  }

  async onClose(): Promise<void> {
    // Override in subclass
  }

  addAction(icon: string, title: string, callback: () => void): HTMLElement {
    const button = document.createElement('button');
    button.setAttribute('aria-label', title);
    button.setAttribute('data-icon', icon);
    button.onclick = callback;
    return button;
  }
}

export class Modal {
  app: App;
  contentEl: any;

  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
  }

  open(): void {
    // Mock implementation
  }

  close(): void {
    // Mock implementation
  }
}

export class Notice {
  constructor(message: string) {
    // Mock implementation - just store the message
    console.log('Notice:', message);
  }
}

// Mock window.moment (Obsidian provides this globally)
if (typeof window !== 'undefined') {
  (window as any).moment = () => {
    return {
      format: (format?: string) => '2024-01-15',
      toDate: () => new Date('2024-01-15'),
      valueOf: () => Date.now(),
    };
  };
}

// Export mock functions for convenience
export const mockApp = () => new App();
export const mockLeaf = () => new WorkspaceLeaf();
