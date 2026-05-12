import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

describe('homepage mobile nav focus management', () => {
  const src = fs.readFileSync('index.html', 'utf8');
  const scriptMatch = src.match(/<script>\s*\/\/ Mobile nav toggle([\s\S]*?)<\/script>/);
  const script = scriptMatch
    ? `// Mobile nav toggle${scriptMatch[1]}`
    : '';

  it('closes mobile nav with Escape and restores focus to the menu toggle', () => {
    expect(script).not.toBe('');

    const handlers: Record<string, (event?: { key?: string }) => void> = {};
    const toggleAttrs = new Map<string, string>();
    const navClassSet = new Set<string>();
    const navLink = { id: 'nav-link' };
    let activeElement: object | null = null;

    const documentMock = {
      get activeElement() {
        return activeElement;
      },
      set activeElement(value: object | null) {
        activeElement = value;
      },
      querySelector: (selector: string) => {
        if (selector === '.menu-toggle') return toggleMock;
        throw new Error(`Unhandled selector in test mock: ${selector}`);
      },
      getElementById: (id: string) => id === 'main-nav' ? navMock : null,
      addEventListener: (type: string, handler: (event?: { key?: string }) => void) => {
        handlers[type] = handler;
      },
    };

    const toggleMock = {
      addEventListener: (type: string, handler: () => void) => {
        handlers[`toggle:${type}`] = handler;
      },
      setAttribute: (name: string, value: string) => {
        toggleAttrs.set(name, value);
      },
      focus: () => {
        documentMock.activeElement = toggleMock;
      },
    };

    const navMock = {
      classList: {
        add: (name: string) => {
          navClassSet.add(name);
        },
        remove: (name: string) => {
          navClassSet.delete(name);
        },
        contains: (name: string) => navClassSet.has(name),
      },
      contains: (element: unknown) => element === navLink,
    };

    vm.runInNewContext(script, { document: documentMock });

    handlers['toggle:click']?.();
    expect(navClassSet.has('open')).toBe(true);
    expect(toggleAttrs.get('aria-expanded')).toBe('true');

    documentMock.activeElement = navLink;
    handlers.keydown?.({ key: 'Escape' });

    expect(navClassSet.has('open')).toBe(false);
    expect(toggleAttrs.get('aria-expanded')).toBe('false');
    expect(documentMock.activeElement).toBe(toggleMock);
  });
});
