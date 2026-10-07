import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachDragSwap } from '../js/matchmaker.js';

function setup(enabled) {
  const listeners = () => new Map();
  const makeTarget = (style = {}) => {
    const handlers = listeners();
    return {
      style,
      handlers,
      addEventListener(type, handler) {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type).add(handler);
      },
      removeEventListener(type, handler) {
        handlers.get(type)?.delete(handler);
      },
      dispatch(type, event) {
        handlers.get(type)?.forEach(handler => handler(event));
      },
      listenerCount() {
        return [...handlers.values()].reduce((count, handlersForType) => count + handlersForType.size, 0);
      },
    };
  };

  const container = makeTarget({ touchAction: 'pan-y' });
  const windowTarget = makeTarget();
  const cells = Array.from({ length: 3 }, (_, c) => {
    const cell = makeTarget();
    cell.dataset = { r: '0', c: String(c) };
    cell.closest = () => cell;
    return cell;
  });
  const points = new Map(cells.map((cell, c) => [`${c + 1},1`, cell]));
  container.contains = element => cells.includes(element);
  vi.stubGlobal('window', windowTarget);
  vi.stubGlobal('document', {
    elementFromPoint: (x, y) => points.get(`${x},${y}`) || null,
  });

  const onSwap = vi.fn();
  const detach = attachDragSwap(container, {
    cellAt: cell => ({ r: Number(cell.dataset.r), c: Number(cell.dataset.c) }),
    onSwap,
    enabled,
  });
  return { container, windowTarget, cells, onSwap, detach };
}

afterEach(() => vi.unstubAllGlobals());

describe('attachDragSwap', () => {
  it('swaps adjacent cells on mouse drag', () => {
    const { container, windowTarget, onSwap } = setup();
    container.dispatch('mousedown', { button: 0, clientX: 1, clientY: 1 });
    windowTarget.dispatch('mousemove', { clientX: 2, clientY: 1 });
    windowTarget.dispatch('mouseup', { clientX: 2, clientY: 1 });
    expect(onSwap).toHaveBeenCalledWith({ r: 0, c: 0 }, { r: 0, c: 1 });
  });

  it('swaps adjacent cells on touch drag and prevents scrolling', () => {
    const { container, onSwap } = setup();
    const startTouch = { clientX: 1, clientY: 1 };
    const targetTouch = { clientX: 2, clientY: 1 };
    const moveEvent = { touches: [targetTouch], preventDefault: vi.fn() };
    container.dispatch('touchstart', { touches: [startTouch] });
    container.dispatch('touchmove', moveEvent);
    container.dispatch('touchend', { changedTouches: [targetTouch], cancelable: true, preventDefault: vi.fn() });
    expect(moveEvent.preventDefault).toHaveBeenCalledOnce();
    expect(onSwap).toHaveBeenCalledWith({ r: 0, c: 0 }, { r: 0, c: 1 });
  });

  it('does not treat a plain mouse tap as a swap', () => {
    const { container, windowTarget, onSwap } = setup();
    container.dispatch('mousedown', { button: 0, clientX: 1, clientY: 1 });
    windowTarget.dispatch('mouseup', { clientX: 1, clientY: 1 });
    expect(onSwap).not.toHaveBeenCalled();
  });

  it('does not start a drag when disabled', () => {
    const { container, windowTarget, onSwap } = setup(() => false);
    container.dispatch('mousedown', { button: 0, clientX: 1, clientY: 1 });
    windowTarget.dispatch('mousemove', { clientX: 2, clientY: 1 });
    windowTarget.dispatch('mouseup', { clientX: 2, clientY: 1 });
    expect(onSwap).not.toHaveBeenCalled();
  });

  it('clears the preview without swapping when a touch is cancelled', () => {
    const { container, cells, onSwap } = setup();
    container.dispatch('touchstart', { touches: [{ clientX: 1, clientY: 1 }] });
    container.dispatch('touchmove', { touches: [{ clientX: 2, clientY: 1 }], preventDefault: vi.fn() });
    container.dispatch('touchcancel', {});
    expect(onSwap).not.toHaveBeenCalled();
    expect(cells[0].style.outline).toBe('');
    expect(cells[1].style.outline).toBe('');
  });

  it('removes listeners and restores touch-action when detached', () => {
    const { container, windowTarget, onSwap, detach } = setup();
    expect(container.style.touchAction).toBe('none');
    detach();
    expect(container.listenerCount()).toBe(0);
    expect(windowTarget.listenerCount()).toBe(0);
    expect(container.style.touchAction).toBe('pan-y');
    container.dispatch('mousedown', { button: 0, clientX: 1, clientY: 1 });
    expect(onSwap).not.toHaveBeenCalled();
  });
});
