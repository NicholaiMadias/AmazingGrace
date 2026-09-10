import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  delete (globalThis as { document?: unknown }).document;
  delete (globalThis as { window?: unknown }).window;
});

describe('matrix root entrypoint', () => {
  it('mounts the full MatrixOfConscience React app for the matrix subdomain root', async () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../matrix-of-conscience/index.html'), 'utf8');
    const rootElement = { innerHTML: '' };
    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));
    const matrixApp = vi.fn(() => React.createElement('div', { id: 'matrix-app' }));
    const getElementById = vi.fn((id: string) => (id === 'matrix-root' ? rootElement : null));
    const addEventListener = vi.fn();

    vi.doMock('react-dom/client', () => ({ createRoot }));
    vi.doMock('../src/components/MatrixOfConscience', () => ({
      default: matrixApp,
    }));

    Object.assign(globalThis, {
      document: {
        getElementById,
        body: { innerHTML: '' },
      },
      window: {
        addEventListener,
      },
    });

    await import('../matrix-of-conscience/main.tsx');

    expect(html).toContain('id="matrix-root"');
    expect(html).toContain('<script type="module" src="./main.tsx"></script>');
    expect(getElementById).toHaveBeenCalledWith('matrix-root');
    expect(createRoot).toHaveBeenCalledWith(rootElement);
    expect(render).toHaveBeenCalledTimes(1);
    const renderedTree = render.mock.calls[0][0];
    expect(React.isValidElement(renderedTree)).toBe(true);
    expect(renderedTree.props.children.type).toBe(matrixApp);
    expect(addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
