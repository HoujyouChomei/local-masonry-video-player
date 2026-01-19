// electron/core/events/event-bus.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(async () => {
  vi.resetModules();
});

describe('EventBus', () => {
  it('should be a singleton', async () => {
    const { eventBus: bus1 } = await import('./event-bus');
    const { eventBus: bus2 } = await import('./event-bus');
    expect(bus1).toBe(bus2);
  });

  it('should emit and receive events with correct payload', async () => {
    vi.resetModules();
    const { eventBus } = await import('./event-bus');

    const listener = vi.fn();
    eventBus.on('video:deleted', listener);

    const payload = { id: 'test-id', path: '/test/path.mp4' };
    eventBus.emit('video:deleted', payload);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(payload);
  });

  it('should support multiple listeners for the same event', async () => {
    vi.resetModules();
    const { eventBus } = await import('./event-bus');

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    eventBus.on('thumbnail:request', listener1);
    eventBus.on('thumbnail:request', listener2);

    const payload = { paths: ['/path/a.mp4'], regenerate: true };
    eventBus.emit('thumbnail:request', payload);

    expect(listener1).toHaveBeenCalledWith(payload);
    expect(listener2).toHaveBeenCalledWith(payload);
  });

  it('should unsubscribe with off()', async () => {
    vi.resetModules();
    const { eventBus } = await import('./event-bus');

    const listener = vi.fn();
    eventBus.on('settings:changed', listener);
    eventBus.off('settings:changed', listener);

    eventBus.emit('settings:changed', { key: 'test', value: 123 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should fire once() listener only once', async () => {
    vi.resetModules();
    const { eventBus } = await import('./event-bus');

    const listener = vi.fn();
    eventBus.once('video:added', listener);

    eventBus.emit('video:added', { id: '1', path: '/a.mp4' });
    eventBus.emit('video:added', { id: '2', path: '/b.mp4' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ id: '1', path: '/a.mp4' });
  });

  it('should return correct listener count', async () => {
    vi.resetModules();
    const { eventBus } = await import('./event-bus');

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    expect(eventBus.listenerCount('video:deleted')).toBe(0);

    eventBus.on('video:deleted', listener1);
    expect(eventBus.listenerCount('video:deleted')).toBe(1);

    eventBus.on('video:deleted', listener2);
    expect(eventBus.listenerCount('video:deleted')).toBe(2);

    eventBus.off('video:deleted', listener1);
    expect(eventBus.listenerCount('video:deleted')).toBe(1);
  });

  it('should remove all listeners for a specific event', async () => {
    vi.resetModules();
    const { eventBus } = await import('./event-bus');

    eventBus.on('video:updated', vi.fn());
    eventBus.on('video:updated', vi.fn());
    eventBus.on('video:deleted', vi.fn());

    expect(eventBus.listenerCount('video:updated')).toBe(2);
    expect(eventBus.listenerCount('video:deleted')).toBe(1);

    eventBus.removeAllListeners('video:updated');

    expect(eventBus.listenerCount('video:updated')).toBe(0);
    expect(eventBus.listenerCount('video:deleted')).toBe(1);
  });
});
